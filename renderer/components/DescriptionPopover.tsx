import { useState } from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PremiumTheme } from 'utils/premiumTheme';

interface DescriptionPopoverProps {
  description: string;
  theme?: 'pos' | 'online';
  className?: string;
}

/**
 * Hybrid description popover component
 * - Shows 2-line truncated description with info icon
 * - Desktop: Hover on text/icon to show full description
 * - Touch: Tap icon to show full description
 * - Auto-dismisses on mouse leave or click outside
 */
export function DescriptionPopover({ 
  description, 
  theme = 'pos',
  className = '' 
}: DescriptionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const themeColor = theme === 'pos' ? '#7C5DFA' : '#8B1538';
  
  // Handle hover for desktop
  const handleMouseEnter = () => setIsOpen(true);
  const handleMouseLeave = () => setIsOpen(false);
  
  // Handle click for touch screens
  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className={`flex items-start gap-1.5 ${className}`}>
        {/* Info icon trigger - shows full description on hover/tap */}
        <PopoverTrigger
          className="flex-shrink-0 cursor-help transition-all duration-200 hover:scale-110 rounded-full bg-black/40 backdrop-blur-md ring-1 ring-white/30 p-1.5 hover:bg-black/50"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Info 
            className="h-4 w-4 md:h-4.5 md:h-4.5" 
            style={{ color: `${themeColor}` }}
          />
        </PopoverTrigger>
      </div>

      {/* Popover content - full description */}
      <PopoverContent
        className="w-80 p-4 border rounded-lg shadow-xl"
        style={{
          backgroundColor: PremiumTheme.colors.dark[850],
          borderColor: `${themeColor}40`,
          boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${themeColor}20`
        }}
        sideOffset={8}
      >
        {/* Full description text */}
        <p 
          className="text-sm leading-relaxed"
          style={{ color: PremiumTheme.colors.text.secondary }}
        >
          {description}
        </p>
      </PopoverContent>
    </Popover>
  );
}
