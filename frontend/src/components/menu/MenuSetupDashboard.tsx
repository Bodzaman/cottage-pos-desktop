/**
 * MenuSetupDashboard Component
 *
 * Landing page for Menu Management that guides users through setup
 * in the natural order: Categories → Proteins → Menu Items → Set Meals → Customizations
 *
 * Features:
 * - 5-row dashboard with status indicators and counts
 * - Side panel navigation (max 2 levels)
 * - First-time setup guidance
 * - Prerequisite warnings (e.g., need categories before menu items)
 * - Live counts from useMenuSetupCounts hook
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MENU SETUP                                                    Settings │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  FOUNDATIONS                                                            │
 * │  ───────────────────────────────────────────────────────────────────── │
 * │  1. Categories       [5 active]  ✓    [+ Add]  [Manage →]              │
 * │  2. Proteins         [8 active]  ✓    [+ Add]  [Manage →]              │
 * │                                                                         │
 * │  MENU CONTENT                                                           │
 * │  ───────────────────────────────────────────────────────────────────── │
 * │  3. Menu Items       [47 items · 3 drafts]  ✓  [+ Add]  [Manage →]     │
 * │  4. Set Meals        [3 meals]  ✓             [+ Add]  [Manage →]      │
 * │  5. Customizations   [23 active]  ✓           [+ Add]  [Manage →]      │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, FolderTree, Beef, Utensils, Package, Sparkles } from 'lucide-react';
import { useMenuSetupCounts } from '../../hooks/useMenuSetupCounts';
import { SetupRow } from './SetupRow';
import { SetupSidePanel, EmptyStateGuide } from './SetupSidePanel';

// Import existing tab components for side panels
import CategoriesTab from '../CategoriesTab';
import ProteinsTab from '../ProteinsTab';
import { useProteinTypes, menuKeys } from '../../utils/menuQueries';
import { useQueryClient } from '@tanstack/react-query';

export type SetupSection = 'categories' | 'proteins' | 'items' | 'setMeals' | 'customizations' | null;

export interface MenuSetupDashboardProps {
  /** Callback when user wants to add a new menu item */
  onAddMenuItem?: () => void;
  /** Callback when user wants to manage menu items (navigate to items list) */
  onManageMenuItems?: () => void;
  /** Callback when user wants to add a new set meal */
  onAddSetMeal?: () => void;
  /** Callback when user wants to manage set meals */
  onManageSetMeals?: () => void;
  /** Callback when user wants to add a new customization */
  onAddCustomization?: () => void;
  /** Callback when user wants to manage customizations */
  onManageCustomizations?: () => void;
}

export function MenuSetupDashboard({
  onAddMenuItem,
  onManageMenuItems,
  onAddSetMeal,
  onManageSetMeals,
  onAddCustomization,
  onManageCustomizations
}: MenuSetupDashboardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const counts = useMenuSetupCounts();

  // Active side panel
  const [activePanel, setActivePanel] = useState<SetupSection>(null);

  // Fetch proteins for ProteinsTab (ProteinsTab expects its own format)
  const { data: rawProteins = [] } = useProteinTypes();
  // ProteinsTab expects: { id, name, description?, created_at, updated_at }
  const proteins = rawProteins.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    created_at: p.created_at,
    updated_at: p.updated_at
  }));

  // Handle menu data changes
  const handleMenuChange = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: menuKeys.all });
    await queryClient.invalidateQueries({ queryKey: ['menu-setup-counts'] });
  }, [queryClient]);

  // Handle protein refresh
  const handleRefreshProteins = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
  }, [queryClient]);

  // Check prerequisites for menu items
  const hasCategories = counts.categories.total > 0;
  const menuItemsBlocked = !hasCategories;

  // Panel handlers
  const openPanel = (section: SetupSection) => setActivePanel(section);
  const closePanel = () => setActivePanel(null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Setup</h1>
          <p className="text-sm text-muted-foreground">
            Configure your menu foundations and content
          </p>
        </div>
      </div>

      {/* Foundations Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
            Foundations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 1. Categories */}
          <SetupRow
            number={1}
            title="Categories"
            description="Organize your menu into sections (Starters, Mains, etc.)"
            counts={counts.categories}
            isLoading={counts.isLoading}
            onAdd={() => openPanel('categories')}
            onManage={() => openPanel('categories')}
          />

          {/* 2. Proteins */}
          <SetupRow
            number={2}
            title="Proteins"
            description="Meat options like Chicken, Lamb, Prawn for variant dishes"
            counts={counts.proteins}
            isLoading={counts.isLoading}
            onAdd={() => openPanel('proteins')}
            onManage={() => openPanel('proteins')}
          />
        </CardContent>
      </Card>

      {/* Menu Content Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
            Menu Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 3. Menu Items */}
          <SetupRow
            number={3}
            title="Menu Items"
            description="Add your dishes with pricing and options"
            counts={counts.menuItems}
            isLoading={counts.isLoading}
            isBlocked={menuItemsBlocked}
            blockedMessage="Add at least one category before creating menu items"
            onAdd={() => {
              if (onAddMenuItem) onAddMenuItem();
              else navigate('/admin-menu');
            }}
            onManage={() => {
              if (onManageMenuItems) onManageMenuItems();
              else navigate('/admin-menu');
            }}
          />

          {/* 4. Set Meals */}
          <SetupRow
            number={4}
            title="Set Meals"
            description="Bundle menu items into meal deals with savings"
            counts={counts.setMeals}
            isLoading={counts.isLoading}
            onAdd={() => {
              if (onAddSetMeal) onAddSetMeal();
              else navigate('/admin-menu?section=set-meals');
            }}
            onManage={() => {
              if (onManageSetMeals) onManageSetMeals();
              else navigate('/admin-menu?section=set-meals');
            }}
          />

          {/* 5. Customizations */}
          <SetupRow
            number={5}
            title="Add-ons & Instructions"
            description="Extra options like spice levels, dietary preferences"
            counts={counts.customizations}
            isLoading={counts.isLoading}
            onAdd={() => {
              if (onAddCustomization) onAddCustomization();
              else navigate('/admin-menu?section=addons');
            }}
            onManage={() => {
              if (onManageCustomizations) onManageCustomizations();
              else navigate('/admin-menu?section=addons');
            }}
          />
        </CardContent>
      </Card>

      {/* Categories Side Panel */}
      <SetupSidePanel
        isOpen={activePanel === 'categories'}
        onClose={closePanel}
        title="Categories"
        description="Create and organize your menu sections"
        addButtonText="New Category"
        onAdd={() => {/* CategoriesTab handles its own add */}}
        widthClass="sm:max-w-2xl"
      >
        {counts.categories.total === 0 ? (
          <EmptyStateGuide
            icon={<FolderTree className="w-6 h-6 text-muted-foreground" />}
            title="Start by creating your menu categories"
            description="Categories organize your menu (e.g., Starters, Main Courses, Tandoori). You'll need at least one before adding menu items."
            actionText="Create Your First Category"
            onAction={() => {/* Let CategoriesTab handle it */}}
          />
        ) : null}
        <CategoriesTab
          onMenuChange={handleMenuChange}
        />
      </SetupSidePanel>

      {/* Proteins Side Panel */}
      <SetupSidePanel
        isOpen={activePanel === 'proteins'}
        onClose={closePanel}
        title="Proteins"
        description="Set up meat and protein options for variant dishes"
        addButtonText="New Protein"
        onAdd={() => {/* ProteinsTab handles its own add */}}
        widthClass="sm:max-w-2xl"
      >
        {counts.proteins.total === 0 ? (
          <EmptyStateGuide
            icon={<Beef className="w-6 h-6 text-muted-foreground" />}
            title="Add protein types for variant dishes"
            description="Proteins like Chicken, Lamb, and Prawn allow customers to choose their preferred option for dishes that come with multiple variants."
            actionText="Create Your First Protein"
            onAction={() => {/* Let ProteinsTab handle it */}}
          />
        ) : null}
        <ProteinsTab
          proteins={proteins}
          onRefreshProteins={handleRefreshProteins}
        />
      </SetupSidePanel>
    </div>
  );
}

export default MenuSetupDashboard;
