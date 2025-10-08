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

    // Search Internet Archive (enhanced with ISBN, normalization, and borrow-only fallback)
    try {
      const clean = (s: string) => s.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const normTitle = clean(title);
      const normAuthor = clean(author);

      // Build primary query with ISBN if available for better accuracy
      let primaryQuery = `title:(${normTitle}) AND creator:(${normAuthor}) AND mediatype:texts`;
      if (isbn) {
        primaryQuery = `(isbn:${isbn} OR (${primaryQuery}))`;
      }

      const buildUrl = (q: string) => `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl=identifier,title,creator,format,downloads&rows=10&page=1&output=json`;

      const fetchItems = async (q: string): Promise<ArchiveItem[]> => {
        const res = await fetch(buildUrl(q));
        if (!res.ok) return [];
        const data = await res.json();
        return data.response?.docs || [];
      };

      // Try primary query first
      let items: ArchiveItem[] = await fetchItems(primaryQuery);

      // Fallback: title-only query if nothing returned
      if (!items || items.length === 0) {
        const fallbackQuery = `title:(\"${normTitle}\") AND mediatype:texts`;
        items = await fetchItems(fallbackQuery);
      }

      if (items && items.length > 0) {
        // First try: Find match with direct downloadable formats (PDF/EPUB/TXT)
        let bestMatch = items.find(item => {
          const formats = Array.isArray(item.format) ? item.format : [];
          return formats.some(f => f.toLowerCase().includes('pdf') || f.toLowerCase().includes('epub') || f.toLowerCase().includes('txt'));
        });

        // If found, build direct download URLs
        if (bestMatch) {
          const formats: Record<string, string> = {}
          const baseUrl = `https://archive.org/download/${bestMatch.identifier}`
          const availableFormats = Array.isArray(bestMatch.format) ? bestMatch.format : []

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
          console.log(`Found Archive match with direct downloads: ${bestMatch.title}`)
        } else {
          // Fallback: Use top item even if borrow-only
          const top = items[0];
          archiveResult = {
            url: `https://archive.org/details/${top.identifier}`,
            id: top.identifier,
            formats: {}
          }
          console.log(`Found Archive match (borrow-only): ${top.title}`)
        }
      }
    } catch (error) {
      console.error('Archive search error:', error)
    }

    // Cache the results in database (replace existing row for this title/author)
    if (gutenbergResult || archiveResult) {
      try {
        // Remove any existing cache entries for this book to avoid duplicates
        const { error: delError } = await supabase
          .from('free_ebook_links')
          .delete()
          .eq('book_title', title)
          .eq('book_author', author);
        if (delError) {
          console.warn('Cache delete warning:', delError.message);
        }

        const payload = {
          book_title: title,
          book_author: author,
          isbn: isbn || null,
          gutenberg_url: gutenbergResult?.url || null,
          gutenberg_id: gutenbergResult?.id || null,
          archive_url: archiveResult?.url || null,
          archive_id: archiveResult?.id || null,
          formats: {
            ...(gutenbergResult?.formats || {}),
            ...(archiveResult?.formats || {})
          },
          last_checked: new Date().toISOString()
        };

        const { error: insError } = await supabase
          .from('free_ebook_links')
          .insert(payload);
        if (insError) {
          console.error('Database cache insert error:', insError);
        } else {
          console.log('Cached free_ebook_links payload:', payload);
        }
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