import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireUser, createUserClient, json } from "../_shared/adminAuth.ts";

interface UserTransmission {
  title: string;
  author: string;
  publication_year?: number;
  created_at: string;
  tags?: string[];
  historical_context_tags?: string[];
  narrative_time_period?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const { userTransmissions, forceRegenerate = false } = await req.json();

    if (!userTransmissions || !Array.isArray(userTransmissions)) {
      throw new Error('Invalid input: userTransmissions array is required');
    }

    if (userTransmissions.length < 3) {
      return json(400, { error: 'At least 3 books required for temporal analysis' });
    }

    const supabase = createUserClient(auth.token);

    // Check for cached analysis (unless force regenerate)
    if (!forceRegenerate) {
      const { data: cached } = await supabase
        .from('reading_insights')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('timeframe', 'temporal')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached && cached.generated_at) {
        const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (cacheAge < sevenDays) {
          return json(200, {
            narrative: cached.narrative,
            metadata: cached.metadata,
            generatedAt: cached.generated_at,
            cached: true
          });
        }
      }
    }

    // Generate temporal context
    const temporalContext = generateTemporalContext(userTransmissions);

    // Get Lovable API key
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Construct AI prompt
    const prompt = `You are a literary historian and temporal analyst specializing in science fiction. Analyze this reader's temporal reading landscape and create a rich, engaging narrative about their journey through time.

${temporalContext}

Create a comprehensive temporal analysis with these sections:

# Your Temporal Reading Landscape
An overview of their reading across time periods, identifying the dominant eras and what this reveals about their interests.

# Era Concentrations
Detailed analysis of which literary eras they gravitate toward (Golden Age, New Wave, Cyberpunk, etc.) and why these periods might resonate with them.

# Historical Influences
Connect their books to real-world events, scientific developments, and cultural movements. Show how the books reflect or react to their historical moment.

# Cultural Context
Explore the zeitgeist of their dominant reading periods - the cultural anxieties, technological dreams, and social movements that shaped these works.

# Temporal Bridges
Identify books that connect different eras or show evolution of themes across time. Highlight temporal jumps and what they might signify.

# Temporal Insights
Personal observations about their reading patterns across time - clustering, preferences, and what their temporal journey reveals about their interests.

Write in an engaging, insightful tone that makes literary history come alive. Use specific book titles and authors from their collection. Keep paragraphs focused and use markdown formatting. Aim for 800-1200 words total.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a literary historian specializing in science fiction and temporal literary analysis. Create engaging, insightful narratives about readers\' journeys through time.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2500
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const narrative = aiData.choices?.[0]?.message?.content;

    if (!narrative) {
      throw new Error('No narrative generated from AI');
    }

    // Create metadata
    const metadata = {
      bookCount: userTransmissions.length,
      yearRange: temporalContext.includes('Year span:') ? 
        temporalContext.match(/Year span: (\d+)-(\d+)/)?.[0] : 'Unknown',
      dominantEras: temporalContext.match(/era:\s*([^\n]+)/gi)?.slice(0, 3) || [],
      model: 'google/gemini-2.5-flash',
      version: '1.0'
    };

    // Store in database
    const { error: insertError } = await supabase
      .from('reading_insights')
      .insert({
        user_id: auth.userId,
        narrative,
        timeframe: 'temporal',
        metadata,
        generated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing temporal analysis:', insertError);
    }

    return json(200, {
      narrative,
      metadata,
      generatedAt: new Date().toISOString(),
      cached: false
    });

  } catch (error) {
    console.error('Temporal analysis error:', error);
    return json(500, { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

function generateTemporalContext(transmissions: UserTransmission[]): string {
  // Analyze temporal distribution
  const years = transmissions
    .map(t => t.publication_year)
    .filter(y => y && y > 1800 && y < 2030) as number[];

  if (years.length === 0) {
    return "No temporal data available for analysis.";
  }

  const yearRange = {
    earliest: Math.min(...years),
    latest: Math.max(...years),
    span: Math.max(...years) - Math.min(...years)
  };

  // Era distribution
  const getEra = (year: number): string => {
    if (year >= 1938 && year <= 1946) return 'Golden Age SF';
    if (year >= 1960 && year <= 1975) return 'New Wave SF';
    if (year >= 1980 && year <= 1995) return 'Cyberpunk';
    if (year >= 1990 && year <= 2010) return 'Post-Cyberpunk';
    if (year >= 2000) return 'Contemporary SF';
    if (year >= 1900 && year < 1938) return 'Early Modern SF';
    return 'Classical/Proto-SF';
  };

  const eraDistribution = years.reduce((acc, year) => {
    const era = getEra(year);
    acc[era] = (acc[era] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top eras
  const topEras = Object.entries(eraDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Recent books
  const recentBooks = transmissions
    .filter(t => t.publication_year)
    .sort((a, b) => (b.publication_year || 0) - (a.publication_year || 0))
    .slice(0, 10);

  // Decade distribution
  const decadeDistribution = years.reduce((acc, year) => {
    const decade = Math.floor(year / 10) * 10;
    acc[`${decade}s`] = (acc[`${decade}s`] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDecades = Object.entries(decadeDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Historical context tags
  const allTags = transmissions
    .flatMap(t => t.historical_context_tags || [])
    .filter(Boolean);
  
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Build context string
  let context = `Temporal Reading Profile:\n\n`;
  context += `Total books: ${transmissions.length}\n`;
  context += `Books with publication data: ${years.length}\n`;
  context += `Year span: ${yearRange.earliest}-${yearRange.latest} (${yearRange.span} years)\n\n`;

  context += `Era Distribution:\n`;
  topEras.forEach(([era, count]) => {
    context += `- ${era}: ${count} books (${Math.round(count / years.length * 100)}%)\n`;
  });

  context += `\nDecade Concentrations:\n`;
  topDecades.forEach(([decade, count]) => {
    context += `- ${decade}: ${count} books\n`;
  });

  if (topTags.length > 0) {
    context += `\nHistorical Context Tags:\n`;
    topTags.forEach(([tag, count]) => {
      context += `- ${tag}: ${count} mentions\n`;
    });
  }

  context += `\nRecent/Representative Books:\n`;
  recentBooks.slice(0, 8).forEach(book => {
    context += `- "${book.title}" by ${book.author}`;
    if (book.publication_year) {
      context += ` (${book.publication_year})`;
    }
    if (book.narrative_time_period) {
      context += ` [Set in: ${book.narrative_time_period}]`;
    }
    context += '\n';
  });

  return context;
}
