
/**
 * Thermal Receipt Preview Utilities
 * Handle real-time preview rendering for thermal formatted receipts
 */

import { ThermalConfig, ThermalItem, formatThermalItemList, formatCustomizations, THERMAL_PRESETS } from './thermalFormatting';

/**
 * Generate realistic sample items based on actual Cottage Tandoori menu
 */
export function generateSampleItems(count: number = 6): ThermalItem[] {
  const menuItems = [
    { name: 'Chicken Tikka Masala', price: 9.50, customizations: ['Medium spicy'] },
    { name: 'Lamb Biryani', price: 14.50, customizations: ['Extra raita'] },
    { name: 'Chicken Madras', price: 8.25, customizations: ['Very hot'] },
    { name: 'Onion Bhaji', price: 4.25 },
    { name: 'Sag Aloo', price: 4.75, customizations: ['Extra spinach'] },
    { name: 'Pilau Rice', price: 3.25 },
    { name: 'Naan Bread', price: 2.75 },
    { name: 'Poppadom', price: 1.50 },
    { name: 'Chicken Jalfrezi', price: 8.95, customizations: ['No peppers'] },
    { name: 'King Prawn Curry', price: 12.95, customizations: ['Extra prawns'] }
  ];
  
  const items: ThermalItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const menuItem = menuItems[i % menuItems.length];
    const quantity = Math.random() > 0.7 ? 2 : 1; // 30% chance of quantity 2
    
    items.push({
      quantity,
      name: menuItem.name,
      price: menuItem.price,
      customizations: menuItem.customizations,
      notes: i === 0 ? 'Please make extra spicy' : undefined
    });
  }
  
  return items;
}

/**
 * Preview thermal formatting for different paper widths
 */
export function previewThermalFormats(items: ThermalItem[]): Record<string, string> {
  return {
    'thermal_80mm': formatThermalItemList(items, THERMAL_PRESETS.thermal_80mm),
    'thermal_58mm': formatThermalItemList(items, THERMAL_PRESETS.thermal_58mm),
    'kitchen_58mm': formatThermalItemList(items, THERMAL_PRESETS.kitchen_58mm),
    'simple': formatThermalItemList(items, THERMAL_PRESETS.simple)
  };
}

/**
 * Calculate optimal column widths based on items content
 */
export function calculateOptimalWidths(items: ThermalItem[], paperWidth: 58 | 80): ThermalConfig['columns'] {
  const totalChars = paperWidth === 58 ? 32 : 48; // Account for margins
  
  // Find maximum widths needed
  let maxQtyWidth = 1;
  let maxItemWidth = 10;
  let priceWidth = 8; // Fixed for £XX.XX format
  
  for (const item of items) {
    maxQtyWidth = Math.max(maxQtyWidth, item.quantity.toString().length);
    maxItemWidth = Math.max(maxItemWidth, item.name.length);
  }
  
  // Limit qty width to reasonable maximum
  maxQtyWidth = Math.min(maxQtyWidth, 3);
  
  // Calculate remaining space for item name
  const remainingSpace = totalChars - maxQtyWidth - priceWidth - 2; // 2 for separators
  const itemWidth = Math.max(15, Math.min(maxItemWidth, remainingSpace));
  
  return {
    qty_width: maxQtyWidth,
    item_width: itemWidth,
    price_width: priceWidth
  };
}

/**
 * Apply thermal formatting to receipt element content
 */
export function applyThermalFormatting(
  content: string, 
  config: ThermalConfig,
  paperWidth?: 58 | 80,
  elementType?: string
): string {
  // If content is already in thermal format, return as-is
  if (config.column_layout === 'thermal' && content.includes('£') && content.match(/^\d+\s+/m)) {
    return content;
  }
  
  // Parse existing simple format and convert
  const items: ThermalItem[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  let currentItem: ThermalItem | null = null;
  
  for (const line of lines) {
    // Check if this is a customization line (starts with whitespace and dash)
    const customizationMatch = line.match(/^\s+- (.+)$/);
    if (customizationMatch && currentItem) {
      // Add customization to current item
      if (!currentItem.customizations) {
        currentItem.customizations = [];
      }
      currentItem.customizations.push(customizationMatch[1]);
      continue;
    }
    
    // Try to parse different formats
    // Kitchen format with prices: "1x   Item Name     £12.50"
    const kitchenPricedMatch = line.match(/^(\d+)x\s+(.+?)\s+£([0-9]+\.[0-9]{2})$/);
    // Kitchen format: "1x   Item Name" (no price)
    const kitchenMatch = line.match(/^(\d+)x\s+(.+)$/);
    // Thermal format: "1 Item Name £12.50"
    const thermalMatch = line.match(/^(\d+)\s+(.+?)\s+£([0-9]+\.[0-9]{2})$/);
    // Simple format: "Item Name £12.50"
    const simpleMatch = line.match(/(.+?)\s+£([0-9]+\.[0-9]{2})$/);
    
    if (kitchenPricedMatch) {
      // Kitchen format with prices parsing
      currentItem = {
        quantity: parseInt(kitchenPricedMatch[1]),
        name: kitchenPricedMatch[2].trim(),
        price: parseFloat(kitchenPricedMatch[3])
      };
      items.push(currentItem);
    } else if (kitchenMatch) {
      // Kitchen format parsing (no price)
      currentItem = {
        quantity: parseInt(kitchenMatch[1]),
        name: kitchenMatch[2].trim(),
        price: 0 // Kitchen format doesn't include prices
      };
      items.push(currentItem);
    } else if (thermalMatch) {
      // Thermal format parsing (with price)
      currentItem = {
        quantity: parseInt(thermalMatch[1]),
        name: thermalMatch[2].trim(),
        price: parseFloat(thermalMatch[3])
      };
      items.push(currentItem);
    } else if (simpleMatch) {
      // Simple format parsing (with price)
      const itemText = simpleMatch[1].trim();
      // Check for quantity in parentheses
      const qtyMatch = itemText.match(/(.+?)\s*\((\d+)\)$/);
      
      if (qtyMatch) {
        const qty = parseInt(qtyMatch[2]);
        const totalPrice = parseFloat(simpleMatch[2]);
        currentItem = {
          quantity: qty,
          name: qtyMatch[1].trim(),
          price: totalPrice / qty
        };
      } else {
        currentItem = {
          quantity: 1,
          name: itemText,
          price: parseFloat(simpleMatch[2])
        };
      }
      items.push(currentItem);
    } else {
      // Reset current item if line doesn't match any pattern
      currentItem = null;
    }
  }
  
  // Use provided config or create optimized one
  const finalConfig = paperWidth ? {
    ...config,
    paper_width: paperWidth,
    columns: calculateOptimalWidths(items, paperWidth)
  } : config;
  
  // Apply element type specific formatting
  if (elementType === 'order_items_kitchen') {
    // Price-less kitchen format - force no prices
    const noPriceConfig = {
      ...finalConfig,
      columns: {
        ...finalConfig.columns,
        price_width: 0
      }
    };
    return formatThermalItemListNoPrices(items, noPriceConfig);
  } else {
    // Standard formatting with prices
    return formatThermalItemList(items, finalConfig);
  }
}

/**
 * Format a complete list of items for thermal receipt without prices (kitchen format)
 */
export function formatThermalItemListNoPrices(items: ThermalItem[], config: ThermalConfig): string {
  const lines: string[] = [];
  
  for (const item of items) {
    // Add main item line without price
    lines.push(formatThermalItemLineNoPrices(item, config));
    
    // Add customizations if any
    if (item.customizations) {
      const customLines = formatCustomizations(item.customizations, config);
      lines.push(...customLines);
    }
    
    // Add notes if any (for kitchen tickets)
    if (item.notes && config.column_layout === 'kitchen') {
      const indentWidth = config.columns.qty_width + 1;
      const noteText = `Note: ${item.notes}`;
      const truncated = noteText.slice(0, config.columns.item_width);
      lines.push(' '.repeat(indentWidth) + truncated);
    }
  }
  
  return lines.join('\n');
}

/**
 * Format a single thermal item line without price (for kitchen format)
 */
export function formatThermalItemLineNoPrices(item: ThermalItem, config: ThermalConfig): string {
  const { qty_width, item_width } = config.columns;
  const totalWidth = qty_width + item_width + 2; // +2 for separators
  
  // Format quantity with alignment
  let qtyStr = item.quantity.toString();
  if (config.alignment.qty === 'right') {
    qtyStr = qtyStr.padStart(qty_width);
  } else {
    qtyStr = qtyStr.padEnd(qty_width);
  }
  
  // Add 'x' suffix for kitchen format
  qtyStr = qtyStr.trim() + 'x';
  
  // Format item name (truncate if too long)
  let nameStr = item.name;
  if (nameStr.length > item_width) {
    nameStr = nameStr.substring(0, item_width - 3) + '...';
  }
  nameStr = nameStr.padEnd(item_width);
  
  // Combine with separators (no price column)
  const separator = config.separator_char;
  return `${qtyStr}${separator}${separator}${separator}${nameStr}`;
}
