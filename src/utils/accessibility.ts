
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

export const getAriaLabel = (text: string, context?: string) => {
  return context ? `${text} ${context}` : text;
};

// iOS Safari specific accessibility fixes
export const enableIOSScrollFix = () => {
  if (typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // Prevent iOS Safari from zooming on input focus
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
    
    // Fix iOS Safari scroll issues
    (document.body.style as any).webkitOverflowScrolling = 'touch';
    document.body.style.touchAction = 'manipulation';
    
    // Ensure header is always accessible
    const header = document.querySelector('header');
    if (header) {
      header.style.position = 'relative';
      header.style.zIndex = '1000';
      header.style.webkitTransform = 'translate3d(0, 0, 0)';
      header.style.transform = 'translate3d(0, 0, 0)';
    }
  }
};

// Ensure proper touch targets for mobile accessibility
export const ensureTouchTargets = () => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    const interactiveElements = document.querySelectorAll('button, a, [role="button"], input, select, textarea');
    interactiveElements.forEach((element) => {
      const el = element as HTMLElement;
      const computedStyle = window.getComputedStyle(el);
      const height = parseInt(computedStyle.height) || 0;
      const width = parseInt(computedStyle.width) || 0;
      
      // Ensure minimum 44px touch target as per WCAG guidelines
      if (height < 44) {
        el.style.minHeight = '44px';
        el.style.padding = `${Math.max(0, (44 - height) / 2)}px ${el.style.paddingLeft || '8px'}`;
      }
      if (width < 44) {
        el.style.minWidth = '44px';
      }
      
      // Enable proper touch handling
      el.style.touchAction = 'manipulation';
      (el.style as any).webkitTapHighlightColor = 'transparent';
    });
  }
};
