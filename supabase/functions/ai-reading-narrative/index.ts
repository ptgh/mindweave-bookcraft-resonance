import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserTransmission {
  title: string;
  author: string;
  tags?: string | string[] | null;
  historical_context_tags?: string[];
  publication_year?: number;
  created_at?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userTransmissions, timeframe = 'all', forceRegenerate = false } = await req.json();

    if (!userTransmissions || !Array.isArray(userTransmissions)) {
      return new Response(
        JSON.stringify({ error: 'userTransmissions array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userTransmissions.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Need at least 3 books to generate insights' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Check for existing narrative if not forcing regeneration
    if (!forceRegenerate) {
      const { data: existingInsight } = await supabase
        .from('reading_insights')
        .select('narrative, metadata, generated_at')
        .eq('user_id', userId)
        .eq('timeframe', timeframe)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingInsight) {
        console.log('Returning existing reading insight');
        return new Response(
          JSON.stringify({
            narrative: existingInsight.narrative,
            metadata: existingInsight.metadata,
            generated_at: existingInsight.generated_at,
            cached: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate rich context for narrative
    const context = generateReadingContext(userTransmissions);

    const prompt = `Generate a personalized reading journey narrative for this science fiction reader. 
Write in an engaging, literary style that celebrates their reading exploration while providing insights.

${context}

Create a narrative with these sections (use markdown headers):

# Your Science Fiction Journey

[Opening paragraph: poetic summary of their reading journey]

## Detected Patterns

[2-3 key patterns you've identified in their reading, with specific examples from their books]

## Thematic Clusters

[Describe the main thematic groups in their collection and how they interconnect]

## Reading Velocity & Momentum

[Analyze their reading pace and what themes they're accelerating through]

## The Bridges

[Identify books that serve as conceptual bridges between different areas of their collection]

## Future Explorations

[2-3 thoughtful predictions about where their reading journey might lead next]

Keep the tone warm, insightful, and specific to their actual collection. Reference specific books and authors.
Total length: 600-900 words.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a literary analyst specializing in science fiction. Write engaging, personalized narratives.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
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
    const narrative = aiData.choices?.[0]?.message?.content;
    
    if (!narrative) {
      throw new Error('No narrative generated');
    }

    // Extract metadata from the context for storage
    const metadata = {
      total_books: userTransmissions.length,
      timeframe,
      generated_model: 'gemini-2.5-flash',
    };

    // Store the narrative
    const { error: insertError } = await supabase
      .from('reading_insights')
      .insert({
        user_id: userId,
        narrative,
        metadata,
        timeframe,
        generated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to store insight:', insertError);
    }

    console.log(`Generated reading narrative for user ${userId}`);

    return new Response(
      JSON.stringify({
        narrative,
        metadata,
        generated_at: new Date().toISOString(),
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-reading-narrative:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateReadingContext(transmissions: UserTransmission[]): string {
  const totalBooks = transmissions.length;
  
  // Extract tags
  const allTags: string[] = [];
  transmissions.forEach(t => {
    let tagList: string[] = [];
    const value = (t as any).tags;
    if (Array.isArray(value)) {
      tagList = value.map(String);
    } else if (typeof value === 'string') {
      const s = value.trim();
      if (s.startsWith('[')) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) tagList = parsed.map(String);
        } catch { /* ignore bad JSON */ }
      } else if (s.length) {
        tagList = s.split(',').map(tag => tag.trim()).filter(Boolean);
      }
    }
    allTags.push(...tagList);
  });
  
  const tagFreq: Record<string, number> = {};
  allTags.forEach(tag => {
    tagFreq[tag] = (tagFreq[tag] || 0) + 1;
  });
  
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => `${tag} (${count} books)`)
    .join(', ');
  
  // Authors
  const authorFreq: Record<string, number> = {};
  transmissions.forEach(t => {
    if (t.author) {
      authorFreq[t.author] = (authorFreq[t.author] || 0) + 1;
    }
  });
  
  const topAuthors = Object.entries(authorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([author, count]) => count > 1 ? `${author} (${count})` : author)
    .join(', ');

  // Recent books
  const recentBooks = transmissions
    .slice(-8)
    .map(t => `"${t.title}" by ${t.author}`)
    .join(', ');

  // Publication year range
  const years = transmissions
    .map(t => t.publication_year)
    .filter((y): y is number => typeof y === 'number')
    .sort((a, b) => a - b);
  
  const yearRange = years.length > 0 
    ? `${years[0]} - ${years[years.length - 1]}`
    : 'Various eras';

  // Books with notes
  const booksWithNotes = transmissions.filter(t => t.notes && t.notes.trim().length > 0).length;

  return `READER'S COLLECTION OVERVIEW:

Total Books: ${totalBooks}

Dominant Themes & Concepts: ${topTags}

Core Authors: ${topAuthors}

Temporal Span: ${yearRange}

Recent Reading: ${recentBooks}

Books with Personal Notes: ${booksWithNotes}

Full Collection:
${transmissions.map((t, i) => 
  `${i + 1}. "${t.title}" by ${t.author}${t.tags ? ` [${t.tags}]` : ''}`
).join('\n')}`;
}