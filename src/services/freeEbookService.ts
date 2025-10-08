import { supabase } from "@/integrations/supabase/client";

export interface FreeEbookLink {
  id: string;
  book_title: string;
  book_author: string;
  isbn?: string;
  gutenberg_url?: string;
  archive_url?: string;
  gutenberg_id?: string;
  archive_id?: string;
  formats?: Record<string, string>;
  last_checked: string;
}

export interface EbookSearchResult {
  hasLinks: boolean;
  gutenberg?: {
    url: string;
    id: string;
    formats: Record<string, string>;
  };
  archive?: {
    url: string;
    id: string;
    formats: Record<string, string>;
  };
}

/**
 * Search for free ebook links in cached data
 */
export const getCachedFreeEbookLink = async (
  title: string, 
  author: string, 
  isbn?: string
): Promise<FreeEbookLink | null> => {
  try {
    let query = supabase
      .from('free_ebook_links')
      .select('*');

    // Try ISBN first if available
    if (isbn) {
      const { data: isbnResult } = await query.eq('isbn', isbn).single();
      if (isbnResult) {
        return {
          ...isbnResult,
          formats: typeof isbnResult.formats === 'string' 
            ? JSON.parse(isbnResult.formats) 
            : isbnResult.formats || {}
        } as FreeEbookLink;
      }
    }

    // Fallback to title/author search
    const { data, error } = await query
      .ilike('book_title', `%${title}%`)
      .ilike('book_author', `%${author}%`)
      .order('last_checked', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching cached ebook link:', error);
      return null;
    }

    if (data) {
      return {
        ...data,
        formats: typeof data.formats === 'string' 
          ? JSON.parse(data.formats) 
          : data.formats || {}
      } as FreeEbookLink;
    }

    return null;
  } catch (error) {
    console.error('Error in getCachedFreeEbookLink:', error);
    return null;
  }
};

/**
 * Search for free ebooks using edge function
 */
export const searchFreeEbooks = async (
  title: string,
  author: string,
  isbn?: string,
  options: { forceRefresh?: boolean } = {}
): Promise<EbookSearchResult> => {
  const startTime = Date.now();
  const searchKey = `${title}-${author}-${isbn || 'no-isbn'}`;
  
  console.log(`🔍 [FreeEbook] Starting search for: "${title}" by ${author}`, {
    title,
    author,
    isbn,
    searchKey: searchKey.substring(0, 50) + '...'
  });

  try {
    // Check cache unless force refresh
    if (!options.forceRefresh) {
      console.log('📦 [FreeEbook] Checking cache...');
      const cached = await getCachedFreeEbookLink(title, author, isbn);
      
      // If cached and recent (within 24 hours for negative, 7 days for positive), use it
      if (cached) {
        const lastChecked = new Date(cached.last_checked);
        const hasPositiveResult = !!(cached.gutenberg_url || cached.archive_url);
        const cacheTTL = hasPositiveResult 
          ? 7 * 24 * 60 * 60 * 1000  // 7 days for positive results
          : 24 * 60 * 60 * 1000;      // 24 hours for negative results
        const cacheExpiry = new Date(Date.now() - cacheTTL);
        const age = Date.now() - lastChecked.getTime();
        
        console.log(`💾 [FreeEbook] Cache entry found, age: ${Math.round(age / (1000 * 60 * 60))}h`, {
          hasGutenberg: !!cached.gutenberg_url,
          hasArchive: !!cached.archive_url,
          isPositive: hasPositiveResult,
          ttlHours: cacheTTL / (1000 * 60 * 60),
          lastChecked: cached.last_checked
        });
        
        if (lastChecked > cacheExpiry) {
          console.log('✅ [FreeEbook] Using cached result');
          return {
            hasLinks: hasPositiveResult,
            gutenberg: cached.gutenberg_url ? {
              url: cached.gutenberg_url,
              id: cached.gutenberg_id || '',
              formats: cached.formats || {}
            } : undefined,
            archive: cached.archive_url ? {
              url: cached.archive_url,
              id: cached.archive_id || '',
              formats: cached.formats || {}
            } : undefined
          };
        } else {
          console.log('⏰ [FreeEbook] Cache expired, refreshing...');
        }
      } else {
        console.log('❌ [FreeEbook] No cache entry found');
      }
    } else {
      console.log('🔄 [FreeEbook] Force refresh requested, bypassing cache');
    }

    // Prepare search terms with transliteration for non-English titles
    const searchTerms = prepareSearchTerms(title, author);
    console.log('🔤 [FreeEbook] Search terms prepared:', searchTerms);

    // Search using edge function with timeout
    console.log('🌐 [FreeEbook] Calling edge function...');
    const searchPromise = supabase.functions.invoke('search-free-ebooks', {
      body: { 
        title, 
        author, 
        isbn,
        searchTerms,
        priority: determinePriority(title, author)
      }
    });

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Search timeout after 30s')), 30000);
    });

    const { data, error } = await Promise.race([searchPromise, timeoutPromise]);
    const responseTime = Date.now() - startTime;

    if (error) {
      console.error('💥 [FreeEbook] Edge function error:', error);
      console.log(`⏱️ [FreeEbook] Failed after ${responseTime}ms`);
      
      // Cache negative result to avoid repeated failed searches
      await cacheNegativeResult(title, author, isbn);
      return { hasLinks: false };
    }

    const result = data || { hasLinks: false };
    console.log(`✅ [FreeEbook] Search completed in ${responseTime}ms:`, {
      hasLinks: result.hasLinks,
      hasGutenberg: !!result.gutenberg,
      hasArchive: !!result.archive,
      responseTime
    });

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 [FreeEbook] Search failed after ${responseTime}ms:`, error);
    
    // Cache negative result for network errors too
    await cacheNegativeResult(title, author, isbn);
    return { hasLinks: false };
  }
};

/**
 * Prepare search terms with transliteration and alternatives
 */
const prepareSearchTerms = (title: string, author: string) => {
  const terms = {
    title: [title],
    author: [author]
  };
  
  // Add simplified versions for non-English titles
  if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(title)) {
    // Remove special characters and diacritics
    const simplified = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s]/g, ' ')         // Remove special chars
      .replace(/\s+/g, ' ')             // Normalize spaces
      .trim();
    
    if (simplified !== title) {
      terms.title.push(simplified);
      console.log('🔤 [FreeEbook] Added simplified title:', simplified);
    }
  }
  
  return terms;
};

/**
 * Determine search priority based on title/author patterns
 */
const determinePriority = (title: string, author: string): 'high' | 'normal' | 'low' => {
  // High priority for classic authors likely to be in public domain
  const classicAuthors = ['asimov', 'herbert', 'clarke', 'heinlein', 'verne', 'wells'];
  if (classicAuthors.some(classic => author.toLowerCase().includes(classic))) {
    return 'high';
  }
  
  // Low priority for very recent books or non-English titles
  if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(title)) {
    return 'low';
  }
  
  return 'normal';
};

/**
 * Cache negative result to avoid repeated failed searches
 */
const cacheNegativeResult = async (title: string, author: string, isbn?: string) => {
  try {
    await supabase.from('free_ebook_links').upsert({
      book_title: title,
      book_author: author,
      isbn: isbn,
      last_checked: new Date().toISOString(),
      gutenberg_url: null,
      archive_url: null,
      formats: {}
    }, {
      onConflict: 'book_title,book_author'
    });
    console.log('💾 [FreeEbook] Cached negative result');
  } catch (error) {
    console.error('💥 [FreeEbook] Failed to cache negative result:', error);
  }
};

/**
 * Download a free ebook using fetch to handle cross-origin issues
 */
export const downloadFreeEbook = async (
  url: string,
  filename: string,
  source: 'gutenberg' | 'archive'
): Promise<boolean> => {
  try {
    console.log(`Attempting to download: ${url}`);
    
    // Try to fetch the file and create a blob for download
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': '*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup blob URL
    window.URL.revokeObjectURL(blobUrl);
    
    console.log(`Free ebook download completed: ${filename} from ${source}`);
    return true;
  } catch (error) {
    console.error('Blob download failed, trying direct link:', error);
    
    // Fallback to direct link if fetch fails
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Direct link download initiated: ${filename} from ${source}`);
      return true;
    } catch (fallbackError) {
      console.error('Error downloading free ebook:', fallbackError);
      return false;
    }
  }
};

/**
 * Get preferred download format and URL
 */
export const getPreferredDownloadUrl = (formats: Record<string, string>): { url: string; format: string } | null => {
  // Preference order: EPUB > PDF > TXT for better compatibility
  const preferenceOrder = ['epub', 'pdf', 'txt'];
  
  for (const format of preferenceOrder) {
    // Check for exact match or partial match (e.g., 'epub.noimages', 'pdf.compressed')
    const matchingFormat = Object.keys(formats).find(key => 
      key.toLowerCase().includes(format.toLowerCase())
    );
    
    if (matchingFormat && formats[matchingFormat]) {
      return { url: formats[matchingFormat], format: format };
    }
  }
  
  // If no preferred format, return first available
  const firstFormat = Object.keys(formats)[0];
  if (firstFormat) {
    const cleanFormat = firstFormat.toLowerCase().includes('epub') ? 'epub' : 
                       firstFormat.toLowerCase().includes('pdf') ? 'pdf' : 
                       firstFormat.toLowerCase().includes('txt') ? 'txt' : firstFormat;
    return { url: formats[firstFormat], format: cleanFormat };
  }
  
  return null;
};