import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DirectorData {
  bio?: string;
  nationality?: string;
  birth_year?: number;
  death_year?: number;
  photo_url?: string;
  wikipedia_url?: string;
  notable_sf_films?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { directorId, directorName } = await req.json();

    if (!directorId && !directorName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Director ID or name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get director info if we have ID
    let director: any = null;
    let searchName = directorName;

    if (directorId) {
      const { data, error } = await supabase
        .from('sf_directors')
        .select('*')
        .eq('id', directorId)
        .single();

      if (error) throw error;
      director = data;
      searchName = data.name;
    }

    console.log(`Enriching director: ${searchName}`);

    // Search Wikipedia for the director
    const wikiSearchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(searchName.replace(/ /g, '_'))}`;
    
    console.log(`Scraping Wikipedia: ${wikiSearchUrl}`);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: wikiSearchUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl scrape error:', errorText);
      throw new Error(`Firecrawl error: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';

    console.log(`Got Wikipedia content: ${markdown.length} characters`);

    // Parse the Wikipedia content
    const enrichedData: DirectorData = {};

    // Extract bio (first paragraph or two)
    const paragraphs = markdown.split('\n\n').filter((p: string) => 
      p.length > 50 && 
      !p.startsWith('#') && 
      !p.startsWith('|') &&
      !p.includes('```')
    );
    
    if (paragraphs.length > 0) {
      // Get first 2 substantial paragraphs for bio
      const bioText = paragraphs.slice(0, 2).join('\n\n');
      // Clean up wiki formatting
      enrichedData.bio = bioText
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
        .replace(/\*\*/g, '')
        .replace(/\n/g, ' ')
        .trim()
        .substring(0, 1000);
    }

    // Extract birth/death years from markdown
    const yearMatches = markdown.match(/\b(born|Born)\s+(?:.*?)(\d{4})/);
    if (yearMatches) {
      enrichedData.birth_year = parseInt(yearMatches[2]);
    }

    const deathMatches = markdown.match(/\b(died|Died|–|-).*?(\d{4})/);
    if (deathMatches && enrichedData.birth_year && parseInt(deathMatches[2]) > enrichedData.birth_year) {
      enrichedData.death_year = parseInt(deathMatches[2]);
    }

    // Try to extract nationality from infobox or first paragraph
    const nationalityPatterns = [
      /is an? (American|British|French|German|Japanese|Canadian|Australian|Russian|Italian|Spanish|Swedish|Danish|Dutch|Polish|Chinese|Korean|Mexican|Brazilian|Argentine|Irish|Scottish|Welsh|New Zealand|South African|Indian|Austrian)/i,
      /was an? (American|British|French|German|Japanese|Canadian|Australian|Russian|Italian|Spanish|Swedish|Danish|Dutch|Polish|Chinese|Korean|Mexican|Brazilian|Argentine|Irish|Scottish|Welsh|New Zealand|South African|Indian|Austrian)/i,
    ];
    
    for (const pattern of nationalityPatterns) {
      const match = markdown.match(pattern);
      if (match) {
        enrichedData.nationality = match[1];
        break;
      }
    }

    // Extract photo URL from HTML (Wikipedia infobox image)
    const imgMatch = html.match(/src="(\/\/upload\.wikimedia\.org\/wikipedia\/[^"]+)"/);
    if (imgMatch) {
      enrichedData.photo_url = 'https:' + imgMatch[1];
    }

    // Set Wikipedia URL
    enrichedData.wikipedia_url = wikiSearchUrl;

    // Get notable SF films from film adaptations table
    const { data: directorFilms } = await supabase
      .from('sf_film_adaptations')
      .select('film_title, film_year')
      .eq('director', searchName)
      .order('film_year', { ascending: false });

    if (directorFilms && directorFilms.length > 0) {
      enrichedData.notable_sf_films = directorFilms.map(f => 
        f.film_year ? `${f.film_title} (${f.film_year})` : f.film_title
      );
    }

    console.log('Extracted data:', enrichedData);

    // Update the director in database
    if (directorId) {
      const { error: updateError } = await supabase
        .from('sf_directors')
        .update({
          ...enrichedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', directorId);

      if (updateError) throw updateError;
      console.log(`Updated director ${searchName} in database`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enriched ${searchName}`,
        data: enrichedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enriching director:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
