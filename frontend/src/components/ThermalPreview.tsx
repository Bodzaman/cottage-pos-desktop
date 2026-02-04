import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { THERMAL_FONTS } from 'utils/thermalFonts';
import { loadFont as loadCmsFont, getFontFamily as getCmsFontFamily } from 'utils/cmsFonts';
import { QSAITheme } from 'utils/QSAIDesign';
import brain from 'brain';
import { QRCodeConfig } from 'utils/receiptDesignerTypes';
import { useRealtimeMenuStoreCompat } from 'utils/realtimeMenuStoreCompat';
import { SECTION_UUID_MAP, FIXED_SECTIONS, findRootSection, SECTION_INDICATORS, SectionId } from 'utils/sectionMapping';
import type { CanvasElement } from 'utils/visualTemplateTypes';

interface OrderData {
  order_id: string;
  order_type: string;
  customer_name: string;
  date: string;
  time: string;
  total: string;
  items: Array<{
    name: string;
    price: string;
    quantity: number;
  }>;
}

// Helper function to transform text to Title Case
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// =====================================================
// SMART ITEM GROUPING FOR THERMAL RECEIPTS
// Groups identical plain items while keeping customized items separate
// =====================================================

interface GroupedReceiptItem {
  // Original item properties
  id: string;
  name: string;
  quantity: number;
  basePrice?: number;
  price?: number;
  total?: number;
  menu_item_id?: string;
  category_id?: string;
  // Grouping properties
  groupedQuantity: number;
  unitPrice: number;
  groupedTotal: number;
  isGrouped: boolean;
  sectionNumber: number;
  sectionName: string;
  // Kitchen display name for abbreviated printing
  kitchen_display_name?: string | null;
  // Display order for sorting within sections
  display_order?: number;
  // Variant
  variant?: { id: string; name: string; price_adjustment: number };
  // Customizations
  customizations?: Array<{ id: string; name: string; price: number; price_adjustment?: number; is_free?: boolean }>;
  instructions?: string;
  notes?: string;
  // Section override fields - for "Serve With" feature
  serveWithSectionId?: string | null;
  serve_with_section_id?: string | null;
  isOverride?: boolean;
  originalSectionId?: string;
}

/**
 * Generate a unique key for grouping identical items
 * Items are identical if: same section + same name + same variant + same price
 */
function generateGroupingKey(item: any, sectionNumber: number): string {
  const variantPart = item.variant?.id || item.variant_id || 'no-variant';
  const pricePart = (item.basePrice || item.price || 0).toFixed(2);
  return `${sectionNumber}|${item.name}|${variantPart}|${pricePart}`;
}

/**
 * Check if an item can be grouped with others
 * Items with customizations or special instructions cannot be grouped
 */
function isItemGroupable(item: any): boolean {
  const hasCustomizations = item.customizations && item.customizations.length > 0;
  const hasInstructions = Boolean(item.instructions || item.notes);
  return !hasCustomizations && !hasInstructions;
}

/**
 * Group receipt items for smart display
 * Consolidates identical plain items while keeping customized items separate
 */
function groupReceiptItems(
  items: any[],
  categoryToSectionMap: Record<string, number>,
  itemToCategoryMap: Record<string, string>,
  sectionNameMap: Record<number, string>
): GroupedReceiptItem[] {
  // DEBUG: Log the state of all inputs at the start
  console.log('📊 groupReceiptItems called with:', {
    itemsCount: items.length,
    categoryToSectionMapSize: Object.keys(categoryToSectionMap).length,
    itemToCategoryMapSize: Object.keys(itemToCategoryMap).length,
    sectionNameMap,
    sampleCategoryToSection: Object.entries(categoryToSectionMap).slice(0, 5),
    sampleItemToCategory: Object.entries(itemToCategoryMap).slice(0, 5)
  });

  if (items.length > 0) {
    const firstItem = items[0];
    console.log('📊 First item details:', {
      name: firstItem.name,
      menu_item_id: firstItem.menu_item_id,
      category_id: firstItem.category_id,
      mappedCategoryId: itemToCategoryMap[firstItem.menu_item_id],
      sectionFromCategoryId: categoryToSectionMap[firstItem.category_id],
      sectionFromMappedId: itemToCategoryMap[firstItem.menu_item_id]
        ? categoryToSectionMap[itemToCategoryMap[firstItem.menu_item_id]]
        : undefined
    });
  }

  const groupedMap = new Map<string, GroupedReceiptItem>();
  const ungroupedItems: GroupedReceiptItem[] = [];

  for (const item of items) {
    // Get section info for this item
    // Check for section override first (item served with different section)
    const overrideId = item.serveWithSectionId || item.serve_with_section_id;
    let sectionNumber: number;
    let sectionName: string;
    let isOverride = false;
    let originalSectionId: string | undefined;

    if (overrideId) {
      // Find the override section by UUID
      const overrideSection = FIXED_SECTIONS.find(s => s.uuid === overrideId);
      if (overrideSection) {
        sectionNumber = overrideSection.order + 1; // 0-indexed to 1-indexed
        sectionName = overrideSection.name;
        isOverride = true;
        // Store original section ID for indicator display
        const categoryId = itemToCategoryMap[item.menu_item_id] || item.category_id;
        const originalSection = categoryId
          ? FIXED_SECTIONS.find(s => categoryToSectionMap[categoryId] === s.order + 1)
          : null;
        originalSectionId = originalSection?.id;
      } else {
        // Invalid override ID, fall back to natural section
        const categoryId = itemToCategoryMap[item.menu_item_id] || item.category_id;
        sectionNumber = categoryToSectionMap[categoryId] || 999;
        sectionName = sectionNameMap[sectionNumber] || '';
      }
    } else {
      // Use natural section from category
      const categoryId = itemToCategoryMap[item.menu_item_id] || item.category_id;
      sectionNumber = categoryToSectionMap[categoryId] || 999;
      sectionName = sectionNameMap[sectionNumber] || '';
    }

    const groupKey = generateGroupingKey(item, sectionNumber);

    // DEBUG: Log section resolution for each item
    console.log('🏷️ Section Resolution:', {
      itemName: item.name,
      menu_item_id: item.menu_item_id,
      category_id: item.category_id,
      sectionNumber,
      sectionName,
      isOverride,
      originalSectionId,
      mapSizes: {
        itemToCategoryMap: Object.keys(itemToCategoryMap).length,
        categoryToSectionMap: Object.keys(categoryToSectionMap).length,
        sectionNameMap: Object.keys(sectionNameMap).length
      }
    });

    // Calculate unit price (base price without quantity multiplication)
    const unitPrice = item.basePrice || item.price || 0;

    if (isItemGroupable(item)) {
      // Try to group with existing identical items
      const existing = groupedMap.get(groupKey);

      if (existing) {
        // Add quantity to existing group
        existing.groupedQuantity += item.quantity;
        existing.groupedTotal = existing.unitPrice * existing.groupedQuantity;
      } else {
        // Create new group entry
        groupedMap.set(groupKey, {
          ...item,
          groupedQuantity: item.quantity,
          unitPrice,
          groupedTotal: unitPrice * item.quantity,
          isGrouped: false, // Will be set to true if more items join
          sectionNumber,
          sectionName,
          isOverride,
          originalSectionId
        });
      }
    } else {
      // Customized item - cannot be grouped, always displays individually
      const itemTotal = item.total || (unitPrice * item.quantity);
      ungroupedItems.push({
        ...item,
        groupedQuantity: item.quantity,
        unitPrice,
        groupedTotal: itemTotal,
        isGrouped: false,
        sectionNumber,
        sectionName,
        isOverride,
        originalSectionId
      });
    }
  }

  // Mark items that were actually grouped (quantity increased)
  const groupedValues = Array.from(groupedMap.values());
  for (const grouped of groupedValues) {
    grouped.isGrouped = grouped.groupedQuantity > 1;
  }

  // Combine grouped and ungrouped items, sort by section then by display_order within section
  const allItems = [...groupedValues, ...ungroupedItems];
  allItems.sort((a, b) => {
    // Primary sort by section number
    if (a.sectionNumber !== b.sectionNumber) {
      return a.sectionNumber - b.sectionNumber;
    }
    // Secondary sort by display_order within the same section
    return (a.display_order || 0) - (b.display_order || 0);
  });

  return allItems;
}

/**
 * Format section separator with centered name and dynamic-width dashes
 * Example: "---------- STARTERS -----------"
 * @param sectionName - The section name to display
 * @param charWidth - Character width of receipt (32 for 58mm, 42 for 80mm)
 */
function formatSectionSeparator(sectionName: string, charWidth: number): string {
  const label = ` ${sectionName.toUpperCase()} `;
  const labelLength = label.length;
  const availableWidth = Math.max(charWidth, labelLength + 4); // Minimum 2 dashes each side
  const totalDashes = availableWidth - labelLength;
  const leftDashes = Math.floor(totalDashes / 2);
  const rightDashes = totalDashes - leftDashes;
  return '-'.repeat(Math.max(1, leftDashes)) + label + '-'.repeat(Math.max(1, rightDashes));
}

// New interface for form-based thermal receipt data
interface ThermalReceiptFormData {
  // Business Information
  businessName: string;
  businessNameFont?: string;  // CMS font ID for business name (optional for backward compatibility)
  businessNameFontSize?: number;  // Font size in pixels (optional for backward compatibility)
  address: string;
  phone: string;
  email: string;
  website: string;
  vatNumber?: string;

  // Display toggles
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;

  // Logo
  logoImage?: string;
  logoPosition: 'left' | 'center' | 'right';
  logoWidth?: number;
  logoHeight?: number;

  // QR Codes - NOW USING PROPER TYPE
  qrCodes: QRCodeConfig[];
  headerQRCodes?: QRCodeConfig[];  // Separate header QR codes
  footerQRCodes?: QRCodeConfig[];  // Separate footer QR codes

  orderType: 'dine_in' | 'collection' | 'delivery' | 'waiting' | 'online_orders';
  receiptNumber?: string;
  tableNumber?: string;
  guestCount?: number;
  linkedTables?: number[];  // Linked table numbers for merged tables

  // Enhanced Order Source Tracking for POS Integration
  orderSource?: 'POS' | 'ONLINE' | 'AI_VOICE';

  // Enhanced Order Mode Support (matching thermal printer engine)
  // Accepts both dash and underscore formats for compatibility
  orderMode?: 'DINE-IN' | 'DINE_IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY';

  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  customerReference?: string;  // CRM reference number (CTRxxxxx)

  // Delivery-specific fields
  deliveryPostcode?: string;
  deliveryDistance?: string;
  deliveryNotes?: string;

  // Collection and Delivery Times
  collectionTime?: string;
  estimatedDeliveryTime?: string;

  // Queue number for waiting orders
  queueNumber?: number;

  // Special Instructions
  specialInstructions?: string;

  // Timestamp for order
  timestamp?: string;

  orderItems: Array<{
    id: string;
    name: string;
    basePrice: number;
    quantity: number;
    price?: number;
    total?: number;
    variant?: {
      id: string;
      name: string;
      price_adjustment: number;
    };
    customizations?: Array<{
      id: string;
      name: string;
      price: number;
      price_adjustment?: number;
      is_free?: boolean;
    }>;
    instructions?: string;
    notes?: string;
    // Category tracking for receipt section organization
    menu_item_id?: string;
    category_id?: string;
    // Kitchen display name for abbreviated printing
    kitchen_display_name?: string | null;
    // Display order for sorting items within sections on receipts
    display_order?: number;
    // Customer grouping for DINE-IN receipts
    customer_id?: string | null;
    customer_name?: string | null;
  }>;

  // Totals
  subtotal?: number;
  vatRate: number;
  serviceCharge: number;
  deliveryFee: number;
  discount: number;

  // Payment Status for PAID badge display
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL';

  // Receipt Format
  receiptFormat: 'front_of_house' | 'kitchen_customer' | 'kitchen';
  footerMessage: string;
  terms: string;
  socialMedia: string;

  // Custom Footer
  showCustomFooter?: boolean;
  customFooterText?: string;

  // Header Text
  headerText?: string;  // Custom header text/welcome message

  // Kitchen Copy Options (for takeaway modes)
  showContainerQtyField?: boolean;
  showCheckedField?: boolean;

  // Kitchen Section Visibility
  kitchenShowHeader?: boolean;
  kitchenShowBusinessInfo?: boolean;
  kitchenShowLogo?: boolean;
  kitchenShowQRCodes?: boolean;
  kitchenShowOrderInfo?: boolean;
  kitchenShowTableInfo?: boolean;
  kitchenShowCustomerDetails?: boolean;
  kitchenShowTiming?: boolean;
  kitchenShowSpecialInstructions?: boolean;
  kitchenShowTotals?: boolean;
  kitchenShowFooter?: boolean;

  // Kitchen Ticket Rail Settings
  kitchenTicketRailMargin?: number;
  kitchenShowPullTab?: boolean;

  // Kitchen Order Label
  showKitchenOrderLabel?: boolean;
  kitchenOrderLabelText?: string;

  // Receipt Number Visibility
  showReceiptNumber?: boolean;
  kitchenShowReceiptNumber?: boolean;

  // Font System
  selectedFont?: string;
  receiptFont: string;
  itemsFont: string;
  useItemsFont: boolean;
}

interface ThermalPreviewProps {
  elements?: CanvasElement[] | null;
  paperWidth: 58 | 80;
  orderData?: OrderData | null;
  // New props for form-based data
  formData?: ThermalReceiptFormData | null;
  mode?: 'canvas' | 'form'; // Choose rendering mode
  receiptFormat?: 'front_of_house' | 'kitchen_customer'; // Format selector
}

export default function ThermalPreview({ 
  elements, 
  paperWidth, 
  orderData, 
  formData, 
  mode = 'canvas',
  receiptFormat 
}: ThermalPreviewProps) {
  // Debug log to check what we're receiving
  console.log('ThermalPreview received:', { mode, formData, paperWidth, receiptFormat });
  
  // Build category → section order map from store (in-memory, no API calls)
  const { categories, menuItems } = useRealtimeMenuStoreCompat({ context: 'admin' });

  // DEBUG: Log store state on every render to track when data becomes available
  console.log('🏪 ThermalPreview - Store state:', {
    categoriesCount: categories.length,
    menuItemsCount: menuItems.length,
    sampleCategories: categories.slice(0, 5).map(c => ({ id: c.id?.slice(0, 8), name: c.name, parent: c.parent_category_id?.slice(0, 8) }))
  });
  
  // Build menu_item_id → category_id lookup
  const itemToCategoryMap = useMemo(() => {
    const map: {[menuItemId: string]: string} = {};
    menuItems.forEach(item => {
      if (item.id && item.category_id) {
        map[item.id] = item.category_id;
      }
    });
    return map;
  }, [menuItems]);
  
  const categoryToSectionMap = useMemo(() => {
    const map: {[categoryId: string]: number} = {};

    // Get set of section UUIDs to skip section-level categories
    const sectionUuids = new Set(FIXED_SECTIONS.map(s => s.uuid));

    categories.forEach(category => {
      // Skip section-level categories (they are the 7 main sections)
      if (category.id && sectionUuids.has(category.id)) {
        return;
      }

      // Use findRootSection for recursive lookup through category hierarchy
      // This handles: Item → Subcategory → Main Category → Section
      const rootSection = findRootSection(category.id, categories);
      if (rootSection) {
        // rootSection.order is 0-indexed, we want 1-indexed for display
        map[category.id] = rootSection.order + 1;
      } else {
        map[category.id] = 999; // Unmapped categories go to end
      }
    });

    return map;
  }, [categories]);
  
  // Build category_id → category_name lookup for category subheadings
  const categoryNameMap = useMemo(() => {
    const map: {[categoryId: string]: string} = {};
    categories.forEach(category => {
      if (category.id && category.name) {
        map[category.id] = category.name;
      }
    });
    return map;
  }, [categories]);

  // Build section number → section name lookup for receipt section separators
  // Uses actual database category names for sections (UUIDs from SECTION_UUID_MAP)
  const sectionNameMap = useMemo(() => {
    // Map section UUIDs to section numbers (1-indexed for display)
    const sectionUuidToNumber: {[uuid: string]: number} = {
      [SECTION_UUID_MAP['starters']]: 1,
      [SECTION_UUID_MAP['main-course']]: 2,
      [SECTION_UUID_MAP['side-dishes']]: 3,
      [SECTION_UUID_MAP['accompaniments']]: 4,
      [SECTION_UUID_MAP['desserts-coffee']]: 5,
      [SECTION_UUID_MAP['drinks-wine']]: 6,
      [SECTION_UUID_MAP['set-meals']]: 7,
    };

    const map: {[sectionNum: number]: string} = {};

    // Look up actual category names from database using UUIDs
    categories.forEach(category => {
      const sectionNum = sectionUuidToNumber[category.id];
      if (sectionNum && category.name) {
        map[sectionNum] = category.name;
      }
    });

    // Fallback names if database lookup fails
    if (!map[1]) map[1] = 'STARTERS';
    if (!map[2]) map[2] = 'MAIN COURSE';
    if (!map[3]) map[3] = 'SIDE DISHES';
    if (!map[4]) map[4] = 'ACCOMPANIMENTS';
    if (!map[5]) map[5] = 'DESSERTS & COFFEE';
    if (!map[6]) map[6] = 'DRINKS & WINE';
    if (!map[7]) map[7] = 'SET MEALS';

    return map;
  }, [categories]);

  // DEBUG: Log specific fields we're having trouble with
  if (mode === 'form' && formData) {
    console.log('🔍 DEBUG - Table and Guest Data:', {
      tableNumber: formData.tableNumber,
      guestCount: formData.guestCount,
      orderMode: formData.orderMode,
      orderType: formData.orderType
    });

    // DEBUG: Section separator mapping info
    console.log('🔍 DEBUG - Section Separator Maps:', {
      categoriesCount: categories.length,
      menuItemsCount: menuItems.length,
      itemToCategoryMapSize: Object.keys(itemToCategoryMap).length,
      categoryToSectionMapSize: Object.keys(categoryToSectionMap).length,
      sampleCategoryToSection: Object.entries(categoryToSectionMap).slice(0, 5),
      sampleItemToCategory: Object.entries(itemToCategoryMap).slice(0, 5),
      orderItemsWithCategoryInfo: (formData.orderItems || []).map(item => ({
        name: item.name,
        menu_item_id: item.menu_item_id,
        category_id: item.category_id,
        resolvedCategoryId: itemToCategoryMap[item.menu_item_id] || item.category_id,
        resolvedSection: categoryToSectionMap[itemToCategoryMap[item.menu_item_id] || item.category_id] || 999
      }))
    });
  }

  // Load business name font when it changes (CMS font for decorative business name)
  useEffect(() => {
    if (formData?.businessNameFont) {
      loadCmsFont(formData.businessNameFont);
    }
  }, [formData?.businessNameFont]);

  // If form mode and formData is provided, use form-based rendering
  if (mode === 'form' && formData) {
    // Use receiptFormat from props or formData
    const format = receiptFormat || formData.receiptFormat || 'front_of_house';
    return renderFormBasedReceipt(formData, paperWidth, format, categoryToSectionMap, itemToCategoryMap, categoryNameMap, sectionNameMap);
  }
  
  // Original canvas-based rendering for backward compatibility
  return renderCanvasBasedReceipt(elements, paperWidth, orderData);
}

// New function for form-based receipt rendering
function renderFormBasedReceipt(
  data: ThermalReceiptFormData,
  paperWidth: 58 | 80,
  receiptFormat: 'front_of_house' | 'kitchen_customer' | 'kitchen',
  categoryToSectionMap: {[key: string]: number} = {},
  itemToCategoryMap: {[key: string]: string} = {},
  categoryNameMap: {[key: string]: string} = {},
  sectionNameMap: {[key: number]: string} = {}
) {
  const charWidth = paperWidth === 58 ? 32 : 42;

  // Kitchen receipts use larger font (14px vs 11px) so need fewer chars to fit the same width
  // FOH: 11px font → 42 chars (80mm) or 32 chars (58mm)
  // Kitchen: 14px font → ~33 chars (80mm) or ~25 chars (58mm) - scaled by font ratio (11/14 ≈ 0.79)
  const isKitchenFormat = receiptFormat === 'kitchen_customer' || receiptFormat === 'kitchen';
  const separatorCharWidth = isKitchenFormat
    ? (paperWidth === 58 ? 25 : 33)  // Kitchen: smaller char count due to larger font
    : charWidth;                       // FOH: normal char count

  // Enhanced font selection with section-specific support
  const getReceiptFont = () => {
    if (data.useItemsFont) {
      // Use dedicated receipt font when in dual font mode
      return THERMAL_FONTS.find(f => f.family === data.receiptFont) || THERMAL_FONTS[0];
    } else {
      // Use single font for everything (legacy mode)
      return THERMAL_FONTS.find(f => f.family === data.receiptFont) ||
             THERMAL_FONTS.find(f => f.family === data.selectedFont) ||
             THERMAL_FONTS[0];
    }
  };

  const getItemsFont = () => {
    if (data.useItemsFont) {
      // Use dedicated items font when in dual font mode
      return THERMAL_FONTS.find(f => f.family === data.itemsFont) || THERMAL_FONTS[0];
    } else {
      // Use same font as receipt when in single font mode
      return getReceiptFont();
    }
  };

  const receiptFont = getReceiptFont();
  const itemsFont = getItemsFont();

  // Format-specific styling
  const isKitchenCustomer = receiptFormat === 'kitchen_customer';
  // Also check for 'kitchen' format from the toggle
  const isKitchenReceipt = isKitchenCustomer || receiptFormat === 'kitchen';
  const fontWeight = isKitchenReceipt ? 'font-bold' : 'font-normal';
  const fontSize = isKitchenReceipt ? 'text-base' : 'text-sm';
  const lineHeight = isKitchenReceipt ? 'leading-relaxed' : 'leading-normal';
  const headerSize = isKitchenReceipt ? 'text-lg font-black' : 'text-base font-bold';
  const itemNameWeight = isKitchenReceipt ? 'font-bold text-lg' : 'font-semibold';
  const modifierWeight = isKitchenReceipt ? 'font-medium' : 'font-normal';
  const restaurantInfoWeight = 'font-normal'; // Always normal for restaurant info

  // Kitchen visibility helpers - FOH always shows, kitchen uses configurable settings
  const shouldShowHeader = !isKitchenReceipt || data.kitchenShowHeader === true;
  const shouldShowBusinessInfo = !isKitchenReceipt || data.kitchenShowBusinessInfo === true;
  const shouldShowLogo = !isKitchenReceipt || data.kitchenShowLogo === true;
  const shouldShowQRCodes = !isKitchenReceipt || data.kitchenShowQRCodes === true;
  const shouldShowOrderInfo = !isKitchenReceipt || data.kitchenShowOrderInfo !== false;
  const shouldShowTableInfo = !isKitchenReceipt || data.kitchenShowTableInfo !== false;
  const shouldShowCustomerDetails = !isKitchenReceipt ||
    (data.orderMode === 'DELIVERY' ? data.kitchenShowCustomerDetails !== false : data.kitchenShowCustomerDetails === true);
  const shouldShowTiming = !isKitchenReceipt || data.kitchenShowTiming !== false;
  const shouldShowSpecialInstructions = !isKitchenReceipt || data.kitchenShowSpecialInstructions !== false;
  const shouldShowTotals = !isKitchenReceipt ||
    (data.orderMode === 'DINE-IN' ? data.kitchenShowTotals === true : data.kitchenShowTotals !== false);
  const shouldShowFooter = !isKitchenReceipt || data.kitchenShowFooter === true;

  // Helper function to align text
  const alignText = (text: string, align: 'left' | 'center' | 'right'): string => {
    const lines = text.split('\n');
    return lines.map(line => {
      if (align === 'center') {
        const padding = Math.max(0, Math.floor((charWidth - line.length) / 2));
        return ' '.repeat(padding) + line;
      } else if (align === 'right') {
        const padding = Math.max(0, charWidth - line.length);
        return ' '.repeat(padding) + line;
      }
      return line; // left align (default)
    }).join('\n');
  };
  
  // Helper function to render QR codes with positioning
  const renderQRCodes = (qrCodes: QRCodeConfig[], defaultAlign: 'left' | 'center' | 'right' = 'center') => {
    // FIX: Only exclude explicitly disabled QR codes (allows undefined/true to pass)
    return qrCodes
      .filter(qr => qr.enabled !== false)
      .map((qr, index) => {
        const qrSize = qr.size === 'small' ? 64 : qr.size === 'medium' ? 96 : 128;
        // FIX: Ensure position is always a valid value with explicit type
        const position: 'left' | 'center' | 'right' = qr.position || defaultAlign;

        return (
          <div key={qr.id || index} className="my-2" style={{ textAlign: position }}>
            {/* Use flexbox to ensure caption is always centered below QR code */}
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCodeSVG
                value={generateQRContent(qr)}
                size={qrSize}
                level="M"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
              {/* QR Code Caption - displays below the QR code */}
              {qr.caption && (
                <div className="mt-1" style={{ fontSize: '10px', fontWeight: 500, textAlign: 'center' }}>
                  {qr.caption}
                </div>
              )}
              {/* Type label for non-URL QR codes (only if no caption) */}
              {!qr.caption && qr.type !== 'url' && (
                <div className="text-xs mt-1" style={{ fontSize: '8px' }}>
                  {qr.type.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        );
      });
  };
  
  // Helper to generate QR content
  const generateQRContent = (qrCode: QRCodeConfig): string => {
    if (!qrCode.content.trim()) return 'Preview QR Code';

    switch (qrCode.type) {
      case 'wifi':
        return `WIFI:T:WPA;S:${qrCode.content.split(',')[0] || 'Network'};P:${qrCode.content.split(',')[1] || 'Password'};;`;
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${qrCode.content}\nEND:VCARD`;
      case 'url':
        return qrCode.content.startsWith('http') ? qrCode.content : `https://${qrCode.content}`;
      case 'text':
      default:
        return qrCode.content;
    }
  };

  // Helper to detect which courses are present in the order
  const detectCourses = (items: any[]) => {
    const hasStarters = items.some(item => {
      const categoryId = itemToCategoryMap[item.menu_item_id] || item.category_id;
      const section = categoryToSectionMap[categoryId];
      return section === 1;
    });
    const hasMains = items.some(item => {
      const categoryId = itemToCategoryMap[item.menu_item_id] || item.category_id;
      const section = categoryToSectionMap[categoryId];
      return [2, 3, 4, 7].includes(section);
    });
    const hasDesserts = items.some(item => {
      const categoryId = itemToCategoryMap[item.menu_item_id] || item.category_id;
      const section = categoryToSectionMap[categoryId];
      return [5, 6].includes(section);
    });
    return { hasStarters, hasMains, hasDesserts };
  };

  const calculateTotal = () => {
    const subtotal = data.subtotal || 0;
    const serviceCharge = data.serviceCharge || 0;
    const deliveryFee = data.deliveryFee || 0;
    const discount = data.discount || 0;
    const total = subtotal + serviceCharge + deliveryFee - discount;
    return total.toFixed(2);
  };
  
  return (
    <div 
      className={`mx-auto bg-white text-black p-4 rounded-lg shadow-lg ${fontSize} ${lineHeight} ${fontWeight}`}
      style={{
        width: paperWidth === 58 ? '224px' : '304px',
        fontFamily: receiptFont.cssFamily, // Apply receipt font as default
        fontSize: isKitchenReceipt ? '16px' : '12px',
        lineHeight: isKitchenReceipt ? '1.8' : '1.4',
        padding: isKitchenReceipt ? '20px' : '16px'
      }}
    >
      {/* Header QR Codes - Place at very top of receipt */}
      {shouldShowQRCodes && data.headerQRCodes && data.headerQRCodes.length > 0 && (
        <div className="space-y-2 mb-4" style={{ fontFamily: receiptFont.cssFamily }}>
          {renderQRCodes(data.headerQRCodes)}
        </div>
      )}

      {/* Logo Image - controlled independently by shouldShowLogo */}
      {shouldShowLogo && data.logoImage && (
        <div className={`mb-1 flex ${
          data.logoPosition === 'center' ? 'justify-center' :
          data.logoPosition === 'right' ? 'justify-end' :
          'justify-start'
        }`}>
          <img
            src={data.logoImage}
            alt="Restaurant Logo"
            className="max-w-full"
            style={{
              maxWidth: paperWidth === 58 ? '150px' : '200px',
              maxHeight: '80px',
              objectFit: 'contain',
              filter: 'contrast(1.2)' // Enhanced contrast without brightness reduction
            }}
          />
        </div>
      )}

      {/* Custom Header Text - controlled by shouldShowHeader */}
      {shouldShowHeader && data.headerText && (
        <div className="text-center mb-2" style={{ fontFamily: receiptFont.cssFamily }}>
          <div className={`${isKitchenReceipt ? 'text-base font-medium' : 'text-sm'}`}>
            {data.headerText}
          </div>
        </div>
      )}

      {/* Business Header - conditionally shown based on kitchen visibility settings */}
      {shouldShowBusinessInfo && (
        <div className="text-center mb-1" style={{ fontFamily: receiptFont.cssFamily }}>
          <h1
            className="mb-1"
            style={{
              fontFamily: data.businessNameFont
                ? getCmsFontFamily(data.businessNameFont)
                : receiptFont.cssFamily,
              fontSize: data.businessNameFontSize ? `${data.businessNameFontSize}px` : (isKitchenReceipt ? '18px' : '16px'),
              fontWeight: isKitchenReceipt ? 900 : 700,
              lineHeight: 1.1  // Tight line-height to prevent large fonts pushing content down
            }}
          >
            {data.businessName || 'Restaurant Name'}
          </h1>
          <div className={`${restaurantInfoWeight} text-xs leading-tight`} style={{ fontFamily: receiptFont.cssFamily }}>
            {data.address && (
              <div className="space-y-0">
                {parseAddressToMultiLine(data.address).map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}
            {data.phone && data.showPhone && <div>Tel: {data.phone}</div>}
            {data.email && data.showEmail && <div>{data.email}</div>}
            {data.website && data.showWebsite && <div>{data.website}</div>}
          </div>
        </div>
      )}

      {/* Kitchen Ticket Rail Pull Tab - Top margin for physical ticket rails */}
      {isKitchenReceipt && (data.kitchenTicketRailMargin ?? 15) > 0 && (
        <div
          style={{
            height: `${data.kitchenTicketRailMargin ?? 15}mm`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: '2mm'
          }}
        >
          {data.kitchenShowPullTab !== false && (
            <>
              <div style={{
                fontSize: '14px',
                letterSpacing: '8px',
                color: '#9CA3AF',
                fontFamily: receiptFont.cssFamily
              }}>
                ▲▲▲
              </div>
              <div style={{
                width: '100%',
                borderBottom: '1px solid #D1D5DB',
                marginTop: '2mm'
              }} />
            </>
          )}
        </div>
      )}

      {/* Order Information */}
      <div className={`mb-1 text-sm`} style={{ marginBottom: isKitchenReceipt ? '8px' : '4px' }}>
        {/* ORDER TYPE HEADER - Kitchen only, large & prominent */}
        {isKitchenReceipt && (
          <div className="text-center mb-3" style={{ fontFamily: receiptFont.cssFamily }}>
            <div style={{
              fontSize: '18px',
              letterSpacing: '0.2em',
              borderTop: '2px solid black',
              borderBottom: '2px solid black',
              padding: '8px 0',
              fontWeight: '900',
              textTransform: 'uppercase'
            }}>
              {(data.orderMode || data.orderType?.replace('_', '-').toUpperCase() || 'DINE-IN')
                .split('').join(' ')}
            </div>
          </div>
        )}

        {/* Receipt Number - respects visibility toggle */}
        {(isKitchenReceipt ? data.kitchenShowReceiptNumber !== false : data.showReceiptNumber !== false) && (
          <div className="text-center mb-2" style={{ fontFamily: receiptFont.cssFamily }}>
            <span
              className="font-bold text-lg"
              style={{
                fontSize: isKitchenReceipt ? '16px' : '18px',
                fontWeight: '700'
              }}
            >
              {data.receiptNumber || 'CT000000'}
            </span>
          </div>
        )}

        {/* Badges Row: Order Mode + Channel + Contextual chips */}
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          {/* Canonical Order Mode Badge - only for customer receipts (kitchen uses header above) */}
          {!isKitchenReceipt && (
            <span
              className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase"
              style={{
                backgroundColor: '#7C3AED',
                color: 'white',
                fontSize: '10px'
              }}
            >
              {data.orderMode || data.orderType?.replace('_', '-').toUpperCase() || 'DINE-IN'}
            </span>
          )}
          
          {/* Channel Badge - Only show for ONLINE orders */}
          {data.orderSource === 'ONLINE' && (
            <span
              className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase"
              style={{
                backgroundColor: '#10B981',
                color: 'white',
                fontSize: isKitchenReceipt ? '12px' : '10px'
              }}
            >
              ONLINE
            </span>
          )}
          
          {/* Conditional contextual chips based on Order Mode */}
          {/* Dine-In → Table & Covers info */}
          {/* Kitchen: Plain bold text for readability | FOH: Purple badges */}
          {/* Controlled by shouldShowTableInfo toggle for kitchen receipts */}
          {shouldShowTableInfo && (data.orderMode === 'DINE-IN' || (!data.orderMode && data.orderType === 'dine_in')) && (
            <>
              {isKitchenReceipt ? (
                /* Kitchen: Plain bold text - TABLE 2 • 3 COVERS */
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'black',
                    fontFamily: receiptFont.cssFamily
                  }}
                >
                  {data.tableNumber && `TABLE ${data.tableNumber}`}
                  {data.tableNumber && data.guestCount && data.guestCount > 0 && '  •  '}
                  {data.guestCount && data.guestCount > 0 && `${data.guestCount} COVERS`}
                  {data.linkedTables && data.linkedTables.length > 0 && (
                    <>  •  {data.linkedTables.map(t => `T${t}`).join(' + ')}</>
                  )}
                </span>
              ) : (
                /* FOH: Purple badges */
                <>
                  {data.tableNumber && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase"
                      style={{
                        backgroundColor: '#7C3AED',
                        color: 'white',
                        fontSize: '10px'
                      }}
                    >
                      TABLE {data.tableNumber}
                    </span>
                  )}
                  {data.guestCount && data.guestCount > 0 && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase"
                      style={{
                        backgroundColor: '#7C3AED',
                        color: 'white',
                        fontSize: '10px'
                      }}
                    >
                      {data.guestCount} Covers
                    </span>
                  )}
                  {/* Linked Tables Display */}
                  {data.linkedTables && data.linkedTables.length > 0 && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: '#2563EB',
                        color: 'white',
                        fontSize: '10px'
                      }}
                    >
                      {data.linkedTables.map(t => `T${t}`).join(' + ')}
                    </span>
                  )}
                </>
              )}
            </>
          )}
          
          {/* Delivery → [ETA 30–45m] [+ Address if present] */}
          {/* Controlled by shouldShowTiming toggle for kitchen receipts */}
          {shouldShowTiming && (data.orderMode === 'DELIVERY' || data.orderType === 'delivery') && (
            <>
              {data.estimatedDeliveryTime && (
                <span
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontSize: isKitchenReceipt ? '12px' : '10px'
                  }}
                >
                  ETA {data.estimatedDeliveryTime}
                </span>
              )}
            </>
          )}

          {/* Collection → [ASAP/Slot] */}
          {/* Controlled by shouldShowTiming toggle for kitchen receipts */}
          {shouldShowTiming && (data.orderMode === 'COLLECTION' || data.orderType === 'collection') && (
            <>
              {/* Only show collection time if it's NOT 'ASAP' (hide default ASAP values) */}
              {data.collectionTime && data.collectionTime.toUpperCase() !== 'ASAP' && (
                <span
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                    fontSize: isKitchenReceipt ? '12px' : '10px'
                  }}
                >
                  {data.collectionTime}
                </span>
              )}
            </>
          )}
          
          {/* Waiting → [Queue #N if present] */}
          {data.orderMode === 'WAITING' && (
            <>
              {data.queueNumber && (
                <span
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    fontSize: isKitchenReceipt ? '12px' : '10px'
                  }}
                >
                  Queue #{data.queueNumber}
                </span>
              )}
            </>
          )}

          {/* PAID Badge - Show prominently when payment is confirmed */}
          {data.paymentStatus === 'PAID' && (
            <span
              className="inline-flex items-center px-3 py-1 rounded text-xs font-black uppercase"
              style={{
                backgroundColor: '#10B981',
                color: 'white',
                fontSize: isKitchenReceipt ? '14px' : '12px',
                border: '2px solid #059669',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
            >
              ✓ PAID
            </span>
          )}

          {/* PARTIAL Payment Badge */}
          {data.paymentStatus === 'PARTIAL' && (
            <span
              className="inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase"
              style={{
                backgroundColor: '#F59E0B',
                color: 'white',
                fontSize: isKitchenReceipt ? '14px' : '12px',
                border: '2px solid #D97706'
              }}
            >
              PARTIAL
            </span>
          )}
        </div>
        
        {/* Merged Date + Time on one line - controlled by kitchen visibility */}
        {shouldShowOrderInfo && (
          <div className="text-center text-xs" style={{ fontFamily: receiptFont.cssFamily, marginBottom: isKitchenReceipt ? '4px' : '2px' }}>
            <span style={{ fontWeight: 'normal' }}>
              {(() => {
                // Use timestamp from data if available, otherwise use current time
                const orderDate = data.timestamp ? new Date(data.timestamp) : new Date();
                return `${orderDate.toLocaleDateString('en-GB')} • ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              })()}
            </span>
          </div>
        )}
      </div>

      {/* Special Instructions (prominently displayed for kitchen) - controlled by kitchen visibility */}
      {shouldShowSpecialInstructions && data.specialInstructions && (
        <div className={`mb-2 p-2 border-2 border-dashed border-red-500 ${isKitchenReceipt ? 'text-base font-bold' : 'text-sm'}`}>
          <div className="text-center font-bold mb-1">SPECIAL INSTRUCTIONS</div>
          <div className="text-center">{data.specialInstructions}</div>
        </div>
      )}

      {/* Customer Information - controlled by kitchen visibility */}
      {shouldShowCustomerDetails && (data.customerName || data.customerPhone) && (
        <>
          <div className={`space-y-1 mb-1 ${isKitchenReceipt ? 'text-base font-bold' : 'text-sm'}`}>
            {data.customerName && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className={itemNameWeight}>{data.customerName}</span>
              </div>
            )}
            {data.customerPhone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{data.customerPhone}</span>
              </div>
            )}
            {data.customerReference && (
              <div className="flex justify-between">
                <span>Ref:</span>
                <span className={itemNameWeight}>{data.customerReference}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delivery Address - Only show for DELIVERY orders - controlled by kitchen visibility */}
      {shouldShowCustomerDetails && (data.orderMode === 'DELIVERY' || data.orderType === 'delivery') && data.deliveryAddress && (
        <>
          <div className={`mb-2 p-2 border-2 ${isKitchenReceipt ? 'border-black bg-gray-50' : 'border-gray-300'} ${isKitchenReceipt ? 'text-base font-bold' : 'text-sm'}`}>
            <div className={`font-bold mb-1 text-center ${isKitchenReceipt ? 'text-lg underline' : 'text-sm'}`}>
              🚗 DELIVERY ADDRESS
            </div>
            <div className={`${isKitchenReceipt ? 'font-medium text-base' : 'font-normal text-sm'}`}>
              {parseAddressToMultiLine(data.deliveryAddress).map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>

            {/* Postcode - Emphasized display for drivers */}
            {data.deliveryPostcode && (
              <div
                className={`mt-2 text-center font-black ${isKitchenReceipt ? 'text-lg bg-yellow-200 p-1 border-2 border-yellow-400' : 'text-base font-bold'}`}
              >
                {data.deliveryPostcode}
              </div>
            )}

            {/* Delivery Distance */}
            {data.deliveryDistance && (
              <div className={`mt-1 text-center ${isKitchenReceipt ? 'text-sm font-medium' : 'text-xs'}`}>
                Distance: {data.deliveryDistance}
              </div>
            )}

            {/* Delivery Notes / Driver Instructions */}
            {data.deliveryNotes && (
              <div
                className={`mt-2 p-2 border-2 border-dashed ${isKitchenReceipt ? 'border-orange-500 bg-orange-50 text-base' : 'border-gray-400 text-sm'}`}
              >
                <div className={`font-bold ${isKitchenReceipt ? 'text-orange-700' : 'text-gray-700'}`}>
                  📋 DRIVER NOTES:
                </div>
                <div className={isKitchenReceipt ? 'font-medium' : ''}>
                  {data.deliveryNotes}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Order Items - Apply itemsFont specifically to this section */}
      <div 
        className={`space-y-1 mb-1 ${isKitchenReceipt ? 'text-base' : 'text-sm'}`}
        style={{ fontFamily: itemsFont.cssFamily }} // Apply items font to the entire order items section
      >
        {/* Show label if: customer receipt OR kitchen with showKitchenOrderLabel enabled */}
        {(!isKitchenReceipt || data.showKitchenOrderLabel !== false) && (
          <div className={`${headerSize} text-left mb-1`} style={{ fontFamily: receiptFont.cssFamily }}>
            {isKitchenReceipt
              ? (data.kitchenOrderLabelText || 'KITCHEN ORDER')
              : 'ORDER ITEMS'}
          </div>
        )}
        
        {data.orderItems && data.orderItems.length > 0 ? (
          (() => {
            // Check if we have customer-grouped data (DINE-IN with customer tabs)
            const hasCustomerData = data.orderItems.some((item: any) => item.customer_id || item.customer_name);
            
            if (hasCustomerData && (data.orderMode === 'DINE-IN' || data.orderType === 'dine_in')) {
              // CUSTOMER-GROUPED RENDERING
              const customerGroups = data.orderItems.reduce((groups: any, item: any) => {
                const customerId = item.customer_id || 'ungrouped';
                const customerName = item.customer_name || 'Other Items';
                
                if (!groups[customerId]) {
                  groups[customerId] = {
                    customerName,
                    items: []
                  };
                }
                groups[customerId].items.push(item);
                return groups;
              }, {});
              
              // Render each customer's items WITH SECTION SEPARATORS
              return Object.entries(customerGroups).map(([customerId, group]: [string, any]) => {
                // Apply section mapping to this customer's items
                const customerGroupedItems = groupReceiptItems(
                  group.items,
                  categoryToSectionMap,
                  itemToCategoryMap,
                  sectionNameMap
                );

                // Track current section for this customer's items
                let customerCurrentSection: number | null = null;

                return (
                  <div key={customerId} className="mb-4">
                    {/* Customer Name Header */}
                    <div
                      className={`text-left font-bold border-b-2 border-gray-400 pb-1 mb-2 ${
                        isKitchenReceipt ? 'text-lg' : 'text-sm'
                      }`}
                      style={{
                        fontFamily: receiptFont.cssFamily,
                        fontSize: isKitchenReceipt ? '16px' : '13px'
                      }}
                    >
                      👤 {group.customerName}
                    </div>

                    {/* Render this customer's items with section separators */}
                    <div className="space-y-1">
                      {customerGroupedItems.map((item: GroupedReceiptItem, idx: number) => {
                        // Determine if we need a section separator
                        const showSeparator = item.sectionNumber !== customerCurrentSection && item.sectionNumber !== 999;
                        if (item.sectionNumber !== 999) {
                          customerCurrentSection = item.sectionNumber;
                        }

                        // Determine display name for customer-grouped items:
                        // - Kitchen receipts: use kitchen_display_name (abbreviated) if available
                        // - Front of house: always use full item name
                        // - If section is overridden, append original section indicator (e.g., "Chicken Tikka (st)")
                        const customerItemDisplayName = (() => {
                          const baseName = (isKitchenReceipt && item.kitchen_display_name)
                            ? item.kitchen_display_name
                            : item.name;

                          // Add indicator if item has section override (served with different section)
                          if (isKitchenReceipt && item.isOverride && item.originalSectionId) {
                            const indicator = SECTION_INDICATORS[item.originalSectionId as SectionId];
                            if (indicator) {
                              return `${baseName} (${indicator})`;
                            }
                          }
                          return baseName;
                        })();

                        return (
                          <div key={item.id || idx}>
                            {/* Section Separator - Centered with dynamic-width dashes */}
                            {showSeparator && item.sectionName && (
                              <div
                                className={`my-2 ${isKitchenReceipt ? 'font-bold' : 'font-medium'}`}
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: isKitchenReceipt ? '14px' : '11px',
                                  whiteSpace: 'pre',
                                  letterSpacing: '0',
                                }}
                              >
                                {formatSectionSeparator(item.sectionName, separatorCharWidth)}
                              </div>
                            )}

                            <div className="mb-1">
                              <div className="flex justify-between items-start" style={{ fontFamily: itemsFont.cssFamily }}>
                                <span
                                  className={`${itemNameWeight}`}
                                  style={{
                                    fontSize: isKitchenReceipt ? '18px' : undefined,
                                    fontWeight: isKitchenReceipt ? 'bold' : undefined,
                                    fontFamily: itemsFont.cssFamily
                                  }}
                                >
                                  {item.groupedQuantity > 1 ? `${item.groupedQuantity} x ` : `${item.groupedQuantity} `}{customerItemDisplayName || '[Missing Item Name]'}
                                </span>
                                {!(isKitchenReceipt && data.orderMode === 'DINE-IN') && (
                                  <span
                                    className={`${isKitchenReceipt ? 'font-bold text-base' : 'font-medium'}`}
                                    style={{ fontFamily: itemsFont.cssFamily }}
                                  >
                                    £{item.groupedTotal?.toFixed(2) || '0.00'}
                                  </span>
                                )}
                              </div>

                              {item.customizations && item.customizations.length > 0 && (
                                <div className="ml-4 space-y-0" style={{ fontFamily: itemsFont.cssFamily }}>
                                  {item.customizations.map((customization: any, custIndex: number) => (
                                    <div key={custIndex} className="flex justify-between text-sm">
                                      <span className={`${isKitchenReceipt ? 'font-bold text-orange-800' : 'font-normal'} text-gray-700`}>
                                        + {customization.name}
                                      </span>
                                      {/* Only show price for customizations with actual cost (hide £0.00 for free items) */}
                                      {!(isKitchenReceipt && data.orderMode === 'DINE-IN') &&
                                        !customization.is_free &&
                                        (customization.price_adjustment ?? customization.price) != null &&
                                        (customization.price_adjustment ?? customization.price) > 0 && (
                                        <span className={`${isKitchenReceipt ? 'font-bold text-orange-800' : 'font-normal'} text-gray-700`}>
                                          £{(customization.price_adjustment ?? customization.price).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {(item.instructions || item.notes) && (
                                <div className={
                                  isKitchenReceipt ?
                                    'ml-4 font-black text-base bg-yellow-200 p-2 rounded border-2 border-yellow-400 text-yellow-900' :
                                    'ml-4 text-xs text-gray-600 italic'
                                }>
                                  {isKitchenReceipt ? '⚠️ SPECIAL NOTE: ' : 'Special Note: '}
                                  <span className={isKitchenReceipt ? 'font-black uppercase' : 'normal-case'}>
                                    {item.instructions || item.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            }
            
            // NO CUSTOMER GROUPING - Item list with section separators
            // Apply SMART ITEM GROUPING: consolidate identical plain items
            const groupedItems = groupReceiptItems(
              data.orderItems,
              categoryToSectionMap,
              itemToCategoryMap,
              sectionNameMap
            );

            // Track current section for separator rendering
            let currentSection: number | null = null;

            return (
              <div className="space-y-1">
                {groupedItems.map((item: GroupedReceiptItem, idx: number) => {
                  // Determine if we need a section separator
                  const showSeparator = item.sectionNumber !== currentSection && item.sectionNumber !== 999;
                  if (item.sectionNumber !== 999) {
                    currentSection = item.sectionNumber;
                  }

                  // Determine display name based on receipt format:
                  // - Kitchen receipts: use kitchen_display_name (abbreviated) if available
                  // - Front of house: always use full item name
                  // - If section is overridden, append original section indicator (e.g., "Chicken Tikka (st)")
                  const displayName = (() => {
                    let baseName: string;

                    // For kitchen receipts, use abbreviated kitchen_display_name if available
                    if (isKitchenReceipt && item.kitchen_display_name) {
                      baseName = item.kitchen_display_name;
                    } else if (!item.variant?.name) {
                      // Front of house or no kitchen_display_name: use full item name
                      // If no variant info exists, use name as-is
                      baseName = item.name;
                    } else {
                      // Check if item.name already contains variant info (modern data format)
                      const nameUpper = item.name.toUpperCase();
                      const variantUpper = item.variant.name.toUpperCase();

                      // If name already contains the variant name, use as-is (modern format)
                      if (nameUpper.includes(variantUpper) || nameUpper === variantUpper) {
                        baseName = item.name;
                      } else {
                        // Legacy fallback: append variant name for older data format
                        baseName = `${item.name} (${item.variant.name})`;
                      }
                    }

                    // Add indicator if item has section override (served with different section)
                    if (isKitchenReceipt && item.isOverride && item.originalSectionId) {
                      const indicator = SECTION_INDICATORS[item.originalSectionId as SectionId];
                      if (indicator) {
                        return `${baseName} (${indicator})`;
                      }
                    }
                    return baseName;
                  })();

                  return (
                    <div key={item.id || idx}>
                      {/* Section Separator - Centered with dynamic-width dashes */}
                      {showSeparator && item.sectionName && (
                        <div
                          className={`my-2 ${isKitchenReceipt ? 'font-bold' : 'font-medium'}`}
                          style={{
                            fontFamily: 'monospace',
                            fontSize: isKitchenReceipt ? '14px' : '11px',
                            whiteSpace: 'pre',
                            letterSpacing: '0',
                          }}
                        >
                          {formatSectionSeparator(item.sectionName, separatorCharWidth)}
                        </div>
                      )}

                      {/* Item Row - Smart Grouping Format */}
                      <div className="mb-1">
                        <div className="flex justify-between items-start" style={{ fontFamily: itemsFont.cssFamily }}>
                          <span
                            className={`${itemNameWeight}`}
                            style={{
                              fontSize: isKitchenReceipt ? '18px' : undefined,
                              fontWeight: isKitchenReceipt ? 'bold' : undefined,
                              fontFamily: itemsFont.cssFamily
                            }}
                          >
                            {/* Smart grouping display format */}
                            {item.isGrouped
                              ? `${item.groupedQuantity} ${displayName} (£${item.unitPrice.toFixed(2)} ea)`
                              : `${item.groupedQuantity} ${displayName || '[Missing Item Name]'}`
                            }
                          </span>
                          {!(isKitchenReceipt && data.orderMode === 'DINE-IN') && (
                            <span
                              className={`${isKitchenReceipt ? 'font-bold text-base' : 'font-medium'}`}
                              style={{ fontFamily: itemsFont.cssFamily }}
                            >
                              £{item.groupedTotal.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Customizations - only shown for non-grouped items */}
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="ml-4 space-y-0" style={{ fontFamily: itemsFont.cssFamily }}>
                            {item.customizations.map((customization: any, custIndex: number) => (
                              <div key={custIndex} className="flex justify-between text-sm">
                                <span className={`${isKitchenReceipt ? 'font-bold text-orange-800' : 'font-normal'} text-gray-700`}>
                                  + {customization.name}
                                </span>
                                {/* Only show price for customizations with actual cost (hide £0.00 for free items) */}
                                {!(isKitchenReceipt && data.orderMode === 'DINE-IN') &&
                                  !customization.is_free &&
                                  (customization.price_adjustment ?? customization.price) != null &&
                                  (customization.price_adjustment ?? customization.price) > 0 && (
                                  <span className={`${isKitchenReceipt ? 'font-bold text-orange-800' : 'font-normal'} text-gray-700`}>
                                    £{(customization.price_adjustment ?? customization.price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Special instructions - only shown for non-grouped items */}
                        {(item.instructions || item.notes) && (
                          <div className={
                            isKitchenReceipt ?
                              'ml-4 font-black text-base bg-yellow-200 p-2 rounded border-2 border-yellow-400 text-yellow-900' :
                              'ml-4 text-xs text-gray-600 italic'
                          }>
                            {isKitchenReceipt ? '⚠️ SPECIAL NOTE: ' : 'Special Note: '}
                            <span className={isKitchenReceipt ? 'font-black uppercase' : 'normal-case'}>
                              {item.instructions || item.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : (
          <div className="text-gray-500 italic">No items</div>
        )}
      </div>

      {/* Totals - Controlled by shouldShowTotals toggle */}
      {/* FOH always shows, Kitchen shows based on kitchenShowTotals setting (default OFF for dine-in) */}
      {shouldShowTotals && (() => {
        // Calculate subtotal from orderItems (don't trust formData.subtotal as it may be 0)
        // Use item.total which already includes quantity × base price + customizations
        const calculatedSubtotal = (data.orderItems || []).reduce((sum, item) => {
          // Prefer item.total (pre-calculated), fallback to price × quantity
          const itemTotal = typeof item.total === 'number' ? item.total :
            (typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0) *
            (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1);
          return sum + itemTotal;
        }, 0);
        
        const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (data.subtotal || 0);
        const serviceCharge = data.serviceCharge || 0;
        const deliveryFee = data.deliveryFee || 0;
        const discount = data.discount || 0;
        const grandTotal = subtotal + serviceCharge + deliveryFee - discount;
        
        return (
          <div 
            className={`space-y-1 ${isKitchenReceipt ? 'text-base font-bold' : 'text-sm'}`}
            style={{ fontFamily: receiptFont.cssFamily }} // Apply receipt font to totals section
          >
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            {data.serviceCharge > 0 && (
              <div className="flex justify-between">
                <span>Service Charge:</span>
                <span>£{data.serviceCharge.toFixed(2)}</span>
              </div>
            )}
            {data.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>£{data.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {data.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-£{data.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-1">
              <div className={`flex justify-between ${isKitchenReceipt ? 'text-lg font-black' : 'text-base font-bold'}`}>
                <span>TOTAL:</span>
                <span>£{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Smart Course Indicator - Kitchen receipts only */}
      {isKitchenReceipt && data.orderItems && data.orderItems.length > 0 && (() => {
        const { hasStarters, hasMains, hasDesserts } = detectCourses(data.orderItems);
        return (
          <div
            className="mt-3 border-t border-dashed border-gray-600 pt-2"
            style={{ fontFamily: receiptFont.cssFamily }}
          >
            <div className="flex justify-center items-center text-sm font-bold">
              <span>Starters: {hasStarters ? '☒' : '☐'}</span>
              <span className="mx-2">|</span>
              <span>Mains: {hasMains ? '☒' : '☐'}</span>
              <span className="mx-2">|</span>
              <span>Desserts: {hasDesserts ? '☒' : '☐'}</span>
            </div>
          </div>
        );
      })()}

      {/* Kitchen QC Footer - Takeaway orders only (WAITING, COLLECTION, DELIVERY) */}
      {isKitchenReceipt &&
       ['WAITING', 'COLLECTION', 'DELIVERY'].includes(data.orderMode || '') &&
       (data.showContainerQtyField !== false || data.showCheckedField !== false) && (
        <div
          className="mt-2 pt-2"
          style={{ fontFamily: receiptFont.cssFamily }}
        >
          <div className="text-center text-sm font-medium whitespace-nowrap">
            {data.showContainerQtyField !== false && (
              <span>QTY: [____]</span>
            )}
            {data.showContainerQtyField !== false && data.showCheckedField !== false && (
              <span className="mx-3">|</span>
            )}
            {data.showCheckedField !== false && (
              <span>Checked: ☐</span>
            )}
          </div>
        </div>
      )}

      {/* Footer - Use receiptFont for footer content - controlled by kitchen visibility */}
      {shouldShowFooter && (data.footerMessage || data.terms || (data.showCustomFooter && data.customFooterText)) && (
        <>
          <div
            className={`text-center mt-1 ${isKitchenReceipt ? 'text-sm font-medium' : 'text-xs'}`}
            style={{ fontFamily: receiptFont.cssFamily }} // Apply receipt font to footer
          >
            {data.footerMessage && (
              <div className={isKitchenReceipt ? 'font-bold' : ''}>
                {data.footerMessage}
              </div>
            )}
            {data.terms && (
              <div className="text-gray-600">
                {data.terms}
              </div>
            )}
            {/* Custom Footer Text - Flexible replacement for hard-coded messages */}
            {data.showCustomFooter && data.customFooterText && (
              <div className="text-gray-700 font-medium mt-1">
                {data.customFooterText}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer QR Codes - Read from footerQRCodes array - controlled by kitchen visibility */}
      {shouldShowQRCodes && data.footerQRCodes &&
       data.footerQRCodes.length > 0 && (
        <>
          <div className="border-t border-black my-3" />
          <div className="space-y-2" style={{ fontFamily: receiptFont.cssFamily }}>
            {renderQRCodes(data.footerQRCodes)}
          </div>
        </>
      )}
    </div>
  );
}

// New smart address parsing function - Add after line 22
function parseAddressToMultiLine(address: string): string[] {
  if (!address || typeof address !== 'string') return [];
  
  // First check if the user has used manual line breaks (\n)
  if (address.includes('\n')) {
    // User has manually formatted with line breaks - preserve their formatting
    return address
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  
  // Otherwise, split on commas for smart auto-formatting
  const lines = address
    .split(',')
    .map(line => line.trim())
    .filter(line => line.length > 0);
    
  return lines;
}

// Original canvas-based rendering function
function renderCanvasBasedReceipt(
  elements: CanvasElement[] | null, 
  paperWidth: 58 | 80, 
  orderData: OrderData | null
) {
  // Provide safe defaults for props
  const safeElements = elements || [];
  const safeOrderData = orderData || {
    order_id: 'PREVIEW-001',
    order_type: 'dine_in',
    customer_name: 'Preview Customer',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    total: '0.00',
    items: []
  };
  
  // Sort elements by their Y position to render in correct order
  const sortedElements = [...safeElements].sort((a, b) => a.y - b.y);
  
  // Calculate character width based on paper size
  const charWidth = paperWidth === 58 ? 32 : 42; // Characters per line
  
  // Helper function to replace dynamic fields with actual data
  const replaceDynamicFields = (text: string): string => {
    return text
      .replace(/\{order\.id\}/g, safeOrderData.order_id)
      .replace(/\{order\.type\}/g, safeOrderData.order_type.toUpperCase())
      .replace(/\{order\.date\}/g, safeOrderData.date)
      .replace(/\{order\.time\}/g, safeOrderData.time)
      .replace(/\{order\.total\}/g, `£${safeOrderData.total}`)
      .replace(/\{customer\.name\}/g, safeOrderData.customer_name)
      .replace(/\{items\.list\}/g, formatItemsList())
      .replace(/\{items\.simple\}/g, formatItemsSimple())
      .replace(/\{items\.compact\}/g, formatItemsCompact());
  };
  
  // Format items list for detailed display
  const formatItemsList = (): string => {
    return safeOrderData.items.map(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const price = `£${item.price}`;
      const maxItemWidth = charWidth - price.length - 1;
      const truncatedItem = itemLine.length > maxItemWidth 
        ? itemLine.substring(0, maxItemWidth - 3) + '...'
        : itemLine;
      const spaces = ' '.repeat(Math.max(0, charWidth - truncatedItem.length - price.length));
      return `${truncatedItem}${spaces}${price}`;
    }).join('\n');
  };
  
  // Format items list for simple display
  const formatItemsSimple = (): string => {
    return safeOrderData.items.map(item => 
      `${item.quantity}x ${item.name}`
    ).join('\n');
  };
  
  // Format items list for compact display
  const formatItemsCompact = (): string => {
    return safeOrderData.items.map(item => 
      `${item.quantity}x ${item.name.substring(0, 15)}... £${item.price}`
    ).join('\n');
  };
  
  // Helper function to align text
  const alignText = (text: string, align: string): string => {
    const lines = text.split('\n');
    return lines.map(line => {
      if (align === 'center') {
        const padding = Math.max(0, Math.floor((charWidth - line.length) / 2));
        return ' '.repeat(padding) + line;
      } else if (align === 'right') {
        const padding = Math.max(0, charWidth - line.length);
        return ' '.repeat(padding) + line;
      }
      return line; // left align (default)
    }).join('\n');
  };
  
  // Helper function to add padding
  const addPadding = (text: string, element: CanvasElement): string => {
    const style = element.style;
    let result = text;
    
    // Add top margin/padding
    if (style.margin_top || style.padding_top) {
      const topLines = Math.ceil((style.margin_top || 0) + (style.padding_top || 0)) / 10;
      result = '\n'.repeat(Math.max(0, topLines)) + result;
    }
    
    // Add bottom margin/padding
    if (style.margin_bottom || style.padding_bottom) {
      const bottomLines = Math.ceil((style.margin_bottom || 0) + (style.padding_bottom || 0)) / 10;
      result = result + '\n'.repeat(Math.max(0, bottomLines));
    }
    
    return result;
  };
  
  return (
    <div className="p-3 text-black" style={{
      fontFamily: 'Courier, monospace',
      fontSize: paperWidth === 58 ? '9px' : '11px',
      lineHeight: '1.1',
      whiteSpace: 'pre-wrap',
      letterSpacing: '0.5px'
    }}>
      {sortedElements.map((element, index) => {
        const processedText = replaceDynamicFields(element.data?.text || '');
        const alignedText = alignText(processedText, element.style.text_align);
        const paddedText = addPadding(alignedText, element);
        
        return (
          <div 
            key={element.id || index}
            style={{
              fontWeight: element.style.font_weight,
              fontSize: element.style.font_size ? `${Math.max(8, element.style.font_size - 2)}px` : undefined,
              backgroundColor: element.style.background_color !== 'transparent' 
                ? element.style.background_color 
                : undefined,
              color: element.style.color,
              fontFamily: element.style.font_family === 'Courier' 
                ? 'Courier, monospace' 
                : element.style.font_family,
              marginBottom: '2px'
            }}
          >
            {paddedText}
          </div>
        );
      })}
      
      {/* Add separator line at bottom */}
      <div className="mt-2 text-center text-gray-600" style={{ fontSize: '8px' }}>
        {'='.repeat(charWidth)}
      </div>
      
      {/* Footer info */}
      <div className="mt-1 text-center text-gray-500" style={{ fontSize: '7px' }}>
        Thermal Preview • {paperWidth}mm Paper
      </div>
    </div>
  );
}
