import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  title: string;
  author: string;
  isbn?: string;
}

interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{ name: string }>;
  formats: Record<string, string>;
  subjects: string[];
}

interface ArchiveItem {
  identifier: string;
  title: string;
  creator?: string | string[];
  format?: string[];
  downloads?: number;
}

interface AnnasArchiveBook {
  id: string;
  title: string;
  author: string;
  extension: string;
  downloadUrl: string;
}

// Anna's Archive search function
async function searchAnnasArchive(title: string, author: string): Promise<{ url: string; id: string; formats: Record<string, string> } | null> {
  try {
    const domain = 'annas-archive.org';
    const searchQuery = `author:"${author}" title:"${title}"`;
    
    const searchParams = new URLSearchParams({
      q: searchQuery,
      ext: 'pdf,epub,mobi',
      sort: 'newest',
      lang: 'en'
    });

    const searchUrl = `https://${domain}/search?${searchParams.toString()}`;
    console.log('🔍 Searching Anna\'s Archive:', searchUrl);

    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!searchResponse.ok) {
      console.error('Anna\'s Archive search failed:', searchResponse.status);
      return null;
    }

    const html = await searchResponse.text();
    
    // Parse the first MD5 link and extract format info
    const md5Match = html.match(/\/md5\/([a-f0-9]{32})/);
    if (!md5Match) return null;

    const md5Hash = md5Match[1];
    const baseUrl = `https://${domain}/md5/${md5Hash}`;
    
    // Extract available formats from the search results
    const formats: Record<string, string> = {};
    
    // Look for PDF, EPUB, MOBI mentions in the surrounding text
    if (html.includes('.pdf') || html.toLowerCase().includes('pdf')) {
      formats.pdf = baseUrl;
    }
    if (html.includes('.epub') || html.toLowerCase().includes('epub')) {
      formats.epub = baseUrl;
    }
    if (html.includes('.mobi') || html.toLowerCase().includes('mobi')) {
      formats.mobi = baseUrl;
    }
    
    // If no specific formats found, default to the page itself
    if (Object.keys(formats).length === 0) {
      formats.pdf = baseUrl;
      formats.epub = baseUrl;
      formats.mobi = baseUrl;
    }

    console.log(`Found Anna's Archive match with formats:`, Object.keys(formats));
    
    return {
      url: baseUrl,
      id: md5Hash.slice(0, 8),
      formats
    };

  } catch (error) {
    console.error('Anna\'s Archive search error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, author, isbn }: SearchRequest = await req.json()

    if (!title || !author) {
      throw new Error('Title and author are required')
    }

    console.log(`Searching for: "${title}" by ${author}`)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let gutenbergResult = null
    let archiveResult = null
    let annasArchiveResult = null

    // Search Project Gutenberg via Gutendex API
    try {
      const gutenbergUrl = `https://gutendex.com/books/?search=${encodeURIComponent(title + ' ' + author)}`
      const gutenbergResponse = await fetch(gutenbergUrl)
      
      if (gutenbergResponse.ok) {
        const gutenbergData = await gutenbergResponse.json()
        
        // Find best match
        const books: GutenbergBook[] = gutenbergData.results || []
        const bestMatch = books.find(book => {
          const bookTitle = book.title.toLowerCase()
          const bookAuthors = book.authors.map(a => a.name.toLowerCase())
          const searchTitle = title.toLowerCase()
          const searchAuthor = author.toLowerCase()
          
          return bookTitle.includes(searchTitle) && 
                 bookAuthors.some(a => a.includes(searchAuthor))
        })
        
        if (bestMatch) {
          // Clean and validate formats, prioritize direct download links
          const cleanFormats: Record<string, string> = {}
          for (const [format, url] of Object.entries(bestMatch.formats)) {
            if (typeof url === 'string' && url.startsWith('http')) {
              const cleanFormat = format.replace('application/', '').replace('text/', '')
              // Only include downloadable formats
              if (cleanFormat.includes('epub') || cleanFormat.includes('pdf') || cleanFormat.includes('txt')) {
                cleanFormats[cleanFormat] = url
              }
            }
          }
          
          gutenbergResult = {
            url: `https://www.gutenberg.org/ebooks/${bestMatch.id}`,
            id: bestMatch.id.toString(),
            formats: cleanFormats
          }
          console.log(`Found Gutenberg match: ${bestMatch.title}`)
        }
      }
    } catch (error) {
      console.error('Gutenberg search error:', error)
    }

    // Search Internet Archive
    try {
      const archiveQuery = `title:(${title}) AND creator:(${author}) AND mediatype:texts`
      const archiveUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(archiveQuery)}&fl=identifier,title,creator,format,downloads&rows=5&page=1&output=json`
      
      const archiveResponse = await fetch(archiveUrl)
      
      if (archiveResponse.ok) {
        const archiveData = await archiveResponse.json()
        const items: ArchiveItem[] = archiveData.response?.docs || []
        
        // Find best match with PDF or EPUB
        const bestMatch = items.find(item => {
          const formats = Array.isArray(item.format) ? item.format : []
          return formats.some(f => f.toLowerCase().includes('pdf') || f.toLowerCase().includes('epub'))
        })
        
        if (bestMatch) {
          // Build direct download URLs for Internet Archive
          const formats: Record<string, string> = {}
          const baseUrl = `https://archive.org/download/${bestMatch.identifier}`
          
          // Check which formats are actually available and build direct download URLs
          const availableFormats = Array.isArray(bestMatch.format) ? bestMatch.format : []
          
          // Prioritize ePub, then PDF, then TXT
          if (availableFormats.some(f => f.toLowerCase().includes('epub'))) {
            formats.epub = `${baseUrl}/${bestMatch.identifier}.epub`
          }
          if (availableFormats.some(f => f.toLowerCase().includes('pdf'))) {
            formats.pdf = `${baseUrl}/${bestMatch.identifier}.pdf`
          }
          if (availableFormats.some(f => f.toLowerCase().includes('txt'))) {
            formats.txt = `${baseUrl}/${bestMatch.identifier}.txt`
          }
          
          archiveResult = {
            url: `https://archive.org/details/${bestMatch.identifier}`,
            id: bestMatch.identifier,
            formats
          }
          console.log(`Found Archive match: ${bestMatch.title}`)
        }
      }
    } catch (error) {
      console.error('Archive search error:', error)
    }

    // Search Anna's Archive
    try {
      annasArchiveResult = await searchAnnasArchive(title, author)
      if (annasArchiveResult) {
        console.log(`Found Anna's Archive match`)
      }
    } catch (error) {
      console.error('Anna\'s Archive search error:', error)
    }

    // Filter formats to only include PDF, EPUB, and MOBI
    const filterFormats = (formats: Record<string, string>) => {
      const filtered: Record<string, string> = {}
      for (const [format, url] of Object.entries(formats)) {
        if (format.toLowerCase().includes('pdf')) {
          filtered.pdf = url
        } else if (format.toLowerCase().includes('epub')) {
          filtered.epub = url
        } else if (format.toLowerCase().includes('mobi')) {
          filtered.mobi = url
        }
      }
      return filtered
    }

    // Filter formats for each source
    if (gutenbergResult) {
      gutenbergResult.formats = filterFormats(gutenbergResult.formats)
    }
    if (archiveResult) {
      archiveResult.formats = filterFormats(archiveResult.formats)
    }
    if (annasArchiveResult) {
      annasArchiveResult.formats = filterFormats(annasArchiveResult.formats)
    }

    // Cache the results in database
    if (gutenbergResult || archiveResult || annasArchiveResult) {
      try {
        await supabase
          .from('free_ebook_links')
          .upsert({
            book_title: title,
            book_author: author,
            isbn: isbn || null,
            gutenberg_url: gutenbergResult?.url || null,
            gutenberg_id: gutenbergResult?.id || null,
            archive_url: archiveResult?.url || null,
            archive_id: archiveResult?.id || null,
            formats: {
              ...gutenbergResult?.formats,
              ...archiveResult?.formats,
              ...annasArchiveResult?.formats
            },
            last_checked: new Date().toISOString()
          })
      } catch (dbError) {
        console.error('Database cache error:', dbError)
        // Don't fail the whole request if caching fails
      }
    }

    const result = {
      hasLinks: !!(gutenbergResult || archiveResult || annasArchiveResult),
      gutenberg: gutenbergResult,
      archive: archiveResult,
      annasArchive: annasArchiveResult
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Search error:', error)
    return new Response(
      JSON.stringify({ error: error.message, hasLinks: false }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})