import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  source?: 'wikipedia' | 'goodreads' | 'isfdb' | 'all';
  maxResults?: number;
}

interface SearchResult {
  source: string;
  title: string;
  url: string;
  snippet: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Firecrawl not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, source = 'all', maxResults = 5 }: SearchRequest = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Query is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('SF Knowledge Search:', { query, source, maxResults });

    const results: SearchResult[] = [];

    // Build search queries based on source
    const searchQueries: { query: string; source: string }[] = [];
    
    const sfQuery = `science fiction ${query}`;
    
    if (source === 'all' || source === 'wikipedia') {
      searchQueries.push({
        query: `site:en.wikipedia.org ${sfQuery}`,
        source: 'wikipedia'
      });
    }
    
    if (source === 'all' || source === 'goodreads') {
      searchQueries.push({
        query: `site:goodreads.com ${sfQuery}`,
        source: 'goodreads'
      });
    }
    
    if (source === 'all' || source === 'isfdb') {
      searchQueries.push({
        query: `site:isfdb.org ${sfQuery}`,
        source: 'isfdb'
      });
    }

    // Execute searches in parallel
    const searchPromises = searchQueries.map(async ({ query: searchQuery, source: searchSource }) => {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: Math.ceil(maxResults / searchQueries.length),
            lang: 'en',
            scrapeOptions: {
              formats: ['markdown']
            }
          }),
        });

        if (!response.ok) {
          console.error(`Firecrawl search error for ${searchSource}:`, response.status);
          return [];
        }

        const data = await response.json();
        
        if (!data.success || !data.data) {
          return [];
        }

        return data.data.map((result: any) => ({
          source: searchSource,
          title: result.title || 'Untitled',
          url: result.url,
          snippet: result.description || result.markdown?.slice(0, 300) || '',
          metadata: {
            markdown: result.markdown?.slice(0, 1000)
          }
        }));
      } catch (error) {
        console.error(`Error searching ${searchSource}:`, error);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and deduplicate results
    for (const sourceResults of searchResults) {
      results.push(...sourceResults);
    }

    // Sort by relevance (Wikipedia first, then Goodreads, then ISFDB)
    const sourceOrder = ['wikipedia', 'goodreads', 'isfdb'];
    results.sort((a, b) => {
      const aIndex = sourceOrder.indexOf(a.source);
      const bIndex = sourceOrder.indexOf(b.source);
      return aIndex - bIndex;
    });

    // Limit total results
    const limitedResults = results.slice(0, maxResults);

    console.log(`Found ${limitedResults.length} results for "${query}"`);

    return new Response(JSON.stringify({ 
      success: true,
      query,
      results: limitedResults,
      totalResults: limitedResults.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SF Knowledge Search error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Search failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
