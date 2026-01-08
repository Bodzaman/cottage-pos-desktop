import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * VisuallyHidden - Screen reader only content
 * 
 * Hides content visually but keeps it accessible to screen readers
 * Follow WCAG guidelines for accessible content
 * 
 * @example
 * <VisuallyHidden>Skip to main content</VisuallyHidden>
 * <VisuallyHidden as="span">Loading...</VisuallyHidden>
 */
export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }}
    >
      {children}
    </Component>
  );
}
