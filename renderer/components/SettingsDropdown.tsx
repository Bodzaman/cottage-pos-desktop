import React, { useState } from 'react';
import { ChevronDown, Settings, ShoppingCart, Clock, CreditCard, Bot, Cog, Power, Zap, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { globalColors } from '../utils/QSAIDesign';
import { toast } from 'sonner';
import { useRestaurantSettings } from '../utils/useRestaurantSettings';
import { usePOSSettings } from '../utils/posSettingsStore';
import ManagementPasswordDialog from './ManagementPasswordDialog';
import { RefundManagementPanel } from './RefundManagementPanel';
import { VoiceOrderNotificationPanel } from './VoiceOrderNotificationPanel';
import { VoiceOrderTestPanel } from './VoiceOrderTestPanel';
import RestaurantSettingsManager from './RestaurantSettingsManager';
import { isManagementAuthenticated } from '../utils/management-auth';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
  category: 'inline' | 'modal';
}

interface SettingsDropdownProps {
  className?: string;
}

export function SettingsDropdown({ className = '' }: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [activeTab, setActiveTab] = useState('business-profile');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Restaurant settings hook for Online Orders toggles
  const { settings, saveSettings, isLoading } = useRestaurantSettings();
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(
    settings?.general?.onlineOrderingEnabled ?? true
  );
  const [autoApproveOrders, setAutoApproveOrders] = useState(
    settings?.general?.autoApproveOrders ?? true
  );

  // POS settings hook for POS toggles
  const { settings: posSettings, updateSettings: updatePOSSettings, isLoading: isPOSLoading } = usePOSSettings();
  const [variantCarouselEnabled, setVariantCarouselEnabled] = useState(
    posSettings?.variant_carousel_enabled ?? true
  );

  // Define the 6 settings sections as in-place actions
  const settingsSections: SettingsSection[] = [
    {
      id: 'online-orders',
      title: 'Online Orders',
      description: 'Website orders, delivery settings, payment options',
      icon: <ShoppingCart className="h-4 w-4" />,
      requiresAuth: true,
      category: 'modal'
    },
    {
      id: 'restaurant-info',
      title: 'Restaurant Info',
      description: 'Hours, contact details, business information',
      icon: <Clock className="h-4 w-4" />,
      requiresAuth: true,
      category: 'modal'
    },
    {
      id: 'payment-delivery',
      title: 'Payment & Delivery',
      description: 'Stripe setup, delivery zones, fees',
      icon: <CreditCard className="h-4 w-4" />,
      requiresAuth: true,
      category: 'modal'
    },
    {
      id: 'pos-settings',
      title: 'POS Settings',
      description: 'Point of sale configuration, table setup',
      icon: <Cog className="h-4 w-4" />,
      requiresAuth: true,
      category: 'modal'
    },
    {
      id: 'ai-staff-settings',
      title: 'AI Staff Settings',
      description: 'AI assistant configuration and management',
      icon: <Bot className="h-4 w-4" />,
      requiresAuth: true,
      category: 'modal'
    }
  ];

  // Handle authentication flow
  const handleAuthenticatedAction = (action: () => void) => {
    if (isManagementAuthenticated()) {
      action();
    } else {
      setPendingAction(() => action);
      setShowPasswordDialog(true);
    }
  };

  const handlePasswordAuthenticated = () => {
    setShowPasswordDialog(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Section click handlers
  const handleSectionClick = (section: SettingsSection) => {
    setIsOpen(false);
    
    if (section.requiresAuth) {
      handleAuthenticatedAction(() => {
        setActiveTab(getTabForSection(section.id));
        setShowManagementModal(true);
      });
    } else {
      setActiveTab(getTabForSection(section.id));
      setShowManagementModal(true);
    }
  };

  const getTabForSection = (sectionId: string): string => {
    switch (sectionId) {
      case 'online-orders': return 'online-orders';
      case 'restaurant-info': return 'business-profile';
      case 'payment-delivery': return 'payments-delivery';
      case 'pos-settings': return 'pos-settings';
      case 'ai-staff-settings': return 'ai-staff';
      default: return 'business-profile';
    }
  };
  
  // Online Orders toggle handlers
  const handleOnlineOrderingToggle = async (enabled: boolean) => {
    try {
      setOnlineOrderingEnabled(enabled);
      
      // Update settings using the hook
      const updatedSettings = {
        ...settings,
        general: {
          ...settings?.general,
          onlineOrderingEnabled: enabled
        }
      };
      
      await saveSettings(updatedSettings);
      toast.success(enabled ? 'Online ordering enabled' : 'Online ordering disabled');
    } catch (error) {
      console.error('Failed to update online ordering setting:', error);
      setOnlineOrderingEnabled(!enabled); // Revert on error
      toast.error('Failed to update setting');
    }
  };
  
  const handleAutoApproveToggle = async (enabled: boolean) => {
    try {
      setAutoApproveOrders(enabled);
      
      // Update settings using the hook
      const updatedSettings = {
        ...settings,
        general: {
          ...settings?.general,
          autoApproveOrders: enabled
        }
      };
      
      await saveSettings(updatedSettings);
      toast.success(enabled ? 'Auto-approve enabled' : 'Auto-approve disabled');
    } catch (error) {
      console.error('Failed to update auto-approve setting:', error);
      setAutoApproveOrders(!enabled); // Revert on error
      toast.error('Failed to update setting');
    }
  };

  const handleVariantCarouselToggle = async (enabled: boolean) => {
    try {
      setVariantCarouselEnabled(enabled);
      
      // Update POS settings
      const updatedSettings = {
        ...posSettings!,
        variant_carousel_enabled: enabled
      };
      
      const success = await updatePOSSettings(updatedSettings);
      if (!success) {
        setVariantCarouselEnabled(!enabled); // Revert on error
      }
    } catch (error) {
      console.error('Failed to update variant carousel setting:', error);
      setVariantCarouselEnabled(!enabled); // Revert on error
      toast.error('Failed to update setting');
    }
  };

  const handleConfigureDetails = () => {
    handleAuthenticatedAction(() => {
      setActiveTab('online-orders');
      setShowManagementModal(true);
    });
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
              Configure your restaurant settings
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
                            disabled={isLoading}
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
                            disabled={isLoading}
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-7 mt-2"
                          onClick={handleConfigureDetails}
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
              ) : section.id === 'pos-settings' ? (
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
                            <Image className="h-3 w-3" style={{ color: variantCarouselEnabled ? globalColors.purple.primary : globalColors.text.muted }} />
                            <span className="text-xs font-medium" style={{ color: globalColors.text.primary }}>Variant Carousel</span>
                          </div>
                          <Switch
                            checked={variantCarouselEnabled}
                            onCheckedChange={handleVariantCarouselToggle}
                            className="scale-75"
                            disabled={isPOSLoading}
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

      {/* Management Password Dialog */}
      <ManagementPasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPendingAction(null);
        }}
        onAuthenticated={handlePasswordAuthenticated}
      />

      {/* Management Modal with Tabs */}
      <Dialog open={showManagementModal} onOpenChange={setShowManagementModal}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-hidden"
          style={{
            backgroundColor: globalColors.background.secondary,
            borderColor: globalColors.border.light
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: globalColors.text.primary }}>
              Restaurant Management
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="business-profile">Business</TabsTrigger>
              <TabsTrigger value="online-orders">Online Orders</TabsTrigger>
              <TabsTrigger value="payments-delivery">Payments</TabsTrigger>
              <TabsTrigger value="pos-settings">POS</TabsTrigger>
              <TabsTrigger value="ai-staff">AI Staff</TabsTrigger>
            </TabsList>
            
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              <TabsContent value="business-profile" className="space-y-4">
                <RestaurantSettingsManager />
              </TabsContent>
              
              <TabsContent value="online-orders" className="space-y-4">
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>Online Orders Configuration</h3>
                  {/* Online orders settings would go here */}
                  <p style={{ color: globalColors.text.secondary }}>Configure website ordering, delivery zones, and payment options.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="payments-delivery" className="space-y-4">
                <div className="grid gap-6">
                  <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>Payment & Delivery Management</h3>
                  <RefundManagementPanel />
                </div>
              </TabsContent>
              
              <TabsContent value="pos-settings" className="space-y-4">
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>POS Configuration</h3>
                  {/* POS settings would go here */}
                  <p style={{ color: globalColors.text.secondary }}>Configure point of sale settings, table management, and receipt templates.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="ai-staff" className="space-y-4">
                <div className="grid gap-6">
                  <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>AI Staff Management</h3>
                  <VoiceOrderNotificationPanel compact={true} />
                  <VoiceOrderTestPanel />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SettingsDropdown;
