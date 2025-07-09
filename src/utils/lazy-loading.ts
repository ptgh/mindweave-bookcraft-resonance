export const createLazyLoader = () => {
  if (typeof window === 'undefined') return null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const src = target.dataset.src;
          
          if (src) {
            if (target.tagName === 'IMG') {
              (target as HTMLImageElement).src = src;
            }
            target.removeAttribute('data-src');
            observer.unobserve(target);
          }
        }
      });
    },
    {
      rootMargin: '50px',
      threshold: 0.1
    }
  );

  return {
    observe: (element: Element) => observer.observe(element),
    unobserve: (element: Element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  };
};

export const lazyLoader = createLazyLoader();