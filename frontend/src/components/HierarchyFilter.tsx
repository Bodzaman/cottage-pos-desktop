import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronRight, FolderOpen, Tag } from 'lucide-react';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { MenuSection } from 'utils/mediaHierarchyUtils';
import { announceFilterChange } from 'utils/announceToScreenReader';

interface HierarchyFilterProps {
  /** Menu sections with nested categories */
  sections: MenuSection[];
  /** Callback to trigger gallery refresh after filter change */
  onFilterChange: () => void;
  /** Disable when non-menu-item asset type selected */
  disabled?: boolean;
}

/**
 * HierarchyFilter - Collapsible Section/Category tree for menu items
 * 
 * Features:
 * - Accordion UI for sections (shadcn Accordion)
 * - Nested clickable categories
 * - Selection cascade: Section → Category
 * - Disabled state with tooltip for non-menu-item types
 * - Active state styling (purple theme)
 */
export function HierarchyFilter({
  sections,
  onFilterChange,
  disabled = false,
}: HierarchyFilterProps) {
  const {
    unifiedFilters,
    setUnifiedSectionFilter,
    setUnifiedCategoryFilter,
  } = useMediaLibraryStore();

  const handleSectionClick = (sectionId: string) => {
    if (disabled) return;
    
    const section = sections.find(s => s.id === sectionId);
    
    // Toggle: if already selected, deselect
    if (unifiedFilters.selectedSectionId === sectionId) {
      setUnifiedSectionFilter(null);
      announceFilterChange('Section', 'cleared');
    } else {
      setUnifiedSectionFilter(sectionId);
      if (section) {
        announceFilterChange('Section', section.name);
      }
    }
    onFilterChange();
  };

  const handleCategoryClick = (categoryId: string) => {
    if (disabled) return;
    
    // Find the category name
    let categoryName = '';
    for (const section of sections) {
      const category = section.categories?.find(c => c.id === categoryId);
      if (category) {
        categoryName = category.name;
        break;
      }
    }
    
    // Toggle: if already selected, deselect
    if (unifiedFilters.selectedCategoryId === categoryId) {
      setUnifiedCategoryFilter(null);
      announceFilterChange('Category', 'cleared');
    } else {
      setUnifiedCategoryFilter(categoryId);
      if (categoryName) {
        announceFilterChange('Category', categoryName);
      }
    }
    onFilterChange();
  };

  const content = (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      {sections.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No sections available
        </div>
      ) : (
        <Accordion 
          type="multiple" 
          className="space-y-1"
          aria-label="Filter by menu section and category"
        >
          {sections.map((section) => {
            const isSectionSelected =
              unifiedFilters.selectedSectionId === section.id;

            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border-none"
              >
                <div
                  className={`
                    rounded-lg border-2 transition-all duration-200
                    hover:scale-[1.01] hover:shadow-md
                    ${
                      isSectionSelected
                        ? 'bg-purple-500/10 border-purple-500/50 shadow-sm shadow-purple-500/10'
                        : 'bg-background/30 border-border/30 hover:border-purple-500/30 hover:bg-purple-500/5'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSectionClick(section.id)}
                      className={`
                        flex-1 justify-start gap-2 h-8 transition-all duration-200
                        hover:scale-[1.02]
                        ${
                          isSectionSelected
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        }
                      `}
                      aria-pressed={isSectionSelected}
                      aria-label={`Filter by ${section.name} section`}
                    >
                      <FolderOpen className="h-4 w-4 transition-transform duration-200 hover:scale-110" aria-hidden="true" />
                      <span className="truncate">{section.name}</span>
                      {section.categories && section.categories.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-auto bg-muted/50 text-xs transition-colors duration-200"
                          aria-label={`${section.categories.length} categories`}
                        >
                          {section.categories.length}
                        </Badge>
                      )}
                    </Button>

                    {section.categories && section.categories.length > 0 && (
                      <AccordionTrigger 
                        className="h-8 w-8 p-0 hover:bg-purple-500/10 rounded transition-all duration-200"
                        aria-label={`Expand ${section.name} categories`}
                      >
                        <ChevronRight className="h-4 w-4 transition-transform duration-300" aria-hidden="true" />
                      </AccordionTrigger>
                    )}
                  </div>

                  {section.categories && section.categories.length > 0 && (
                    <AccordionContent className="pb-2 px-2">
                      <div 
                        className="space-y-1 ml-6 mt-1"
                        role="group"
                        aria-label={`Categories in ${section.name}`}
                      >
                        {section.categories.map((category) => {
                          const isCategorySelected =
                            unifiedFilters.selectedCategoryId === category.id;

                          return (
                            <Button
                              key={category.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCategoryClick(category.id)}
                              className={`
                                w-full justify-start gap-2 h-7 text-sm transition-all duration-200
                                hover:scale-[1.02] hover:shadow-sm
                                ${
                                  isCategorySelected
                                    ? 'bg-purple-500/20 text-foreground font-medium border-l-2 border-purple-500 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-purple-500/5 hover:border-l-2 hover:border-purple-400/50'
                                }
                              `}
                              aria-pressed={isCategorySelected}
                              aria-label={`Filter by ${category.name} category`}
                            >
                              <Tag className="h-3 w-3 transition-transform duration-200 hover:scale-110" aria-hidden="true" />
                              <span className="truncate">{category.name}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  )}
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );

  // Wrap in tooltip if disabled
  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Available only for Menu Items</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
