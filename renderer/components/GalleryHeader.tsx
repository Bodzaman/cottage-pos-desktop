import React from 'react';
import { Image, Bot, FolderOpen, LayoutGrid, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryHeaderProps {
  /** Current asset type selected */
  assetType: 'all' | 'menu-item' | 'ai-avatar' | 'general';
  /** Count of filtered items */
  count: number;
  /** Optional callback to show keyboard shortcuts help */
  onShowHelp?: () => void;
}

/**
 * GalleryHeader - Simple title bar showing current filter and count
 * 
 * Replaces the old tab navigation with a clean, informative header.
 * Shows what's currently being displayed based on sidebar filters.
 */
export function GalleryHeader({ assetType, count, onShowHelp }: GalleryHeaderProps) {
  // Map asset type to display text and icon
  const getDisplayInfo = () => {
    switch (assetType) {
      case 'menu-item':
        return {
          icon: <Image className="h-5 w-5 text-purple-400" />,
          text: count === 1 ? 'Menu Image' : 'Menu Images',
        };
      case 'ai-avatar':
        return {
          icon: <Bot className="h-5 w-5 text-purple-400" />,
          text: count === 1 ? 'AI Avatar' : 'AI Avatars',
        };
      case 'general':
        return {
          icon: <FolderOpen className="h-5 w-5 text-purple-400" />,
          text: count === 1 ? 'General Asset' : 'General Assets',
        };
      case 'all':
      default:
        return {
          icon: <LayoutGrid className="h-5 w-5 text-purple-400" />,
          text: count === 1 ? 'Asset' : 'Assets',
        };
    }
  };

  const { icon, text } = getDisplayInfo();

  return (
    <div className="flex items-center justify-between pb-4 border-b border-border/30">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-lg font-semibold text-foreground">
          Showing{' '}
          <span className="text-purple-400">{count}</span>{' '}
          {text}
        </h2>
      </div>
      {onShowHelp && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowHelp}
          className="text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10"
          title="Keyboard shortcuts (Press ?)"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
