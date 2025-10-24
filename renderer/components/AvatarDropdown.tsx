import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AvatarDropdownProps {
  email: string;
  role: string | null;
  profileImageUrl: string | null;
  onLogout: () => void;
  onAdminClick?: () => void; // NEW: Callback for Admin option
  trigger?: React.ReactNode; // NEW: Custom trigger element
  className?: string;
}

/**
 * Professional SaaS-style dropdown menu
 * Can be triggered by any custom button (e.g., Admin button in header)
 */
export function AvatarDropdown({ 
  email, 
  role, 
  profileImageUrl, 
  onLogout,
  onAdminClick,
  trigger,
  className = '' 
}: AvatarDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Get user initials from email
  const getInitials = (email: string): string => {
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(email);
  const isAdmin = role?.toLowerCase() === 'admin';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-2"
        style={{
          backgroundColor: '#1A1A1A',
          borderColor: 'rgba(124, 93, 250, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* User Info Header */}
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            {/* Profile Image */}
            <div 
              className="flex-shrink-0 rounded-full overflow-hidden ring-2 ring-purple-500/30"
              style={{ width: '48px', height: '48px' }}
            >
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-lg font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #5B21B6 0%, #7C5DFA 100%)',
                    color: '#FFFFFF'
                  }}
                >
                  {getInitials(email)}
                </div>
              )}
            </div>
            
            {/* Email & Role */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {email}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {role || 'User'}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {/* Menu Items */}
        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false);
            navigate('/customer-portal');
          }}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors"
          style={{
            color: '#E5E5E5'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(124, 93, 250, 0.15)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#E5E5E5';
          }}
        >
          <User className="h-4 w-4" />
          <span className="font-medium">Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false);
            navigate('/pos-settings');
          }}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors"
          style={{
            color: '#E5E5E5'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(124, 93, 250, 0.15)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#E5E5E5';
          }}
        >
          <Settings className="h-4 w-4" />
          <span className="font-medium">Settings</span>
        </DropdownMenuItem>
        
        {/* Admin Option - Only show if callback provided (means user has admin role) */}
        {onAdminClick && (
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              onAdminClick();
            }}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors"
            style={{
              color: '#E5E5E5'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(124, 93, 250, 0.15)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#E5E5E5';
            }}
          >
            <Shield className="h-4 w-4" />
            <span className="font-medium">Admin</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {/* Logout */}
        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false);
            onLogout();
          }}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors"
          style={{
            color: '#EF4444'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#FF6B6B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#EF4444';
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
