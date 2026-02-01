/**
 * Menu Components Index
 *
 * Exports all components for the Menu Setup Dashboard and related UI.
 */

// Dashboard
export { MenuSetupDashboard } from './MenuSetupDashboard';
export type { MenuSetupDashboardProps, SetupSection } from './MenuSetupDashboard';

// Building blocks
export { SetupRow } from './SetupRow';
export type { SetupRowProps, SetupRowCounts } from './SetupRow';

export { SetupSidePanel, EmptyStateGuide } from './SetupSidePanel';
export type { SetupSidePanelProps, EmptyStateGuideProps } from './SetupSidePanel';

// Tenant guidance
export { OnboardingTooltip, useOnboardingCompleted, resetOnboarding } from './OnboardingTooltip';
export type { OnboardingTooltipProps } from './OnboardingTooltip';

export { PrerequisiteWarning, useMenuItemsPrerequisites } from './PrerequisiteWarning';
export type { PrerequisiteWarningProps, Prerequisite } from './PrerequisiteWarning';

// Side panel wrappers
export { SetMealsSidePanel } from './SetMealsSidePanel';
export type { SetMealsSidePanelProps } from './SetMealsSidePanel';

export { CustomizationsSidePanel } from './CustomizationsSidePanel';
export type { CustomizationsSidePanelProps } from './CustomizationsSidePanel';

// Landing page (combines dashboard with navigation)
export { MenuManagementLanding } from './MenuManagementLanding';
export type { MenuManagementLandingProps, MenuView } from './MenuManagementLanding';
