import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserTransmission {
  title: string;
  author: string;
  tags?: string;
  historical_context_tags?: string[];
  publication_year?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userTransmissions, limit = 10 } = await req.json();

    if (!userTransmissions || !Array.isArray(userTransmissions)) {
      return new Response(
        JSON.stringify({ error: 'userTransmissions array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    const userId = authHeader ? authHeader.replace('Bearer ', '') : null;

    // Check cache if user is authenticated
    if (userId) {
      const { data: cachedData } = await supabase
        .from('book_recommendations_cache')
        .select('recommendations, cached_at')
        .eq('user_id', userId)
        .order('cached_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Return cached if less than 24 hours old
      if (cachedData && cachedData.cached_at) {
        const cacheAge = Date.now() - new Date(cachedData.cached_at).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (cacheAge < twentyFourHours) {
          console.log('Returning cached recommendations');
          return new Response(
            JSON.stringify(cachedData.recommendations),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate collection summary
    const collectionSummary = generateCollectionSummary(userTransmissions);

    const prompt = `Based on this user's science fiction collection, recommend ${limit} books that would:
1. Fill thematic gaps in their collection
2. Create bridges between existing interest clusters
3. Extend their reading patterns

USER'S COLLECTION SUMMARY:
${collectionSummary}

For each recommendation, provide:
- title
- author
- reason (one sentence explaining why this bridges their interests or fills a gap)
- cluster_connection (which themes/books it connects to)

Return ONLY a JSON array, no markdown:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "reason": "Bridges your interest in X and Y themes",
    "cluster_connection": "Cyberpunk ↔ Philosophy"
  }
]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert science fiction book recommender. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse recommendations
    let recommendations;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      recommendations = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse recommendations');
    }

    const result = {
      recommendations: recommendations.slice(0, limit),
      generated_at: new Date().toISOString(),
    };

    // Cache results if user is authenticated
    if (userId) {
      await supabase.from('book_recommendations_cache').insert({
        user_id: userId,
        recommendations: result,
        cached_at: new Date().toISOString(),
      });
    }

    console.log(`Generated ${recommendations.length} recommendations`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-book-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateCollectionSummary(transmissions: UserTransmission[]): string {
  const totalBooks = transmissions.length;
  
  // Extract all tags
  const allTags: string[] = [];
  transmissions.forEach(t => {
    if (t.tags) {
      const tags = t.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      allTags.push(...tags);
    }
  });
  
  // Count tag frequency
  const tagFreq: Record<string, number> = {};
  allTags.forEach(tag => {
    tagFreq[tag] = (tagFreq[tag] || 0) + 1;
  });
  
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => `${tag} (${count})`)
    .join(', ');
  
  // Count authors
  const authorFreq: Record<string, number> = {};
  transmissions.forEach(t => {
    if (t.author) {
      authorFreq[t.author] = (authorFreq[t.author] || 0) + 1;
    }
  });
  
  const topAuthors = Object.entries(authorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author, count]) => `${author} (${count})`)
    .join(', ');

  // Recent books
  const recentBooks = transmissions
    .slice(-5)
    .map(t => `"${t.title}" by ${t.author}`)
    .join(', ');

  return `Total Books: ${totalBooks}

Top Themes: ${topTags || 'None yet'}

Favorite Authors: ${topAuthors || 'Various'}

Recent Additions: ${recentBooks}`;
}