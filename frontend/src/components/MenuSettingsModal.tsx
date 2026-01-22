/**
 * MenuSettingsModal
 *
 * Modal for managing menu configuration settings:
 * - Categories Tab: Add/edit/delete/reorder categories
 * - Proteins Tab: Add/edit/delete proteins with price modifiers
 *
 * This replaces the separate Categories and Proteins tabs in the main navigation,
 * grouping rarely-changed configuration in one accessible modal.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FolderTree, Beef, X } from 'lucide-react';

// Import the existing tab components
import CategoriesTab from './CategoriesTab';
import ProteinsTab from './ProteinsTab';

// Import React Query hooks
import { useProteinTypes, menuKeys } from '../utils/menuQueries';
import { mapApiProteinToProteinType } from '../utils/masterTypes';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../utils/InternalDesignSystem';

export type SettingsTab = 'categories' | 'proteins';

interface MenuSettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler for closing the modal */
  onClose: () => void;
  /** Handler for when menu data changes (e.g., category added/deleted) */
  onMenuChange?: () => void;
  /** Initial tab to show */
  initialTab?: SettingsTab;
}

export const MenuSettingsModal: React.FC<MenuSettingsModalProps> = ({
  isOpen,
  onClose,
  onMenuChange,
  initialTab = 'categories',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const queryClient = useQueryClient();

  // Fetch proteins data for the Proteins tab
  const { data: rawProteins = [] } = useProteinTypes();

  // Handle menu change and propagate to parent
  const handleMenuChange = async () => {
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: menuKeys.all });

    // Call parent handler if provided
    onMenuChange?.();
  };

  // Handle protein refresh
  const handleRefreshProteins = async () => {
    await queryClient.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-3xl w-[95vw] max-h-[85vh] flex flex-col"
        style={{
          backgroundColor: colors.background.primary,
          border: `1px solid ${colors.border.accent}`,
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle
              className="text-xl font-bold"
              style={{ color: colors.text.primary }}
            >
              Menu Settings
            </DialogTitle>
          </div>
          <DialogDescription style={{ color: colors.text.secondary }}>
            Configure categories and protein types for your menu items.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as SettingsTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList
            className="grid w-full grid-cols-2 flex-shrink-0"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: `1px solid ${colors.border.accent}`,
            }}
          >
            <TabsTrigger
              value="categories"
              className="flex items-center gap-2 data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white transition-all duration-200"
              style={{ color: colors.text.secondary }}
            >
              <FolderTree className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger
              value="proteins"
              className="flex items-center gap-2 data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white transition-all duration-200"
              style={{ color: colors.text.secondary }}
            >
              <Beef className="h-4 w-4" />
              Proteins
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="categories" className="mt-0 h-full">
              <CategoriesTab onMenuChange={handleMenuChange} />
            </TabsContent>

            <TabsContent value="proteins" className="mt-0 h-full">
              <ProteinsTab
                proteins={rawProteins as unknown as Parameters<typeof ProteinsTab>[0]['proteins']}
                onRefreshProteins={handleRefreshProteins}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div
          className="flex-shrink-0 pt-4"
          style={{ borderTop: `1px solid ${colors.border.light}` }}
        >
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="text-white"
              style={{
                backgroundColor: colors.purple.primary,
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuSettingsModal;
