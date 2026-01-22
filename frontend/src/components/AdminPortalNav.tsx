
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { colors } from '../utils/designSystem';
import {
  LayoutDashboard,
  Utensils,
  Image,
  Users,
  Settings,
  ShoppingCart,
  Bot,
  Cog
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPortalNavProps {
  activePage?: string;
}

// MenuItem component for navigation
interface MenuItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive: linkActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
          isActive || linkActive 
            ? `text-white font-medium bg-[#7C5DFA]/10` 
            : `text-[#BBC3E1] hover:text-white`
        }`
      }
    >
      {React.cloneElement(icon as React.ReactElement, { 
        style: { color: isActive ? colors.brand.purple : colors.text.secondary } 
      })}
      <span>{label}</span>
    </NavLink>
  );
};

export function AdminPortalNav({ activePage }: AdminPortalNavProps) {
  const { isAdmin } = useSimpleAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Admin Portal</h2>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Restaurant Management
        </p>
      </div>
      
      {/* Clean 5-Section Navigation - Priority Order */}
      <div className="space-y-2 flex-grow">
        <MenuItem
          to="/admin-portal?section=dashboard"
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
        />
        <MenuItem
          to="/admin-portal?section=menu"
          icon={<Utensils className="h-5 w-5" />}
          label="Menu Management"
        />
        <MenuItem
          to="/admin-portal?section=ai-staff"
          icon={<Bot className="h-5 w-5" />}
          label="AI Staff Members"
        />
        <MenuItem
          to="/media-library"
          icon={<Image className="h-5 w-5" />}
          label="Media Library"
        />
        <MenuItem
          to="/admin-portal?section=customers"
          icon={<Users className="h-5 w-5" />}
          label="Customers"
        />
        <MenuItem
          to="/admin-settings"
          icon={<Cog className="h-5 w-5" />}
          label="Settings"
        />
      </div>
      

    </div>
  );
}
