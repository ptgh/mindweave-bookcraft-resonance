import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { requireAdminOrInternal, corsHeaders } from "../_shared/adminAuth.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET_NAME = 'book-covers';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin authorization check
  const auth = await requireAdminOrInternal(req);
  if (auth instanceof Response) return auth;

  try {
    const { url, type = 'book' } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL is absolute (starts with http/https)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.warn(`Rejected relative URL: ${url}`);
      return new Response(
        JSON.stringify({ 
          cached: false, 
          url: url, 
          error: 'Only absolute URLs (http/https) can be cached' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for storage access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if image is already cached
    const { data: existing } = await supabase
      .from('cached_images')
      .select('cached_url, id')
      .eq('original_url', url)
      .maybeSingle();

    if (existing) {
      // Update access count and last_accessed
      await supabase
        .from('cached_images')
        .update({ 
          last_accessed: new Date().toISOString(),
          access_count: existing.id ? 1 : 1 // Will be incremented by trigger if we add one
        })
        .eq('original_url', url);

      console.log(`Cache hit for: ${url}`);
      return new Response(
        JSON.stringify({ 
          cached: true, 
          url: existing.cached_url,
          original: url 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the original image
    console.log(`Cache miss, fetching: ${url}`);
    
    // Optimize URL before fetching
    let fetchUrl = url;
    
    // For Google Books, get higher quality
    if (url.includes('books.google') || url.includes('googleusercontent.com')) {
      fetchUrl = url.replace(/zoom=\d+/, 'zoom=2');
      if (!fetchUrl.includes('zoom=')) {
        fetchUrl = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}zoom=2`;
      }
    }
    
    // For TMDB, get w780 quality
    if (url.includes('image.tmdb.org')) {
      fetchUrl = url.replace(/\/w\d+\//, '/w780/');
    }

    const imageResponse = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Leafnode/1.0 (Image Cache)',
      }
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status}`);
      return new Response(
        JSON.stringify({ 
          cached: false, 
          url: url, // Return original URL on failure
          error: 'Failed to fetch original image'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResponse.arrayBuffer();
    const fileSize = imageBuffer.byteLength;

    // Generate unique filename based on URL hash
    const urlHash = await generateHash(url);
    const extension = getExtension(contentType);
    const fileName = `${type}/${urlHash}${extension}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: true,
        cacheControl: '31536000' // Cache for 1 year
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ 
          cached: false, 
          url: url,
          error: 'Failed to upload to storage'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const cachedUrl = publicUrlData.publicUrl;

    // Store in database
    const { error: dbError } = await supabase
      .from('cached_images')
      .insert({
        original_url: url,
        cached_path: fileName,
        cached_url: cachedUrl,
        image_type: type,
        file_size: fileSize
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Still return the cached URL even if DB insert fails
    }

    console.log(`Cached image: ${url} -> ${cachedUrl}`);
    
    return new Response(
      JSON.stringify({ 
        cached: true, 
        url: cachedUrl,
        original: url,
        size: fileSize
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Generate a hash from URL for filename
async function generateHash(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get file extension from content type
function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[contentType] || '.jpg';
}
