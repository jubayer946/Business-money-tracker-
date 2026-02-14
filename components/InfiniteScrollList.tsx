import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollListProps {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
}

/**
 * InfiniteScrollList detects when the user scrolls near the end of the content
 * and triggers a callback to load more data.
 */
export const InfiniteScrollList: React.FC<InfiniteScrollListProps> = ({
  hasMore,
  isLoadingMore,
  onLoadMore,
  children,
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We use IntersectionObserver to monitor the 'loading' trigger element
    const observer = new IntersectionObserver(
      (entries) => {
        // If the element is visible, and we have more to load, and we aren't currently loading...
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { 
        threshold: 0.1,
        // Optional: rootMargin to trigger load before actually reaching the very bottom
        rootMargin: '100px' 
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className="w-full">
      {children}
      
      {/* Intersection target and loader UI */}
      <div 
        ref={loadMoreRef} 
        className="py-10 flex flex-col items-center justify-center space-y-3"
      >
        {isLoadingMore ? (
          <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500 animate-in fade-in duration-300">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[11px] font-black uppercase tracking-widest">Loading more results</span>
          </div>
        ) : (
          hasMore ? (
            // Hidden trigger when not loading but more exists
            <div className="h-4" aria-hidden="true" />
          ) : (
            // End of list indicator
            <div className="flex flex-col items-center space-y-2 opacity-40">
              <div className="w-8 h-px bg-slate-300 dark:bg-slate-700" />
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                You've reached the end
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};