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
  isbn?: string
): Promise<EbookSearchResult> => {
  try {
    // First check cache
    const cached = await getCachedFreeEbookLink(title, author, isbn);
    
    // If cached and recent (within 7 days), use it
    if (cached) {
      const lastChecked = new Date(cached.last_checked);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      if (lastChecked > weekAgo) {
        return {
          hasLinks: !!(cached.gutenberg_url || cached.archive_url),
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
      }
    }

    // Search using edge function
    const { data, error } = await supabase.functions.invoke('search-free-ebooks', {
      body: { title, author, isbn }
    });

    if (error) {
      console.error('Error searching free ebooks:', error);
      return { hasLinks: false };
    }

    return data || { hasLinks: false };
  } catch (error) {
    console.error('Error in searchFreeEbooks:', error);
    return { hasLinks: false };
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