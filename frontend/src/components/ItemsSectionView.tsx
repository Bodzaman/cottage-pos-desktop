import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Edit, Power, Trash2, ImageIcon, UtensilsCrossed, Package, Truck } from 'lucide-react';
import CompactMenuItemCard from './CompactMenuItemCard';
import { colors } from '../utils/InternalDesignSystem';
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
  /** Handler for reverting draft items to published state */
  onRevert?: (itemId: string) => void;
  viewMode?: 'card' | 'list';
  /** Whether selection mode is enabled */
  selectionMode?: boolean;
  /** Set of selected item IDs */
  selectedIds?: Set<string>;
  /** Handler for selection toggle */
  onSelectionToggle?: (itemId: string) => void;
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
  onRevert,
  viewMode = 'card',
  selectionMode = false,
  selectedIds = new Set(),
  onSelectionToggle,
}: Props) {
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const { itemVariants, proteinTypes } = useRealtimeMenuStore();
  const { categories: allCategories } = useRealtimeMenuStore();

  // Helper to check if an item is a draft (published_at is null)
  const isDraft = (item: any): boolean => !item.published_at;

  // Helper to count drafts in an array of items
  const countDrafts = (items: any[]): number =>
    items.filter(isDraft).length;

  // Helper to count drafts in a category (including children)
  const countCategoryDrafts = (cat: GroupedItemCategory): number => {
    let count = countDrafts(cat.items || []);
    if (cat.children) {
      cat.children.forEach((child) => {
        count += countDrafts(child.items || []);
      });
    }
    return count;
  };

  // Helper to count drafts in a section
  const countSectionDrafts = (section: GroupedSection): number => {
    let count = 0;
    section.categories.forEach((cat) => {
      count += countCategoryDrafts(cat);
    });
    return count;
  };
  
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

    // Get proper display prices for all 3 modes using utility
    const priceDisplayDineIn = getItemDisplayPrice(item, variants, 'DINE-IN');
    const priceDisplayTakeaway = getItemDisplayPrice(item, variants, 'COLLECTION');
    const priceDisplayDelivery = getItemDisplayPrice(item, variants, 'DELIVERY');

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
        <div
          className="flex items-center gap-4 p-3 rounded-lg transition-colors group"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            border: `1px solid ${colors.border.light}`,
          }}
        >
          {/* Thumbnail */}
          <div
            className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              border: `1px solid ${colors.border.accent}`,
            }}
          >
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
                className="text-xs transition-colors flex items-center gap-1 mt-1"
                style={{ color: colors.purple.primary }}
              >
                {isVariantsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {variants.length} variant{variants.length > 1 ? 's' : ''}
              </button>
            )}
          </div>

          <div className="w-32 text-sm text-gray-400 truncate">
            {getCategoryName(item.category_id)}
          </div>

          {/* All 3 Prices */}
          <div className="flex items-center gap-3">
            {/* Dine-In */}
            <div className="w-20 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <UtensilsCrossed className="h-3 w-3" style={{ color: colors.purple.light }} />
                <span className="text-[10px] uppercase tracking-wide" style={{ color: colors.text.tertiary }}>DI</span>
              </div>
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{priceDisplayDineIn.formattedPrice}</span>
            </div>
            {/* Takeaway */}
            <div className="w-20 text-center px-3" style={{ borderLeft: `1px solid ${colors.border.accent}`, borderRight: `1px solid ${colors.border.accent}` }}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Package className="h-3 w-3" style={{ color: colors.purple.light }} />
                <span className="text-[10px] uppercase tracking-wide" style={{ color: colors.text.tertiary }}>TA</span>
              </div>
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{priceDisplayTakeaway.formattedPrice}</span>
            </div>
            {/* Delivery */}
            <div className="w-20 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Truck className="h-3 w-3" style={{ color: colors.purple.light }} />
                <span className="text-[10px] uppercase tracking-wide" style={{ color: colors.text.tertiary }}>DE</span>
              </div>
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{priceDisplayDelivery.formattedPrice}</span>
            </div>
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
              className="h-8 w-8 p-0 transition-all duration-200"
              style={{ color: colors.purple.primary }}
              aria-label="Edit item"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleItemActive(item.id, !item.active)}
              className="h-8 w-8 p-0 transition-all duration-200"
              style={{ color: item.active ? colors.status.success : colors.text.tertiary }}
              aria-label={item.active ? 'Deactivate item' : 'Activate item'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteItem(item.id)}
              className="h-8 w-8 p-0 transition-all duration-200"
              style={{ color: colors.status.error }}
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Variants expansion */}
        {hasVariants && isVariantsExpanded && (
          <div className="ml-16 pl-4 space-y-2" style={{ borderLeft: `2px solid ${colors.border.accent}` }}>
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center gap-4 p-2 rounded"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                <div className="flex-1 text-sm" style={{ color: colors.text.secondary }}>
                  {getProteinName(variant.protein_type_id)}
                </div>
                {/* All 3 variant prices */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-16 text-center">
                    <span className="text-[10px] block" style={{ color: colors.text.tertiary }}>DI</span>
                    <span className="font-medium" style={{ color: colors.text.primary }}>£{getVariantPriceByMode(variant, 'DINE-IN').toFixed(2)}</span>
                  </div>
                  <div className="w-16 text-center px-2" style={{ borderLeft: `1px solid ${colors.border.accent}`, borderRight: `1px solid ${colors.border.accent}` }}>
                    <span className="text-[10px] block" style={{ color: colors.text.tertiary }}>TA</span>
                    <span className="font-medium" style={{ color: colors.text.primary }}>£{getVariantPriceByMode(variant, 'COLLECTION').toFixed(2)}</span>
                  </div>
                  <div className="w-16 text-center">
                    <span className="text-[10px] block" style={{ color: colors.text.tertiary }}>DE</span>
                    <span className="font-medium" style={{ color: colors.text.primary }}>£{getVariantPriceByMode(variant, 'DELIVERY').toFixed(2)}</span>
                  </div>
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
          <Card
            key={section.id}
            className="backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.6)',
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <CardHeader
              className="pb-3 cursor-pointer transition-colors rounded-t-lg"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSectionExpanded ? (
                    <ChevronDown className="h-5 w-5" style={{ color: colors.purple.primary }} />
                  ) : (
                    <ChevronRight className="h-5 w-5" style={{ color: colors.purple.primary }} />
                  )}
                  <h3 className="text-xl font-bold" style={{ color: colors.text.primary }}>
                    {section.icon ? `${section.icon} ` : ''}{section.displayName}
                  </h3>
                  <Badge
                    style={{
                      backgroundColor: 'rgba(124, 58, 237, 0.2)',
                      color: colors.purple.primary,
                      border: `1px solid ${colors.border.accent}`,
                    }}
                  >
                    {section.itemCount} {section.itemCount === 1 ? 'item' : 'items'}
                  </Badge>
                  {/* Draft count badge for section */}
                  {(() => {
                    const draftCount = countSectionDrafts(section);
                    return draftCount > 0 ? (
                      <Badge
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                          color: colors.status.warning,
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        {draftCount} {draftCount === 1 ? 'draft' : 'drafts'}
                      </Badge>
                    ) : null;
                  })()}
                </div>
              </div>
            </CardHeader>
            {isSectionExpanded && (
              <CardContent className="pt-0 space-y-4">
                {section.categories.length === 0 ? (
                  <div
                    className="p-6 text-center rounded-lg border border-dashed"
                    style={{
                      color: colors.text.tertiary,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderColor: colors.border.accent,
                    }}
                  >
                    No categories in this section
                  </div>
                ) : (
                  section.categories.map((cat) => {
                    const isCatExpanded = expandedCategories.has(cat.id);
                    const hasDirect = (cat.items?.length || 0) > 0;
                    const hasChildren = (cat.children?.length || 0) > 0;
                    return (
                      <Card
                        key={cat.id}
                        className="backdrop-blur-sm"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          border: `1px solid ${colors.border.light}`,
                        }}
                      >
                        <CardHeader
                          className="pb-2 cursor-pointer transition-colors rounded-t-lg"
                          onClick={() => toggleCategory(cat.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isCatExpanded ? (
                                <ChevronDown className="h-4 w-4" style={{ color: colors.purple.primary }} />
                              ) : (
                                <ChevronRight className="h-4 w-4" style={{ color: colors.purple.primary }} />
                              )}
                              <h4 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                                📂 {stripSectionPrefix(cat.name)}
                              </h4>
                              <Badge
                                className="text-sm"
                                style={{
                                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                                  color: colors.purple.primary,
                                  border: `1px solid ${colors.border.accent}`,
                                }}
                              >
                                {cat.itemCount} {cat.itemCount === 1 ? 'item' : 'items'}
                              </Badge>
                              {/* Draft count badge for category */}
                              {(() => {
                                const draftCount = countCategoryDrafts(cat);
                                return draftCount > 0 ? (
                                  <Badge
                                    className="text-sm"
                                    style={{
                                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                      color: colors.status.warning,
                                      border: '1px solid rgba(245, 158, 11, 0.2)',
                                    }}
                                  >
                                    {draftCount} {draftCount === 1 ? 'draft' : 'drafts'}
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </CardHeader>
                        {isCatExpanded && (
                          <CardContent className="pt-0 space-y-4">
                            {hasDirect && (
                              <div>
                                <div className="flex items-center gap-2 mb-3 pl-2">
                                  <div className="h-px flex-1" style={{ backgroundColor: colors.border.accent }}></div>
                                  <span className="text-sm" style={{ color: colors.text.tertiary }}>Items in {stripSectionPrefix(cat.name)}</span>
                                  <div className="h-px flex-1" style={{ backgroundColor: colors.border.accent }}></div>
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
                                        onRevert={onRevert}
                                        selectionMode={selectionMode}
                                        isSelected={selectedIds.has(item.id)}
                                        onSelectionToggle={onSelectionToggle}
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
                                    <Card
                                      key={sub.id}
                                      className="ml-6"
                                      style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                        border: `1px solid ${colors.border.light}`,
                                      }}
                                    >
                                      <CardHeader
                                        className="pb-2 cursor-pointer transition-colors rounded-t-lg"
                                        onClick={() => toggleCategory(sub.id)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            {isSubExpanded ? (
                                              <ChevronDown className="h-4 w-4" style={{ color: colors.purple.primary }} />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" style={{ color: colors.purple.primary }} />
                                            )}
                                            <h5 className="text-base font-semibold" style={{ color: colors.text.primary }}>
                                              📁 {stripSectionPrefix(sub.name)}
                                            </h5>
                                            <Badge
                                              className="text-xs"
                                              style={{
                                                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                                                color: colors.purple.primary,
                                                border: `1px solid ${colors.border.accent}`,
                                              }}
                                            >
                                              {sub.itemCount} {sub.itemCount === 1 ? 'item' : 'items'}
                                            </Badge>
                                            {/* Draft count badge for subcategory */}
                                            {(() => {
                                              const draftCount = countDrafts(sub.items || []);
                                              return draftCount > 0 ? (
                                                <Badge
                                                  className="text-xs"
                                                  style={{
                                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                    color: colors.status.warning,
                                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                                  }}
                                                >
                                                  {draftCount} {draftCount === 1 ? 'draft' : 'drafts'}
                                                </Badge>
                                              ) : null;
                                            })()}
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
                                                  onRevert={onRevert}
                                                  selectionMode={selectionMode}
                                                  isSelected={selectedIds.has(item.id)}
                                                  onSelectionToggle={onSelectionToggle}
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
