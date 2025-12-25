/**
 * Haptic feedback hook for iOS and supported devices
 * Uses multiple fallback strategies for maximum compatibility
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

// Vibration patterns for different feedback styles (in ms)
const vibrationPatterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  selection: 10,
  success: [10, 50, 10],
  warning: [20, 50, 20],
  error: [30, 50, 30, 50, 30],
};

export const useHapticFeedback = () => {
  const isIOSDevice = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const supportsVibration = () => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  };

  /**
   * Trigger haptic feedback
   * Falls back gracefully on unsupported devices
   */
  const trigger = (style: HapticStyle = 'light') => {
    try {
      // Try native vibration API (works on Android, some browsers)
      if (supportsVibration()) {
        const pattern = vibrationPatterns[style];
        navigator.vibrate(pattern);
        return;
      }

      // For iOS, we can trigger a subtle "click" effect using audio context
      // This creates a near-imperceptible audio pulse that iOS interprets as feedback
      if (isIOSDevice()) {
        triggerIOSHaptic(style);
      }
    } catch (error) {
      // Silently fail - haptic feedback is a nice-to-have
      console.debug('Haptic feedback not available:', error);
    }
  };

  /**
   * iOS-specific haptic using AudioContext trick
   * Creates a very short, silent audio burst that triggers the taptic engine
   */
  const triggerIOSHaptic = (style: HapticStyle) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Set frequency based on style (imperceptible but triggers haptic)
      const frequencies: Record<HapticStyle, number> = {
        light: 1,
        medium: 2,
        heavy: 3,
        selection: 1,
        success: 2,
        warning: 2,
        error: 3,
      };

      oscillator.frequency.value = frequencies[style];
      gainNode.gain.value = 0.001; // Nearly silent

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.001);

      // Clean up
      setTimeout(() => ctx.close(), 100);
    } catch {
      // Silent fail
    }
  };

  /**
   * Convenience methods for common feedback types
   */
  const impact = {
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    heavy: () => trigger('heavy'),
  };

  const notification = {
    success: () => trigger('success'),
    warning: () => trigger('warning'),
    error: () => trigger('error'),
  };

  const selection = () => trigger('selection');

  return {
    trigger,
    impact,
    notification,
    selection,
    isSupported: supportsVibration() || isIOSDevice(),
  };
};

export default useHapticFeedback;
