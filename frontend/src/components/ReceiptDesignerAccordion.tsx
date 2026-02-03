/**
 * ReceiptDesignerAccordion - Compact accordion-based config panel for ThermalReceiptDesignerV2
 * Features:
 * - Single scrollable panel with collapsible sections
 * - Compact styling with reduced padding
 * - All panels can be open simultaneously (type="multiple")
 * - Integrated with Zustand store
 * - Uses CompactLogoUpload for inline logo management
 */

import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  FileText,
  ShoppingCart,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  ChefHat
} from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { useReceiptDesignerStoreV2 } from 'utils/receiptDesignerStoreV2';
import { FormData, OrderItem } from 'utils/receiptDesignerTypes';
import { AppApisTableOrdersOrderItem } from '@/brain/data-contracts';
import CompactLogoUpload from 'components/CompactLogoUpload';
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

export function ReceiptDesignerAccordion({ className = '', isLoadingSettings = false, onOpenSampleOrderModal }: Props) {
  const { formData, updateFormData, paperWidth, setPaperWidth } = useReceiptDesignerStoreV2();

  // Default open sections
  const [openSections, setOpenSections] = useState<string[]>(['business', 'header']);

  // Local state for menu modal
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Helper to update single field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    updateFormData({ [field]: value });
  };

  // Handle logo upload
  const handleLogoProcessed = (processedImage: string) => {
    updateFormData({ logoImage: processedImage });
  };

  // Handle logo clear
  const handleLogoClear = () => {
    updateFormData({ logoImage: '' });
  };

  // Handle menu items from modal
  const handleOrderComplete = (items: AppApisTableOrdersOrderItem[]) => {
    const mappedItems: OrderItem[] = items.map(item => {
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
        // Use variant_name as primary display name to prevent duplication
        // variant_name contains the full formatted name (e.g., "KING PRAWN TIKKA (starter)")
        name: item.variant_name || item.name,
        basePrice: item.price ?? 0,
        quantity: item.quantity,
        total: (item.price ?? 0) * item.quantity,
        variant: item.variant_id ? {
          id: item.variant_id,
          name: '',  // Cleared - full name already in 'name' field above
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

  // Shared input styles
  const inputStyle = {
    backgroundColor: QSAITheme.background.secondary,
    border: `1px solid ${QSAITheme.border.light}`,
    color: QSAITheme.text.primary
  };

  const labelStyle = { color: QSAITheme.text.secondary };
  const mutedStyle = { color: QSAITheme.text.muted };

  return (
    <div className={`${className} overflow-y-auto`}>
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-2"
      >
        {/* ==================== BUSINESS INFORMATION ==================== */}
        <AccordionItem
          value="business"
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.panel }}
        >
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            style={{ color: QSAITheme.text.primary }}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
              <span className="font-medium">Business Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {isLoadingSettings ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Business Name + Font in 2 cols */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs" style={labelStyle}>Business Name *</Label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => updateField('businessName', e.target.value)}
                      placeholder="Cottage Tandoori"
                      className="h-9"
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs" style={labelStyle}>Name Font</Label>
                    <Select
                      value={formData.businessNameFont || 'old-english'}
                      onValueChange={(val) => updateField('businessNameFont', val)}
                    >
                      <SelectTrigger
                        className="h-9"
                        style={{
                          ...inputStyle,
                          fontFamily: getFontFamily(formData.businessNameFont || 'old-english')
                        }}
                      >
                        <SelectValue placeholder="Font" />
                      </SelectTrigger>
                      <SelectContent>
                        {CMS_FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.id} value={font.id} style={{ fontFamily: font.family }}>
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Font Size Controls */}
                <div className="flex items-center gap-3">
                  <Label className="text-xs w-16" style={labelStyle}>Font Size</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateField('businessNameFontSize', Math.max(12, (formData.businessNameFontSize || 18) - 1))}
                    disabled={(formData.businessNameFontSize || 18) <= 12}
                    className="h-7 w-7 p-0"
                    style={inputStyle}
                  >
                    −
                  </Button>
                  <span className="text-sm min-w-[45px] text-center" style={{ color: QSAITheme.text.primary }}>
                    {formData.businessNameFontSize || 18}px
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateField('businessNameFontSize', Math.min(32, (formData.businessNameFontSize || 18) + 1))}
                    disabled={(formData.businessNameFontSize || 18) >= 32}
                    className="h-7 w-7 p-0"
                    style={inputStyle}
                  >
                    +
                  </Button>
                </div>

                {/* VAT Number */}
                <div className="space-y-1">
                  <Label className="text-xs" style={labelStyle}>VAT Number</Label>
                  <Input
                    value={formData.vatNumber}
                    onChange={(e) => updateField('vatNumber', e.target.value)}
                    placeholder="GB123456789"
                    className="h-9"
                    style={inputStyle}
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <Label className="text-xs" style={labelStyle}>Address</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 High Street, London"
                    rows={2}
                    className="min-h-[60px] resize-none"
                    style={inputStyle}
                  />
                </div>

                {/* Phone + Email in 2 cols */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs" style={labelStyle}>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="020 7123 4567"
                      className="h-9"
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs" style={labelStyle}>Email</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="orders@restaurant.co.uk"
                      type="email"
                      className="h-9"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-1">
                  <Label className="text-xs" style={labelStyle}>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="www.restaurant.co.uk"
                    className="h-9"
                    style={inputStyle}
                  />
                </div>

                {/* Visibility Toggles - Horizontal */}
                <div className="pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                  <Label className="text-xs mb-2 block" style={labelStyle}>Show on Receipt</Label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      { key: 'showPhone', label: 'Phone' },
                      { key: 'showEmail', label: 'Email' },
                      { key: 'showWebsite', label: 'Website' },
                      { key: 'showVatNumber', label: 'VAT' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs" style={mutedStyle}>{label}</span>
                        <Switch
                          checked={formData[key as keyof FormData] as boolean}
                          onCheckedChange={(checked) => updateField(key as keyof FormData, checked as any)}
                          className="scale-90"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kitchen Visibility Toggle - Note: Also in Kitchen Copy Settings section */}
                <div className="pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs block" style={mutedStyle}>Show on Kitchen</span>
                      <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>Display business info on kitchen tickets</span>
                    </div>
                    <Switch
                      checked={formData.kitchenShowBusinessInfo === true}
                      onCheckedChange={(checked) => updateField('kitchenShowBusinessInfo', checked)}
                      className="scale-90"
                    />
                  </div>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ==================== HEADER & LOGO ==================== */}
        <AccordionItem
          value="header"
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.panel }}
        >
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            style={{ color: QSAITheme.text.primary }}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
              <span className="font-medium">Header & Logo</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Compact Logo Upload */}
              <CompactLogoUpload
                currentImage={formData.logoImage || null}
                onImageProcessed={handleLogoProcessed}
                onClear={handleLogoClear}
                position={formData.logoPosition || 'center'}
                onPositionChange={(pos) => updateField('logoPosition', pos)}
              />

              {/* Custom Header Text */}
              <div className="space-y-1">
                <Label className="text-xs" style={labelStyle}>Header Text</Label>
                <Textarea
                  value={formData.headerText || ''}
                  onChange={(e) => updateField('headerText', e.target.value)}
                  placeholder="Welcome message or announcement"
                  rows={2}
                  className="min-h-[50px] resize-none text-sm"
                  style={inputStyle}
                />
              </div>

              {/* Header QR Codes */}
              <div className="space-y-1">
                <Label className="text-xs" style={labelStyle}>Header QR Codes</Label>
                <QRCodeFormBuilder
                  qrCodes={(formData.headerQRCodes || []).map(qr => ({ ...qr, enabled: qr.enabled ?? true }))}
                  onQRCodesChange={(codes) => updateFormData({ headerQRCodes: codes })}
                  currentSection="header"
                />
              </div>

              {/* Kitchen Visibility Toggles */}
              <div className="pt-3 border-t space-y-2" style={{ borderColor: QSAITheme.border.light }}>
                <Label className="text-xs mb-2 block" style={labelStyle}>Kitchen Visibility</Label>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs block" style={mutedStyle}>Show Header Text</span>
                    <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>Display header on kitchen tickets</span>
                  </div>
                  <Switch
                    checked={formData.kitchenShowHeader === true}
                    onCheckedChange={(checked) => updateField('kitchenShowHeader', checked)}
                    className="scale-90"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs block" style={mutedStyle}>Show Logo</span>
                    <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>Display logo on kitchen tickets</span>
                  </div>
                  <Switch
                    checked={formData.kitchenShowLogo === true}
                    onCheckedChange={(checked) => updateField('kitchenShowLogo', checked)}
                    className="scale-90"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs block" style={mutedStyle}>Show QR Codes</span>
                    <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>Display QR codes on kitchen tickets</span>
                  </div>
                  <Switch
                    checked={formData.kitchenShowQRCodes === true}
                    onCheckedChange={(checked) => updateField('kitchenShowQRCodes', checked)}
                    className="scale-90"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ==================== ORDER DETAILS ==================== */}
        <AccordionItem
          value="order"
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.panel }}
        >
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            style={{ color: QSAITheme.text.primary }}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
              <span className="font-medium">Order Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Receipt Number Visibility - Customer Copy */}
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: QSAITheme.border.light }}>
                <div>
                  <span className="text-xs block" style={mutedStyle}>
                    Show Receipt Number
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: QSAITheme.purple.primary + '30', color: QSAITheme.purple.light }}>
                      Customer
                    </span>
                  </span>
                  <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>Only affects FOH/Customer receipt preview</span>
                </div>
                <Switch
                  checked={formData.showReceiptNumber !== false}
                  onCheckedChange={(checked) => updateField('showReceiptNumber', checked)}
                  className="scale-90"
                />
              </div>

              <OrderInfoSection formData={formData} updateField={updateField} />
              <TableServiceSection formData={formData} updateField={updateField} />
              <CustomerDetailsSection formData={formData} updateField={updateField} />
              <TimingScheduleSection formData={formData} updateField={updateField} />
              <SpecialInstructionsSection formData={formData} updateField={updateField} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ==================== MENU ITEMS ==================== */}
        <AccordionItem
          value="items"
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.panel }}
        >
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            style={{ color: QSAITheme.text.primary }}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
              <span className="font-medium">Menu Items</span>
              {formData.orderItems.length > 0 && (
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: QSAITheme.purple.primary, color: '#fff' }}
                >
                  {formData.orderItems.length}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {/* Add Items Button */}
              <Button
                onClick={onOpenSampleOrderModal}
                className="w-full h-9"
                style={{ backgroundColor: QSAITheme.purple.primary, color: '#fff' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Pick Menu Items
              </Button>

              {/* Selected Items List */}
              {formData.orderItems.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded text-sm"
                      style={{ backgroundColor: QSAITheme.background.secondary, border: `1px solid ${QSAITheme.border.light}` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: QSAITheme.text.primary }}>
                          {item.name}
                        </p>
                        <p className="text-xs" style={mutedStyle}>
                          £{((item.total && item.quantity) ? item.total / item.quantity : item.basePrice || 0).toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-7 w-7 p-0 ml-2"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Item Display Options */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={mutedStyle}>Category subheadings</span>
                  <Switch
                    checked={formData.showCategorySubheadings || false}
                    onCheckedChange={(checked) => updateField('showCategorySubheadings', checked)}
                    className="scale-90"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ==================== FOOTER & MESSAGING ==================== */}
        <AccordionItem
          value="footer"
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.panel }}
        >
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            style={{ color: QSAITheme.text.primary }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
              <span className="font-medium">Footer & Messaging</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {/* Thank You Message */}
              <div className="space-y-1">
                <Label className="text-xs" style={labelStyle}>Thank You Message</Label>
                <Textarea
                  value={formData.footerMessage || ''}
                  onChange={(e) => updateField('footerMessage', e.target.value)}
                  placeholder="Thank you for your order!"
                  rows={2}
                  className="min-h-[50px] resize-none text-sm"
                  style={inputStyle}
                />
              </div>

              {/* Terms */}
              <div className="space-y-1">
                <Label className="text-xs" style={labelStyle}>Terms & Conditions</Label>
                <Textarea
                  value={formData.terms || ''}
                  onChange={(e) => updateField('terms', e.target.value)}
                  placeholder="All prices include VAT."
                  rows={2}
                  className="min-h-[50px] resize-none text-sm"
                  style={inputStyle}
                />
              </div>

              {/* Social Media */}
              <div className="space-y-1">
                <Label className="text-xs" style={labelStyle}>Social Media</Label>
                <Input
                  value={formData.socialMedia || ''}
                  onChange={(e) => updateField('socialMedia', e.target.value)}
                  placeholder="Follow us @yourhandle"
                  className="h-9"
                  style={inputStyle}
                />
              </div>

              {/* Custom Footer Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs" style={mutedStyle}>Show custom footer</span>
                <Switch
                  checked={formData.showCustomFooter || false}
                  onCheckedChange={(checked) => updateField('showCustomFooter', checked)}
                  className="scale-90"
                />
              </div>

              {formData.showCustomFooter && (
                <div className="space-y-1">
                  <Label className="text-xs" style={labelStyle}>Custom Footer Text</Label>
                  <Textarea
                    value={formData.customFooterText || ''}
                    onChange={(e) => updateField('customFooterText', e.target.value)}
                    placeholder="Custom footer text"
                    rows={2}
                    className="min-h-[50px] resize-none text-sm"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Footer QR Codes */}
              <div className="space-y-1 pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                <Label className="text-xs" style={labelStyle}>Footer QR Codes</Label>
                <QRCodeFormBuilder
                  qrCodes={(formData.footerQRCodes || []).map(qr => ({ ...qr, enabled: qr.enabled ?? true }))}
                  onQRCodesChange={(codes) => updateFormData({ footerQRCodes: codes })}
                  currentSection="footer"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ==================== KITCHEN COPY SETTINGS ==================== */}
        <AccordionItem
          value="kitchen"
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.panel }}
        >
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            style={{ color: QSAITheme.text.primary }}
          >
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
              <span className="font-medium">Kitchen Copy Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <p className="text-[10px]" style={{ color: QSAITheme.text.muted }}>
                Configure what appears on kitchen tickets
              </p>

              {/* Receipt Number Visibility */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs block" style={mutedStyle}>Show Receipt Number</span>
                  <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>Order reference on kitchen copy</span>
                </div>
                <Switch
                  checked={formData.kitchenShowReceiptNumber !== false}
                  onCheckedChange={(checked) => updateField('kitchenShowReceiptNumber', checked)}
                  className="scale-90"
                />
              </div>

              {/* Kitchen Order Label */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs block" style={mutedStyle}>Show Section Label</span>
                  <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>Header text above items</span>
                </div>
                <Switch
                  checked={formData.showKitchenOrderLabel !== false}
                  onCheckedChange={(checked) => updateField('showKitchenOrderLabel', checked)}
                  className="scale-90"
                />
              </div>

              {formData.showKitchenOrderLabel !== false && (
                <div className="space-y-1 pl-4 border-l-2" style={{ borderColor: QSAITheme.purple.primary }}>
                  <Label className="text-xs" style={labelStyle}>Label Text</Label>
                  <Input
                    value={formData.kitchenOrderLabelText || 'KITCHEN ORDER'}
                    onChange={(e) => updateField('kitchenOrderLabelText', e.target.value)}
                    placeholder="KITCHEN ORDER"
                    className="h-9"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Visibility Toggles */}
              <div className="pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                <Label className="text-xs font-medium block mb-2" style={labelStyle}>Show on Kitchen Tickets</Label>
                {[
                  { key: 'kitchenShowBusinessInfo', label: 'Business Info', desc: 'Name, address, contact', defaultOn: false },
                  { key: 'kitchenShowOrderInfo', label: 'Order Info', desc: 'Date, time, source', defaultOn: true },
                  { key: 'kitchenShowTableInfo', label: 'Table Info', desc: 'Table #, covers, linked tables', defaultOn: true },
                  { key: 'kitchenShowCustomerDetails', label: 'Customer Details', desc: 'Name, phone (delivery: ON)', defaultOn: false },
                  { key: 'kitchenShowTiming', label: 'Timing', desc: 'Collection/delivery times', defaultOn: true },
                  { key: 'kitchenShowSpecialInstructions', label: 'Special Instructions', desc: 'Customer notes', defaultOn: true },
                  { key: 'kitchenShowTotals', label: 'Totals', desc: 'For cash collection', defaultOn: false },
                  { key: 'kitchenShowFooter', label: 'Footer', desc: 'Thank you message', defaultOn: false },
                ].map(({ key, label, desc, defaultOn }) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-xs block" style={mutedStyle}>{label}</span>
                      <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>{desc}</span>
                    </div>
                    <Switch
                      checked={defaultOn
                        ? (formData[key as keyof FormData] as boolean) !== false
                        : (formData[key as keyof FormData] as boolean) === true}
                      onCheckedChange={(checked) => updateField(key as keyof FormData, checked as any)}
                      className="scale-90"
                    />
                  </div>
                ))}
              </div>

              {/* Takeaway-Only Options */}
              <div className="pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs font-medium" style={labelStyle}>Takeaway Options</Label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: QSAITheme.background.secondary, color: QSAITheme.text.muted }}>
                    Takeaway only
                  </span>
                </div>
                {[
                  { key: 'showContainerQtyField', label: 'Container QTY box', desc: 'For packing count' },
                  { key: 'showCheckedField', label: 'Checked box', desc: 'For verification' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-xs block" style={mutedStyle}>{label}</span>
                      <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>{desc}</span>
                    </div>
                    <Switch
                      checked={(formData[key as keyof FormData] as boolean) !== false}
                      onCheckedChange={(checked) => updateField(key as keyof FormData, checked as any)}
                      className="scale-90"
                    />
                  </div>
                ))}
              </div>

              {/* Thermal Font */}
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                <div>
                  <span className="text-xs block" style={mutedStyle}>Thermal Font for Items</span>
                  <span className="text-[10px]" style={{ color: QSAITheme.text.muted }}>Monospace font for item list</span>
                </div>
                <Switch
                  checked={formData.useItemsThermalFont || false}
                  onCheckedChange={(checked) => updateField('useItemsThermalFont', checked)}
                  className="scale-90"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ==================== ADVANCED SETTINGS ==================== */}
        <AccordionItem
          value="advanced"
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.panel }}
        >
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            style={{ color: QSAITheme.text.primary }}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
              <span className="font-medium">Advanced Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {/* Receipt Font Family */}
              <div className="space-y-1">
                <Label className="text-xs" style={labelStyle}>Receipt Font</Label>
                <Select
                  value={formData.receiptFont || 'Inter'}
                  onValueChange={(val) => updateField('receiptFont', val)}
                >
                  <SelectTrigger className="h-9" style={inputStyle}>
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

              {/* Paper Width */}
              <div className="space-y-1">
                <Label className="text-xs" style={labelStyle}>Paper Width</Label>
                <Select
                  value={String(paperWidth || 80)}
                  onValueChange={(val) => setPaperWidth(Number(val))}
                >
                  <SelectTrigger className="h-9" style={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm (Small)</SelectItem>
                    <SelectItem value="80">80mm (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Logo Width */}
              <div className="space-y-1">
                <Label className="text-xs" style={labelStyle}>Logo Width (px)</Label>
                <Input
                  type="number"
                  value={formData.logoWidth || 100}
                  onChange={(e) => updateField('logoWidth', Number(e.target.value))}
                  min={50}
                  max={300}
                  className="h-9"
                  style={inputStyle}
                />
                <p className="text-[10px]" style={{ color: QSAITheme.text.muted }}>
                  Logo position is set in Header & Logo section
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Menu Modal */}
      <ThermalReceiptMenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
}

export default ReceiptDesignerAccordion;
