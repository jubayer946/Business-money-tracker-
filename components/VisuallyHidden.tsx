import React from 'react';

/**
 * VisuallyHidden hides content from the screen but keeps it accessible to screen readers.
 * Uses Tailwind's 'sr-only' utility class.
 */
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);