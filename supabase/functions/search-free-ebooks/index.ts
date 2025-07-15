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
    
    // Look for book matches in search results
    const titleRegex = /<h3[^>]*>([^<]*)<\/h3>/g;
    let titleMatch;
    
    while ((titleMatch = titleRegex.exec(html))) {
      const bookTitle = titleMatch[1].toLowerCase();
      const searchTitle = title.toLowerCase();
      
      if (bookTitle.includes(searchTitle.substring(0, Math.min(searchTitle.length, 20)))) {
        console.log('Found Archive match:', titleMatch[1]);
        
        // Return the search page URL itself since it's always valid
        const formats: Record<string, string> = {
          view: searchUrl
        };
        
        console.log(`Found Anna's Archive match with search page URL`);
        
        return {
          url: searchUrl,
          id: title.replace(/\s+/g, '_'),
          formats
        };
      }
    }
    
    return null;
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
            formats: { view: `https://www.gutenberg.org/ebooks/${bestMatch.id}` }
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
          // Use the main details page URL which always works
          const formats: Record<string, string> = {
            view: `https://archive.org/details/${bestMatch.identifier}`
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

    // Cache the results in database using new ebook_search_cache table
    if (gutenbergResult || archiveResult || annasArchiveResult) {
      try {
        const searchKey = `${title.toLowerCase()}_${author.toLowerCase()}`.replace(/[^a-z0-9_]/g, '_');
        
        await supabase
          .from('ebook_search_cache')
          .upsert({
            search_key: searchKey,
            title,
            author,
            gutenberg_results: gutenbergResult ? [gutenbergResult] : null,
            internet_archive_results: archiveResult ? [archiveResult] : null,
            annas_archive_results: annasArchiveResult ? [annasArchiveResult] : null,
            last_searched: new Date().toISOString()
          })
      } catch (dbError) {
        console.error('Database cache error:', dbError)
        // Don't fail the whole request if caching fails
      }
    }

    // Convert results to the new format expected by frontend
    const formatResult = (result: any, sourceName: string) => {
      if (!result) return [];
      
      try {
        if (result.formats && typeof result.formats === 'object') {
          return [{
            title: title,
            author: author,
            formats: Object.entries(result.formats).map(([type, url]) => ({
              type: type.toUpperCase(),
              url: url as string
            }))
          }];
        }
      } catch (error) {
        console.error(`Error formatting ${sourceName} result:`, error);
      }
      
      return [];
    };

    const response = {
      annasArchive: formatResult(annasArchiveResult, 'Anna\'s Archive'),
      internetArchive: formatResult(archiveResult, 'Internet Archive'),
      gutenberg: formatResult(gutenbergResult, 'Project Gutenberg')
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Search error:', error)
    return new Response(
      JSON.stringify({ error: error.message, annasArchive: [], internetArchive: [], gutenberg: [] }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})