/**
 * SetMealsSidePanel Component
 *
 * Wrapper that renders SetMealsManagement inside a SetupSidePanel.
 * Used in the Menu Setup Dashboard for managing set meals.
 *
 * Following the plan's "hybrid approach":
 * - Preserves existing CRUD logic from SetMealsManagement
 * - Modernizes container UI to match Setup Dashboard pattern
 */

import React from 'react';
import { SetupSidePanel, EmptyStateGuide } from './SetupSidePanel';
import SetMealsManagement from '../SetMealsManagement';
import { Package } from 'lucide-react';

export interface SetMealsSidePanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Handler for closing the panel */
  onClose: () => void;
  /** Number of existing set meals (for empty state) */
  setMealCount?: number;
}

export function SetMealsSidePanel({
  isOpen,
  onClose,
  setMealCount = 0
}: SetMealsSidePanelProps) {
  return (
    <SetupSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Set Meals"
      description="Create meal deals by bundling menu items together"
      widthClass="sm:max-w-3xl"
    >
      {setMealCount === 0 ? (
        <EmptyStateGuide
          icon={<Package className="w-6 h-6 text-muted-foreground" />}
          title="Create your first set meal"
          description="Set meals bundle multiple menu items into a deal. Customers love meal deals that offer savings on popular combinations."
          actionText="Create Set Meal"
          onAction={() => {/* SetMealsManagement has its own create button */}}
        />
      ) : null}
      <SetMealsManagement />
    </SetupSidePanel>
  );
}

export default SetMealsSidePanel;
