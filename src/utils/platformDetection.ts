/**
 * Platform detection utilities for determining user's operating system
 */

/**
 * Detect if the user is on an Apple device (macOS, iOS, iPadOS)
 */
export const isAppleDevice = (): boolean => {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform.toLowerCase();

  return (
    userAgent.includes('mac') ||
    userAgent.includes('iphone') ||
    userAgent.includes('ipad') ||
    platform.includes('mac') ||
    platform.includes('iphone') ||
    platform.includes('ipad')
  );
};

/**
 * Determine if Apple Books button should be shown
 * Shows on all platforms but prioritized for Apple devices
 */
export const shouldShowAppleButton = (hasAppleLink: boolean): boolean => {
  return hasAppleLink; // Show if link is available
};

/**
 * Determine if Google Books button should be shown
 * Shows on all platforms but prioritized for non-Apple devices
 */
export const shouldShowGoogleButton = (hasGoogleLink: boolean): boolean => {
  return hasGoogleLink; // Show if link is available
};
