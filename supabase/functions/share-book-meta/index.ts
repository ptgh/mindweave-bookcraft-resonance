import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.leafnode.co.uk";
const FALLBACK_IMAGE = `${SITE_URL}/og-image.jpg`;
const FALLBACK_TITLE = "Leafnode - Your Personal Sci-Fi Library";
const FALLBACK_DESCRIPTION = "Track, discover, and explore science fiction literature with AI-powered insights.";

// Get high quality cover URL for social sharing
function getSocialShareImageUrl(url: string): string {
  if (!url) return FALLBACK_IMAGE;
  
  // For Google Books URLs, get highest quality (zoom=3)
  if (url.includes('books.google') || url.includes('googleusercontent.com')) {
    let optimized = url.replace(/zoom=\d+/, 'zoom=3');
    if (!optimized.includes('zoom=')) {
      optimized = `${url}${url.includes('?') ? '&' : '?'}zoom=3`;
    }
    return optimized;
  }
  
  return url;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const transmissionId = url.searchParams.get("id");
    
    // Also support path-based: /share-book-meta/123
    const pathMatch = url.pathname.match(/\/share-book-meta\/(\d+)/);
    const bookId = transmissionId || (pathMatch ? pathMatch[1] : null);

    if (!bookId) {
      // Return default meta tags if no book ID
      return new Response(generateHTML({
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        image: FALLBACK_IMAGE,
        url: SITE_URL,
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch book/transmission data
    const { data: book, error } = await supabase
      .from("transmissions")
      .select("id, title, author, cover_url, notes, tags")
      .eq("id", parseInt(bookId))
      .single();

    if (error || !book) {
      console.error("Book not found:", error);
      return new Response(generateHTML({
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        image: FALLBACK_IMAGE,
        url: SITE_URL,
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // Build meta data
    const title = book.title || "Untitled Book";
    const author = book.author || "Unknown Author";
    const fullTitle = `${title} by ${author} | Leafnode`;
    const description = book.notes 
      ? `${book.notes.substring(0, 150)}...` 
      : `Discover "${title}" by ${author} on Leafnode - your personal sci-fi reading companion.`;
    const image = getSocialShareImageUrl(book.cover_url || "");
    const bookUrl = `${SITE_URL}/share/book/${book.id}`;

    // Generate HTML with proper OG tags
    const html = generateHTML({
      title: fullTitle,
      description,
      image: image || FALLBACK_IMAGE,
      url: bookUrl,
      bookTitle: title,
      bookAuthor: author,
    });

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(generateHTML({
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      image: FALLBACK_IMAGE,
      url: SITE_URL,
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
});

interface MetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  bookTitle?: string;
  bookAuthor?: string;
}

function generateHTML(meta: MetaData): string {
  const { title, description, image, url, bookTitle, bookAuthor } = meta;
  
  // Escape HTML entities
  const escape = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escape(title)}</title>
  <meta name="title" content="${escape(title)}">
  <meta name="description" content="${escape(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${bookTitle ? 'book' : 'website'}">
  <meta property="og:url" content="${escape(url)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${escape(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Leafnode">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escape(url)}">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(image)}">
  
  ${bookTitle ? `
  <!-- Book-specific meta -->
  <meta property="book:author" content="${escape(bookAuthor || '')}">
  <meta property="og:book:author" content="${escape(bookAuthor || '')}">
  ` : ''}
  
  <!-- Canonical -->
  <link rel="canonical" href="${escape(url)}">
  
  <!-- Redirect to actual app after meta tags are parsed -->
  <meta http-equiv="refresh" content="0;url=${escape(url)}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .loading {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #60a5fa;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading Leafnode...</p>
  </div>
  <script>
    // Immediate redirect for JS-enabled browsers
    window.location.replace("${escape(url)}");
  </script>
</body>
</html>`;
}
