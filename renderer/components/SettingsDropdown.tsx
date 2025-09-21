
import React, { useState } from 'react';
import { ChevronDown, Settings, ShoppingCart, Clock, CreditCard, Bot, Cog, Power, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigation } from './NavigationProvider';
import { globalColors } from '../utils/QSAIDesign';
import { toast } from 'sonner';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  category: 'inline' | 'navigation';
}

interface SettingsDropdownProps {
  className?: string;
}

export function SettingsDropdown({ className = '' }: SettingsDropdownProps) {
  const { navigateWithHistory } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Quick control states for Online Orders
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(true);
  const [autoApproveOrders, setAutoApproveOrders] = useState(true);

  // Define the 6 settings sections as specified in requirements
  const settingsSections: SettingsSection[] = [
    {
      id: 'online-orders',
      title: 'Online Orders',
      description: 'Website orders, delivery settings, payment options',
      icon: <ShoppingCart className="h-4 w-4" />,
      path: '/online-order-settings',
      category: 'navigation'
    },
    {
      id: 'restaurant-info',
      title: 'Restaurant Info',
      description: 'Hours, contact details, business information',
      icon: <Clock className="h-4 w-4" />,
      path: '/admin-settings?tab=restaurant-info',
      category: 'navigation'
    },
    {
      id: 'payment-delivery',
      title: 'Payment & Delivery',
      description: 'Stripe setup, delivery zones, fees',
      icon: <CreditCard className="h-4 w-4" />,
      path: '/admin-settings?tab=payment-delivery',
      category: 'navigation'
    },
    {
      id: 'pos-settings',
      title: 'POS Settings',
      description: 'Point of sale configuration, table setup',
      icon: <Cog className="h-4 w-4" />,
      path: '/admin-settings?tab=pos-settings',
      category: 'navigation'
    },
    {
      id: 'ai-staff-settings',
      title: 'AI Staff Settings',
      description: 'AI assistant configuration and management',
      icon: <Bot className="h-4 w-4" />,
      path: '/ai-staff-management-hub',
      category: 'navigation'
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'General app configuration and preferences',
      icon: <Cog className="h-4 w-4" />,
      path: '/admin-settings?tab=system-settings',
      category: 'navigation'
    }
  ];

  const handleSectionClick = (section: SettingsSection) => {
    navigateWithHistory(section.path);
    setIsOpen(false);
  };
  
  const handleOnlineOrderingToggle = (enabled: boolean) => {
    setOnlineOrderingEnabled(enabled);
    toast.success(enabled ? 'Online ordering enabled' : 'Online ordering disabled');
  };
  
  const handleAutoApproveToggle = (enabled: boolean) => {
    setAutoApproveOrders(enabled);
    toast.success(enabled ? 'Auto-approve enabled' : 'Auto-approve disabled');
  };

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 hover:bg-white/10 transition-all duration-200"
            style={{ color: globalColors.text.secondary }}
          >
            <Cog className="h-4 w-4 mr-2" />
            Settings
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          align="end"
          className="w-80 p-2"
          style={{
            backgroundColor: globalColors.background.secondary,
            borderColor: globalColors.border.light,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="px-2 py-1 mb-2">
            <h3 
              className="text-sm font-medium"
              style={{ color: globalColors.text.primary }}
            >
              Settings & Configuration
            </h3>
            <p 
              className="text-xs mt-1"
              style={{ color: globalColors.text.secondary }}
            >
              Organize and manage your restaurant settings
            </p>
          </div>
          
          <DropdownMenuSeparator style={{ backgroundColor: globalColors.border.light }} />
          
          {settingsSections.map((section, index) => (
            <React.Fragment key={section.id}>
              {/* Enhanced Online Orders Section with Quick Controls */}
              {section.id === 'online-orders' ? (
                <div className="p-3">
                  <div className="flex items-start space-x-3 w-full mb-3">
                    <div 
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: globalColors.purple.primary }}
                    >
                      {section.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="text-sm font-medium mb-1"
                        style={{ color: globalColors.text.primary }}
                      >
                        {section.title}
                      </h4>
                      <p 
                        className="text-xs leading-relaxed mb-3"
                        style={{ color: globalColors.text.secondary }}
                      >
                        {section.description}
                      </p>
                      
                      {/* Quick Controls */}
                      <div className="space-y-3 border-t pt-3" style={{ borderColor: globalColors.border.light }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Power className="h-3 w-3" style={{ color: onlineOrderingEnabled ? globalColors.purple.primary : globalColors.text.muted }} />
                            <span className="text-xs font-medium" style={{ color: globalColors.text.primary }}>Online Ordering</span>
                          </div>
                          <Switch
                            checked={onlineOrderingEnabled}
                            onCheckedChange={handleOnlineOrderingToggle}
                            className="scale-75"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-3 w-3" style={{ color: autoApproveOrders ? globalColors.purple.primary : globalColors.text.muted }} />
                            <span className="text-xs font-medium" style={{ color: globalColors.text.primary }}>Auto-Approve</span>
                          </div>
                          <Switch
                            checked={autoApproveOrders}
                            onCheckedChange={handleAutoApproveToggle}
                            className="scale-75"
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-7 mt-2"
                          onClick={() => handleSectionClick(section)}
                          style={{
                            borderColor: globalColors.purple.primary,
                            color: globalColors.purple.primary,
                            backgroundColor: 'transparent'
                          }}
                        >
                          Configure Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <DropdownMenuItem
                  className="p-3 cursor-pointer hover:bg-white/5 rounded-md focus:bg-white/5"
                  onClick={() => handleSectionClick(section)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div 
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: globalColors.purple.primary }}
                    >
                      {section.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="text-sm font-medium mb-1"
                        style={{ color: globalColors.text.primary }}
                      >
                        {section.title}
                      </h4>
                      <p 
                        className="text-xs leading-relaxed"
                        style={{ color: globalColors.text.secondary }}
                      >
                        {section.description}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
              
              {index < settingsSections.length - 1 && (
                <DropdownMenuSeparator 
                  className="my-1" 
                  style={{ backgroundColor: globalColors.border.light }} 
                />
              )}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default SettingsDropdown;
