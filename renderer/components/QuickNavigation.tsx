import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Menu, X, Settings, Cog, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigation, NavigationItem } from './NavigationProvider';
import { globalColors } from '../utils/QSAIDesign';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { SettingsDropdown } from './SettingsDropdown';
import QuickToolsModal from './QuickToolsModal';

interface QuickNavigationProps {
  className?: string;
}

export function QuickNavigation({ className = '' }: QuickNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickTools, setShowQuickTools] = useState(false);
  const { getAvailableRoutes, navigateWithHistory, goBack, canGoBack, currentPage } = useNavigation();
  const { user, isAdmin } = useSimpleAuth();

  // DEBUG: Add debugging for settings visibility investigation
  useEffect(() => {
    console.log('🔍 QuickNavigation DEBUG INFO:');
    console.log('User:', user);
    console.log('isAdmin:', isAdmin);
    console.log('Settings will show:', isAdmin);
  }, [user, isAdmin]);

  // Add event listeners for modal triggers from QuickToolsModal
  React.useEffect(() => {
    const handleOpenMenuManagement = () => {
      // Trigger menu management modal in ManagementHeader
      const event = new CustomEvent('menu-management-open');
      document.dispatchEvent(event);
    };

    const handleOpenAllOrders = () => {
      // Trigger all orders modal in ManagementHeader
      const event = new CustomEvent('all-orders-open');
      document.dispatchEvent(event);
    };

    document.addEventListener('open-menu-management', handleOpenMenuManagement);
    document.addEventListener('open-all-orders', handleOpenAllOrders);

    return () => {
      document.removeEventListener('open-menu-management', handleOpenMenuManagement);
      document.removeEventListener('open-all-orders', handleOpenAllOrders);
    };
  }, []);

  const availableRoutes = getAvailableRoutes();
  
  // Filter out settings-related routes that are now in the dropdown
  const settingsRoutes = [
    '/admin-settings',
    '/online-order-settings', 
    '/pos-settings',
    '/ai-staff-management-hub'
  ];
  
  // Filter routes based on search query and exclude settings routes handled by dropdown
  const filteredRoutes = availableRoutes.filter(route => {
    // Exclude settings routes from the main navigation
    if (settingsRoutes.includes(route.path)) return false;
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      route.title.toLowerCase().includes(query) ||
      route.description?.toLowerCase().includes(query) ||
      route.category.toLowerCase().includes(query)
    );
  });

  // Group routes by category
  const groupedRoutes = filteredRoutes.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = [];
    }
    acc[route.category].push(route);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const handleNavigate = (path: string) => {
    navigateWithHistory(path);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      public: globalColors.accent.turquoise,
      customer: globalColors.accent.gold,
      staff: globalColors.purple.primary,
      admin: globalColors.purple.light
    };
    return colors[category as keyof typeof colors] || globalColors.text.secondary;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      public: 'Public',
      customer: 'Customer',
      staff: 'Staff',
      admin: 'Admin'
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Back Button */}
      {canGoBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="h-8 w-8 p-0 hover:bg-white/10"
          title="Go back"
        >
          <ArrowLeft className="h-4 w-4" style={{ color: globalColors.text.secondary }} />
        </Button>
      )}

      {/* Settings Dropdown - DESKTOP FIX: Always show for desktop app compatibility */}
      <SettingsDropdown className="" />

      {/* Quick Tools Button - replaces old Settings button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowQuickTools(true)}
        className="h-8 px-3 hover:bg-white/10"
        style={{ color: globalColors.text.secondary }}
      >
        <Zap className="h-4 w-4 mr-2" />
        Quick Tools
      </Button>

      {/* Quick Tools Modal */}
      <QuickToolsModal
        isOpen={showQuickTools}
        onClose={() => setShowQuickTools(false)}
      />
    </div>
  );
}

export default QuickNavigation;
