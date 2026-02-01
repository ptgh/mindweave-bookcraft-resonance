import { supabase } from '@/integrations/supabase/client';

interface CacheResult {
  cached: boolean;
  url: string;
  original?: string;
  error?: string;
}

// In-memory cache for session
const memoryCache = new Map<string, string>();

/**
 * Get cached image URL from Supabase storage
 * Falls back to original URL if caching fails
 */
/**
 * Validate URL is absolute (starts with http/https)
 */
function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Get cached image URL from Supabase storage
 * Falls back to original URL if caching fails
 */
export async function getCachedImageUrl(
  originalUrl: string,
  type: 'book' | 'film' = 'book'
): Promise<string> {
  if (!originalUrl) return '';

  // Reject relative URLs - they can't be cached externally
  if (!isAbsoluteUrl(originalUrl)) {
    return originalUrl;
  }

  // Check memory cache first
  if (memoryCache.has(originalUrl)) {
    return memoryCache.get(originalUrl)!;
  }

  // Check database for existing cached URL (no edge function call needed)
  try {
    const { data: existing } = await supabase
      .from('cached_images')
      .select('cached_url')
      .eq('original_url', originalUrl)
      .maybeSingle();

    if (existing?.cached_url) {
      memoryCache.set(originalUrl, existing.cached_url);
      return existing.cached_url;
    }
  } catch (e) {
    console.warn('Cache lookup failed:', e);
  }

  // Return original URL - background cache will handle it
  return originalUrl;
}

/**
 * Request image to be cached in background
 * This is fire-and-forget, returns immediately
 */
export async function requestImageCache(
  originalUrl: string,
  type: 'book' | 'film' = 'book'
): Promise<void> {
  if (!originalUrl) return;

  // Reject relative URLs - only absolute URLs can be cached
  if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
    return;
  }

  // Don't cache if already in memory cache
  if (memoryCache.has(originalUrl)) return;

  // Skip caching for already-cached Supabase URLs
  if (originalUrl.includes('supabase.co/storage')) return;

  try {
    const { data, error } = await supabase.functions.invoke<CacheResult>('cache-image', {
      body: { url: originalUrl, type }
    });

    if (!error && data?.cached && data?.url) {
      memoryCache.set(originalUrl, data.url);
    }
  } catch (e) {
    // Silent fail - caching is optional enhancement
    console.warn('Background cache request failed:', e);
  }
}

/**
 * Batch cache multiple images in the background
 */
export async function batchCacheImages(
  urls: Array<{ url: string; type: 'book' | 'film' }>
): Promise<void> {
  const uncached = urls.filter(
    ({ url }) => url && !memoryCache.has(url) && !url.includes('supabase.co/storage')
  );

  // Process in parallel with a limit
  const batchSize = 3;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    await Promise.all(
      batch.map(({ url, type }) => requestImageCache(url, type))
    );
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalCached: number;
  totalSize: number;
  bookCount: number;
  filmCount: number;
}> {
  try {
    const { data, error } = await supabase
      .from('cached_images')
      .select('image_type, file_size');

    if (error) throw error;

    const stats = {
      totalCached: data?.length || 0,
      totalSize: data?.reduce((sum, row) => sum + (row.file_size || 0), 0) || 0,
      bookCount: data?.filter(row => row.image_type === 'book').length || 0,
      filmCount: data?.filter(row => row.image_type === 'film').length || 0
    };

    return stats;
  } catch (e) {
    console.error('Failed to get cache stats:', e);
    return { totalCached: 0, totalSize: 0, bookCount: 0, filmCount: 0 };
  }
}

/**
 * Clear expired cache entries (older than 30 days without access)
 */
export async function cleanupCache(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // This would need an edge function with service role to delete from storage
    // For now, just return 0
    return 0;
  } catch (e) {
    console.error('Cache cleanup failed:', e);
    return 0;
  }
}
