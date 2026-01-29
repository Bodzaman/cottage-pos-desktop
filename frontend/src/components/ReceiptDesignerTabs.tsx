/**
 * ReceiptDesignerTabs - Main form component for ThermalReceiptDesignerV2
 * Features:
 * - Tab navigation (Business, Header, Order, Items, Footer, Advanced)
 * - Default active tab: 'header' (MYA-1038)
 * - All panels fully mounted with controlled inputs
 * - No flicker on tab switches
 * - Integrated with Zustand store
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Building2, 
  ShoppingCart, 
  Receipt, 
  MessageSquare,
  Settings,
  Upload,
  Plus,
  Trash2
} from 'lucide-react';
import { QSAITheme, styles } from 'utils/QSAIDesign';
import { useReceiptDesignerStoreV2, selectFormData, selectActiveTab } from 'utils/receiptDesignerStoreV2';
import { FormData, OrderItem } from 'utils/receiptDesignerTypes';
import { QRCodeConfig } from 'components/QRCodeFormBuilder';
import { AppApisTableOrdersOrderItem } from '@/brain/data-contracts';
import ImageUploadDithering from 'components/ImageUploadDithering';
import ThermalReceiptMenuModal from 'components/ThermalReceiptMenuModal';
import QRCodeFormBuilder from 'components/QRCodeFormBuilder';
import { OrderInfoSection } from 'components/OrderInfoSection';
import { TableServiceSection } from 'components/TableServiceSection';
import { CustomerDetailsSection } from 'components/CustomerDetailsSection';
import { TimingScheduleSection } from 'components/TimingScheduleSection';
import { SpecialInstructionsSection } from 'components/SpecialInstructionsSection';
import { toast } from 'sonner';
import { CMS_FONT_OPTIONS, loadFont, getFontFamily } from 'utils/cmsFonts';

interface Props {
  className?: string;
  isLoadingSettings?: boolean;
  onOpenSampleOrderModal?: () => void;
}

export function ReceiptDesignerTabs({ className = '', isLoadingSettings = false, onOpenSampleOrderModal }: Props) {
  const { formData, activeTab, updateFormData, setActiveTab, paperWidth, setPaperWidth } = useReceiptDesignerStoreV2();
  
  // Local state for menu modal
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Helper to update single field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    updateFormData({ [field]: value });
  };

  // Handle logo upload
  const handleLogoProcessed = (processedImage: string) => {
    updateFormData({ logoImage: processedImage });
    toast.success('Logo processed for thermal printing');
  };

  // Handle menu items from modal - convert from AppApisTableOrdersOrderItem to OrderItem
  const handleOrderComplete = (items: AppApisTableOrdersOrderItem[]) => {
    // Map AppApisTableOrdersOrderItem to OrderItem format
    const mappedItems: OrderItem[] = items.map(item => {
      // Customizations from the API are Record<string, any>[], so we need to handle safely
      const mappedCustomizations = item.customizations?.map((c: Record<string, any>) => ({
        id: (c.customization_id as string) || (c.id as string) || `cust-${Date.now()}`,
        customization_id: c.customization_id as string | undefined,
        name: (c.name as string) || '',
        price_adjustment: (c.price_adjustment as number) ?? 0,
        category: c.category as string | undefined,
        group: c.group as string | undefined,
        is_free: c.is_free as boolean | undefined
      }));

      return {
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        basePrice: item.price ?? 0,
        quantity: item.quantity,
        total: (item.price ?? 0) * item.quantity,
        variant: item.variant_id ? {
          id: item.variant_id,
          name: item.variant_name || '',
          price_adjustment: 0,
          protein_type: item.protein_type || undefined
        } : undefined,
        customizations: mappedCustomizations,
        instructions: item.notes || '',
        notes: item.notes || '',
        variantName: item.variant_name || undefined,
        kitchen_display_name: null,
        menu_item_id: item.menu_item_id,
        protein_type: item.protein_type
      };
    });

    updateFormData({ orderItems: mappedItems });
    setShowMenuModal(false);
    toast.success(`${items.length} items added to receipt`);
  };

  // Handle removing an order item
  const handleRemoveItem = (itemId: string) => {
    const updatedItems = formData.orderItems.filter(item => item.id !== itemId);
    updateFormData({ orderItems: updatedItems });
    toast.success('Item removed');
  };

  // Load business name font when it changes
  useEffect(() => {
    if (formData.businessNameFont) {
      loadFont(formData.businessNameFont);
    }
  }, [formData.businessNameFont]);

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        {/* Tab Navigation */}
        <TabsList
          className="grid w-full grid-cols-5 mb-6"
          style={{
            backgroundColor: QSAITheme.background.panel,
            border: `1px solid ${QSAITheme.border.light}`
          }}
        >
          <TabsTrigger
            value="business"
            className="gap-2"
            style={{
              backgroundColor: activeTab === 'business' ? QSAITheme.purple.primary : 'transparent',
              color: activeTab === 'business' ? QSAITheme.text.primary : QSAITheme.text.muted
            }}
          >
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger
            value="header"
            className="gap-2"
            style={{
              backgroundColor: activeTab === 'header' ? QSAITheme.purple.primary : 'transparent',
              color: activeTab === 'header' ? QSAITheme.text.primary : QSAITheme.text.muted
            }}
          >
            <FileText className="h-4 w-4" />
            Header
          </TabsTrigger>
          <TabsTrigger
            value="order"
            className="gap-2"
            style={{
              backgroundColor: activeTab === 'order' ? QSAITheme.purple.primary : 'transparent',
              color: activeTab === 'order' ? QSAITheme.text.primary : QSAITheme.text.muted
            }}
          >
            <Receipt className="h-4 w-4" />
            Order
          </TabsTrigger>
          <TabsTrigger
            value="items"
            className="gap-2"
            style={{
              backgroundColor: activeTab === 'items' ? QSAITheme.purple.primary : 'transparent',
              color: activeTab === 'items' ? QSAITheme.text.primary : QSAITheme.text.muted
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger
            value="footer"
            className="gap-2"
            style={{
              backgroundColor: activeTab === 'footer' ? QSAITheme.purple.primary : 'transparent',
              color: activeTab === 'footer' ? QSAITheme.text.primary : QSAITheme.text.muted
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Footer
          </TabsTrigger>
        </TabsList>

        {/* Business Info Tab */}
        <TabsContent value="business" className="mt-0">
          {isLoadingSettings ? (
            <Card style={styles.glassCard}>
              <CardHeader>
                <CardTitle style={{ color: QSAITheme.text.primary }}>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card style={styles.glassCard}>
              <CardHeader>
                <CardTitle style={{ color: QSAITheme.text.primary }}>
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label style={{ color: QSAITheme.text.secondary }}>Business Name *</Label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => updateField('businessName', e.target.value)}
                      placeholder="Cottage Tandoori Restaurant"
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.primary
                      }}
                    />
                  </div>
                  <div>
                    <Label style={{ color: QSAITheme.text.secondary }}>Business Name Font</Label>
                    <Select
                      value={formData.businessNameFont || 'old-english'}
                      onValueChange={(val) => updateField('businessNameFont', val)}
                    >
                      <SelectTrigger
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.primary,
                          fontFamily: getFontFamily(formData.businessNameFont || 'old-english')
                        }}
                      >
                        <SelectValue placeholder="Select font style" />
                      </SelectTrigger>
                      <SelectContent>
                        {CMS_FONT_OPTIONS.map((font) => (
                          <SelectItem
                            key={font.id}
                            value={font.id}
                            style={{ fontFamily: font.family }}
                          >
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                      Decorative font for the restaurant name
                    </p>
                  </div>
                </div>

                <div>
                  <Label style={{ color: QSAITheme.text.secondary }}>Business Name Font Size</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateField('businessNameFontSize', Math.max(12, (formData.businessNameFontSize || 18) - 1))}
                      disabled={(formData.businessNameFontSize || 18) <= 12}
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.primary
                      }}
                    >
                      <span className="text-lg font-bold">−</span>
                    </Button>
                    <span
                      className="text-sm font-medium min-w-[50px] text-center"
                      style={{ color: QSAITheme.text.primary }}
                    >
                      {formData.businessNameFontSize || 18}px
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateField('businessNameFontSize', Math.min(32, (formData.businessNameFontSize || 18) + 1))}
                      disabled={(formData.businessNameFontSize || 18) >= 32}
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.primary
                      }}
                    >
                      <span className="text-lg font-bold">+</span>
                    </Button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                    Adjust the size of the restaurant name (12-32px)
                  </p>
                </div>

                <div>
                  <Label style={{ color: QSAITheme.text.secondary }}>VAT Number *</Label>
                  <Input
                    value={formData.vatNumber}
                    onChange={(e) => updateField('vatNumber', e.target.value)}
                    placeholder="GB123456789"
                    style={{
                      backgroundColor: QSAITheme.background.secondary,
                      border: `1px solid ${QSAITheme.border.light}`,
                      color: QSAITheme.text.primary
                    }}
                  />
                </div>

                <div>
                  <Label style={{ color: QSAITheme.text.secondary }}>Address *</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 High Street, London, SW1A 1AA"
                    rows={3}
                    style={{
                      backgroundColor: QSAITheme.background.secondary,
                      border: `1px solid ${QSAITheme.border.light}`,
                      color: QSAITheme.text.primary
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label style={{ color: QSAITheme.text.secondary }}>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="020 7123 4567"
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.primary
                      }}
                    />
                  </div>
                  <div>
                    <Label style={{ color: QSAITheme.text.secondary }}>Email</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="orders@cottagetandoori.co.uk"
                      type="email"
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.primary
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label style={{ color: QSAITheme.text.secondary }}>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="www.cottagetandoori.co.uk"
                    style={{
                      backgroundColor: QSAITheme.background.secondary,
                      border: `1px solid ${QSAITheme.border.light}`,
                      color: QSAITheme.text.primary
                    }}
                  />
                </div>

                {/* Visibility Toggles */}
                <div className="space-y-3 pt-4 border-t" style={{ borderColor: QSAITheme.border.light }}>
                  <Label style={{ color: QSAITheme.text.secondary }}>Show on Receipt</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span style={{ color: QSAITheme.text.secondary }} className="text-sm">Phone</span>
                      <Switch
                        checked={formData.showPhone}
                        onCheckedChange={(checked) => updateField('showPhone', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: QSAITheme.text.secondary }} className="text-sm">Email</span>
                      <Switch
                        checked={formData.showEmail}
                        onCheckedChange={(checked) => updateField('showEmail', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: QSAITheme.text.secondary }} className="text-sm">Website</span>
                      <Switch
                        checked={formData.showWebsite}
                        onCheckedChange={(checked) => updateField('showWebsite', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: QSAITheme.text.secondary }} className="text-sm">VAT Number</span>
                      <Switch
                        checked={formData.showVatNumber}
                        onCheckedChange={(checked) => updateField('showVatNumber', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Header Tab */}
        <TabsContent value="header" className="space-y-6">
          {/* Logo Upload */}
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Upload Logo (Auto-dithered for thermal)</Label>
                <ImageUploadDithering
                  onImageProcessed={handleLogoProcessed}
                  currentImage={formData.logoImage}
                />
              </div>
            </CardContent>
          </Card>

          {/* Header Text */}
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Header Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Custom Header Text</Label>
                <Textarea
                  value={formData.headerText || ''}
                  onChange={(e) => updateField('headerText', e.target.value)}
                  placeholder="Welcome message or special announcement"
                  className="min-h-[80px]"
                  style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Header QR Codes */}
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Header QR Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QRCodeFormBuilder
                qrCodes={(formData.headerQRCodes || []).map(qr => ({ ...qr, enabled: qr.enabled ?? true }))}
                onQRCodesChange={(updatedQRCodes) => updateFormData({ headerQRCodes: updatedQRCodes })}
                currentSection="header"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Tab */}
        <TabsContent value="order" className="space-y-4">
          <Card style={{ ...styles.frostedGlassStyle }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 1. Order Information Section */}
              <OrderInfoSection formData={formData} updateField={updateField} />
              
              {/* 2. Table Service Section (conditional on dine-in) */}
              <TableServiceSection formData={formData} updateField={updateField} />
              
              {/* 3. Customer Details Section */}
              <CustomerDetailsSection formData={formData} updateField={updateField} />
              
              {/* 4. Timing & Schedule Section */}
              <TimingScheduleSection formData={formData} updateField={updateField} />
              
              {/* 5. Special Instructions Section */}
              <SpecialInstructionsSection formData={formData} updateField={updateField} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Menu Item Picker */}
              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Sample Items (for preview)</Label>
                <Button
                  onClick={onOpenSampleOrderModal}
                  className="w-full"
                  style={{ backgroundColor: QSAITheme.purple.primary, color: '#fff' }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Pick Menu Items
                </Button>
                <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                  {formData.orderItems.length} items selected
                </p>
              </div>

              {/* Selected Items List */}
              {formData.orderItems.length > 0 && (
                <div className="space-y-2">
                  <Label style={{ color: QSAITheme.text.primary }}>Selected Items</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded"
                        style={{ backgroundColor: QSAITheme.background.secondary, border: `1px solid ${QSAITheme.border.light}` }}
                      >
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: QSAITheme.text.primary }}>
                            {item.name}
                          </p>
                          <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                            {/* Use safe unit price: prefer total/quantity, fallback to basePrice, else 0 */}
                            £{(
                              (typeof item.total === 'number' && item.quantity ? item.total / item.quantity : (typeof item.basePrice === 'number' ? item.basePrice : 0))
                            ).toFixed(2)}
                            {' '}× {item.quantity}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          style={{ color: QSAITheme.purple.primary }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Font Settings */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label style={{ color: QSAITheme.text.primary }}>Use Thermal Font for Items</Label>
                  <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Apply monospace thermal font to order items
                  </p>
                </div>
                <Switch
                  checked={formData.useItemsThermalFont || false}
                  onCheckedChange={(checked) => updateField('useItemsThermalFont', checked)}
                />
              </div>
              
              {/* Category Subheadings Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label style={{ color: QSAITheme.text.primary }}>Show Category Subheadings</Label>
                  <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Display category names under sections in receipt
                  </p>
                </div>
                <Switch
                  checked={formData.showCategorySubheadings || false}
                  onCheckedChange={(checked) => updateField('showCategorySubheadings', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer" className="space-y-6">
          {/* Footer Message */}
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Footer Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Thank You Message</Label>
                <Textarea
                  value={formData.footerMessage || ''}
                  onChange={(e) => updateField('footerMessage', e.target.value)}
                  placeholder="Thank you for your order!"
                  className="min-h-[60px]"
                  style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Terms & Conditions</Label>
                <Textarea
                  value={formData.terms || ''}
                  onChange={(e) => updateField('terms', e.target.value)}
                  placeholder="All prices include VAT. Service charge is optional."
                  className="min-h-[60px]"
                  style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Social Media</Label>
                <Input
                  value={formData.socialMedia || ''}
                  onChange={(e) => updateField('socialMedia', e.target.value)}
                  placeholder="Follow us @yourhandle"
                  style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}
                />
              </div>

              {/* Custom Footer Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label style={{ color: QSAITheme.text.primary }}>Show Custom Footer</Label>
                  <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Display additional custom text at bottom
                  </p>
                </div>
                <Switch
                  checked={formData.showCustomFooter || false}
                  onCheckedChange={(checked) => updateField('showCustomFooter', checked)}
                />
              </div>

              {formData.showCustomFooter && (
                <div className="space-y-2">
                  <Label style={{ color: QSAITheme.text.primary }}>Custom Footer Text</Label>
                  <Textarea
                    value={formData.customFooterText || ''}
                    onChange={(e) => updateField('customFooterText', e.target.value)}
                    placeholder="Enter custom footer text"
                    className="min-h-[60px]"
                    style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer QR Codes */}
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Footer QR Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QRCodeFormBuilder
                qrCodes={(formData.footerQRCodes || []).map(qr => ({ ...qr, enabled: qr.enabled ?? true }))}
                onQRCodesChange={(updatedQRCodes) => updateFormData({ footerQRCodes: updatedQRCodes })}
                currentSection="footer"
              />
            </CardContent>
          </Card>

          {/* Kitchen Copy Options */}
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>
                Kitchen Copy Options
                <span className="text-xs font-normal ml-2" style={{ color: QSAITheme.text.muted }}>
                  (Takeaway modes only)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                These options only affect kitchen tickets for Waiting, Collection, and Delivery orders.
              </p>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label style={{ color: QSAITheme.text.primary }}>Show Totals on Kitchen Copy</Label>
                  <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Drivers need bill amount for cash collection
                  </p>
                </div>
                <Switch
                  checked={formData.showKitchenTotals !== false}
                  onCheckedChange={(checked) => updateField('showKitchenTotals', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label style={{ color: QSAITheme.text.primary }}>Container/Item QTY Box</Label>
                  <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Staff writes item count after packing
                  </p>
                </div>
                <Switch
                  checked={formData.showContainerQtyField !== false}
                  onCheckedChange={(checked) => updateField('showContainerQtyField', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label style={{ color: QSAITheme.text.primary }}>Checked Verification Box</Label>
                  <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Second staff confirms items checked
                  </p>
                </div>
                <Switch
                  checked={formData.showCheckedField !== false}
                  onCheckedChange={(checked) => updateField('showCheckedField', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Font Settings */}
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Font Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Receipt Font Family</Label>
                <Select
                  value={formData.receiptFont || 'Inter'}
                  onValueChange={(val) => updateField('receiptFont', val)}
                >
                  <SelectTrigger style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (Default)</SelectItem>
                    <SelectItem value="JetBrains Mono">JetBrains Mono (Thermal)</SelectItem>
                    <SelectItem value="Roboto Mono">Roboto Mono</SelectItem>
                    <SelectItem value="Courier Prime">Courier Prime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label style={{ color: QSAITheme.text.primary }}>Use Thermal Font for Items</Label>
                  <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Apply monospace thermal font to order items section
                  </p>
                </div>
                <Switch
                  checked={formData.useItemsThermalFont || false}
                  onCheckedChange={(checked) => updateField('useItemsThermalFont', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Paper & Layout */}
          <Card style={{ backgroundColor: QSAITheme.background.panel, borderColor: QSAITheme.border.light }}>
            <CardHeader>
              <CardTitle style={{ color: QSAITheme.text.primary }}>Paper & Layout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Paper Width (mm)</Label>
                <Select
                  value={String(paperWidth || 80)}
                  onValueChange={(val) => setPaperWidth(Number(val))}
                >
                  <SelectTrigger style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm (Small)</SelectItem>
                    <SelectItem value="80">80mm (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Logo Width (px)</Label>
                <Input
                  type="number"
                  value={formData.logoWidth || 100}
                  onChange={(e) => updateField('logoWidth', Number(e.target.value))}
                  min={50}
                  max={300}
                  style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: QSAITheme.text.primary }}>Logo Position</Label>
                <Select
                  value={formData.logoPosition || 'center'}
                  onValueChange={(val) => updateField('logoPosition', val as any)}
                >
                  <SelectTrigger style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.primary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Menu Modal */}
      <ThermalReceiptMenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
}
