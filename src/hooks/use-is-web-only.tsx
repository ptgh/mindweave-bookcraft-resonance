import { useState, useEffect } from 'react';

/**
 * Hook to detect if we're running in a web browser (not in Capacitor app)
 * Returns true for web browsers, false for mobile apps
 */
export function useIsWebOnly(): boolean {
  const [isWebOnly, setIsWebOnly] = useState<boolean>(true);

  useEffect(() => {
    // Check if we're in a Capacitor environment
    const isCapacitor = !!(window as any).Capacitor;
    
    // Check if we're in a mobile app context
    const isMobileApp = isCapacitor || 
                       !!(window as any).cordova || 
                       !!(window as any).PhoneGap ||
                       !!(window as any).phonegap ||
                       /Capacitor/i.test(navigator.userAgent);

    setIsWebOnly(!isMobileApp);
  }, []);

  return isWebOnly;
}