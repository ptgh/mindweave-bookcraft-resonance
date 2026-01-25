
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const lazyLoad = (callback: () => void, delay = 100) => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
};

// Device and browser detection utilities for optimization
export const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
  
  if (isMobile && !isTablet) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
};

export const getBrowserType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  if (userAgent.includes('chrome')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('edge')) return 'edge';
  
  return 'unknown';
};

// Performance optimizations based on device and browser
export const getOptimizedSettings = () => {
  const deviceType = getDeviceType();
  const browserType = getBrowserType();
  
  return {
    // Reduce animations on mobile for better performance
    reduceAnimations: deviceType === 'mobile',
    // Use smaller images on mobile
    useHighResImages: deviceType === 'desktop',
    // Adjust debounce timing based on device
    debounceMs: deviceType === 'mobile' ? 300 : 150,
    // Lazy loading threshold
    lazyLoadThreshold: deviceType === 'mobile' ? '50px' : '100px',
    // Safari-specific optimizations
    useSafariOptimizations: browserType === 'safari',
    // Chrome-specific optimizations
    useChromeOptimizations: browserType === 'chrome',
    // Maximum concurrent requests - optimized for book searches
    maxConcurrentRequests: deviceType === 'mobile' ? 3 : 6
  };
};

// Network-aware loading
export const isSlowConnection = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
  }
  return false;
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const settings = getOptimizedSettings();
  
  // Preload key CSS animations if not on mobile
  if (!settings.reduceAnimations) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = '/src/index.css';
    document.head.appendChild(link);
  }
};

// Image optimization utility - balances quality and speed
// IMPORTANT: Google Books content endpoint only reliably serves zoom=1
// Forcing higher zoom causes 404s for many books
export const getOptimizedImageUrl = (url: string, width?: number) => {
  if (!url) return '';
  
  const settings = getOptimizedSettings();
  
  // For Google Books content endpoint - DO NOT modify zoom level
  // These URLs only work at their original zoom level (usually 1)
  if (url.includes('books.google.com/books/content') || 
      url.includes('books.googleusercontent.com/books/content')) {
    // Keep the URL exactly as-is - changing zoom breaks it
    return url;
  }
  
  // For other Google Books URLs (not content endpoint)
  if (url.includes('books.google') || url.includes('googleusercontent.com')) {
    // Only set zoom if not already present
    if (!url.includes('zoom=')) {
      const zoomLevel = settings.reduceAnimations ? 1 : 1; // Always use zoom=1 for reliability
      return `${url}${url.includes('?') ? '&' : '?'}zoom=${zoomLevel}`;
    }
    return url;
  }
  
  // For TMDB poster URLs - use higher quality on desktop
  if (url.includes('image.tmdb.org')) {
    if (settings.reduceAnimations) {
      return url.replace(/\/w\d+\//, '/w342/');
    } else {
      return url.replace(/\/w\d+\//, '/w780/');
    }
  }
  
  // For Open Library covers - ensure -L (large) size
  if (url.includes('covers.openlibrary.org')) {
    return url.replace(/-[SM]\.jpg/, '-L.jpg');
  }
  
  // Use smaller images on mobile devices
  if (settings.reduceAnimations && width) {
    const mobileWidth = Math.min(width, 400);
    if (url.includes('googleusercontent.com') && !url.includes('books/content')) {
      return url.replace(/=s\d+/, `=s${mobileWidth}`);
    }
  }
  
  return url;
};

// Get high quality image URL for social sharing (minimum 1200px width)
export const getSocialShareImageUrl = (url: string): string => {
  if (!url) return '';
  
  // For Google Books URLs, get highest quality
  if (url.includes('books.google') || url.includes('googleusercontent.com')) {
    let optimized = url.replace(/zoom=\d+/, 'zoom=3');
    if (!optimized.includes('zoom=')) {
      optimized = `${optimized}${optimized.includes('?') ? '&' : '?'}zoom=3`;
    }
    return optimized;
  }
  
  // For TMDB URLs, use original quality
  if (url.includes('image.tmdb.org')) {
    return url.replace(/\/w\d+\//, '/original/');
  }
  
  // For Open Library, use L size
  if (url.includes('covers.openlibrary.org')) {
    return url.replace(/-[SML]\.jpg/, '-L.jpg');
  }
  
  return url;
};

// Get high quality display URL (for modals, previews)
export const getHighQualityDisplayUrl = (url: string): string => {
  if (!url) return '';
  
  // For Google Books URLs
  if (url.includes('books.google') || url.includes('googleusercontent.com')) {
    let optimized = url.replace(/zoom=\d+/, 'zoom=2');
    if (!optimized.includes('zoom=')) {
      optimized = `${optimized}${optimized.includes('?') ? '&' : '?'}zoom=2`;
    }
    return optimized;
  }
  
  // For TMDB URLs, use w780 (good balance of quality and size)
  if (url.includes('image.tmdb.org')) {
    return url.replace(/\/w\d+\//, '/w780/');
  }
  
  // For Open Library, use L size
  if (url.includes('covers.openlibrary.org')) {
    return url.replace(/-[SM]\.jpg/, '-L.jpg');
  }
  
  return url;
};

// Preload an image and return a promise
export const preloadImage = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('No source provided'));
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
};

// Preload multiple images
export const preloadImages = (urls: string[]): void => {
  urls.filter(Boolean).forEach(url => {
    const img = new Image();
    img.src = url;
  });
};
