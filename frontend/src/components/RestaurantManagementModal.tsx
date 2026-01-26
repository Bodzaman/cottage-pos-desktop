import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { globalColors } from '../utils/QSAIDesign';
import {
  BusinessSettingsTab,
  OnlineOrdersSettingsTab,
  PaymentsSettingsTab,
  POSSettingsTab,
  AIStaffSettingsTab,
} from './settings-tabs';

interface RestaurantManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function RestaurantManagementModal({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}: RestaurantManagementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90dvh] overflow-hidden"
        style={{
          backgroundColor: globalColors.background.secondary,
          borderColor: globalColors.border.light,
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: globalColors.text.primary }}>
            Restaurant Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="business-profile">Business</TabsTrigger>
            <TabsTrigger value="online-orders">Online Orders</TabsTrigger>
            <TabsTrigger value="payments-delivery">Payments</TabsTrigger>
            <TabsTrigger value="pos-settings">POS</TabsTrigger>
            <TabsTrigger value="ai-staff">AI Staff</TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[60dvh] overflow-y-auto">
            <TabsContent value="business-profile" className="space-y-4">
              <BusinessSettingsTab />
            </TabsContent>

            <TabsContent value="online-orders" className="space-y-4">
              <OnlineOrdersSettingsTab />
            </TabsContent>

            <TabsContent value="payments-delivery" className="space-y-4">
              <PaymentsSettingsTab />
            </TabsContent>

            <TabsContent value="pos-settings" className="space-y-4">
              <POSSettingsTab />
            </TabsContent>

            <TabsContent value="ai-staff" className="space-y-4">
              <AIStaffSettingsTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default RestaurantManagementModal;
