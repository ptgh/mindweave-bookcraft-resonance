import { corsHeaders, json, requireUser, createServiceClient } from "../_shared/adminAuth.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user (not admin-only)
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!TMDB_API_KEY) {
    console.error('[add-external-film] TMDB_API_KEY not configured');
    return json(500, { error: 'TMDB_API_KEY not configured' });
  }

  if (!LOVABLE_API_KEY) {
    console.error('[add-external-film] LOVABLE_API_KEY not configured');
    return json(500, { error: 'LOVABLE_API_KEY not configured' });
  }

  try {
    const { tmdb_id, title, year, poster_url, preview_only } = await req.json();

    if (!tmdb_id || !title) {
      return json(400, { error: 'tmdb_id and title required' });
    }

    const isPreviewMode = preview_only === true;
    console.log(`[add-external-film] ${isPreviewMode ? 'Previewing' : 'Adding'} film: "${title}" (${year}) - TMDB ID: ${tmdb_id}`);

    const supabase = createServiceClient();

    // Check if already exists by tmdb_id
    const { data: existingByTmdb } = await supabase
      .from('sf_film_adaptations')
      .select('id, film_title')
      .eq('tmdb_id', tmdb_id)
      .maybeSingle();

    if (existingByTmdb) {
      console.log(`[add-external-film] Film already exists with tmdb_id: ${tmdb_id}`);
      return json(409, { error: 'Film already in collection', existing_id: existingByTmdb.id });
    }

    // Check by title + year as backup
    const { data: existingByTitle } = await supabase
      .from('sf_film_adaptations')
      .select('id, film_title')
      .ilike('film_title', title)
      .eq('film_year', year)
      .maybeSingle();

    if (existingByTitle) {
      console.log(`[add-external-film] Film already exists by title/year match`);
      return json(409, { error: 'Film already in collection', existing_id: existingByTitle.id });
    }

    // Fetch full details from TMDB
    const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const detailsRes = await fetch(detailsUrl);
    
    if (!detailsRes.ok) {
      console.error(`[add-external-film] TMDB details error: ${detailsRes.status}`);
      throw new Error(`Failed to fetch film details from TMDB`);
    }

    const details = await detailsRes.json();
    const director = details.credits?.crew?.find((c: any) => c.job === 'Director')?.name || null;

    console.log(`[add-external-film] Director: ${director || 'unknown'}, IMDB: ${details.imdb_id || 'none'}`);

    // Use AI to determine book source AND get real screenwriter names
    const aiPrompt = `Is the film "${title}" (${year}) directed by ${director || 'unknown'} based on a book, novel, or short story?

If YES (based on existing written work), respond with JSON:
{
  "is_adaptation": true,
  "book_title": "exact book title",
  "book_author": "author name in English/Latin characters",
  "source_type": "novel" | "short_story" | "novella"
}

If NO (original screenplay NOT based on a book), respond with:
{
  "is_adaptation": false,
  "book_title": "${title} (original screenplay)",
  "book_author": "ACTUAL SCREENWRITER NAME(S)",
  "source_type": "original"
}

CRITICAL RULES FOR ORIGINAL SCREENPLAYS:
- book_author MUST contain the REAL screenwriter name(s) who wrote the screenplay
- Use " & " to separate multiple writers (e.g., "Jim Thomas & John Thomas")
- Do NOT use the director's name unless they actually wrote the screenplay
- Do NOT use "Original screenplay" as the author - use the real writer names
- Examples: "Predator" -> "Jim Thomas & John Thomas", "Ex Machina" -> "Alex Garland"

If UNCERTAIN, make your best assessment based on your knowledge. Respond ONLY with valid JSON.`;

    let bookInfo = {
      is_adaptation: false,
      book_title: `${title} (original screenplay)`,
      book_author: 'Unknown Screenwriter', // Will be overwritten by AI or enrichment
      source_type: 'original'
    };

    try {
      const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: aiPrompt }
          ],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        try {
          let cleanContent = content.trim();
          if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
          if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
          if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
          bookInfo = JSON.parse(cleanContent.trim());
          console.log(`[add-external-film] AI determined book source:`, bookInfo);
        } catch (e) {
          console.warn('[add-external-film] Could not parse AI response, using defaults');
        }
      } else {
        console.warn(`[add-external-film] AI request failed: ${aiRes.status}`);
      }
    } catch (aiError) {
      console.warn('[add-external-film] AI request error:', aiError);
    }

    // If preview mode, return the book info without inserting
    if (isPreviewMode) {
      console.log('[add-external-film] Preview mode - returning book info without inserting');
      return json(200, {
        preview: true,
        director: director,
        book_info: bookInfo,
        tmdb_details: {
          imdb_id: details.imdb_id,
          rating: details.vote_average,
        }
      });
    }

    // Insert into database
    const { data: inserted, error: insertError } = await supabase
      .from('sf_film_adaptations')
      .insert({
        film_title: title,
        film_year: year,
        director: director,
        book_title: bookInfo.book_title,
        book_author: bookInfo.book_author,
        adaptation_type: bookInfo.is_adaptation ? bookInfo.source_type : 'original',
        poster_url: poster_url || (details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null),
        tmdb_id: tmdb_id,
        imdb_id: details.imdb_id || null,
        imdb_rating: details.vote_average || null,
        source: 'user_added',
      })
      .select('id, film_title')
      .single();

    if (insertError) {
      console.error('[add-external-film] Insert error:', insertError);
      return json(500, { error: 'Failed to add film: ' + insertError.message });
    }

    console.log(`[add-external-film] Successfully added film: ${inserted.film_title} (ID: ${inserted.id})`);

    // Trigger enrichment (fire-and-forget)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const INTERNAL_SECRET = Deno.env.get('INTERNAL_EDGE_SECRET');
    
    if (SUPABASE_URL && INTERNAL_SECRET && inserted?.id) {
      // Include screenplay enrichment for original screenplays
      const enrichFunctions = ['enrich-film-artwork', 'enrich-trailer-urls', 'enrich-screenplay-data'];
      for (const func of enrichFunctions) {
        fetch(`${SUPABASE_URL}/functions/v1/${func}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': INTERNAL_SECRET,
          },
          body: JSON.stringify({ filmIds: [inserted.id] }),
        }).catch(err => {
          console.warn(`[add-external-film] Background ${func} failed:`, err);
        });
      }
      console.log(`[add-external-film] Triggered background enrichment for film ID: ${inserted.id}`);
    }

    return json(200, {
      success: true,
      film: inserted,
      book_info: bookInfo,
      message: `Added "${title}" to collection!`
    });

  } catch (err) {
    console.error('[add-external-film] Error:', err);
    return json(500, { error: err instanceof Error ? err.message : 'Failed to add film' });
  }
});
