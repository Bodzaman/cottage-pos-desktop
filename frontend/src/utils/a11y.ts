import { useEffect, useRef } from 'react';

/**
 * Focus trap utility for accessibility
 * Traps keyboard focus within modal dialogs and overlays
 * 
 * @param isActive - Whether the focus trap should be active
 * 
 * @example
 * ```tsx
 * const [isModalOpen, setIsModalOpen] = useState(false);
 * useFocusTrap(isModalOpen);
 * ```
 */
export function useFocusTrap(isActive: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the element that had focus before the trap activated
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];
      
      return Array.from(
        document.querySelectorAll<HTMLElement>(selectors.join(','))
      ).filter(el => {
        // Only include visible elements
        return el.offsetParent !== null;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trap Tab key
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab (backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab (forwards)
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element when trap activates
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the element that had focus before the trap
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);
}

/**
 * Visually hide an element while keeping it accessible to screen readers
 * 
 * @returns CSS properties for visually hidden elements
 */
export const visuallyHidden = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: '0',
};

/**
 * Generate a unique ID for ARIA attributes
 * 
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
