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

// Removed Anna's Archive functionality as requested

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
          // Use the main details page URL which always works
          const detailsUrl = `https://archive.org/details/${bestMatch.identifier}`
          
          archiveResult = {
            url: detailsUrl,
            id: bestMatch.identifier,
            formats: { view: detailsUrl }
          }
          console.log(`Found Archive match: ${bestMatch.title}`)
        }
      }
    } catch (error) {
      console.error('Archive search error:', error)
    }

    // Anna's Archive removed as requested

    // URL validation function
    const validateUrl = (url: string): boolean => {
      try {
        new URL(url);
        return url.startsWith('https://');
      } catch {
        return false;
      }
    };

    // Validate and clean results
    if (gutenbergResult && (!validateUrl(gutenbergResult.url) || Object.keys(gutenbergResult.formats).length === 0)) {
      console.log('Invalid Gutenberg result, removing');
      gutenbergResult = null;
    }
    
    if (archiveResult && (!validateUrl(archiveResult.url) || Object.keys(archiveResult.formats).length === 0)) {
      console.log('Invalid Archive result, removing');
      archiveResult = null;
    }

    // Cache the results in database using new ebook_search_cache table
    if (gutenbergResult || archiveResult) {
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
            annas_archive_results: null,
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
        // For viewing pages, use the main URL
        const viewUrl = result.url || (result.formats && result.formats.view);
        
        if (viewUrl) {
          return [{
            title: title,
            author: author,
            formats: [{ type: 'VIEW', url: viewUrl }]
          }];
        }
      } catch (error) {
        console.error(`Error formatting ${sourceName} result:`, error);
      }
      
      return [];
    };

    const response = {
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
      JSON.stringify({ error: error.message, internetArchive: [], gutenberg: [] }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})