import React, { useState } from 'react';
import { ChevronDown, ShoppingCart, Cog, Zap, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { globalColors } from '../utils/QSAIDesign';
import { toast } from 'sonner';
import { useRestaurantSettings } from '../utils/useRestaurantSettings';
import { usePOSSettingsQuery, useUpdatePOSSettings } from '../utils/posSettingsQueries';
import ManagementPasswordDialog from './ManagementPasswordDialog';
import { RestaurantManagementModal } from './RestaurantManagementModal';
import { isManagementAuthenticated } from '../utils/management-auth';

interface SettingsDropdownProps {
  className?: string;
}

export function SettingsDropdown({ className = '' }: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [activeTab, setActiveTab] = useState('online-orders');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Restaurant settings hook for Online Orders toggles
  const { settings, saveSettings, isLoading } = useRestaurantSettings();
  const [autoApproveOrders, setAutoApproveOrders] = useState(
    settings?.general?.autoApproveOrders ?? true
  );

  // POS settings hook for Variant Carousel toggle (React Query)
  const { data: posSettings, isLoading: isPOSLoading } = usePOSSettingsQuery();
  const updatePOSSettingsMutation = useUpdatePOSSettings();
  const [variantCarouselEnabled, setVariantCarouselEnabled] = useState(
    posSettings?.variant_carousel_enabled ?? true
  );

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

  const handleAutoApproveToggle = async (enabled: boolean) => {
    try {
      setAutoApproveOrders(enabled);

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
      setAutoApproveOrders(!enabled);
      toast.error('Failed to update setting');
    }
  };

  const handleVariantCarouselToggle = async (enabled: boolean) => {
    try {
      setVariantCarouselEnabled(enabled);

      const updatedSettings = {
        ...posSettings!,
        variant_carousel_enabled: enabled
      };

      await updatePOSSettingsMutation.mutateAsync(updatedSettings);
    } catch (error) {
      console.error('Failed to update variant carousel setting:', error);
      setVariantCarouselEnabled(!enabled);
      // Toast error is handled by the mutation hook
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

          {/* Online Orders Section */}
          <div className="p-3">
            <div className="flex items-start space-x-3 w-full mb-3">
              <div
                className="flex-shrink-0 mt-0.5"
                style={{ color: globalColors.purple.primary }}
              >
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="text-sm font-medium mb-1"
                  style={{ color: globalColors.text.primary }}
                >
                  Online Orders
                </h4>
                <p
                  className="text-xs leading-relaxed mb-3"
                  style={{ color: globalColors.text.secondary }}
                >
                  Website orders, delivery settings, payment options
                </p>

                {/* Quick Controls */}
                <div className="space-y-3 border-t pt-3" style={{ borderColor: globalColors.border.light }}>
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

          <DropdownMenuSeparator className="my-1" style={{ backgroundColor: globalColors.border.light }} />

          {/* Variant Carousel Toggle */}
          <div className="p-3">
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
          </div>
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

      {/* Restaurant Management Modal */}
      <RestaurantManagementModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

export default SettingsDropdown;
