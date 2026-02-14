
import React, { useRef, useState, useCallback } from 'react';

interface SwipeState {
  offset: number;
  isOpen: boolean;
}

interface UseSwipeActionOptions {
  threshold?: number;
  maxOffset?: number;
  direction?: 'left' | 'right';
}

/**
 * useSwipeAction manages the state and event handlers for horizontal swipe gestures.
 * It includes logic to distinguish between horizontal swipes and vertical scrolls.
 */
export const useSwipeAction = (options: UseSwipeActionOptions = {}) => {
  const { threshold = 70, maxOffset = 140, direction = 'right' } = options;
  const [state, setState] = useState<SwipeState>({ offset: 0, isOpen: false });
  
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const isSwiping = useRef(false);

  // Fix: Import React to provide namespace for TouchEvent types.
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    isSwiping.current = false;
  }, []);

  // Fix: Import React to provide namespace for TouchEvent types.
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // If vertical scroll, don't interfere
    if (isHorizontalSwipe.current === false) {
      return;
    }

    // Prevent vertical scroll during horizontal swipe
    if (isHorizontalSwipe.current === true) {
      // Check if we are moving in the allowed direction
      const isCorrectDirection = (direction === 'right' && diffX > 0) || (direction === 'left' && diffX < 0);
      
      // If we're already open, we allow swiping back to close regardless of direction
      if (isCorrectDirection || state.isOpen) {
        if (e.cancelable) e.preventDefault();
        isSwiping.current = true;
        
        let newOffset = 0;
        if (direction === 'right') {
          if (!state.isOpen) {
            newOffset = Math.min(Math.max(0, diffX), maxOffset);
          } else {
            // If already open at maxOffset, we allow closing
            newOffset = Math.min(Math.max(0, maxOffset + diffX), maxOffset);
          }
        } else if (direction === 'left') {
          if (!state.isOpen) {
            newOffset = Math.max(Math.min(0, diffX), -maxOffset);
          } else {
            newOffset = Math.max(Math.min(0, -maxOffset + diffX), -maxOffset);
          }
        }
        
        setState(prev => ({ ...prev, offset: newOffset }));
      }
    }
  }, [direction, maxOffset, state.isOpen]);

  const handleTouchEnd = useCallback(() => {
    const absOffset = Math.abs(state.offset);
    if (absOffset > threshold) {
      setState({ 
        offset: direction === 'right' ? maxOffset : -maxOffset, 
        isOpen: true 
      });
    } else {
      setState({ offset: 0, isOpen: false });
    }
    isHorizontalSwipe.current = null;
    // We don't reset isSwiping here immediately to allow parent components to check it in their click handlers
    setTimeout(() => {
      isSwiping.current = false;
    }, 50);
  }, [state.offset, threshold, maxOffset, direction]);

  const close = useCallback(() => {
    setState({ offset: 0, isOpen: false });
  }, []);

  return {
    offset: state.offset,
    isOpen: state.isOpen,
    isSwiping: isSwiping.current,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    close,
  };
};
