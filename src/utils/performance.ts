
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
    // Maximum concurrent requests
    maxConcurrentRequests: deviceType === 'mobile' ? 2 : 4
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

// Image optimization utility
export const getOptimizedImageUrl = (url: string, width?: number) => {
  if (!url) return '';
  
  const settings = getOptimizedSettings();
  
  // Use smaller images on mobile devices
  if (settings.reduceAnimations && width) {
    const mobileWidth = Math.min(width, 400);
    // If the URL supports dynamic resizing, modify it
    if (url.includes('googleusercontent.com')) {
      return url.replace(/=s\d+/, `=s${mobileWidth}`);
    }
  }
  
  return url;
};
