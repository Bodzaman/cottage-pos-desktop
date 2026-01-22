import React, { useState } from 'react';
import { HelpCircle, Command, Search, Filter, Trash2, Layers, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getShortcutDisplay } from 'utils/useMediaLibraryShortcuts';

interface ShortcutItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Keyboard shortcuts help dialog for Media Library
 * 
 * Displays all available keyboard shortcuts
 * with visual icons and clear descriptions.
 */
export function MediaLibraryShortcutsHelp() {
  const [open, setOpen] = useState(false);

  const shortcuts: ShortcutItem[] = [
    {
      key: 'search',
      label: 'Focus Search',
      description: 'Open menu item search',
      icon: <Search className="h-4 w-4" />,
    },
    {
      key: 'presets',
      label: 'Filter Presets',
      description: 'Open filter preset panel',
      icon: <Filter className="h-4 w-4" />,
    },
    {
      key: 'clear',
      label: 'Clear Filters',
      description: 'Remove all active filters',
      icon: <Trash2 className="h-4 w-4" />,
    },
    {
      key: 'tab-all',
      label: 'All Assets',
      description: 'Switch to All Assets tab',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      key: 'tab-menu',
      label: 'Menu Images',
      description: 'Switch to Menu Images tab',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      key: 'tab-avatars',
      label: 'AI Avatars',
      description: 'Switch to AI Avatars tab',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      key: 'refresh',
      label: 'Refresh',
      description: 'Reload media library data',
      icon: <RefreshCw className="h-4 w-4" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
          aria-label="View keyboard shortcuts"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm border-purple-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Command className="h-5 w-5 text-purple-400" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-1 mt-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-500/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="text-purple-400 group-hover:scale-110 transition-transform">
                  {shortcut.icon}
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">
                    {shortcut.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {shortcut.description}
                  </div>
                </div>
              </div>
              <kbd className="px-2.5 py-1.5 text-xs font-mono bg-muted/50 border border-border/50 rounded-md shadow-sm">
                {getShortcutDisplay(shortcut.key)}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Shortcuts work
            anywhere in the Media Library except when typing in search fields.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
