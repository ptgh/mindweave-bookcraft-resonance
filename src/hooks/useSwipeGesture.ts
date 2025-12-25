import { useRef, useCallback, RefObject } from 'react';

interface SwipeConfig {
  threshold?: number;      // Minimum distance to trigger swipe (px)
  velocityThreshold?: number; // Minimum velocity to trigger swipe (px/ms)
  direction?: 'left' | 'right' | 'up' | 'down' | 'horizontal' | 'vertical' | 'all';
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

export const useSwipeGesture = (
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) => {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    direction = 'all',
  } = config;

  const touchState = useRef<TouchState | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!touchState.current) return;
    
    const touch = e.touches[0];
    touchState.current.currentX = touch.clientX;
    touchState.current.currentY = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchState.current) return;

    const { startX, startY, startTime, currentX, currentY } = touchState.current;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const deltaTime = Date.now() - startTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocityX = absX / deltaTime;
    const velocityY = absY / deltaTime;

    // Determine swipe direction
    const isHorizontal = absX > absY;
    const isVertical = absY > absX;

    // Check thresholds
    const meetsDistanceThreshold = isHorizontal ? absX >= threshold : absY >= threshold;
    const meetsVelocityThreshold = isHorizontal ? velocityX >= velocityThreshold : velocityY >= velocityThreshold;

    if (meetsDistanceThreshold || meetsVelocityThreshold) {
      if (isHorizontal && (direction === 'horizontal' || direction === 'all' || direction === 'left' || direction === 'right')) {
        if (deltaX > 0 && (direction === 'horizontal' || direction === 'all' || direction === 'right')) {
          handlers.onSwipeRight?.();
        } else if (deltaX < 0 && (direction === 'horizontal' || direction === 'all' || direction === 'left')) {
          handlers.onSwipeLeft?.();
        }
      }

      if (isVertical && (direction === 'vertical' || direction === 'all' || direction === 'up' || direction === 'down')) {
        if (deltaY > 0 && (direction === 'vertical' || direction === 'all' || direction === 'down')) {
          handlers.onSwipeDown?.();
        } else if (deltaY < 0 && (direction === 'vertical' || direction === 'all' || direction === 'up')) {
          handlers.onSwipeUp?.();
        }
      }
    }

    touchState.current = null;
  }, [handlers, threshold, velocityThreshold, direction]);

  // Bind handlers to a ref element
  const bind = useCallback((ref: RefObject<HTMLElement>) => {
    const element = ref.current;
    if (!element) return () => {};

    element.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    element.addEventListener('touchmove', handleTouchMove as any, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as any);
      element.removeEventListener('touchmove', handleTouchMove as any);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Return props to spread on an element
  const handlers_props = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    bind,
    handlers: handlers_props,
  };
};

export default useSwipeGesture;
