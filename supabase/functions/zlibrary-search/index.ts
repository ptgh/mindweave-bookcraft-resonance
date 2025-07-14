import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZLibrarySearchParams {
  title?: string;
  author?: string;
  isbn?: string;
  language?: string;
  limit?: number;
}

interface ZLibraryBook {
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
  description?: string;
}

// Store session cookies for Z-Library authentication
let sessionCookies = '';
let isAuthenticated = false;

async function authenticateZLibrary(): Promise<boolean> {
  try {
    const email = Deno.env.get('ZLIBRARY_EMAIL');
    const password = Deno.env.get('ZLIBRARY_PASSWORD');
    const domain = Deno.env.get('ZLIBRARY_DOMAIN') || 'z-lib.id';

    if (!email || !password) {
      console.error('Z-Library credentials not found in environment');
      return false;
    }

    console.log('🔐 Authenticating with Z-Library...');

    // Step 1: Get login page to extract any required tokens
    const loginPageResponse = await fetch(`https://${domain}/eauth.php`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!loginPageResponse.ok) {
      console.error('Failed to load login page');
      return false;
    }

    // Extract cookies from login page
    const loginCookies = loginPageResponse.headers.get('set-cookie') || '';
    
    // Step 2: Perform login
    const loginData = new URLSearchParams({
      'email': email,
      'password': password,
      'action': 'login'
    });

    const loginResponse = await fetch(`https://${domain}/eauth.php`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': loginCookies,
        'Referer': `https://${domain}/eauth.php`,
      },
      body: loginData,
      redirect: 'manual',
    });

    // Extract session cookies
    const authCookies = loginResponse.headers.get('set-cookie');
    if (authCookies) {
      sessionCookies = authCookies;
      isAuthenticated = true;
      console.log('✅ Z-Library authentication successful');
      return true;
    }

    console.error('❌ Z-Library authentication failed - no session cookies received');
    return false;
  } catch (error) {
    console.error('❌ Z-Library authentication error:', error);
    return false;
  }
}

async function searchZLibraryBooks(params: ZLibrarySearchParams): Promise<ZLibraryBook[]> {
  try {
    if (!isAuthenticated) {
      const authSuccess = await authenticateZLibrary();
      if (!authSuccess) {
        throw new Error('Failed to authenticate with Z-Library');
      }
    }

    const domain = Deno.env.get('ZLIBRARY_DOMAIN') || 'z-lib.id';
    const searchParams = new URLSearchParams();

    if (params.title) searchParams.append('q', params.title);
    if (params.author) searchParams.append('author', params.author);
    if (params.isbn) searchParams.append('isbn', params.isbn);
    
    searchParams.append('yearFrom', '');
    searchParams.append('yearTo', '');
    searchParams.append('language', params.language || 'english');
    searchParams.append('extension', '');
    searchParams.append('order', 'bestmatch');

    const searchUrl = `https://${domain}/s/${params.title || params.author}?${searchParams.toString()}`;
    
    console.log('🔍 Searching Z-Library:', searchUrl);

    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': sessionCookies,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.status}`);
    }

    const html = await searchResponse.text();
    
    // Parse the HTML to extract book information
    const books = parseZLibrarySearchResults(html, domain);
    
    console.log(`📚 Found ${books.length} books`);
    return books.slice(0, params.limit || 10);

  } catch (error) {
    console.error('❌ Z-Library search error:', error);
    throw error;
  }
}

function parseZLibrarySearchResults(html: string, domain: string): ZLibraryBook[] {
  const books: ZLibraryBook[] = [];
  
  // This is a simplified parser - in production you'd want more robust HTML parsing
  // Look for book entries in the search results
  const bookRegex = /<div[^>]*class="[^"]*bookRow[^"]*"[^>]*>(.*?)<\/div>/gs;
  const matches = html.match(bookRegex);

  if (!matches) {
    console.log('No book matches found in HTML');
    return books;
  }

  matches.forEach((match, index) => {
    try {
      // Extract title
      const titleMatch = match.match(/<h3[^>]*><a[^>]*>([^<]+)</);
      const title = titleMatch ? titleMatch[1].trim() : `Book ${index + 1}`;

      // Extract author
      const authorMatch = match.match(/class="authors"[^>]*>([^<]+)/);
      const author = authorMatch ? authorMatch[1].trim() : 'Unknown Author';

      // Extract download link
      const linkMatch = match.match(/href="([^"]*\/book\/[^"]*)/);
      const bookPath = linkMatch ? linkMatch[1] : '';

      // Extract file info
      const extensionMatch = match.match(/\.(\w+)(?:\s*,|\s*$)/);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'pdf';

      const sizeMatch = match.match(/(\d+(?:\.\d+)?\s*[KMGT]?B)/);
      const filesize = sizeMatch ? sizeMatch[1] : '';

      // Extract year
      const yearMatch = match.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : '';

      if (bookPath) {
        books.push({
          id: `zlib-${index + 1}`,
          title,
          author,
          year,
          language: 'English',
          filesize,
          extension,
          downloadUrl: `https://${domain}${bookPath}`,
          coverUrl: `https://via.placeholder.com/120x180/1e293b/64748b?text=${extension.toUpperCase()}`,
          publisher: 'Z-Library',
          description: `${title} by ${author} - Available on Z-Library`
        });
      }
    } catch (error) {
      console.error('Error parsing book entry:', error);
    }
  });

  return books;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = req.json ? await req.json() : {};
    
    if (!searchParams) {
      return new Response(
        JSON.stringify({ error: 'Search parameters required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Z-Library search request:', searchParams);

    const books = await searchZLibraryBooks(searchParams);

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
        error: 'Failed to search Z-Library',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});