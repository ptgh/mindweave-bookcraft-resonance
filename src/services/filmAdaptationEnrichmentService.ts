import { supabase } from "@/integrations/supabase/client";
import { searchGoogleBooks } from "./googleBooks/api";
import { cleanPersonName } from "@/utils/textCleaners";

export interface FilmAdaptationEnrichmentStats {
  totalFilms: number;
  missingBookData: number;
  processed: number;
  successful: number;
  failed: number;
}

export const getMissingBookDataStats = async (): Promise<{ 
  missingCovers: number; 
  missingYears: number;
  totalFilms: number 
}> => {
  const { data, error } = await supabase
    .from('sf_film_adaptations')
    .select('id, book_cover_url, book_publication_year');

  if (error) throw error;

  const missingCovers = data?.filter(f => !f.book_cover_url || f.book_cover_url.trim() === '').length || 0;
  const missingYears = data?.filter(f => !f.book_publication_year).length || 0;
  const totalFilms = data?.length || 0;

  return { missingCovers, missingYears, totalFilms };
};

export const enrichFilmAdaptationBooks = async (
  onProgress?: (current: number, total: number) => void
): Promise<FilmAdaptationEnrichmentStats> => {
  const stats: FilmAdaptationEnrichmentStats = {
    totalFilms: 0,
    missingBookData: 0,
    processed: 0,
    successful: 0,
    failed: 0
  };

  // Get films with missing book covers OR missing publication years
  const { data: filmsNeedingEnrichment, error } = await supabase
    .from('sf_film_adaptations')
    .select('id, book_title, book_author, book_cover_url, book_publication_year')
    .or('book_cover_url.is.null,book_publication_year.is.null');

  if (error) throw error;

  stats.totalFilms = filmsNeedingEnrichment?.length || 0;
  stats.missingBookData = stats.totalFilms;

  if (!filmsNeedingEnrichment || filmsNeedingEnrichment.length === 0) {
    return stats;
  }

  console.log(`Found ${filmsNeedingEnrichment.length} films needing book enrichment. Starting...`);

  for (let i = 0; i < filmsNeedingEnrichment.length; i++) {
    const film = filmsNeedingEnrichment[i];
    
    try {
      onProgress?.(i + 1, filmsNeedingEnrichment.length);
      
      // Clean author name for search using centralized cleaner
      const cleanAuthor = cleanPersonName(film.book_author).split(',')[0].trim();

      const searchQuery = `${film.book_title} ${cleanAuthor}`;
      const results = await searchGoogleBooks(searchQuery, 5);
      
      // Find best match by title similarity
      const bestMatch = results.find(result => 
        result.title.toLowerCase().includes(film.book_title.toLowerCase()) ||
        film.book_title.toLowerCase().includes(result.title.toLowerCase())
      ) || results[0]; // Fallback to first result if no good match
      
      if (bestMatch) {
        const updates: Record<string, any> = {};
        
        // Update cover if missing
        if (!film.book_cover_url && bestMatch.coverUrl) {
          updates.book_cover_url = bestMatch.coverUrl;
        }
        
        // Update publication year if missing
        if (!film.book_publication_year && bestMatch.publishedDate) {
          const year = parseInt(bestMatch.publishedDate.substring(0, 4));
          if (!isNaN(year) && year > 1800 && year <= new Date().getFullYear()) {
            updates.book_publication_year = year;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('sf_film_adaptations')
            .update(updates)
            .eq('id', film.id);

          if (updateError) {
            console.error(`Failed to update ${film.book_title}:`, updateError);
            stats.failed++;
          } else {
            console.log(`✓ Updated: ${film.book_title}`, updates);
            stats.successful++;
          }
        } else {
          console.log(`✗ No new data for: ${film.book_title}`);
          stats.failed++;
        }
      } else {
        console.log(`✗ No results for: ${film.book_title}`);
        stats.failed++;
      }

      stats.processed++;

      // Rate limiting - wait between requests
      if (i < filmsNeedingEnrichment.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

    } catch (error) {
      console.error(`Error processing ${film.book_title}:`, error);
      stats.failed++;
      stats.processed++;
    }
  }

  return stats;
};

// Re-fetch covers for films with broken/placeholder Google Books images
export const refreshBrokenCovers = async (
  onProgress?: (current: number, total: number) => void
): Promise<FilmAdaptationEnrichmentStats> => {
  const stats: FilmAdaptationEnrichmentStats = {
    totalFilms: 0,
    missingBookData: 0,
    processed: 0,
    successful: 0,
    failed: 0
  };

  // Get films with Google Books URLs that might be broken (containing specific problem IDs)
  const { data: films, error } = await supabase
    .from('sf_film_adaptations')
    .select('id, book_title, book_author, book_cover_url')
    .not('book_cover_url', 'is', null)
    .like('book_cover_url', '%books.google.com%');

  if (error) throw error;

  stats.totalFilms = films?.length || 0;

  if (!films || films.length === 0) {
    return stats;
  }

  console.log(`Checking ${films.length} films for broken covers...`);

  for (let i = 0; i < films.length; i++) {
    const film = films[i];
    
    try {
      onProgress?.(i + 1, films.length);
      
      // Clean author name for search using centralized cleaner
      const cleanAuthor = cleanPersonName(film.book_author).split(',')[0].trim();

      const searchQuery = `${film.book_title} ${cleanAuthor}`;
      const results = await searchGoogleBooks(searchQuery, 3);
      
      const bestMatch = results.find(result => 
        result.title.toLowerCase().includes(film.book_title.toLowerCase()) ||
        film.book_title.toLowerCase().includes(result.title.toLowerCase())
      );
      
      if (bestMatch?.coverUrl && bestMatch.coverUrl !== film.book_cover_url) {
        const { error: updateError } = await supabase
          .from('sf_film_adaptations')
          .update({ book_cover_url: bestMatch.coverUrl })
          .eq('id', film.id);

        if (!updateError) {
          console.log(`✓ Refreshed cover: ${film.book_title}`);
          stats.successful++;
        } else {
          stats.failed++;
        }
      }

      stats.processed++;

      // Rate limiting
      if (i < films.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`Error processing ${film.book_title}:`, error);
      stats.failed++;
      stats.processed++;
    }
  }

  return stats;
};
