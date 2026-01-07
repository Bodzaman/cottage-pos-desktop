import React from 'react';
import { Check, ChevronDown, ChevronRight, ChefHat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FIXED_SECTIONS } from 'utils/sectionMapping';
import { MenuCategory } from '../utils/menuTypes';

interface ExtendedMenuCategory extends MenuCategory {
  children?: ExtendedMenuCategory[];
  item_count?: number;
}

interface CategorySectionViewProps {
  // Section data from organizeCategoriesBySection helper
  sections: Array<{
    section: typeof FIXED_SECTIONS[number];
    categories: ExtendedMenuCategory[];
    count: number;
  }>;
  
  // State and handlers from CategoryManagement
  selectedCategories: string[];
  expandedSections: Record<string, boolean>;
  
  // Event handlers
  onToggleSection: (sectionId: string, e: React.MouseEvent) => void;
  onToggleMultiSelect: (categoryId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onToggleActive: (categoryId: string, active: boolean) => void;
  onDeleteCategory: (categoryId: string) => void;
}

/**
 * CategorySectionView Component
 * 
 * Renders categories organized by FIXED_SECTIONS with collapsible sections.
 * Preserves all existing functionality (multi-select, edit, delete, toggle active).
 * 
 * Part of MYA-1010 implementation.
 */
export const CategorySectionView = React.memo(function CategorySectionView({
  sections,
  selectedCategories,
  expandedSections,
  onToggleSection,
  onToggleMultiSelect,
  onSelectCategory,
  onToggleActive,
  onDeleteCategory
}: CategorySectionViewProps) {
  
  return (
    <div className="space-y-3">
      {sections.map((sectionData) => {
        const isExpanded = expandedSections[sectionData.section.id] ?? false;
        const hasCategories = sectionData.count > 0;
        
        return (
          <div key={sectionData.section.id} className="space-y-1">
            {/* Section Header */}
            <button
              onClick={(e) => onToggleSection(sectionData.section.id, e)}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-[#1A1A1A] border border-[rgba(124,93,250,0.3)] hover:border-[rgba(124,93,250,0.5)] transition-all duration-200 hover:shadow-[0_0_15px_rgba(124,93,250,0.2)]"
            >
              <div className="flex items-center gap-3">
                {/* Expand/Collapse Icon */}
                {hasCategories ? (
                  isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-[#7C5DFA]" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-[#7C5DFA]" />
                  )
                ) : (
                  <div className="h-5 w-5" /> 
                )}
                
                {/* Section Icon & Name */}
                <span className="text-2xl">{sectionData.section.icon}</span>
                <h3 className="text-lg font-bold text-white">{sectionData.section.displayName}</h3>
                
                {/* Category Count Badge */}
                <Badge className="bg-[#7C5DFA]/20 text-[#7C5DFA] border-[#7C5DFA]/30 text-xs px-2 py-1">
                  {sectionData.count} {sectionData.count === 1 ? 'category' : 'categories'}
                </Badge>
              </div>
            </button>
            
            {/* Section Categories (Collapsible) */}
            {isExpanded && (
              <div className="ml-4 space-y-1">
                {hasCategories ? (
                  sectionData.categories.map((category) => (
                    <div
                      key={category.id}
                      className={`group relative overflow-hidden rounded-lg transition-all duration-300 ${
                        selectedCategories.includes(category.id)
                          ? 'bg-[#1A1A1A] border-[rgba(124,93,250,0.6)] shadow-[0_0_15px_rgba(124,93,250,0.3)]'
                          : 'bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] hover:border-[rgba(124,93,250,0.4)] hover:shadow-[0_0_15px_rgba(124,93,250,0.1)]'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCategory(category.id);
                      }}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {/* Multi-select checkbox */}
                          <div
                            className="flex items-center justify-center w-6 h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleMultiSelect(category.id);
                            }}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                                selectedCategories.includes(category.id)
                                  ? 'bg-[#7C5DFA] border-[#7C5DFA] shadow-[0_0_8px_rgba(124,93,250,0.4)]'
                                  : 'border-gray-500 hover:border-[#7C5DFA]'
                              } flex items-center justify-center`}
                            >
                              {selectedCategories.includes(category.id) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                          
                          {/* Category info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-lg text-white truncate">
                                {category.name}
                              </h3>
                              
                              {/* Status indicators */}
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  category.active ? 'bg-green-400' : 'bg-red-400'
                                }`} />
                                
                                {!category.active && (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-2 py-1">
                                    Inactive
                                  </Badge>
                                )}
                                
                                {category.print_to_kitchen && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-2 py-1">
                                    <ChefHat className="h-3 w-3 mr-1" />
                                    Kitchen
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Category metadata */}
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>Order: {category.menu_order}</span>
                              <span>Items: {category.item_count || 0}</span>
                              {category.description && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="max-w-xs truncate cursor-help hover:text-gray-300 transition-colors">
                                        {category.description}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      className="bg-[#1A1A1A] border-[#7C5DFA]/30 text-white max-w-sm p-3 shadow-xl"
                                      sideOffset={8}
                                    >
                                      <p className="text-sm leading-relaxed">{category.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Toggle Active */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleActive(category.id, !category.active);
                            }}
                            className="text-gray-400 hover:text-white hover:bg-[#7C5DFA]/20"
                          >
                            {category.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          
                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCategory(category.id);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 bg-[#1A1A1A]/50 border border-dashed border-[rgba(124,93,250,0.2)] rounded-lg">
                    <p className="text-sm">No categories yet in this section</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
