/**
 * CustomizationsSidePanel Component
 *
 * Wrapper that renders CustomizationsTab inside a SetupSidePanel.
 * Used in the Menu Setup Dashboard for managing add-ons and instructions.
 *
 * Following the plan's "hybrid approach":
 * - Preserves existing CRUD logic from CustomizationsTab
 * - Modernizes container UI to match Setup Dashboard pattern
 */

import React from 'react';
import { SetupSidePanel, EmptyStateGuide } from './SetupSidePanel';
import CustomizationsTab from '../CustomizationsTab';
import { Sparkles } from 'lucide-react';

export interface CustomizationsSidePanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Handler for closing the panel */
  onClose: () => void;
  /** Number of existing customizations (for empty state) */
  customizationCount?: number;
}

export function CustomizationsSidePanel({
  isOpen,
  onClose,
  customizationCount = 0
}: CustomizationsSidePanelProps) {
  return (
    <SetupSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Add-ons & Instructions"
      description="Extra options customers can add to their orders"
      widthClass="sm:max-w-4xl"
    >
      {customizationCount === 0 ? (
        <EmptyStateGuide
          icon={<Sparkles className="w-6 h-6 text-muted-foreground" />}
          title="Create your first add-on"
          description="Add-ons like extra toppings, spice levels, or special instructions let customers personalize their orders."
          actionText="Create Add-on"
          onAction={() => {/* CustomizationsTab has its own create form */}}
        />
      ) : null}
      <CustomizationsTab />
    </SetupSidePanel>
  );
}

export default CustomizationsSidePanel;
