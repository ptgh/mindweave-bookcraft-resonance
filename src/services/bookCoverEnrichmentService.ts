import { supabase } from "@/integrations/supabase/client";
import { searchGoogleBooks } from "./googleBooks/api";

export interface CoverEnrichmentStats {
  totalBooks: number;
  missingCovers: number;
  processed: number;
  successful: number;
  failed: number;
}

export const getMissingCoverStats = async (): Promise<{ missingCovers: number; totalBooks: number }> => {
  const { data, error } = await supabase
    .from('transmissions')
    .select('id, cover_url', { count: 'exact' });

  if (error) throw error;

  const missingCovers = data?.filter(t => !t.cover_url || t.cover_url.trim() === '').length || 0;
  const totalBooks = data?.length || 0;

  return { missingCovers, totalBooks };
};

export const enrichBookCovers = async (
  onProgress?: (current: number, total: number) => void
): Promise<CoverEnrichmentStats> => {
  const stats: CoverEnrichmentStats = {
    totalBooks: 0,
    missingCovers: 0,
    processed: 0,
    successful: 0,
    failed: 0
  };

  // Get all books missing covers
  const { data: booksWithoutCovers, error } = await supabase
    .from('transmissions')
    .select('id, title, author, isbn, cover_url')
    .or('cover_url.is.null,cover_url.eq.');

  if (error) throw error;

  stats.totalBooks = booksWithoutCovers?.length || 0;
  stats.missingCovers = stats.totalBooks;

  if (!booksWithoutCovers || booksWithoutCovers.length === 0) {
    return stats;
  }

  console.log(`Found ${booksWithoutCovers.length} books without covers. Starting enrichment...`);

  for (let i = 0; i < booksWithoutCovers.length; i++) {
    const book = booksWithoutCovers[i];
    
    try {
      onProgress?.(i + 1, booksWithoutCovers.length);
      
      let coverUrl: string | null = null;

      // Try ISBN first if available
      if (book.isbn) {
        const results = await searchGoogleBooks(`isbn:${book.isbn}`, 1);
        if (results[0]?.coverUrl) {
          coverUrl = results[0].coverUrl;
        }
      }

      // Try title + author if ISBN didn't work
      if (!coverUrl && book.title && book.author) {
        const searchQuery = `${book.title} ${book.author}`;
        const results = await searchGoogleBooks(searchQuery, 3);
        
        // Find best match by title similarity
        const bestMatch = results.find(result => 
          result.title.toLowerCase().includes(book.title!.toLowerCase()) ||
          book.title!.toLowerCase().includes(result.title.toLowerCase())
        );
        
        if (bestMatch?.coverUrl) {
          coverUrl = bestMatch.coverUrl;
        }
      }

      if (coverUrl) {
        // Update the book with the found cover
        const { error: updateError } = await supabase
          .from('transmissions')
          .update({ cover_url: coverUrl })
          .eq('id', book.id);

        if (updateError) {
          console.error(`Failed to update cover for ${book.title}:`, updateError);
          stats.failed++;
        } else {
          console.log(`✓ Updated cover for: ${book.title}`);
          stats.successful++;
        }
      } else {
        console.log(`✗ No cover found for: ${book.title}`);
        stats.failed++;
      }

      stats.processed++;

      // Rate limiting - wait between requests
      if (i < booksWithoutCovers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`Error processing ${book.title}:`, error);
      stats.failed++;
      stats.processed++;
    }
  }

  return stats;
};
