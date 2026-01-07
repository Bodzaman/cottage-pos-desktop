import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Edit, Power, Trash2, ImageIcon } from 'lucide-react';
import CompactMenuItemCard from './CompactMenuItemCard';
import { colors } from '../utils/designSystem';
import { Button } from '@/components/ui/button';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { getItemDisplayPrice, getVariantPrice as getVariantPriceByMode } from '../utils/variantPricing';

// Types for grouped structure
export interface GroupedItemCategory {
  id: string;
  name: string;
  itemCount: number;
  items: any[]; // MenuItem
  children: Array<{
    id: string;
    name: string;
    itemCount: number;
    items: any[]; // MenuItem
  }>;
}

export interface GroupedSection {
  id: string; // section id (e.g., 'starters')
  displayName: string;
  icon?: string;
  itemCount: number; // total items in this section (after filtering)
  categories: GroupedItemCategory[]; // top-level categories under this section
}

interface Props {
  sections: GroupedSection[];
  expandedSections: Set<string>;
  setExpandedSections: (s: Set<string>) => void;
  expandedCategories: Set<string>;
  setExpandedCategories: (s: Set<string>) => void;
  onEditItem: (item: any) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItemActive: (itemId: string, active: boolean) => void;
}

export default function ItemsSectionView({
  sections,
  expandedSections,
  setExpandedSections,
  expandedCategories,
  setExpandedCategories,
  onEditItem,
  onDeleteItem,
  onToggleItemActive,
  viewMode = 'card',
}: Props) {
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const { itemVariants, proteinTypes } = useRealtimeMenuStore();
  const { categories: allCategories } = useRealtimeMenuStore();
  
  // Helper to strip [SECTION] prefix from category names
  const stripSectionPrefix = (name: string): string => {
    return name.replace(/^\[SECTION\]\s*/i, '');
  };
  
  const toggleSection = (sectionId: string) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
    setExpandedSections(next);
  };

  const toggleCategory = (categoryId: string) => {
    const next = new Set(expandedCategories);
    if (next.has(categoryId)) next.delete(categoryId); else next.add(categoryId);
    setExpandedCategories(next);
  };

  // Helper to get category name from ID
  const getCategoryName = (categoryId: string): string => {
    const category = allCategories?.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  // Helper to get price from item (handles variants)
  const getItemPrice = (item: any): number => {
    return item.base_price || item.price || item.price_dine_in || 0;
  };

  // Render list view row for an item
  const renderListItem = (item: any) => {
    const variants = itemVariants?.filter(v => v.menu_item_id === item.id) || [];
    const isVariantsExpanded = expandedVariants.has(item.id);

    // Helper to get protein name
    const getProteinName = (proteinTypeId: string | null): string => {
      if (!proteinTypeId || !proteinTypes) return 'N/A';
      const protein = proteinTypes.find(p => p.id === proteinTypeId);
      return protein?.name || 'N/A';
    };

    // Helper to get variant price
    const getVariantPrice = (variant: any): number => {
      return variant.price_dine_in || variant.price || variant.base_price || 0;
    };

    const hasVariants = variants.length > 0;
    
    // Get proper display price using utility
    const priceDisplay = getItemDisplayPrice(item, variants, 'DINE-IN');

    const toggleVariants = () => {
      const next = new Set(expandedVariants);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      setExpandedVariants(next);
    };

    return (
      <div key={item.id} className="space-y-2">
        {/* Main item row */}
        <div className="flex items-center gap-4 p-3 bg-black/10 hover:bg-black/20 border border-[rgba(124,93,250,0.1)] rounded-lg transition-colors group">
          {/* Thumbnail */}
          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-black/20 border border-[rgba(124,93,250,0.2)]">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${item.image_url ? 'hidden' : ''}`}>
              <ImageIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>

          {/* Item info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{item.name}</p>
            {hasVariants && (
              <button
                onClick={toggleVariants}
                className="text-xs text-[#7C5DFA] hover:text-[#6B4CE6] transition-colors flex items-center gap-1 mt-1"
              >
                {isVariantsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {variants.length} variant{variants.length > 1 ? 's' : ''}
              </button>
            )}
          </div>

          <div className="w-40 text-sm text-gray-400 truncate">
            {getCategoryName(item.category_id)}
          </div>
          <div className="w-24 text-right">
            <span className="text-white font-medium">{priceDisplay.formattedPrice}</span>
          </div>
          <div className="w-24">
            <Badge
              className={`${
                item.active
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}
            >
              {item.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditItem(item)}
              className="h-8 w-8 p-0 text-[#7C5DFA] hover:text-[#6B4CE6] hover:bg-[rgba(124,93,250,0.1)]"
              aria-label="Edit item"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleItemActive(item.id, !item.active)}
              className={`h-8 w-8 p-0 ${
                item.active
                  ? 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                  : 'text-gray-500 hover:text-gray-400 hover:bg-gray-500/10'
              }`}
              aria-label={item.active ? 'Deactivate item' : 'Activate item'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteItem(item.id)}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Variants expansion */}
        {hasVariants && isVariantsExpanded && (
          <div className="ml-16 pl-4 border-l-2 border-[rgba(124,93,250,0.3)] space-y-2">
            {variants.map((variant) => (
              <div key={variant.id} className="flex items-center gap-4 p-2 bg-black/5 rounded border border-[rgba(124,93,250,0.1)]">
                <div className="flex-1 text-sm text-gray-300">
                  {getProteinName(variant.protein_type_id)}
                </div>
                <div className="text-sm text-white font-medium">
                  £{getVariantPriceByMode(variant, 'DINE-IN').toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isSectionExpanded = expandedSections.has(section.id);
        return (
          <Card key={section.id} className="bg-black/20 backdrop-blur-sm border-tandoor-platinum/20">
            <CardHeader
              className="pb-3 cursor-pointer hover:bg-black/10 transition-colors rounded-t-lg"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSectionExpanded ? (
                    <ChevronDown className="h-5 w-5 text-[#7C5DFA]" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-[#7C5DFA]" />
                  )}
                  <h3 className="text-xl font-bold text-white">
                    {section.icon ? `${section.icon} ` : ''}{section.displayName}
                  </h3>
                  <Badge className="bg-[#7C5DFA]/20 text-[#7C5DFA] border-[#7C5DFA]/30">
                    {section.itemCount} {section.itemCount === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            {isSectionExpanded && (
              <CardContent className="pt-0 space-y-4">
                {section.categories.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 bg-black/10 rounded-lg border border-dashed border-[#7C5DFA]/20">
                    No categories in this section
                  </div>
                ) : (
                  section.categories.map((cat) => {
                    const isCatExpanded = expandedCategories.has(cat.id);
                    const hasDirect = (cat.items?.length || 0) > 0;
                    const hasChildren = (cat.children?.length || 0) > 0;
                    return (
                      <Card key={cat.id} className="bg-black/10 backdrop-blur-sm border-[#7C5DFA]/10">
                        <CardHeader
                          className="pb-2 cursor-pointer hover:bg-black/5 transition-colors rounded-t-lg"
                          onClick={() => toggleCategory(cat.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isCatExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#7C5DFA]" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[#7C5DFA]" />
                              )}
                              <h4 className="text-lg font-semibold text-white">
                                📂 {stripSectionPrefix(cat.name)}
                              </h4>
                              <Badge className="bg-[#7C5DFA]/15 text-[#7C5DFA] border-[#7C5DFA]/20 text-sm">
                                {cat.itemCount} {cat.itemCount === 1 ? 'item' : 'items'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        {isCatExpanded && (
                          <CardContent className="pt-0 space-y-4">
                            {hasDirect && (
                              <div>
                                <div className="flex items-center gap-2 mb-3 pl-2">
                                  <div className="h-px bg-[#7C5DFA]/30 flex-1"></div>
                                  <span className="text-sm text-gray-400">Items in {stripSectionPrefix(cat.name)}</span>
                                  <div className="h-px bg-[#7C5DFA]/30 flex-1"></div>
                                </div>
                                {viewMode === 'list' ? (
                                  <div className="space-y-2">
                                    {cat.items.map((item) => renderListItem(item))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {cat.items.map((item) => (
                                      <CompactMenuItemCard
                                        key={item.id}
                                        item={item}
                                        onEdit={onEditItem}
                                        onDelete={onDeleteItem}
                                        onToggleActive={onToggleItemActive}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {hasChildren && (
                              <div className="space-y-3">
                                {cat.children.map((sub) => {
                                  const isSubExpanded = expandedCategories.has(sub.id);
                                  return (
                                    <Card key={sub.id} className="bg-black/5 border-[#7C5DFA]/10 ml-6">
                                      <CardHeader
                                        className="pb-2 cursor-pointer hover:bg-black/5 transition-colors rounded-t-lg"
                                        onClick={() => toggleCategory(sub.id)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            {isSubExpanded ? (
                                              <ChevronDown className="h-4 w-4 text-[#7C5DFA]" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-[#7C5DFA]" />
                                            )}
                                            <h5 className="text-base font-semibold text-white">
                                              📁 {stripSectionPrefix(sub.name)}
                                            </h5>
                                            <Badge className="bg-[#7C5DFA]/10 text-[#7C5DFA] border-[#7C5DFA]/20 text-xs">
                                              {sub.itemCount} {sub.itemCount === 1 ? 'item' : 'items'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      {isSubExpanded && sub.items.length > 0 && (
                                        <CardContent className="pt-0">
                                          {viewMode === 'list' ? (
                                            <div className="space-y-2">
                                              {sub.items.map((item) => renderListItem(item))}
                                            </div>
                                          ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                              {sub.items.map((item) => (
                                                <CompactMenuItemCard
                                                  key={item.id}
                                                  item={item}
                                                  onEdit={onEditItem}
                                                  onDelete={onDeleteItem}
                                                  onToggleActive={onToggleItemActive}
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </CardContent>
                                      )}
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
