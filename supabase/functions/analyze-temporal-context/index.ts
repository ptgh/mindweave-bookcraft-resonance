import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  userId: string;
  forceRefresh?: boolean;
}

interface TemporalAnalysis {
  eraNarratives: Record<string, { description: string; books: Array<{ title: string; author: string; year: number }> }>;
  temporalBridges: Array<{ eras: string[]; connection: string; bookTitles: string[] }>;
  historicalForces: Array<{ force: string; books: Array<{ title: string; author: string }>; impact: string }>;
  authorInsights: Array<{ author: string; contribution: string; bookCount: number }>;
  readingPattern: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { userId, forceRefresh = false }: AnalysisRequest = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    // Fetch user's books with temporal tags
    const { data: transmissions, error: transmissionsError } = await supabaseClient
      .from('transmissions')
      .select('title, author, publication_year, temporal_context_tags')
      .eq('user_id', userId)
      .not('temporal_context_tags', 'is', null);

    if (transmissionsError) {
      console.error('Error fetching transmissions:', transmissionsError);
      throw transmissionsError;
    }

    if (!transmissions || transmissions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No books with temporal tags found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Calculate temporal signature (hash of all tags)
    const allTags = transmissions
      .flatMap(t => t.temporal_context_tags || [])
      .sort()
      .join(',');
    const temporalSignature = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(allTags)
    ).then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Check cache unless force refresh
    if (!forceRefresh) {
      const { data: cached } = await supabaseClient
        .from('temporal_analysis_cache')
        .select('analysis, generated_at, temporal_signature')
        .eq('user_id', userId)
        .single();

      if (cached && cached.temporal_signature === temporalSignature) {
        const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (cacheAge < sevenDays) {
          console.log('Returning cached analysis');
          return new Response(
            JSON.stringify(cached.analysis),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Generate new analysis with Gemini
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Organize books by temporal tags
    const tagToBooks = new Map<string, Array<{ title: string; author: string; year: number }>>();
    transmissions.forEach(t => {
      (t.temporal_context_tags || []).forEach((tag: string) => {
        if (!tagToBooks.has(tag)) {
          tagToBooks.set(tag, []);
        }
        tagToBooks.get(tag)!.push({
          title: t.title,
          author: t.author,
          year: t.publication_year || 0
        });
      });
    });

    const tagSummary = Array.from(tagToBooks.entries())
      .map(([tag, books]) => `${tag}: ${books.map(b => `${b.title} (${b.author} ${b.year})`).join(', ')}`)
      .join('\n');

    const prompt = `Analyze this user's science fiction library temporal distribution:

${tagSummary}

Total books: ${transmissions.length}
Publication range: ${Math.min(...transmissions.map(t => t.publication_year || 9999))} - ${Math.max(...transmissions.map(t => t.publication_year || 0))}

Provide a detailed analysis with these sections:

1. ERA NARRATIVES: For each literary era present (Golden Age, New Wave, Cyberpunk Era, etc.), write 2-3 sentences explaining what defined that period and how these specific books embody it. Include the book titles.

2. TEMPORAL BRIDGES: Identify 2-3 connections between books from different eras that share themes despite their temporal distance. Be specific about which books connect and why.

3. HISTORICAL FORCES: For each major historical force tag (Cold War, Digital Revolution, etc.), explain in 2-3 sentences how it shaped these specific books. List the book titles.

4. AUTHOR INSIGHTS: Highlight 3-4 key authors and their specific contributions based on the books in this collection.

5. READING PATTERN: In 3-4 sentences, describe what this collection reveals about the reader's interests and how they've explored SF across time.

Keep responses specific to these books. Be concise but insightful.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a science fiction literary analyst. Provide specific, book-focused analysis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to your workspace.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;

    // Parse the AI response into structured data
    const analysis: TemporalAnalysis = parseAnalysis(analysisText, tagToBooks);

    // Cache the result
    const { error: cacheError } = await supabaseClient
      .from('temporal_analysis_cache')
      .upsert({
        user_id: userId,
        analysis,
        temporal_signature: temporalSignature,
        generated_at: new Date().toISOString(),
      });

    if (cacheError) {
      console.error('Error caching analysis:', cacheError);
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-temporal-context:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function parseAnalysis(
  text: string,
  tagToBooks: Map<string, Array<{ title: string; author: string; year: number }>>
): TemporalAnalysis {
  // Extract sections using markers
  const sections = {
    eraNarratives: extractSection(text, 'ERA NARRATIVES', 'TEMPORAL BRIDGES'),
    temporalBridges: extractSection(text, 'TEMPORAL BRIDGES', 'HISTORICAL FORCES'),
    historicalForces: extractSection(text, 'HISTORICAL FORCES', 'AUTHOR INSIGHTS'),
    authorInsights: extractSection(text, 'AUTHOR INSIGHTS', 'READING PATTERN'),
    readingPattern: extractSection(text, 'READING PATTERN', null),
  };

  // Parse era narratives
  const eraNarratives: Record<string, { description: string; books: Array<{ title: string; author: string; year: number }> }> = {};
  const eraMatches = sections.eraNarratives.match(/([A-Z][a-zA-Z\s]+(?:Era|Age|SF|Wave|punk)):\s*([^\n]+(?:\n(?![A-Z][a-zA-Z\s]+:)[^\n]+)*)/g);
  
  if (eraMatches) {
    eraMatches.forEach(match => {
      const [era, ...descParts] = match.split(':');
      const description = descParts.join(':').trim();
      const eraTag = era.trim();
      eraNarratives[eraTag] = {
        description,
        books: tagToBooks.get(eraTag) || []
      };
    });
  }

  // Parse temporal bridges
  const temporalBridges: Array<{ eras: string[]; connection: string; bookTitles: string[] }> = [];
  const bridgeMatches = sections.temporalBridges.match(/[-•]\s*([^\n]+)/g);
  
  if (bridgeMatches) {
    bridgeMatches.forEach(match => {
      const connection = match.replace(/^[-•]\s*/, '').trim();
      const eras: string[] = [];
      const bookTitles: string[] = [];
      
      // Extract book titles mentioned
      Array.from(tagToBooks.values()).flat().forEach(book => {
        if (connection.includes(book.title)) {
          bookTitles.push(book.title);
        }
      });
      
      temporalBridges.push({ eras, connection, bookTitles });
    });
  }

  // Parse historical forces
  const historicalForces: Array<{ force: string; books: Array<{ title: string; author: string }>; impact: string }> = [];
  const forceMatches = sections.historicalForces.match(/([A-Z][a-zA-Z\s]+(?:War|Revolution|Age|Era|Tensions)):\s*([^\n]+(?:\n(?![A-Z][a-zA-Z\s]+:)[^\n]+)*)/g);
  
  if (forceMatches) {
    forceMatches.forEach(match => {
      const [force, ...impactParts] = match.split(':');
      const impact = impactParts.join(':').trim();
      const forceTag = force.trim();
      const books = (tagToBooks.get(forceTag) || []).map(b => ({ title: b.title, author: b.author }));
      historicalForces.push({ force: forceTag, books, impact });
    });
  }

  // Parse author insights
  const authorInsights: Array<{ author: string; contribution: string; bookCount: number }> = [];
  const authorMatches = sections.authorInsights.match(/([A-Z][a-zA-Z.\s]+):\s*([^\n]+)/g);
  
  if (authorMatches) {
    authorMatches.forEach(match => {
      const [author, contribution] = match.split(':').map(s => s.trim());
      const bookCount = Array.from(tagToBooks.values())
        .flat()
        .filter(b => b.author === author).length;
      authorInsights.push({ author, contribution, bookCount });
    });
  }

  return {
    eraNarratives,
    temporalBridges,
    historicalForces,
    authorInsights,
    readingPattern: sections.readingPattern.trim()
  };
}

function extractSection(text: string, startMarker: string, endMarker: string | null): string {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? text.indexOf(endMarker, contentStart) : text.length;
  
  return text.substring(contentStart, endIndex === -1 ? text.length : endIndex).trim();
}
