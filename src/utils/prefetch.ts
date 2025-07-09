// Prefetch critical resources for faster navigation
export const prefetchCriticalResources = () => {
  if (typeof window === 'undefined') return;

  // Prefetch DNS for external APIs
  const prefetchLink = (href: string, rel = 'dns-prefetch') => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    document.head.appendChild(link);
  };

  // DNS prefetch for APIs
  prefetchLink('https://www.googleapis.com');
  prefetchLink('https://itunes.apple.com');
  prefetchLink('https://mmnfjeukxandnhdaovzx.supabase.co');

  // Preload critical scripts
  const preloadScript = (src: string) => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = src;
    document.head.appendChild(link);
  };

  // Critical route components
  const criticalRoutes = [
    '/src/pages/Discovery.tsx',
    '/src/pages/Index.tsx',
    '/src/hooks/useAuth.tsx'
  ];

  criticalRoutes.forEach(route => {
    preloadScript(route);
  });
};

// Call on app start
if (typeof window !== 'undefined') {
  // Defer prefetching to avoid blocking initial render
  setTimeout(prefetchCriticalResources, 100);
}