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
    // Anna's Archive uses a more structured format than Z-Library
    // Look for search result items (typically in divs with specific classes)
    
    // Extract search result blocks - Anna's Archive typically uses consistent structure
    const resultBlockRegex = /<div[^>]*class="[^"]*h-\[125\][^"]*"[^>]*>.*?<\/div>/gs;
    const resultBlocks = html.match(resultBlockRegex) || [];

    // Also try alternative patterns for different page layouts
    const alternativeRegex = /<div[^>]*class="[^"]*border[^"]*rounded[^"]*"[^>]*>.*?(?=<div[^>]*class="[^"]*border[^"]*rounded|$)/gs;
    const alternativeBlocks = html.match(alternativeRegex) || [];
    
    const allBlocks = [...resultBlocks, ...alternativeBlocks];

    console.log(`🔍 Found ${allBlocks.length} potential result blocks`);

    allBlocks.forEach((block, index) => {
      try {
        // Extract title - Anna's Archive usually has titles in links or headers
        const titleMatches = [
          /<h3[^>]*>.*?<a[^>]*>([^<]+)</gi,
          /<a[^>]*class="[^"]*text-[^"]*"[^>]*>([^<]+)</gi,
          /<div[^>]*class="[^"]*font-bold[^"]*"[^>]*>([^<]+)</gi
        ];
        
        let title = '';
        for (const regex of titleMatches) {
          const match = block.match(regex);
          if (match && match[1]) {
            title = match[1].trim();
            break;
          }
        }

        // Extract author
        const authorMatches = [
          /author[^>]*>([^<]+)/gi,
          /by\s+([^<\n,]+)/gi,
          /<div[^>]*class="[^"]*text-gray[^"]*"[^>]*>([^<]+)</gi
        ];
        
        let author = '';
        for (const regex of authorMatches) {
          const match = block.match(regex);
          if (match && match[1]) {
            author = match[1].trim();
            break;
          }
        }

        // Extract download link (MD5 hash based)
        const linkMatches = [
          /href="\/md5\/([a-f0-9]{32})"/gi,
          /\/md5\/([a-f0-9]{32})/gi,
          /href="(\/download\/[^"]+)"/gi
        ];
        
        let downloadPath = '';
        for (const regex of linkMatches) {
          const match = block.match(regex);
          if (match && match[1]) {
            downloadPath = match[1].includes('/md5/') ? `/md5/${match[1]}` : match[1];
            break;
          }
        }

        // Extract file format
        const formatMatches = [
          /\.(\w+)(?:\s*,|\s*\]|\s*$)/gi,
          /format[^>]*>([^<]+)/gi,
          /(pdf|epub|mobi|azw3|djvu|fb2)/gi
        ];
        
        let extension = 'pdf'; // default
        for (const regex of formatMatches) {
          const match = block.match(regex);
          if (match && match[1]) {
            extension = match[1].toLowerCase();
            break;
          }
        }

        // Extract file size
        const sizeMatch = block.match(/(\d+(?:\.\d+)?\s*[KMGT]?B)/gi);
        const filesize = sizeMatch ? sizeMatch[0] : '';

        // Extract year
        const yearMatch = block.match(/(\d{4})/g);
        const year = yearMatch ? yearMatch[yearMatch.length - 1] : ''; // Take the last year found

        // Extract ISBN if present
        const isbnMatch = block.match(/isbn[^>]*>([^<]+)/gi) || block.match(/(\d{13}|\d{10})/g);
        const isbn = isbnMatch ? isbnMatch[0].replace(/\D/g, '') : '';

        // Only add if we have essential information
        if (title && downloadPath) {
          books.push({
            id: `annas-${index + 1}`,
            title: title || `Book ${index + 1}`,
            author: author || 'Unknown Author',
            year,
            language: 'English',
            filesize,
            extension,
            downloadUrl: `https://${domain}${downloadPath}`,
            coverUrl: `https://via.placeholder.com/120x180/1e293b/64748b?text=${extension.toUpperCase()}`,
            publisher: "Anna's Archive",
            isbn,
            description: `${title} by ${author} - Available on Anna's Archive`
          });
        }
      } catch (error) {
        console.error(`Error parsing book entry ${index}:`, error);
      }
    });

    // If we didn't find results with the primary method, try a simpler approach
    if (books.length === 0) {
      console.log('🔄 Trying fallback parsing method...');
      
      // Look for any links containing MD5 hashes (Anna's Archive's primary format)
      const md5Links = html.match(/\/md5\/[a-f0-9]{32}/g) || [];
      const titleElements = html.match(/<title[^>]*>([^<]+)</gi) || [];
      
      md5Links.slice(0, 5).forEach((link, index) => {
        books.push({
          id: `annas-fallback-${index + 1}`,
          title: `Book ${index + 1}`,
          author: 'Unknown Author',
          year: '',
          language: 'English',
          filesize: '',
          extension: 'pdf',
          downloadUrl: `https://${domain}${link}`,
          coverUrl: 'https://via.placeholder.com/120x180/1e293b/64748b?text=PDF',
          publisher: "Anna's Archive",
          description: `Book available on Anna's Archive`
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