


/**
 * Thermal Receipt Formatting Utilities
 * Professional column-based formatting for thermal printers
 */

export interface ThermalItem {
  quantity: number;
  name: string;
  price: number;
  customizations?: string[];
  notes?: string;
}

export interface ThermalConfig {
  column_layout: 'thermal' | 'kitchen' | 'simple';
  paper_width: 58 | 80;
  columns: {
    qty_width: number;
    item_width: number;
    price_width: number;
  };
  alignment: {
    qty: 'left' | 'center' | 'right';
    item: 'left' | 'center' | 'right';
    price: 'left' | 'center' | 'right';
  };
  separator_char: '.' | ' ' | '-';
  fill_style?: 'dots' | 'spaces'; // Professional fill style for price alignment
  show_customizations: boolean;
}

/**
 * Default thermal configurations for different paper sizes and layouts
 */
export const THERMAL_PRESETS: Record<string, ThermalConfig> = {
  thermal_80mm: {
    column_layout: 'thermal',
    paper_width: 80,
    columns: {
      qty_width: 3,
      item_width: 35,
      price_width: 8
    },
    alignment: {
      qty: 'right',
      item: 'left', 
      price: 'right'
    },
    separator_char: ' ',
    fill_style: 'spaces', // Default to space padding for 80mm
    show_customizations: true
  },
  thermal_58mm: {
    column_layout: 'thermal',
    paper_width: 58,
    columns: {
      qty_width: 3, // Increased from 2 for better readability
      item_width: 22, // Optimized for better text wrapping
      price_width: 7
    },
    alignment: {
      qty: 'right',
      item: 'left',
      price: 'right'
    },
    separator_char: ' ',
    fill_style: 'dots', // Default to dot leaders for compact 58mm
    show_customizations: true
  },
  kitchen_58mm: {
    column_layout: 'kitchen',
    paper_width: 58,
    columns: {
      qty_width: 3, // Reduced from 4 for better space utilization
      item_width: 29, // Increased from 30 for better text clarity
      price_width: 0
    },
    alignment: {
      qty: 'center', // Changed from left to center for better visibility
      item: 'left',
      price: 'left'
    },
    separator_char: ' ',
    fill_style: 'spaces', // Not used for price-less format but included for consistency
    show_customizations: true
  },
  simple: {
    column_layout: 'simple',
    paper_width: 80,
    columns: {
      qty_width: 0,
      item_width: 40,
      price_width: 8
    },
    alignment: {
      qty: 'left',
      item: 'left',
      price: 'right'
    },
    separator_char: ' ',
    fill_style: 'spaces', // Default to space padding for simple format
    show_customizations: false
  }
};

/**
 * Align text within a specified width
 */
export function alignText(text: string, width: number, alignment: 'left' | 'center' | 'right'): string {
  const cleanText = text.slice(0, width); // Truncate if too long
  const padding = width - cleanText.length;
  
  if (padding <= 0) return cleanText;
  
  switch (alignment) {
    case 'left':
      return cleanText + ' '.repeat(padding);
    case 'right':
      return ' '.repeat(padding) + cleanText;
    case 'center':
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + cleanText + ' '.repeat(rightPad);
    default:
      return cleanText;
  }
}

/**
 * Format a single item line for thermal receipt
 */
export function formatThermalItemLine(item: ThermalItem, config: ThermalConfig): string {
  const { columns, alignment, separator_char } = config;
  
  // Format quantity
  const qtyText = config.column_layout === 'kitchen' 
    ? `${item.quantity}x`
    : item.quantity.toString();
  const qtyFormatted = alignText(qtyText, columns.qty_width, alignment.qty);
  
  // If no price, use simple concatenation (price-less kitchen format)
  if (columns.price_width === 0) {
    const itemFormatted = alignText(item.name, columns.item_width, alignment.item);
    const parts = [qtyFormatted, itemFormatted];
    return parts.join(separator_char);
  }
  
  // Professional fixed-width column formatting for priced receipts
  const fillStyle = config.fill_style || 'spaces';
  const fillChar = fillStyle === 'dots' ? '.' : ' ';
  
  // Calculate precise character positions for 58mm paper
  const qtyColumnEnd = columns.qty_width;
  const priceColumnStart = config.paper_width - columns.price_width;
  const availableItemWidth = priceColumnStart - qtyColumnEnd - 1; // -1 for separator after qty
  
  // Format and truncate item name with ellipsis if needed
  let itemText = item.name;
  if (itemText.length > availableItemWidth) {
    // Reserve 3 characters for "..."
    const maxLength = Math.max(1, availableItemWidth - 3);
    itemText = itemText.slice(0, maxLength) + '...';
  }
  
  // Format price with right alignment
  const priceText = `£${item.price.toFixed(2)}`;
  const priceFormatted = alignText(priceText, columns.price_width, 'right');
  
  // Build the line: qty + separator + item + fill + price
  const qtyPart = qtyFormatted + separator_char;
  const usedWidth = qtyPart.length + itemText.length + priceFormatted.length;
  const fillWidth = config.paper_width - usedWidth;
  const fillPart = fillChar.repeat(Math.max(0, fillWidth));
  
  return qtyPart + itemText + fillPart + priceFormatted;
}

/**
 * Format customizations/modifications for an item
 */
export function formatCustomizations(customizations: string[], config: ThermalConfig): string[] {
  if (!config.show_customizations || !customizations.length) {
    return [];
  }
  
  const indentWidth = config.columns.qty_width + 1;
  const maxWidth = config.columns.item_width;
  
  return customizations.map(custom => {
    const indentedText = `- ${custom}`;
    const truncated = indentedText.slice(0, maxWidth);
    return ' '.repeat(indentWidth) + truncated;
  });
}

/**
 * Format a complete list of items for thermal receipt
 */
export function formatThermalItemList(items: ThermalItem[], config: ThermalConfig): string {
  const lines: string[] = [];
  
  for (const item of items) {
    // Add main item line
    lines.push(formatThermalItemLine(item, config));
    
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
 * Convert legacy simple text format to thermal format
 */
export function convertSimpleToThermal(simpleText: string, config: ThermalConfig): string {
  const lines = simpleText.split('\n');
  const items: ThermalItem[] = [];
  
  for (const line of lines) {
    // Parse simple format: "Item Name £12.95" or "Item Name (2) £25.90"
    const priceMatch = line.match(/£([0-9]+\.[0-9]{2})\s*$/);
    if (!priceMatch) continue;
    
    const price = parseFloat(priceMatch[1]);
    let itemText = line.replace(/£[0-9]+\.[0-9]{2}\s*$/, '').trim();
    
    // Extract quantity if present
    const qtyMatch = itemText.match(/(.+?)\s*\(([0-9]+)\)\s*$/);
    let quantity = 1;
    
    if (qtyMatch) {
      itemText = qtyMatch[1].trim();
      quantity = parseInt(qtyMatch[2]);
    }
    
    items.push({
      quantity,
      name: itemText,
      price: price / quantity // Convert total to unit price
    });
  }
  
  return formatThermalItemList(items, config);
}

/**
 * Sample data for testing thermal formatting
 */
export const SAMPLE_THERMAL_ITEMS: ThermalItem[] = [
  {
    quantity: 1,
    name: 'Spicy Chicken Tikka Masala',
    price: 9.50,
    customizations: ['Extra spicy', 'No dairy']
  },
  {
    quantity: 1,
    name: 'Chicken Madras',
    price: 8.25
  },
  {
    quantity: 2,
    name: 'Onion Bhaji',
    price: 4.25
  },
  {
    quantity: 1,
    name: 'Sag Aloo',
    price: 4.75,
    customizations: ['Extra portion']
  },
  {
    quantity: 2,
    name: 'Pilau Rice',
    price: 3.25
  },
  {
    quantity: 4,
    name: 'Naan',
    price: 2.75,
    notes: 'Make them crispy'
  }
];
