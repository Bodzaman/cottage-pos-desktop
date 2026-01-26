import React from 'react';
import { LayoutDashboard, User, MapPin, ClipboardList, Heart } from 'lucide-react';
import { cn } from 'utils/cn';

type CustomerSection = 'dashboard' | 'profile' | 'addresses' | 'orders' | 'favorites';

interface PortalNavigationProps {
  activeSection: CustomerSection;
  onSectionChange: (section: CustomerSection) => void;
}

const sections = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'addresses' as const, label: 'Addresses', icon: MapPin },
  { id: 'orders' as const, label: 'Orders', icon: ClipboardList },
  { id: 'favorites' as const, label: 'Favorites', icon: Heart },
];

/**
 * PortalNavigation - Desktop sticky tab navigation for Customer Portal
 * Premium pill-style tabs with icons and burgundy active state
 * Hidden on mobile (< 768px), shows PortalBottomNav instead
 */
export function PortalNavigation({ activeSection, onSectionChange }: PortalNavigationProps) {
  return (
    <nav
      className="sticky top-20 z-40 backdrop-blur-xl hidden md:block border-b border-white/5"
      style={{ background: 'rgba(10, 10, 10, 0.85)' }}
    >
      <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-center py-3 gap-2 overflow-x-auto scrollbar-hide">
          {sections.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={cn(
                  // Base styles - prevent jitter with consistent box model
                  'relative flex items-center gap-2 px-5 py-2.5 rounded-full',
                  'text-sm font-medium whitespace-nowrap',
                  'transition-all duration-200 ease-out',
                  'border', // Always have border for consistency
                  // Active state
                  isActive
                    ? 'bg-[#8B1538] text-white border-[#8B1538] shadow-[0_0_16px_rgba(139,21,56,0.4)]'
                    : 'bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10 hover:border-white/10'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default PortalNavigation;
