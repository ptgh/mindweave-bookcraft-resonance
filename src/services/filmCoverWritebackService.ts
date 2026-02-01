import { supabase } from "@/integrations/supabase/client";

/**
 * Updates the book_cover_url in sf_film_adaptations when a live fetch succeeds.
 * This is called from FilmBookCover when a Google Books API fetch finds a working cover
 * that isn't already stored in the database.
 * 
 * The update is done silently - we don't want to block the UI or show errors for this
 * background optimization.
 */
export async function writeBackFilmCover(
  bookTitle: string,
  bookAuthor: string,
  coverUrl: string
): Promise<boolean> {
  try {
    // Don't write back if URL is already a Supabase URL (already cached)
    if (coverUrl.includes('supabase.co/storage')) {
      return false;
    }

    // Find the film adaptation by title and author
    const { data: film, error: findError } = await supabase
      .from('sf_film_adaptations')
      .select('id, book_cover_url')
      .ilike('book_title', bookTitle)
      .ilike('book_author', `%${bookAuthor.split(' ').pop()}%`) // Match by last name
      .maybeSingle();

    if (findError || !film) {
      console.debug(`[WriteBack] Film not found: ${bookTitle}`);
      return false;
    }

    // Only update if current cover is null/empty or is an external URL that differs
    const currentCover = film.book_cover_url;
    const shouldUpdate = 
      !currentCover || 
      currentCover.trim() === '' ||
      (
        !currentCover.includes('supabase.co/storage') && 
        currentCover !== coverUrl
      );

    if (!shouldUpdate) {
      console.debug(`[WriteBack] No update needed for: ${bookTitle}`);
      return false;
    }

    // Update the database with the new cover URL
    const { error: updateError } = await supabase
      .from('sf_film_adaptations')
      .update({ book_cover_url: coverUrl })
      .eq('id', film.id);

    if (updateError) {
      console.warn(`[WriteBack] Update failed for ${bookTitle}:`, updateError);
      return false;
    }

    console.log(`[WriteBack] ✓ Updated cover for: ${bookTitle}`);
    return true;
  } catch (error) {
    // Silently fail - this is a background optimization
    console.debug(`[WriteBack] Error:`, error);
    return false;
  }
}
