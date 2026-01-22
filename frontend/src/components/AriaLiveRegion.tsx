import React, { useEffect, useState } from 'react';

/**
 * AriaLiveRegion - Accessible announcements for screen readers
 * 
 * Provides a visually hidden live region that announces messages to screen readers.
 * Supports both polite (non-interrupting) and assertive (interrupting) announcements.
 * 
 * @example
 * ```tsx
 * const [announcement, setAnnouncement] = useState('');
 * 
 * <AriaLiveRegion message={announcement} politeness="polite" />
 * 
 * // Trigger announcement
 * setAnnouncement('Settings saved successfully');
 * ```
 */

export interface AriaLiveRegionProps {
  /** The message to announce to screen readers */
  message: string;
  /** 
   * Politeness level:
   * - 'polite': Wait for user to finish current task (default)
   * - 'assertive': Interrupt immediately (use for errors/urgent)
   */
  politeness?: 'polite' | 'assertive';
  /** Clear message after announcement (ms). Default: 1000ms */
  clearDelay?: number;
  /** Callback when message is cleared */
  onClear?: () => void;
}

/**
 * Visually hidden but accessible to screen readers
 */
const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

export function AriaLiveRegion({
  message,
  politeness = 'polite',
  clearDelay = 1000,
  onClear,
}: AriaLiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      // Update message (triggers screen reader announcement)
      setCurrentMessage(message);

      // Clear after delay to prepare for next announcement
      const timer = setTimeout(() => {
        setCurrentMessage('');
        onClear?.();
      }, clearDelay);

      return () => clearTimeout(timer);
    }
  }, [message, clearDelay, onClear]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      style={visuallyHiddenStyle}
    >
      {currentMessage}
    </div>
  );
}

/**
 * Hook for managing announcements
 * Provides a simple API for triggering screen reader announcements
 * 
 * @example
 * ```tsx
 * const { announce, AnnouncementRegion } = useAnnouncer();
 * 
 * return (
 *   <div>
 *     {AnnouncementRegion}
 *     <button onClick={() => announce('Button clicked!')}>Click me</button>
 *   </div>
 * );
 * ```
 */
export function useAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (politeness === 'assertive') {
      setAssertiveMessage(message);
    } else {
      setPoliteMessage(message);
    }
  };

  const AnnouncementRegion = (
    <>
      <AriaLiveRegion 
        message={politeMessage} 
        politeness="polite"
        onClear={() => setPoliteMessage('')}
      />
      <AriaLiveRegion 
        message={assertiveMessage} 
        politeness="assertive"
        onClear={() => setAssertiveMessage('')}
      />
    </>
  );

  return { announce, AnnouncementRegion };
}
