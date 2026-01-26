import React from 'react';
import { LayoutDashboard, User, MapPin, ClipboardList, Heart } from 'lucide-react';
import { cn } from 'utils/cn';

type CustomerSection = 'dashboard' | 'profile' | 'addresses' | 'orders' | 'favorites';

interface PortalBottomNavProps {
  activeSection: CustomerSection;
  onSectionChange: (section: CustomerSection) => void;
}

const sections = [
  { id: 'dashboard' as const, label: 'Home', icon: LayoutDashboard },
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'addresses' as const, label: 'Address', icon: MapPin },
  { id: 'orders' as const, label: 'Orders', icon: ClipboardList },
  { id: 'favorites' as const, label: 'Favorites', icon: Heart },
];

/**
 * PortalBottomNav - Mobile bottom navigation bar for Customer Portal
 * Fixed at bottom of screen, only visible on mobile (< 768px)
 * Premium styling with burgundy active state and iOS safe-area support
 */
export function PortalBottomNav({ activeSection, onSectionChange }: PortalBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden backdrop-blur-xl border-t border-white/10"
      style={{
        background: 'rgba(15, 15, 15, 0.95)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch justify-around py-2 px-1">
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className="flex flex-col items-center gap-1 py-1.5 px-2 min-w-0 flex-1"
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={cn(
                  'p-2.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-[#8B1538] text-white shadow-[0_0_12px_rgba(139,21,56,0.5)]'
                    : 'bg-transparent text-gray-500'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'text-[10px] truncate max-w-full transition-colors duration-200',
                  isActive ? 'text-white font-medium' : 'text-gray-500'
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default PortalBottomNav;
