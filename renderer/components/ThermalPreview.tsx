import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { THERMAL_FONTS } from 'utils/thermalFonts';
import { QSAITheme } from 'utils/QSAIDesign';
import brain from 'brain';

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

// New interface for form-based thermal receipt data
interface ThermalReceiptFormData {
  // Business Information
  businessName: string;
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
  
  // QR Codes
  qrCodes: Array<{
    id: string;
    title: string;
    content: string;
    size: number;
    position: 'header' | 'footer';
    placement: 'left' | 'center' | 'right';
  }>;
  
  orderType: 'dine_in' | 'collection' | 'delivery';
  receiptNumber?: string;
  tableNumber?: string;
  guestCount?: number;
  
  // Enhanced Order Source Tracking for POS Integration
  orderSource?: 'POS' | 'ONLINE' | 'AI_VOICE';
  
  // Enhanced Order Mode Support (matching thermal printer engine)
  orderMode?: 'DINE-IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY';
  
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  
  // Collection and Delivery Times
  collectionTime?: string;
  estimatedDeliveryTime?: string;
  
  // Queue number for waiting orders
  queueNumber?: number;
  
  // Special Instructions
  specialInstructions?: string;
  
  orderItems: Array<{
    id: string;
    name: string;
    basePrice: number;
    quantity: number;
    variant?: {
      id: string;
      name: string;
      price_adjustment: number;
    };
    customizations?: Array<{
      id: string;
      name: string;
      price: number;
    }>;
    instructions?: string;
  }>;
  
  vatRate: number;
  serviceCharge: number;
  deliveryFee: number;
  discount: number;
  
  // Receipt Format
  receiptFormat: 'front_of_house' | 'kitchen_customer';
  footerMessage: string;
  terms: string;
  socialMedia: string;
  
  // Font System
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
  
  // State for category section mappings
  const [sectionMappings, setSectionMappings] = useState<{[key: string]: number}>({});
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  
  // Load section mappings when component mounts
  useEffect(() => {
    const loadSectionMappings = async () => {
      if (isLoadingMappings) return;
      
      setIsLoadingMappings(true);
      try {
        const response = await brain.get_category_section_mappings();
        const result = await response.json();
        
        console.log('🔍 Section mappings API response:', result);
        
        if (result.success && result.mappings && result.mappings.length > 0) {
          // Create a lookup map: menu_item_id -> section_order
          const itemToSectionMap: {[key: string]: number} = {};
          
          // We need to fetch menu items to map menu_item_id to category
          const menuResponse = await brain.get_real_menu_data();
          const menuResult = await menuResponse.json();
          
          console.log('🔍 Menu data API response:', menuResult);
          
          if (menuResult.success && menuResult.menu_items) {
            // Create category_id to section mapping
            const categoryToSection: {[key: string]: number} = {};
            result.mappings.forEach((mapping: any) => {
              categoryToSection[mapping.category_id] = mapping.print_order;
            });
            
            // Map menu_item_id to section using category_id
            menuResult.menu_items.forEach((item: any) => {
              const sectionOrder = categoryToSection[item.category_id] || 999;
              itemToSectionMap[item.id] = sectionOrder;
            });
            
            setSectionMappings(itemToSectionMap);
            console.log('🎯 Section mappings loaded:', itemToSectionMap);
          } else {
            console.warn('⚠️ Menu data API failed or returned no items');
          }
        } else {
          console.warn('⚠️ Section mappings API failed or returned no mappings');
        }
      } catch (error) {
        console.error('❌ Failed to load section mappings:', error);
        // Fallback to simple alphabetical sorting
        setSectionMappings({});
      } finally {
        setIsLoadingMappings(false);
      }
    };
    
    loadSectionMappings();
  }, []);
  
  // DEBUG: Log specific fields we're having trouble with
  if (mode === 'form' && formData) {
    console.log('🔍 DEBUG - Table and Guest Data:', {
      tableNumber: formData.tableNumber,
      guestCount: formData.guestCount,
      orderMode: formData.orderMode,
      orderType: formData.orderType
    });
  }
  
  // If form mode and formData is provided, use form-based rendering
  if (mode === 'form' && formData) {
    // Use receiptFormat from props or formData
    const format = receiptFormat || formData.receiptFormat || 'front_of_house';
    return renderFormBasedReceipt(formData, paperWidth, format, sectionMappings);
  }
  
  // Original canvas-based rendering for backward compatibility
  return renderCanvasBasedReceipt(elements, paperWidth, orderData);
}

// New function for form-based receipt rendering
function renderFormBasedReceipt(
  data: ThermalReceiptFormData, 
  paperWidth: 58 | 80, 
  receiptFormat: 'front_of_house' | 'kitchen_customer',
  sectionMappings: {[key: string]: number} = {}
) {
  const charWidth = paperWidth === 58 ? 32 : 42;
  
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
    return qrCodes
      .filter(qr => qr.enabled)
      .map((qr, index) => {
        const qrSize = qr.size === 'small' ? 64 : qr.size === 'medium' ? 96 : 128;
        const alignStyle = qr.position === 'center' ? 'center' : qr.position === 'right' ? 'flex-end' : 'flex-start';
        
        return (
          <div key={qr.id} className="my-2" style={{ display: 'flex', justifyContent: alignStyle }}>
            <div className="text-center">
              <QRCodeSVG
                value={generateQRContent(qr)}
                size={qrSize}
                level="M"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
              {qr.type !== 'url' && (
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
      className={`bg-white text-black p-4 rounded-lg shadow-lg ${fontSize} ${lineHeight} ${fontWeight}`}
      style={{ 
        width: paperWidth === 58 ? '224px' : '304px', 
        fontFamily: receiptFont.cssFamily, // Apply receipt font as default
        fontSize: isKitchenReceipt ? '16px' : '12px',
        lineHeight: isKitchenReceipt ? '1.8' : '1.4',
        padding: isKitchenReceipt ? '20px' : '16px'
      }}
    >
      {/* Header QR Codes - Place at very top of receipt */}
      {data.qrCodes && data.qrCodes.filter(qr => qr.placement === 'header').length > 0 && (
        <div className="space-y-2 mb-4" style={{ fontFamily: receiptFont.cssFamily }}>
          {renderQRCodes(data.qrCodes.filter(qr => qr.placement === 'header'))}
        </div>
      )}

      {/* Business Header */}
      <div className="text-center mb-1" style={{ fontFamily: receiptFont.cssFamily }}>
        {/* Logo Image */}
        {data.logoImage && (
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
                filter: 'contrast(1.2) brightness(0.9)' // Enhance contrast for thermal printing
              }}
            />
          </div>
        )}
        
        <h1 className={`${headerSize} mb-1`} style={{ fontFamily: receiptFont.cssFamily }}>
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

      {/* Order Information */}
      <div className={`mb-1 text-sm`} style={{ marginBottom: isKitchenReceipt ? '8px' : '4px' }}>
        {/* Receipt Number at the top */}
        <div className="text-center mb-2" style={{ fontFamily: receiptFont.cssFamily }}>
          <span 
            className="font-bold text-lg"
            style={{ 
              fontSize: isKitchenReceipt ? '18px' : '16px',
              fontWeight: '700'
            }}
          >
            {data.receiptNumber || 'CT000000'}
          </span>
        </div>
        
        {/* Badges Row: Order Mode + Channel + Contextual chips */}
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          {/* Canonical Order Mode Badge */}
          <span 
            className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase"
            style={{
              backgroundColor: '#7C3AED',
              color: 'white',
              fontSize: isKitchenReceipt ? '12px' : '10px'
            }}
          >
            {data.orderMode || data.orderType?.replace('_', '-').toUpperCase() || 'DINE-IN'}
          </span>
          
          {/* Channel Badge */}
          {/* Hide 'POS' badge for dine-in orders since all dine-in orders are POS orders (redundant) */}
          {data.orderSource && 
            !(data.orderSource === 'POS' && 
              (data.orderMode === 'DINE-IN' || 
               (!data.orderMode && data.orderType === 'dine_in'))) && (
            <span 
              className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase"
              style={{
                backgroundColor: data.orderSource === 'AI_VOICE' ? '#8B5CF6' : 
                              data.orderSource === 'ONLINE' ? '#10B981' : '#6B7280',
                color: 'white',
                fontSize: isKitchenReceipt ? '12px' : '10px'
              }}
            >
              {data.orderSource === 'AI_VOICE' ? 'Voice' : data.orderSource}
            </span>
          )}
          
          {/* Conditional contextual chips based on Order Mode */}
          {/* Dine-In → [Table 12] [4 pax] */}
          {(data.orderMode === 'DINE-IN' || (!data.orderMode && data.orderType === 'dine_in')) && (
            <>
              {data.tableNumber && (
                <span 
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    fontSize: isKitchenReceipt ? '12px' : '10px'
                  }}
                >
                  Table {data.tableNumber}
                </span>
              )}
              {data.guestCount && data.guestCount > 0 && (
                <span 
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    fontSize: isKitchenReceipt ? '12px' : '10px'
                  }}
                >
                  {data.guestCount} pax
                </span>
              )}
            </>
          )}
          
          {/* Delivery → [ETA 30–45m] [+ Address if present] */}
          {(data.orderMode === 'DELIVERY' || data.orderType === 'delivery') && (
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
          {(data.orderMode === 'COLLECTION' || data.orderType === 'collection') && (
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
        </div>
        
        {/* Merged Date + Time on one line */}
        <div className="text-center text-xs" style={{ fontFamily: receiptFont.cssFamily, marginBottom: isKitchenReceipt ? '4px' : '2px' }}>
          <span style={{ fontWeight: 'normal' }}>
            {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      {/* Special Instructions (prominently displayed for kitchen) */}
      {data.specialInstructions && (
        <div className={`mb-2 p-2 border-2 border-dashed border-red-500 ${isKitchenReceipt ? 'text-base font-bold' : 'text-sm'}`}>
          <div className="text-center font-bold mb-1">SPECIAL INSTRUCTIONS</div>
          <div className="text-center">{data.specialInstructions}</div>
        </div>
      )}

      {/* Customer Information */}
      {(data.customerName || data.customerPhone) && (
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
          </div>
        </>
      )}

      {/* Delivery Address - Only show for DELIVERY orders */}
      {(data.orderMode === 'DELIVERY' || data.orderType === 'delivery') && data.deliveryAddress && (
        <>
          <div className={`mb-2 p-2 border border-gray-300 ${isKitchenReceipt ? 'text-base font-bold' : 'text-sm'}`}>
            <div className={`font-bold mb-1 ${isKitchenReceipt ? 'text-lg' : 'text-sm'}`}>
              DELIVERY ADDRESS:
            </div>
            <div className={`${isKitchenReceipt ? 'font-medium text-base' : 'font-normal text-sm'}`}>
              {parseAddressToMultiLine(data.deliveryAddress).map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Order Items - Apply itemsFont specifically to this section */}
      <div 
        className={`space-y-1 mb-1 ${isKitchenReceipt ? 'text-base' : 'text-sm'}`}
        style={{ fontFamily: itemsFont.cssFamily }} // Apply items font to the entire order items section
      >
        <div className={`${headerSize} text-left mb-1`} style={{ fontFamily: receiptFont.cssFamily }}>
          {isKitchenReceipt ? 'KITCHEN ORDER' : 'ORDER ITEMS'}
        </div>
        
        {data.orderItems && data.orderItems.length > 0 ? (
          // First group identical items
          (() => {
            // Group items by name, variant, and customizations
            const groupedItems = data.orderItems.reduce((groups: any[], item: any) => {
              // Create a unique key for grouping identical items
              const variantKey = item.variant ? `_${item.variant.name}` : '';
              const customizationsKey = item.customizations ? 
                item.customizations
                  .map((c: any) => `${c.name}_${c.price}`)
                  .sort()
                  .join('|') : '';
              const instructionsKey = item.instructions ? `_inst:${item.instructions}` : '';
              
              const groupKey = `${item.name}${variantKey}_${customizationsKey}${instructionsKey}`;
              
              // Find existing group or create new one
              const existingGroup = groups.find(g => g.groupKey === groupKey);
              
              if (existingGroup) {
                // Add to existing group
                existingGroup.quantity += item.quantity;
                existingGroup.total += item.total || 0;
              } else {
                // Create new group
                groups.push({
                  ...item,
                  groupKey,
                  quantity: item.quantity,
                  total: item.total || 0
                });
              }
              
              return groups;
            }, []);
            
            return groupedItems;
          })()
            .sort((a, b) => {
              // Sort by section order (1-7) using sectionMappings lookup
              const getSectionOrder = (item: any) => {
                // Use the sectionMappings lookup table that maps menu_item_id to section order
                // Only use mappings if they're loaded (not empty object)
                if (sectionMappings && Object.keys(sectionMappings).length > 0 && item.menu_item_id && sectionMappings[item.menu_item_id]) {
                  return sectionMappings[item.menu_item_id];
                }
                
                // Enhanced fallback: check the actual item name for common section patterns
                const itemName = (item.name || '').toUpperCase();
                
                // Common starter patterns
                if (itemName.includes('SAMOSA') || itemName.includes('BHAJI') || itemName.includes('PURI') || 
                    itemName.includes('TIKKA') && !itemName.includes('(MAIN)') || itemName.includes('PACKORA') ||
                    itemName.includes('KEBAB') || itemName.includes('SOUP') || itemName.includes('PRAWN COCKTAIL')) {
                  return 1; // STARTERS
                }
                
                // Main course patterns
                if (itemName.includes('(MAIN)') || itemName.includes('MIXED GRILL') || itemName.includes('TANDOORI CHICKEN (MAIN)')) {
                  return 2; // MAIN COURSE
                }
                
                // Rice and bread patterns
                if (itemName.includes('RICE') || itemName.includes('NAAN') || itemName.includes('CHAPATI') || itemName.includes('PARATHA')) {
                  return 3; // SIDE DISHES
                }
                
                // Accompaniments patterns
                if (itemName.includes('CHUTNEY') || itemName.includes('PICKLE') || itemName.includes('RAITA') || itemName.includes('SAUCE')) {
                  return 4; // ACCOMPANIMENTS
                }
                
                // Desserts and coffee patterns
                if (itemName.includes('KULFI') || itemName.includes('DESSERT') || itemName.includes('COFFEE') || itemName.includes('TEA')) {
                  return 5; // DESSERTS & COFFEE
                }
                
                // Drinks patterns
                if (itemName.includes('DRINK') || itemName.includes('WINE') || itemName.includes('BEER') || itemName.includes('LASSI')) {
                  return 6; // DRINKS & WINE
                }
                
                // Set meal patterns
                if (itemName.includes('SET') || itemName.includes('MEAL') || itemName.includes('FEAST') || itemName.includes('SPECIAL')) {
                  return 7; // SET MEALS
                }
                
                // Final fallback to original category mapping
                const categoryToSection: { [key: string]: number } = {
                  'STARTERS': 1,
                  'MAIN COURSE': 2, 
                  'SIDE DISHES': 3,
                  'ACCOMPANIMENTS': 4,
                  'DESSERTS & COFFEE': 5,
                  'DRINKS & WINE': 6,
                  'SET MEALS': 7
                };
                
                const categoryName = item.category_name || item.category?.name || '';
                const sectionOrder = categoryToSection[categoryName.toUpperCase()] || 999;
                
                return sectionOrder;
              };
              
              const aSection = getSectionOrder(a);
              const bSection = getSectionOrder(b);
              
              // Debug logging - only if mappings are loaded
              if (Object.keys(sectionMappings).length > 0) {
                console.log(`🔄 Sorting: ${a.name} (menu_item_id: ${a.menu_item_id}, section ${aSection}) vs ${b.name} (menu_item_id: ${b.menu_item_id}, section ${bSection})`);
              }
              
              // Primary sort: by section order (1-7)
              if (aSection !== bSection) {
                return aSection - bSection;
              }
              
              // Secondary sort: alphabetically within same section
              const aName = a.name || '';
              const bName = b.name || '';
              return aName.localeCompare(bName);
            })
            // Group items by section and render with section headers
            .reduce((acc: any[], item: any, index: number, sortedItems: any[]) => {
              // Get section info for current item
              const getSectionOrder = (item: any) => {
                if (sectionMappings && Object.keys(sectionMappings).length > 0 && item.menu_item_id && sectionMappings[item.menu_item_id]) {
                  return sectionMappings[item.menu_item_id];
                }
                
                const itemName = (item.name || '').toUpperCase();
                if (itemName.includes('SAMOSA') || itemName.includes('BHAJI') || itemName.includes('PURI') || 
                    itemName.includes('TIKKA') && !itemName.includes('(MAIN)') || itemName.includes('PACKORA') ||
                    itemName.includes('KEBAB') || itemName.includes('SOUP') || itemName.includes('PRAWN COCKTAIL')) {
                  return 1;
                }
                if (itemName.includes('(MAIN)') || itemName.includes('MIXED GRILL') || itemName.includes('TANDOORI CHICKEN (MAIN)')) {
                  return 2;
                }
                if (itemName.includes('RICE') || itemName.includes('NAAN') || itemName.includes('CHAPATI') || itemName.includes('PARATHA')) {
                  return 3;
                }
                if (itemName.includes('CHUTNEY') || itemName.includes('PICKLE') || itemName.includes('RAITA') || itemName.includes('SAUCE')) {
                  return 4;
                }
                if (itemName.includes('KULFI') || itemName.includes('DESSERT') || itemName.includes('COFFEE') || itemName.includes('TEA')) {
                  return 5;
                }
                if (itemName.includes('DRINK') || itemName.includes('WINE') || itemName.includes('BEER') || itemName.includes('LASSI')) {
                  return 6;
                }
                if (itemName.includes('SET') || itemName.includes('MEAL') || itemName.includes('FEAST') || itemName.includes('SPECIAL')) {
                  return 7;
                }
                
                const categoryToSection: { [key: string]: number } = {
                  'STARTERS': 1, 'MAIN COURSE': 2, 'SIDE DISHES': 3,
                  'ACCOMPANIMENTS': 4, 'DESSERTS & COFFEE': 5, 'DRINKS & WINE': 6, 'SET MEALS': 7
                };
                const categoryName = item.category_name || item.category?.name || '';
                return categoryToSection[categoryName.toUpperCase()] || 999;
              };
              
              const currentSectionOrder = getSectionOrder(item);
              const previousSectionOrder = index > 0 ? getSectionOrder(sortedItems[index - 1]) : null;
              
              // Section name mapping
              const getSectionName = (sectionOrder: number): string => {
                const sectionNames: { [key: number]: string } = {
                  1: 'STARTERS',
                  2: 'MAIN COURSE', 
                  3: 'SIDE DISHES',
                  4: 'ACCOMPANIMENTS',
                  5: 'DESSERTS & COFFEE',
                  6: 'DRINKS & WINE',
                  7: 'SET MEALS'
                };
                return sectionNames[sectionOrder] || 'OTHER';
              };
              
              // Add section header if this is a new section
              if (currentSectionOrder !== previousSectionOrder) {
                const sectionName = getSectionName(currentSectionOrder);
                acc.push(
                  <div 
                    key={`section-${currentSectionOrder}`} 
                    className={`text-center my-2 ${
                      isKitchenReceipt 
                        ? 'text-lg font-black text-gray-800' 
                        : 'text-xs font-medium text-gray-600'
                    }`}
                    style={{ 
                      fontFamily: receiptFont.cssFamily,
                      fontSize: isKitchenReceipt ? '16px' : '10px',
                      fontWeight: isKitchenReceipt ? 'bold' : '500',
                      marginTop: index === 0 ? '8px' : '16px',
                      marginBottom: '8px'
                    }}
                  >
                    ----{sectionName}----
                  </div>
                );
              }
              
              // Add the item itself
              acc.push(
                <div key={item.id || index} className="mb-1">
                  {/* Main item line with smart name selection */}
                  <div className="flex justify-between items-start" style={{ fontFamily: itemsFont.cssFamily }}>
                    <span 
                      className={`${itemNameWeight}`}
                      style={{
                        fontSize: isKitchenReceipt ? '18px' : undefined,
                        fontWeight: isKitchenReceipt ? 'bold' : undefined,
                        fontFamily: itemsFont.cssFamily
                      }}
                    >
                      {/* Updated display format: Show 'X x ITEM_NAME' instead of 'X ITEM_NAME' */}
                      {item.quantity > 1 ? `${item.quantity} x ` : `${item.quantity} `}{(() => {
                        const hasProteinVariant = item.protein_type && item.variantName && 
                          !['regular', 'standard', 'default', 'normal'].includes(item.variantName.toLowerCase());
                        return hasProteinVariant ? item.variantName : item.name;
                      })()}
                    </span>
                    {/* Hide item prices for kitchen receipts */}
                    {!(isKitchenReceipt && (data.orderType === 'dine_in' || data.orderMode === 'DINE-IN')) && (
                      <span 
                        className={`${isKitchenReceipt ? 'font-bold text-base' : 'font-medium'}`}
                        style={{ fontFamily: itemsFont.cssFamily }}
                      >
                        £{item.total?.toFixed(2) || '0.00'}
                      </span>
                    )}
                  </div>
                  
                  {/* Enhanced customizations display with individual pricing */}
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="ml-4 space-y-0" style={{ fontFamily: itemsFont.cssFamily }}>
                      {item.customizations.map((customization: any, custIndex: number) => (
                        <div key={custIndex} className="flex justify-between text-sm">
                          <span className={`${isKitchenReceipt ? 'font-bold text-orange-800' : 'font-normal'} text-gray-700`}>
                            + {customization.name}
                          </span>
                          {/* Hide customization prices for kitchen receipts */}
                          {!(isKitchenReceipt && (data.orderType === 'dine_in' || data.orderMode === 'DINE-IN')) && (
                            <span className={`${isKitchenReceipt ? 'font-bold text-orange-800' : 'font-normal'} text-gray-700`}>
                              {customization.is_free || customization.price === 0 || customization.price === null || customization.price === undefined ? 
                                '£0.00' : 
                                `£${(customization.price || 0).toFixed(2)}`
                              }
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Fallback support for legacy modifiers */}
                  {!item.customizations && item.modifiers && item.modifiers.length > 0 && (
                    <div className="ml-4 space-y-0" style={{ fontFamily: itemsFont.cssFamily }}>
                      {item.modifiers.map((modifier: any, modIndex: number) => (
                        <div key={modIndex} className="flex justify-between text-sm">
                          <span className={`${isKitchenReceipt ? 'font-bold text-orange-800' : 'font-normal'} text-gray-700`}>
                            + {modifier.name}
                          </span>
                          {/* Hide modifier prices for kitchen receipts */}
                          {!(isKitchenReceipt && (data.orderType === 'dine_in' || data.orderMode === 'DINE-IN')) && (
                            <span className={`${isKitchenReceipt ? 'font-bold text-orange-800' : 'font-normal'} text-gray-700`}>
                              £{(modifier.price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Enhanced special instructions/notes with format-specific styling */}
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
              );
              
              return acc;
            }, [])
        ) : (
          <div className="text-center text-gray-500 italic">
            No items added yet
          </div>
        )}
      </div>

      {/* Totals - Use receiptFont for financial summary - HIDE FOR KITCHEN RECEIPTS */}
      {!(isKitchenReceipt && (data.orderType === 'dine_in' || data.orderMode === 'DINE-IN')) && (
        <div 
          className={`space-y-1 ${isKitchenReceipt ? 'text-base font-bold' : 'text-sm'}`}
          style={{ fontFamily: receiptFont.cssFamily }} // Apply receipt font to totals section
        >
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>£{(data.subtotal || 0).toFixed(2)}</span>
          </div>
          {data.serviceCharge > 0 && (
            <div className="flex justify-between">
              <span>Service Charge:</span>
              <span>£{data.serviceCharge.toFixed(2)}</span>
            </div>
          )}
          {data.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
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
              <span>£{((data.subtotal || 0) + (data.serviceCharge || 0) + (data.deliveryFee || 0) - (data.discount || 0)).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span>Payment:</span>
            <span className="uppercase">{data.paymentMethod || 'CASH'}</span>
          </div>
        </div>
      )}

      {/* Footer - Use receiptFont for footer content */}
      {(data.footerMessage || data.terms || (data.showCustomFooter && data.customFooterText)) && (
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

      {/* Footer QR Codes - Only show footer placement QR codes */}
      {data.qrCodes && data.qrCodes.filter(qr => qr.placement === 'footer').length > 0 && (
        <>
          <div className="border-t border-black my-3" />
          <div className="space-y-2" style={{ fontFamily: receiptFont.cssFamily }}>
            {renderQRCodes(data.qrCodes.filter(qr => qr.placement === 'footer'))}
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
        const processedText = replaceDynamicFields(element.content);
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
