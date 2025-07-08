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
          gutenbergResult = {
            url: `https://www.gutenberg.org/ebooks/${bestMatch.id}`,
            id: bestMatch.id.toString(),
            formats: bestMatch.formats
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
          archiveResult = {
            url: `https://archive.org/details/${bestMatch.identifier}`,
            id: bestMatch.identifier,
            formats: {
              pdf: `https://archive.org/download/${bestMatch.identifier}/${bestMatch.identifier}.pdf`,
              epub: `https://archive.org/download/${bestMatch.identifier}/${bestMatch.identifier}.epub`
            }
          }
          console.log(`Found Archive match: ${bestMatch.title}`)
        }
      }
    } catch (error) {
      console.error('Archive search error:', error)
    }

    // Cache the results in database
    if (gutenbergResult || archiveResult) {
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
              ...archiveResult?.formats
            },
            last_checked: new Date().toISOString()
          }, {
            onConflict: 'book_title,book_author',
            ignoreDuplicates: false
          })
      } catch (dbError) {
        console.error('Database cache error:', dbError)
        // Don't fail the whole request if caching fails
      }
    }

    const result = {
      hasLinks: !!(gutenbergResult || archiveResult),
      gutenberg: gutenbergResult,
      archive: archiveResult
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