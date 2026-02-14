
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
}

export function useVirtualList<T>({ items, itemHeight, overscan = 5 }: UseVirtualListOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });

    resizeObserver.observe(container);

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const { virtualItems, totalHeight, startIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length, 
      Math.ceil((scrollTop + (containerHeight || 800)) / itemHeight) + overscan
    );

    return {
      virtualItems: items.slice(start, end).map((item, i) => ({
        index: start + i,
        data: item,
      })),
      totalHeight: items.length * itemHeight,
      startIndex: start,
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const scrollToIndex = useCallback((index: number) => {
    containerRef.current?.scrollTo({ 
      top: index * itemHeight, 
      behavior: 'smooth' 
    });
  }, [itemHeight]);

  return {
    containerRef,
    virtualItems,
    totalHeight,
    startIndex,
    scrollToIndex,
    // Fix: Ensure React namespace is available for React.CSSProperties.
    containerProps: {
      ref: containerRef,
      style: { overflow: 'auto', height: '100%' } as React.CSSProperties,
    },
    // Fix: Import React to resolve missing React.CSSProperties namespace error.
    wrapperProps: {
      style: { height: totalHeight, position: 'relative' } as React.CSSProperties,
    },
    getItemProps: (index: number) => ({
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: itemHeight,
        transform: `translateY(${index * itemHeight}px)`,
      },
    }),
  };
}
