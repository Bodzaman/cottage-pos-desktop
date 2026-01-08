import React, { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '../utils/cn';

interface SplitViewProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  leftTitle: string;
  rightTitle: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function SplitView({
  leftContent,
  rightContent,
  leftTitle,
  rightTitle,
  className = '',
  orientation = 'horizontal'
}: SplitViewProps) {
  const isHorizontal = orientation === 'horizontal';

  // For smaller screens, switch to tabs layout
  return (
    <div className={cn("w-full", className)}>
      {/* Larger screens: Split view */}
      <div className={cn(
        "hidden md:flex rounded-md overflow-hidden border border-tandoor-platinum/10",
        isHorizontal ? "flex-row" : "flex-col"
      )}>
        {/* Left side */}
        <div className={cn(
          "flex flex-col",
          isHorizontal ? "w-1/2 border-r" : "h-1/2 border-b",
          "border-tandoor-platinum/10"
        )}>
          <div className="bg-tandoor-charcoal px-4 py-3 border-b border-tandoor-platinum/10">
            <h3 className="text-sm font-medium text-tandoor-platinum">{leftTitle}</h3>
          </div>
          <div className="flex-1 overflow-auto bg-black/40">
            {leftContent}
          </div>
        </div>
        
        {/* Right side */}
        <div className={cn(
          "flex flex-col",
          isHorizontal ? "w-1/2" : "h-1/2"
        )}>
          <div className="bg-tandoor-charcoal px-4 py-3 border-b border-tandoor-platinum/10">
            <h3 className="text-sm font-medium text-tandoor-platinum">{rightTitle}</h3>
          </div>
          <div className="flex-1 overflow-auto bg-black/40">
            {rightContent}
          </div>
        </div>
      </div>

      {/* Mobile/Smaller screens: Tabs layout */}
      <div className="md:hidden bg-black/40 rounded-md border border-tandoor-platinum/10 overflow-hidden">
        <Tabs defaultValue="left">
          <TabsList className="bg-tandoor-charcoal w-full">
            <TabsTrigger value="left" className="flex-1 data-[state=active]:bg-tandoor-red/20">
              {leftTitle}
            </TabsTrigger>
            <TabsTrigger value="right" className="flex-1 data-[state=active]:bg-tandoor-red/20">
              {rightTitle}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="left" className="p-0 m-0">
            <div className="h-[500px] overflow-auto">
              {leftContent}
            </div>
          </TabsContent>
          <TabsContent value="right" className="p-0 m-0">
            <div className="h-[500px] overflow-auto">
              {rightContent}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
