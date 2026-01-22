/**
 * MenuManagementSidebar
 *
 * Persistent sidebar navigation for Menu Management.
 * Replaces the horizontal 5-tab navigation with a cleaner sidebar design.
 *
 * Sections:
 * - Menu Items (with count + draft badge)
 * - Set Meals (with count)
 * - Add-ons (with count)
 * - Settings (opens modal for Categories & Proteins)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Utensils,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { colors } from '../utils/InternalDesignSystem';

export type MenuSection = 'items' | 'set-meals' | 'addons';

interface MenuManagementSidebarProps {
  /** Currently active section */
  activeSection: MenuSection;
  /** Handler for section change */
  onSectionChange: (section: MenuSection) => void;
  /** Handler for opening settings modal */
  onOpenSettings: () => void;
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Handler for toggling collapsed state */
  onToggleCollapsed: () => void;
  /** Counts for each section */
  counts: {
    items: number;
    itemDrafts: number;
    setMeals: number;
    addons: number;
  };
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  draftCount?: number;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  count,
  draftCount,
  isActive,
  isCollapsed,
  onClick,
}) => {
  // Build accessible label
  const accessibleLabel = [
    label,
    count !== undefined ? `${count} items` : '',
    draftCount && draftCount > 0 ? `${draftCount} drafts` : '',
  ].filter(Boolean).join(', ');

  return (
    <button
      onClick={onClick}
      aria-label={isCollapsed ? accessibleLabel : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        'hover:bg-[rgba(124,58,237,0.1)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isCollapsed && 'justify-center px-2'
      )}
      style={{
        backgroundColor: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
        border: isActive ? `1px solid ${colors.border.accent}` : '1px solid transparent',
      }}
    >
      <div
        className="flex-shrink-0"
        style={{ color: isActive ? colors.purple.primary : colors.text.secondary }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {!isCollapsed && (
        <>
          <span
            className="flex-1 text-left text-sm font-medium"
            style={{ color: isActive ? colors.text.primary : colors.text.secondary }}
          >
            {label}
          </span>

          <div className="flex items-center gap-1.5">
            {count !== undefined && (
              <span
                className="text-xs"
                style={{ color: colors.text.tertiary }}
                aria-label={`${count} items`}
              >
                {count}
              </span>
            )}
            {draftCount !== undefined && draftCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0"
                style={{
                  backgroundColor: `${colors.status.warning}20`,
                  color: colors.status.warning,
                  border: `1px solid ${colors.status.warning}30`,
                }}
                aria-label={`${draftCount} drafts`}
              >
                {draftCount}
              </Badge>
            )}
          </div>
        </>
      )}

      {isCollapsed && draftCount !== undefined && draftCount > 0 && (
        <Badge
          variant="secondary"
          className="absolute -top-1 -right-1 text-xs w-4 h-4 p-0 flex items-center justify-center"
          style={{
            backgroundColor: `${colors.status.warning}20`,
            color: colors.status.warning,
            border: `1px solid ${colors.status.warning}30`,
          }}
          aria-hidden="true"
        >
          {draftCount > 9 ? '9+' : draftCount}
        </Badge>
      )}
    </button>
  );
};

export const MenuManagementSidebar: React.FC<MenuManagementSidebarProps> = ({
  activeSection,
  onSectionChange,
  onOpenSettings,
  isCollapsed,
  onToggleCollapsed,
  counts,
}) => {
  return (
    <aside
      className={cn(
        'flex flex-col transition-all duration-300 rounded-lg shadow-lg sticky top-6',
        isCollapsed ? 'w-16' : 'w-56'
      )}
      style={{
        maxHeight: 'calc(100vh - 3rem)',
        backgroundColor: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${colors.border.light}`,
      }}
      aria-label="Menu Management Navigation"
    >
      {/* Section Header */}
      <div
        className={cn('px-3 py-4 backdrop-blur-md shadow-sm sticky top-0 z-10', isCollapsed && 'px-2')}
        style={{
          borderBottom: `1px solid ${colors.border.light}`,
          backgroundColor: 'rgba(26, 26, 26, 0.8)',
        }}
      >
        {!isCollapsed && (
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: colors.text.tertiary }}
          >
            Menu
          </span>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-2" aria-label="Menu sections">
        <NavItem
          icon={<Utensils className="h-5 w-5" />}
          label="Items"
          count={counts.items}
          draftCount={counts.itemDrafts}
          isActive={activeSection === 'items'}
          isCollapsed={isCollapsed}
          onClick={() => onSectionChange('items')}
        />

        <NavItem
          icon={<Package className="h-5 w-5" />}
          label="Set Meals"
          count={counts.setMeals}
          isActive={activeSection === 'set-meals'}
          isCollapsed={isCollapsed}
          onClick={() => onSectionChange('set-meals')}
        />

        <NavItem
          icon={<Layers className="h-5 w-5" />}
          label="Add-ons"
          count={counts.addons}
          isActive={activeSection === 'addons'}
          isCollapsed={isCollapsed}
          onClick={() => onSectionChange('addons')}
        />
      </nav>

      {/* Divider */}
      <div className="mx-3" style={{ borderTop: `1px solid ${colors.border.light}` }} />

      {/* Settings */}
      <div className="p-2">
        <NavItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          isActive={false}
          isCollapsed={isCollapsed}
          onClick={onOpenSettings}
        />
      </div>

      {/* Collapse Toggle */}
      <div
        className="p-2 backdrop-blur-sm"
        style={{
          borderTop: `1px solid ${colors.border.light}`,
          backgroundColor: 'rgba(26, 26, 26, 0.3)',
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className={cn(
            'w-full hover:bg-[rgba(124,58,237,0.1)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            isCollapsed && 'px-0 justify-center'
          )}
          style={{ color: colors.text.secondary }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
};

export default MenuManagementSidebar;
