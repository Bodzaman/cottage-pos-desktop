import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Save, Edit, Trash2, AlertCircle, RefreshCw, Grid, ChevronDown, ChevronRight, Menu, Search, Utensils, Expand, Minimize2, Folder, FolderOpen, LayoutGrid, List } from 'lucide-react';
import { apiClient } from 'app';
import { useMenuData } from '../utils/menuCache';
import CompactMenuItemCard from './CompactMenuItemCard';
import { colors } from '../utils/designSystem';

// Types - Using runtime types from menuTypes
import type { Category, MenuItem } from '../utils/menuTypes';
import { FIXED_SECTIONS, mapCategoryToSection } from 'utils/sectionMapping';
import ItemsSectionView, { GroupedSection } from './ItemsSectionView';

// Extended category interface with hierarchy support
interface ExtendedMenuCategory extends Category {
  children?: ExtendedMenuCategory[];
  items?: MenuItem[];
  item_count?: number;
}

interface MenuItemsTabProps {
  // Data props
  categories: Category[];
  menuItems: MenuItem[];
  loading: boolean;
  
  // State props for search and expand
  menuSearchQuery: string;
  setMenuSearchQuery: (query: string) => void;
  expandedCategories: Set<string>;
  setExpandedCategories: (categories: Set<string>) => void;
  expandedSections: Set<string>;
  setExpandedSections: (sections: Set<string>) => void;
  
  // Action props
  onCreateItem: () => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItemActive: (itemId: string, active: boolean) => void;
  onRefresh: () => void;
}

const MenuItemsTab: React.FC<MenuItemsTabProps> = ({
  categories,
  menuItems,
  loading,
  menuSearchQuery,
  setMenuSearchQuery,
  expandedCategories,
  setExpandedCategories,
  expandedSections,
  setExpandedSections,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onToggleItemActive,
  onRefresh
}) => {
  // Defensive: ensure menuItems is an array
  const safeMenuItems: MenuItem[] = Array.isArray(menuItems) ? menuItems : [];
  if (!Array.isArray(menuItems)) {
    console.warn('MenuItemsTab: menuItems was not an array. Falling back to empty list.');
  }

  // View mode state: 'card' or 'list'
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Helpers for compatibility across shapes
  const isActiveItem = (item: any): boolean => {
    return (item?.active ?? item?.is_active ?? true) === true;
  };
  const isActiveCategory = (cat: any): boolean => {
    return (cat?.active ?? cat?.is_active ?? true) === true;
  };
  const getOrder = (obj: any): number => {
    const ord = obj?.menu_order ?? obj?.display_order;
    return typeof ord === 'number' ? ord : 0;
  };

  // Build grouped structure: Section → Categories → Items
  const buildSections = (): { sections: GroupedSection[]; allCategoryIds: string[] } => {
    const activeCategories = (Array.isArray(categories) ? categories : []).filter((c) => isActiveCategory(c));

    // Lookup maps
    const catById = new Map<string, any>();
    activeCategories.forEach((c: any) => catById.set(c.id, c));

    // Determine section for each category
    const categorySection = new Map<string, string>(); // catId -> sectionId

    // Pass 1: top-level and new-format mapping
    activeCategories.forEach((cat: any) => {
      const parent = cat.parent_category_id;
      if (typeof parent === 'string' && parent.startsWith('section-')) {
        categorySection.set(cat.id, parent.replace('section-', ''));
      } else if (parent == null) {
        const sectionId = mapCategoryToSection({ name: cat.name, code_prefix: (cat as any)?.code_prefix || null });
        categorySection.set(cat.id, sectionId);
      }
    });

    // Pass 2: children inherit parent's section
    activeCategories.forEach((cat: any) => {
      if (cat.parent_category_id && !String(cat.parent_category_id).startsWith('section-')) {
        const parentSection = categorySection.get(cat.parent_category_id);
        if (parentSection) categorySection.set(cat.id, parentSection);
      }
    });

    // Filter and sort items by search query only (show ALL items in Admin)
    const q = menuSearchQuery?.toLowerCase() || '';
    const filteredItems = safeMenuItems
      .filter((it: any) => {
        if (!q) return true;
        const desc = it?.menu_item_description || it?.description || '';
        return it?.name?.toLowerCase?.().includes(q) || desc?.toLowerCase?.().includes(q);
      });

    // Prepare sections always in fixed order
    const sections: GroupedSection[] = FIXED_SECTIONS.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      icon: s.icon,
      itemCount: 0,
      categories: [],
    }));

    // Helper to get or create section entry
    const sectionIndexById = new Map<string, number>();
    sections.forEach((s, idx) => sectionIndexById.set(s.id, idx));

    // Determine top-level categories per section
    const topLevelCatsBySection = new Map<string, any[]>();
    FIXED_SECTIONS.forEach((s) => topLevelCatsBySection.set(s.id, []));

    activeCategories.forEach((cat: any) => {
      const secId = categorySection.get(cat.id);
      if (!secId) return;
      const parent = cat.parent_category_id;
      const isTopLevel = !parent || (typeof parent === 'string' && parent.startsWith('section-'));
      if (isTopLevel) {
        topLevelCatsBySection.get(secId)!.push(cat);
      }
    });

    // Sort top-level categories within each section
    topLevelCatsBySection.forEach((arr, secId) => {
      arr.sort((a: any, b: any) => {
        const ao = getOrder(a);
        const bo = getOrder(b);
        if (ao === bo) return (a?.name || '').localeCompare(b?.name || '');
        return ao - bo;
      });
    });

    // Build categories with items
    const allCategoryIds: string[] = [];

    sections.forEach((section) => {
      const topCats = topLevelCatsBySection.get(section.id) || [];

      const groupedCats = topCats.map((parentCat: any) => {
        // Direct items under parent
        const directItems = filteredItems
          .filter((it: any) => it.category_id === parentCat.id)
          .sort((a: any, b: any) => getOrder(a) - getOrder(b));

        // Children categories
        const childCats = activeCategories
          .filter((c: any) => c.parent_category_id === parentCat.id)
          .sort((a: any, b: any) => {
            const ao = getOrder(a);
            const bo = getOrder(b);
            if (ao === bo) return (a?.name || '').localeCompare(b?.name || '');
            return ao - bo;
          })
          .map((child: any) => {
            const childItems = filteredItems
              .filter((it: any) => it.category_id === child.id)
              .sort((a: any, b: any) => getOrder(a) - getOrder(b));
            return {
              id: child.id,
              name: child.name,
              itemCount: childItems.length,
              items: childItems,
            };
          })
          .filter((c: any) => c.itemCount > 0);

        const itemCount = directItems.length + childCats.reduce((sum: number, c: any) => sum + c.itemCount, 0);
        return {
          id: parentCat.id,
          name: parentCat.name,
          itemCount,
          items: directItems,
          children: childCats,
        };
      }).filter((gc: any) => gc.itemCount > 0);

      section.categories = groupedCats;
      section.itemCount = groupedCats.reduce((sum, c) => sum + c.itemCount, 0);

      // Track category IDs for expand-all
      groupedCats.forEach((gc: any) => {
        allCategoryIds.push(gc.id);
        gc.children?.forEach((sub: any) => allCategoryIds.push(sub.id));
      });
    });

    return { sections, allCategoryIds };
  };

  const { sections: groupedSections, allCategoryIds } = buildSections();

  // Expand All should toggle both sections and categories
  const handleExpandAll = () => {
    const allSectionIds = new Set(FIXED_SECTIONS.map((s) => s.id));
    const allCategoryIdSet = new Set(allCategoryIds);

    const allSectionsExpanded = [...allSectionIds].every((id) => expandedSections.has(id));
    const allCategoriesExpanded = [...allCategoryIdSet].every((id) => expandedCategories.has(id));

    if (allSectionsExpanded && allCategoriesExpanded) {
      setExpandedSections(new Set());
      setExpandedCategories(new Set());
    } else {
      setExpandedSections(allSectionIds);
      setExpandedCategories(allCategoryIdSet);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with search and controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Menu Management</h2>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1 border border-[rgba(124,93,250,0.3)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('card')}
                className={`h-8 px-3 transition-all ${
                  viewMode === 'card'
                    ? 'bg-[#7C5DFA] text-white hover:bg-[#6B4CE6]'
                    : 'text-gray-400 hover:text-white hover:bg-black/20'
                }`}
                aria-label="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 px-3 transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#7C5DFA] text-white hover:bg-[#6B4CE6]'
                    : 'text-gray-400 hover:text-white hover:bg-black/20'
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              className="border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.1)] text-white"
            >
              {(expandedSections.size > 0 || expandedCategories.size > 0) ? (
                <><Minimize2 className="h-4 w-4 mr-2" />Collapse All</>
              ) : (
                <><Expand className="h-4 w-4 mr-2" />Expand All</>
              )}
            </Button>
            <Button 
              onClick={onCreateItem}
              className="bg-[#7C5DFA] hover:bg-[#6B4CE6] text-white font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search menu items..."
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
            className="pl-10 bg-black/30 border-tandoor-platinum/20 text-white placeholder:text-gray-400 focus:border-[#7C5DFA]"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.brand.purple }} />
          <p style={{ color: colors.text.secondary }}>Loading menu items...</p>
        </div>
      ) : safeMenuItems.length === 0 ? (
        <Card className="bg-black/30 backdrop-blur-sm border-tandoor-platinum/20">
          <CardContent className="p-8 text-center">
            <Utensils className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.secondary }} />
            <h4 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
              No Menu Items
            </h4>
            <p className="mb-4" style={{ color: colors.text.secondary }}>
              Start building your menu by adding your first item.
            </p>
            <Button 
              onClick={onCreateItem}
              className="bg-[#7C5DFA] hover:bg-[#6B4CE6] text-white"
            >
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ItemsSectionView
          sections={groupedSections}
          expandedSections={expandedSections}
          setExpandedSections={setExpandedSections}
          expandedCategories={expandedCategories}
          setExpandedCategories={setExpandedCategories}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onToggleItemActive={onToggleItemActive}
          viewMode={viewMode}
        />
      )}
    </div>
  );
};

export default MenuItemsTab;
