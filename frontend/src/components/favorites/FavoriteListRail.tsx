import React, { useRef, useState, useEffect } from 'react';
import { List, MoreVertical, FolderEdit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from 'utils/cn';
import type { FavoriteList } from 'types';

interface FavoriteListRailProps {
  lists: FavoriteList[] | null;
  selectedListId: string;
  onSelectList: (id: string) => void;
  totalFavorites: number;
  onRenameList: (list: { id: string; name: string }) => void;
  onDeleteList: (list: { id: string; name: string }) => void;
}

export function FavoriteListRail({
  lists,
  selectedListId,
  onSelectList,
  totalFavorites,
  onRenameList,
  onDeleteList,
}: FavoriteListRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and update fade hints
  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
      return () => {
        ref.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [lists]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      {/* Scroll Controls - Desktop only */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-gray-900/80 backdrop-blur-sm border border-white/10 text-white hover:bg-gray-800 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-gray-900/80 backdrop-blur-sm border border-white/10 text-white hover:bg-gray-800 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Fade hints */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0F0F0F] to-transparent pointer-events-none z-[5] transition-opacity',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0F0F0F] to-transparent pointer-events-none z-[5] transition-opacity',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Scrollable Rail */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-1 md:px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* All Favorites Pill */}
        <button
          onClick={() => onSelectList('all')}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 border',
            selectedListId === 'all'
              ? 'bg-gradient-to-r from-[#8B1538] to-[#6B1028] text-white border-transparent shadow-[0_0_16px_rgba(139,21,56,0.4)]'
              : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
          )}
        >
          <List className="h-4 w-4" />
          All Favorites
          <span className={cn(
            'px-1.5 py-0.5 rounded-md text-xs',
            selectedListId === 'all' ? 'bg-white/20' : 'bg-white/10'
          )}>
            {totalFavorites}
          </span>
        </button>

        {/* Custom Lists */}
        {lists?.map((list) => (
          <div key={list.id} className="flex-shrink-0 relative group">
            <button
              onClick={() => onSelectList(list.id)}
              className={cn(
                'px-4 py-2 pr-10 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 border',
                selectedListId === list.id
                  ? 'bg-gradient-to-r from-[#8B1538] to-[#6B1028] text-white border-transparent shadow-[0_0_16px_rgba(139,21,56,0.4)]'
                  : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
              )}
            >
              {list.list_name}
              <span className={cn(
                'px-1.5 py-0.5 rounded-md text-xs',
                selectedListId === list.id ? 'bg-white/20' : 'bg-white/10'
              )}>
                {list.item_count || 0}
              </span>
            </button>

            {/* List Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-white/10 rounded-lg"
                  aria-label="List options"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-900/95 backdrop-blur-xl border-white/10 rounded-xl"
              >
                <DropdownMenuItem
                  onClick={() => onRenameList({ id: list.id, name: list.list_name })}
                  className="text-white hover:bg-white/10 cursor-pointer rounded-lg"
                >
                  <FolderEdit className="h-4 w-4 mr-2" />
                  Rename List
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteList({ id: list.id, name: list.list_name })}
                  className="text-red-400 hover:bg-red-500/10 cursor-pointer rounded-lg"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
