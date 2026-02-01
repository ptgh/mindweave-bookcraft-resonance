import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

interface AIRecommendation {
  film_title: string;
  book_title: string;
  author: string;
  year: number;
  director: string;
  reason: string;
  type?: 'NEW' | 'REDISCOVERY';
}

// Helper for JSON responses with CORS
function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Trigger enrichment functions internally (fire-and-forget)
async function triggerEnrichment(filmIds: string[], supabaseUrl: string, internalSecret: string): Promise<void> {
  // Removed legacy 'enrich-criterion-links' - Criterion feature deprecated
  const enrichFunctions = [
    'enrich-film-artwork',
    'enrich-trailer-urls',
    'enrich-film-book-covers'
  ];

  for (const funcName of enrichFunctions) {
    try {
      const url = `${supabaseUrl}/functions/v1/${funcName}`;
      console.log(`[auto-enrich] Triggering ${funcName} for ${filmIds.length} films...`);
      
      // Fire-and-forget - don't await
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify({ filmIds }),
      }).then(res => {
        console.log(`[auto-enrich] ${funcName} responded: ${res.status}`);
      }).catch(err => {
        console.warn(`[auto-enrich] ${funcName} failed:`, err.message);
      });
      
      // Small delay between triggering functions
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.warn(`[auto-enrich] Failed to trigger ${funcName}:`, err);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin authorization (writes to sf_film_adaptations)
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  // === ENV VAR NULL CHECKS ===
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const INTERNAL_EDGE_SECRET = Deno.env.get('INTERNAL_EDGE_SECRET');

  if (!SUPABASE_URL) {
    console.error('Missing SUPABASE_URL');
    return json(500, { error: 'Server misconfiguration: SUPABASE_URL not set', recommendations: [] });
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return json(500, { error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set', recommendations: [] });
  }
  if (!LOVABLE_API_KEY) {
    console.error('Missing LOVABLE_API_KEY');
    return json(500, { error: 'Server misconfiguration: LOVABLE_API_KEY not set', recommendations: [] });
  }
  if (!INTERNAL_EDGE_SECRET) {
    console.error('Missing INTERNAL_EDGE_SECRET');
    return json(500, { error: 'Server misconfiguration: INTERNAL_EDGE_SECRET not set', recommendations: [] });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get existing films for context and deduplication
    const { data: existingFilms } = await supabase
      .from('sf_film_adaptations')
      .select('film_title, book_title, book_author')
      .limit(100);

    const existingTitles = existingFilms?.map(f => f.film_title.toLowerCase()) || [];
    const existingTitlesStr = existingFilms?.map(f => f.film_title).join(', ') || '';

const systemPrompt = `You have been doing an exceptional job curating this science fiction film collection — the suggestions so far have been excellent and the database has grown to ${existingFilms?.length || 0} quality films. 

However, as the collection expands, finding genuinely new titles becomes harder. We need your help to dig deeper and uncover films that haven't yet been suggested. Keep processing the way you have been — your judgment on quality has been spot-on — but push further into overlooked corners of SF cinema.

AUDIENCE:
- Serious science fiction enthusiasts who value both literature and cinema
- Appreciate critically acclaimed work, not just popular titles
- English-speaking (UK, US, Australia, Canada)

STRICT REQUIREMENTS:
- FEATURE FILMS ONLY — no TV series, no miniseries, no anthology episodes
- English-language priority (80%), international films only if widely acclaimed and easily available in English (20%)
- Films must have critical credibility (festival recognition, respected director, strong reviews, or cult classic status)
- Popular films are welcome IF they have genuine merit

QUALITY INDICATORS (at least one required):
- Based on work by respected SF author (Asimov, Dick, Le Guin, Clarke, Bradbury, Vonnegut, Wells, Heinlein, etc.)
- Directed by acclaimed filmmaker
- Festival recognition or major award nominations
- Strong critical reviews (not just box office success)
- Recognized cult classic status
- Significant influence on the genre

CATEGORIES TO EXPLORE (dig deep here):
- Overlooked 1960s-80s literary adaptations
- Acclaimed indie SF films
- British SF cinema
- Recent prestige SF (A24, streaming originals with critical acclaim)
- Lesser-known Philip K. Dick adaptations
- Films based on SF short stories
- Directorial passion projects adapting classic novels
- Commonwealth SF (Australia, Canada, New Zealand)
- Thoughtful 1990s-2000s SF that got lost in the blockbuster era

AVOID:
- TV series, miniseries, limited series (feature films only)
- Films without critical credibility
- Hard-to-find international films without English availability

IMPORTANT: Use only English/Latin characters in your responses.

EXISTING FILMS IN COLLECTION — DO NOT SUGGEST THESE (${existingFilms?.length || 0} total):
${existingTitlesStr}`;

    const userPrompt = `Suggest 6 science fiction FEATURE FILMS (no TV series) based on books or short stories.

Your curation has been excellent — the collection is now ${existingFilms?.length || 0} films strong. We need you to dig deeper to find quality titles not yet included.

Audience: Discerning SF book lovers and cinephiles who value quality and credibility.

Requirements:
- FEATURE FILMS ONLY (theatrical or streaming feature, 70+ minutes)
- No TV series, miniseries, or anthology episodes
- Prioritize English-language (max 1 international film, must be acclaimed and available in English)
- Each film must have critical merit (awards, respected director, strong reviews, or cult status)
- Popular films welcome if genuinely good
- 4-5 NEW films not yet in the collection
- 1-2 REDISCOVERY picks from existing collection

Push into overlooked areas:
- 1970s-80s adaptations that aren't the obvious picks
- Indie SF with theatrical or streaming release
- British and Commonwealth cinema
- Recent prestige SF (2015-2024)
- Short story adaptations

Return ONLY valid JSON:
[
  {
    "film_title": "...",
    "book_title": "...",
    "author": "...",
    "year": 1999,
    "director": "...",
    "reason": "Why it has merit (awards, critical reception, influence, quality)",
    "type": "NEW" or "REDISCOVERY"
  }
]

Use only English/Latin characters for all names.`;

    console.log('Calling Lovable AI for film recommendations...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return json(429, { error: 'Rate limit exceeded. Please try again later.', recommendations: [] });
      }
      if (response.status === 402) {
        return json(402, { error: 'AI credits exhausted. Please add credits.', recommendations: [] });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing...');

    // Extract JSON from response - clean parsing
    let recommendations: AIRecommendation[] = [];
    try {
      let cleanContent = content.trim();
      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
      cleanContent = cleanContent.trim();
      
      recommendations = JSON.parse(cleanContent);
      
      if (!Array.isArray(recommendations)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return json(500, { 
        error: 'Failed to parse AI response as valid JSON',
        recommendations: []
      });
    }

    console.log(`Parsed ${recommendations.length} recommendations`);

    // Auto-add recommendations to database (avoiding duplicates)
    let addedCount = 0;
    const addedFilms: string[] = [];
    const addedFilmIds: string[] = [];
    const skippedFilms: string[] = [];

    for (const rec of recommendations) {
      const normalizedTitle = rec.film_title.toLowerCase().trim();
      
      // Check if already exists
      if (existingTitles.includes(normalizedTitle)) {
        skippedFilms.push(rec.film_title);
        console.log(`Skipped (already exists): ${rec.film_title}`);
        continue;
      }

      // Double-check in database
      const { data: existing } = await supabase
        .from('sf_film_adaptations')
        .select('id')
        .ilike('film_title', rec.film_title)
        .limit(1);

      if (existing && existing.length > 0) {
        skippedFilms.push(rec.film_title);
        console.log(`Skipped (found in DB): ${rec.film_title}`);
        continue;
      }

      // Insert new film
      const { data: inserted, error: insertError } = await supabase
        .from('sf_film_adaptations')
        .insert({
          film_title: rec.film_title,
          book_title: rec.book_title,
          book_author: rec.author,
          film_year: rec.year,
          director: rec.director,
          source: 'ai_suggested',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`Failed to insert ${rec.film_title}:`, insertError);
      } else {
        addedCount++;
        addedFilms.push(rec.film_title);
        if (inserted?.id) {
          addedFilmIds.push(inserted.id);
        }
        existingTitles.push(normalizedTitle); // Prevent duplicates in this batch
        console.log(`Added: ${rec.film_title} (id: ${inserted?.id})`);
      }
    }

    console.log(`Added ${addedCount} new films to database`);

    // === AUTO-TRIGGER ENRICHMENT (server-side, no client orchestration) ===
    if (addedFilmIds.length > 0) {
      console.log(`[auto-enrich] Triggering enrichment for ${addedFilmIds.length} new films...`);
      // Fire-and-forget - don't await
      triggerEnrichment(addedFilmIds, SUPABASE_URL, INTERNAL_EDGE_SECRET);
    }

    return json(200, { 
      recommendations,
      added: addedFilms,
      skipped: skippedFilms,
      addedCount,
      addedFilmIds,
      message: addedCount > 0 
        ? `Added ${addedCount} new film${addedCount > 1 ? 's' : ''} to collection! Enrichment started.`
        : 'All suggested films are already in your collection.'
    });

  } catch (error) {
    console.error('Error in ai-film-recommendations:', error);
    return json(500, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: []
    });
  }
});
