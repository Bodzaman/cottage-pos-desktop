import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Bot, FolderOpen } from 'lucide-react';
import { MediaLibraryTab } from 'utils/mediaLibraryStore';

interface MediaLibraryTabsProps {
  activeTab: MediaLibraryTab;
  onTabChange: (tab: MediaLibraryTab) => void;
  menuItemCount?: number;
  aiAvatarCount?: number;
  generalCount?: number;
}

export default function MediaLibraryTabs({
  activeTab,
  onTabChange,
  menuItemCount = 0,
  aiAvatarCount = 0,
  generalCount = 0,
}: MediaLibraryTabsProps) {
  // Keyboard shortcuts (Alt+1, Alt+2, Alt+3)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            onTabChange('menu-images');
            break;
          case '2':
            e.preventDefault();
            onTabChange('ai-avatars');
            break;
          case '3':
            e.preventDefault();
            onTabChange('general');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange]);

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as MediaLibraryTab)}>
      <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-background/50 border border-border/50">
        <TabsTrigger
          value="menu-images"
          className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/50 border border-transparent transition-all duration-200 group"
        >
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="font-semibold">Menu Images</span>
            {menuItemCount > 0 && (
              <span className="ml-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
                {menuItemCount}
              </span>
            )}
          </div>
          <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Alt+1
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="ai-avatars"
          className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/50 border border-transparent transition-all duration-200 group"
        >
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="font-semibold">AI Avatars</span>
            {aiAvatarCount > 0 && (
              <span className="ml-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
                {aiAvatarCount}
              </span>
            )}
          </div>
          <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Alt+2
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="general"
          className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/50 border border-transparent transition-all duration-200 group"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="font-semibold">General Media</span>
            {generalCount > 0 && (
              <span className="ml-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
                {generalCount}
              </span>
            )}
          </div>
          <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Alt+3
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
