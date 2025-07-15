import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnnasArchiveSearchParams {
  title?: string;
  author?: string;
  isbn?: string;
  language?: string;
  limit?: number;
}

interface AnnasArchiveBook {
  id: string;
  title: string;
  author: string;
  year?: string;
  language: string;
  filesize?: string;
  extension: string;
  downloadUrl: string;
  coverUrl?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
}

async function searchAnnasArchiveBooks(params: AnnasArchiveSearchParams): Promise<AnnasArchiveBook[]> {
  try {
    const domain = 'annas-archive.org';
    
    // Build search query for Anna's Archive
    let searchQuery = '';
    if (params.title && params.author) {
      searchQuery = `author:"${params.author}" title:"${params.title}"`;
    } else if (params.title) {
      searchQuery = `title:"${params.title}"`;
    } else if (params.author) {
      searchQuery = `author:"${params.author}"`;
    } else if (params.isbn) {
      searchQuery = `isbn:"${params.isbn}"`;
    }

    if (!searchQuery) {
      throw new Error('At least title, author, or ISBN is required');
    }

    const searchParams = new URLSearchParams({
      q: searchQuery,
      ext: 'pdf,epub,mobi', // Focus on common ebook formats
      sort: 'newest',
      lang: params.language || 'en'
    });

    const searchUrl = `https://${domain}/search?${searchParams.toString()}`;
    
    console.log('🔍 Searching Anna\'s Archive:', searchUrl);

    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const html = await searchResponse.text();
    
    // Parse the HTML to extract book information
    const books = parseAnnasArchiveSearchResults(html, domain);
    
    console.log(`📚 Found ${books.length} books from Anna's Archive`);
    return books.slice(0, params.limit || 10);

  } catch (error) {
    console.error('❌ Anna\'s Archive search error:', error);
    throw error;
  }
}

function parseAnnasArchiveSearchResults(html: string, domain: string): AnnasArchiveBook[] {
  const books: AnnasArchiveBook[] = [];
  
  try {
    // Anna's Archive 2024 structure - look for table rows with book data
    // Each book is typically in a table row with specific data cells
    const tableRowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const tableRows = html.match(tableRowRegex) || [];
    
    console.log(`🔍 Found ${tableRows.length} table rows to parse`);

    // Filter rows that contain MD5 links (actual book entries)
    const bookRows = tableRows.filter(row => row.includes('/md5/'));
    console.log(`📖 Found ${bookRows.length} book rows with MD5 links`);

    bookRows.forEach((row, index) => {
      try {
        // Extract MD5 link first
        const md5Match = row.match(/\/md5\/([a-f0-9]{32})/);
        if (!md5Match) return;

        const md5Hash = md5Match[1];
        const downloadPath = `/md5/${md5Hash}`;

        // Extract title - look for links or text in table cells
        const titlePatterns = [
          /<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/gi,
          /<td[^>]*>([^<]+)<\/td>/gi,
          />([^<]{10,})</gi // Any text longer than 10 chars
        ];
        
        let title = '';
        for (const pattern of titlePatterns) {
          const matches = row.match(pattern);
          if (matches) {
            // Find the longest meaningful text that's not just numbers/symbols
            const candidates = matches
              .map(m => m.replace(/<[^>]*>/g, '').trim())
              .filter(text => text.length > 5 && !/^\d+$/.test(text) && !/^[^\w]*$/.test(text));
            
            if (candidates.length > 0) {
              title = candidates.reduce((longest, current) => 
                current.length > longest.length ? current : longest
              );
              break;
            }
          }
        }

        // Extract file format from extension or text
        const formatMatch = row.match(/\.(pdf|epub|mobi|azw3|djvu|fb2|txt)/gi) ||
                           row.match(/(pdf|epub|mobi|azw3|djvu|fb2|txt)/gi);
        const extension = formatMatch ? formatMatch[0].replace('.', '').toLowerCase() : 'pdf';

        // Extract file size
        const sizeMatch = row.match(/(\d+(?:\.\d+)?\s*[KMGT]?B)/gi);
        const filesize = sizeMatch ? sizeMatch[0] : '';

        // Extract year if present
        const yearMatch = row.match(/(19|20)\d{2}/g);
        const year = yearMatch ? yearMatch[yearMatch.length - 1] : '';

        // For author, look for common patterns or use search context
        let author = 'Unknown Author';
        const authorPatterns = [
          /by\s+([^<>\n,]+)/gi,
          /author[^>]*>([^<]+)/gi,
          /([A-Z][a-z]+\s+[A-Z][a-z]+)/g // Name pattern
        ];
        
        for (const pattern of authorPatterns) {
          const match = row.match(pattern);
          if (match && match[1]) {
            author = match[1].trim();
            break;
          }
        }

        // Create book entry if we have essential data
        if (title && title.length > 3) {
          books.push({
            id: `annas-${md5Hash.slice(0, 8)}`,
            title: title,
            author: author,
            year,
            language: 'English',
            filesize,
            extension,
            downloadUrl: `https://${domain}${downloadPath}`,
            coverUrl: `https://via.placeholder.com/120x180/1e293b/64748b?text=${extension.toUpperCase()}`,
            publisher: "Anna's Archive",
            isbn: '',
            description: `${title} by ${author} - Available on Anna's Archive`
          });
        }
      } catch (error) {
        console.error(`Error parsing book row ${index}:`, error);
      }
    });

    // Enhanced fallback method if table parsing fails
    if (books.length === 0) {
      console.log('🔄 Trying enhanced fallback parsing method...');
      
      // Get all MD5 links
      const md5Links = html.match(/\/md5\/[a-f0-9]{32}/g) || [];
      console.log(`🔗 Found ${md5Links.length} MD5 links`);
      
      // Try to extract titles from page context
      const titleCandidates = html.match(/>([^<]{15,100})</g) || [];
      const meaningfulTitles = titleCandidates
        .map(t => t.replace(/^>/, '').trim())
        .filter(t => 
          t.length > 10 && 
          t.length < 200 && 
          !/^\d+$/.test(t) &&
          !/^(search|results|archive)/i.test(t) &&
          /[a-zA-Z]/.test(t)
        )
        .slice(0, md5Links.length);

      // Pair MD5 links with titles
      md5Links.slice(0, 5).forEach((link, index) => {
        const title = meaningfulTitles[index] || `Document ${index + 1}`;
        const md5Hash = link.match(/([a-f0-9]{32})/)[1];
        
        books.push({
          id: `annas-fallback-${md5Hash.slice(0, 8)}`,
          title: title,
          author: 'Unknown Author',
          year: '',
          language: 'English',
          filesize: '',
          extension: 'pdf',
          downloadUrl: `https://${domain}${link}`,
          coverUrl: 'https://via.placeholder.com/120x180/1e293b/64748b?text=PDF',
          publisher: "Anna's Archive",
          description: `${title} - Available on Anna's Archive`
        });
      });
    }

  } catch (error) {
    console.error('❌ Error parsing Anna\'s Archive results:', error);
  }

  return books;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { searchParams } = body;
    
    if (!searchParams) {
      return new Response(
        JSON.stringify({ error: 'Search parameters required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Anna\'s Archive search request:', searchParams);

    const books = await searchAnnasArchiveBooks(searchParams);

    return new Response(
      JSON.stringify({
        books,
        total: books.length,
        page: 1
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to search Anna\'s Archive',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});