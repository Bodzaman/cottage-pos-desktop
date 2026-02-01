/**
 * MenuManagementLanding Component
 *
 * Landing page for Menu Management module that shows the Setup Dashboard.
 * Users can navigate to detailed management views from here.
 *
 * Flow:
 * 1. User lands on MenuSetupDashboard (5-row overview)
 * 2. Categories/Proteins open as side panels (inline)
 * 3. Menu Items/Set Meals/Customizations navigate to detailed view
 *
 * This replaces the direct rendering of AdminPortalMenuContent,
 * providing a setup-first experience for new tenants.
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MenuSetupDashboard } from './MenuSetupDashboard';
import { OnboardingTooltip } from './OnboardingTooltip';
import AdminPortalMenuContent from '../AdminPortalMenuContent';

export type MenuView = 'dashboard' | 'items' | 'set-meals' | 'addons';

export interface MenuManagementLandingProps {
  /** Initial view to show */
  initialView?: MenuView;
  /** Initial section within AdminPortalMenuContent */
  initialSection?: 'items' | 'set-meals' | 'addons';
}

export function MenuManagementLanding({
  initialView = 'dashboard',
  initialSection
}: MenuManagementLandingProps) {
  const [currentView, setCurrentView] = useState<MenuView>(initialView);

  // Navigation handlers
  const handleAddMenuItem = useCallback(() => {
    setCurrentView('items');
    // TODO: Trigger add item dialog after navigation
  }, []);

  const handleManageMenuItems = useCallback(() => {
    setCurrentView('items');
  }, []);

  const handleAddSetMeal = useCallback(() => {
    setCurrentView('set-meals');
    // TODO: Trigger add set meal dialog after navigation
  }, []);

  const handleManageSetMeals = useCallback(() => {
    setCurrentView('set-meals');
  }, []);

  const handleAddCustomization = useCallback(() => {
    setCurrentView('addons');
  }, []);

  const handleManageCustomizations = useCallback(() => {
    setCurrentView('addons');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setCurrentView('dashboard');
  }, []);

  // If viewing dashboard, show MenuSetupDashboard
  if (currentView === 'dashboard') {
    return (
      <div className="h-full">
        <OnboardingTooltip />
        <MenuSetupDashboard
          onAddMenuItem={handleAddMenuItem}
          onManageMenuItems={handleManageMenuItems}
          onAddSetMeal={handleAddSetMeal}
          onManageSetMeals={handleManageSetMeals}
          onAddCustomization={handleAddCustomization}
          onManageCustomizations={handleManageCustomizations}
        />
      </div>
    );
  }

  // For detailed views, show AdminPortalMenuContent with back button
  return (
    <div className="h-full flex flex-col">
      {/* Back to Dashboard Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToDashboard}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu Setup
        </Button>
      </div>

      {/* AdminPortalMenuContent takes over */}
      <div className="flex-1 overflow-auto">
        <AdminPortalMenuContent />
      </div>
    </div>
  );
}

export default MenuManagementLanding;
