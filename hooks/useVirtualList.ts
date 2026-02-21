import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface UseVirtualListOptions<T> {
  items: T[];
  // Used as an initial guess for height until we measure the real one
  itemHeight: number;
  // Overscan in "items worth" of pixels (approximate)
  overscan?: number;
}

export function useVirtualList<T>({ items, itemHeight, overscan = 5 }: UseVirtualListOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Measured heights per item (by index)
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const observersRef = useRef<Map<number, ResizeObserver>>(new Map());
  const offsetsRef = useRef<number[]>([]); // prefix sums of heights

  // Init/resync heights when items length changes
  useEffect(() => {
    setItemHeights(prev => {
      const next = new Array(items.length);
      for (let i = 0; i < items.length; i++) {
        next[i] = prev[i] ?? itemHeight; // use previous or fallback estimate
      }
      return next;
    });
  }, [items.length, itemHeight]);

  // Track container size and scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
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

  // Cleanup all item observers on unmount
  useEffect(() => {
    return () => {
      observersRef.current.forEach(observer => observer.disconnect());
      observersRef.current.clear();
    };
  }, []);

  const overscanPx = overscan * itemHeight;

  const { virtualItems, totalHeight, startIndex } = useMemo(() => {
    const count = items.length;
    if (count === 0) {
      offsetsRef.current = [0];
      return { virtualItems: [] as { index: number; data: T }[], totalHeight: 0, startIndex: 0 };
    }

    // Build prefix sums of heights
    const heights = itemHeights.length === count ? itemHeights : new Array(count).fill(itemHeight);
    const offsets: number[] = new Array(count + 1);
    offsets[0] = 0;
    for (let i = 0; i < count; i++) {
      offsets[i + 1] = offsets[i] + (heights[i] || itemHeight);
    }
    offsetsRef.current = offsets;

    const totalHeight = offsets[count];

    const viewportTop = Math.max(0, scrollTop - overscanPx);
    const viewportBottom = Math.min(totalHeight, scrollTop + containerHeight + overscanPx);

    // Binary search for first visible index
    let low = 0;
    let high = count;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (offsets[mid + 1] < viewportTop) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    const start = low;

    // Binary search for last visible index (exclusive)
    low = start;
    high = count;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (offsets[mid] <= viewportBottom) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    const end = low;

    const virtualItems = [];
    for (let i = start; i < end; i++) {
      virtualItems.push({ index: i, data: items[i] });
    }

    return { virtualItems, totalHeight, startIndex: start };
  }, [items, itemHeights, scrollTop, containerHeight, overscanPx, itemHeight]);

  // Smooth scroll to item index based on measured offsets
  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const offsets = offsetsRef.current;
    const top = offsets[index] ?? 0;
    container.scrollTo({ top, behavior: 'smooth' });
  }, []);

  // Attach this to each item to measure its real height
  const getItemProps = (index: number) => ({
    ref: (element: HTMLDivElement | null) => {
      // Clean up any old observer for this index
      const existingObserver = observersRef.current.get(index);
      if (existingObserver) {
        existingObserver.disconnect();
        observersRef.current.delete(index);
      }

      if (!element) return;

      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (!entry) return;
        const newHeight = entry.contentRect.height;

        setItemHeights(prev => {
          if (prev[index] === newHeight) return prev;
          const next = [...prev];
          next[index] = newHeight;
          return next;
        });
      });

      observer.observe(element);
      observersRef.current.set(index, observer);
    },
    style: {
      position: 'absolute' as const,
      top: offsetsRef.current[index] ?? 0,
      left: 0,
      right: 0,
      // NOTE: no fixed height here: height comes from content, which we measure
    } as React.CSSProperties,
  });

  return {
    containerRef,
    virtualItems,
    totalHeight,
    startIndex,
    scrollToIndex,
    containerProps: {
      ref: containerRef,
      style: { overflow: 'auto', height: '100%' } as React.CSSProperties,
    },
    wrapperProps: {
      style: { height: totalHeight, position: 'relative' } as React.CSSProperties,
    },
    getItemProps,
  };
}
