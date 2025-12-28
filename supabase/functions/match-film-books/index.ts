import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, requireAdminOrInternal, createServiceClient } from "../_shared/adminAuth.ts";

interface MatchResult {
  filmId: string;
  bookId: string | null;
  confidence: number;
  matchType: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Env var safety checks
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing required env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json(500, { error: "Server configuration error: missing required environment variables" });
  }

  // Require admin or internal call
  const authResult = await requireAdminOrInternal(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  console.log("✅ [MatchFilmBooks] Authorized, processing request...");

  try {
    const body = await req.json().catch(() => ({}));
    const { filmIds } = body as { filmIds?: string[] };

    const supabase = createServiceClient();

    // Fetch films that need matching
    let query = supabase
      .from("sf_film_adaptations")
      .select("id, book_title, book_author, book_isbn")
      .is("book_id", null);

    if (filmIds && filmIds.length > 0) {
      query = query.in("id", filmIds);
    }

    const { data: films, error: filmsError } = await query;

    if (filmsError) {
      console.error("❌ Failed to fetch films:", filmsError);
      return json(500, { error: "Failed to fetch films", details: filmsError.message });
    }

    if (!films || films.length === 0) {
      console.log("ℹ️ No films need matching");
      return json(200, { success: true, matched: 0, message: "No films need matching" });
    }

    console.log(`📚 [MatchFilmBooks] Processing ${films.length} films for matching...`);

    // Fetch all publisher books for matching
    const { data: books, error: booksError } = await supabase
      .from("publisher_books")
      .select("id, title, author, isbn");

    if (booksError) {
      console.error("❌ Failed to fetch publisher books:", booksError);
      return json(500, { error: "Failed to fetch books", details: booksError.message });
    }

    const results: MatchResult[] = [];
    let matchedCount = 0;

    for (const film of films) {
      let bestMatch: { bookId: string; confidence: number; matchType: string } | null = null;

      // Strategy 1: Exact ISBN match (highest confidence)
      if (film.book_isbn) {
        const isbnMatch = books?.find(b => 
          b.isbn && normalizeIsbn(b.isbn) === normalizeIsbn(film.book_isbn!)
        );
        if (isbnMatch) {
          bestMatch = { bookId: isbnMatch.id, confidence: 100, matchType: "isbn_exact" };
        }
      }

      // Strategy 2: Fuzzy title + author match (if no ISBN match)
      if (!bestMatch && books) {
        const normalizedFilmTitle = normalizeText(film.book_title);
        const normalizedFilmAuthor = normalizeText(film.book_author);

        for (const book of books) {
          const normalizedBookTitle = normalizeText(book.title);
          const normalizedBookAuthor = normalizeText(book.author);

          // Calculate similarity
          const titleSimilarity = calculateSimilarity(normalizedFilmTitle, normalizedBookTitle);
          const authorSimilarity = calculateSimilarity(normalizedFilmAuthor, normalizedBookAuthor);

          // Require high title match and reasonable author match
          if (titleSimilarity >= 0.85 && authorSimilarity >= 0.7) {
            const confidence = Math.round((titleSimilarity * 0.6 + authorSimilarity * 0.4) * 100);
            
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = { bookId: book.id, confidence, matchType: "fuzzy_title_author" };
            }
          }
        }
      }

      // Update film if we found a match
      if (bestMatch && bestMatch.confidence >= 70) {
        const { error: updateError } = await supabase
          .from("sf_film_adaptations")
          .update({
            book_id: bestMatch.bookId,
            match_confidence: bestMatch.confidence
          })
          .eq("id", film.id);

        if (updateError) {
          console.error(`❌ Failed to update film ${film.id}:`, updateError);
        } else {
          matchedCount++;
          console.log(`✅ Matched film "${film.book_title}" with confidence ${bestMatch.confidence}% (${bestMatch.matchType})`);
        }

        results.push({
          filmId: film.id,
          bookId: bestMatch.bookId,
          confidence: bestMatch.confidence,
          matchType: bestMatch.matchType
        });
      } else {
        results.push({
          filmId: film.id,
          bookId: null,
          confidence: bestMatch?.confidence || 0,
          matchType: "no_match"
        });
      }
    }

    console.log(`✅ [MatchFilmBooks] Completed: ${matchedCount}/${films.length} films matched`);

    return json(200, {
      success: true,
      processed: films.length,
      matched: matchedCount,
      results
    });

  } catch (err) {
    console.error("❌ [MatchFilmBooks] Error:", err);
    return json(500, { error: "Internal error", details: String(err) });
  }
});

// Helper functions for text normalization and similarity

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, "").toLowerCase();
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ")    // Normalize whitespace
    .trim();
}

// Simple Jaccard-like similarity for short strings
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const words1 = new Set(str1.split(" "));
  const words2 = new Set(str2.split(" "));

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  const jaccardSim = intersection / union;

  // Also check for substring containment
  const containsBonus = str1.includes(str2) || str2.includes(str1) ? 0.2 : 0;

  return Math.min(1, jaccardSim + containsBonus);
}