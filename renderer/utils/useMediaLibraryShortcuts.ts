import { useEffect, useCallback, RefObject } from 'react';
import { useMediaLibraryStore } from './mediaLibraryStore';
import { toast } from 'sonner';

interface UseMediaLibraryShortcutsOptions {
  /** Ref to the menu item search input trigger button */
  menuItemSearchRef?: RefObject<HTMLButtonElement>;
  /** Callback to open preset command palette */
  onOpenPresetPalette?: () => void;
  /** Callback to refresh media library */
  onRefresh?: () => void;
}

/**
 * Keyboard shortcuts for Media Library
 * 
 * Shortcuts:
 * - Ctrl/Cmd + F: Focus menu item search
 * - Ctrl/Cmd + K: Open filter preset command palette
 * - Esc: Clear all filters
 * - Alt + 1: Switch to All Assets
 * - Alt + 2: Switch to Menu Images
 * - Alt + 3: Switch to AI Avatars
 * - Ctrl/Cmd + R: Refresh media library
 */
export function useMediaLibraryShortcuts({
  menuItemSearchRef,
  onOpenPresetPalette,
  onRefresh,
}: UseMediaLibraryShortcutsOptions = {}) {
  const { setActiveTab, clearAllFilters } = useMediaLibraryStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Ignore shortcuts when typing in input/textarea
      const target = event.target as HTMLElement;
      const isTyping = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Ctrl/Cmd + F: Focus menu item search
      if (modKey && event.key === 'f' && !isTyping) {
        event.preventDefault();
        if (menuItemSearchRef?.current) {
          menuItemSearchRef.current.click();
          toast.info('Menu item search opened');
        }
        return;
      }

      // Ctrl/Cmd + K: Open filter preset command palette
      if (modKey && event.key === 'k' && !isTyping) {
        event.preventDefault();
        if (onOpenPresetPalette) {
          onOpenPresetPalette();
          toast.info('Filter presets opened');
        }
        return;
      }

      // Esc: Clear all filters (only when NOT typing)
      if (event.key === 'Escape' && !isTyping) {
        event.preventDefault();
        clearAllFilters();
        toast.success('All filters cleared');
        return;
      }

      // Alt + 1/2/3: Switch asset type tabs
      if (event.altKey && !modKey && !isTyping) {
        if (event.key === '1') {
          event.preventDefault();
          setActiveTab('all');
          toast.info('Switched to All Assets');
          return;
        }
        if (event.key === '2') {
          event.preventDefault();
          setActiveTab('menu-images');
          toast.info('Switched to Menu Images');
          return;
        }
        if (event.key === '3') {
          event.preventDefault();
          setActiveTab('ai-avatars');
          toast.info('Switched to AI Avatars');
          return;
        }
      }

      // Ctrl/Cmd + R: Refresh media library
      if (modKey && event.key === 'r' && !isTyping) {
        event.preventDefault();
        if (onRefresh) {
          onRefresh();
          toast.success('Media library refreshed');
        }
        return;
      }
    },
    [menuItemSearchRef, onOpenPresetPalette, onRefresh, setActiveTab, clearAllFilters]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get keyboard shortcut display string based on platform
 */
export function getShortcutDisplay(key: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: Record<string, string> = {
    'search': `${modKey}+F`,
    'presets': `${modKey}+K`,
    'clear': 'Esc',
    'tab-all': 'Alt+1',
    'tab-menu': 'Alt+2',
    'tab-avatars': 'Alt+3',
    'refresh': `${modKey}+R`,
  };

  return shortcuts[key] || '';
}
