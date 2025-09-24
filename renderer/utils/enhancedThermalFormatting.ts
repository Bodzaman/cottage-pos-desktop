/**
 * Enhanced Thermal Formatting with Perfect Column Alignment
 * Integrates with calibration system for professional results
 */

import { 
  CalibratedThermalConfig, 
  getCalibratedConfig, 
  formatCalibratedLine,
  alignTextInField
} from './thermalCalibration';

/**
 * Enhanced thermal item with precise formatting
 */
export interface EnhancedThermalItem {
  quantity: number;
  name: string;
  price: number;
  customizations?: string[];
  notes?: string;
}

/**
 * Format a complete receipt with perfect alignment
 */
export function formatEnhancedThermalReceipt(
  items: EnhancedThermalItem[], 
  paperWidth: 58 | 80, 
  fillStyle: 'dots' | 'spaces'
): string {
  const config = getCalibratedConfig(paperWidth, fillStyle);
  const lines: string[] = [];
  
  // Add header separator
  lines.push('='.repeat(config.total_chars));
  
  // Format each item with perfect alignment
  for (const item of items) {
    const qty = item.quantity.toString();
    const price = `£${item.price.toFixed(2)}`;
    
    // Format main item line
    const itemLine = formatCalibratedLine(qty, item.name, price, config);
    lines.push(itemLine);
    
    // Add customizations with proper indentation
    if (item.customizations && item.customizations.length > 0) {
      for (const custom of item.customizations) {
        const indentedCustom = `  + ${custom}`;
        const customLine = alignTextInField(indentedCustom, config.total_chars, 'left');
        lines.push(customLine);
      }
    }
    
    // Add notes with proper indentation (for kitchen orders)
    if (item.notes) {
      const indentedNote = `  Note: ${item.notes}`;
      const noteLine = alignTextInField(indentedNote, config.total_chars, 'left');
      lines.push(noteLine);
    }
  }
  
  // Add footer separator
  lines.push('='.repeat(config.total_chars));
  
  return lines.join('\n');
}

/**
 * Parse receipt content and format with enhanced alignment
 */
export function parseAndFormatEnhanced(
  content: string, 
  paperWidth: 58 | 80, 
  fillStyle: 'dots' | 'spaces'
): string {
  const config = getCalibratedConfig(paperWidth, fillStyle);
  const lines = content.split('\n').filter(line => line.trim());
  const formattedLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if line contains price (£ symbol)
    if (trimmed.includes('£')) {
      // Parse quantity, item name, and price
      const priceMatch = trimmed.match(/£[\d,.]+/);
      if (priceMatch) {
        const price = priceMatch[0];
        const beforePrice = trimmed.substring(0, trimmed.indexOf(price)).trim();
        
        // Extract quantity (number followed by 'x')
        const qtyMatch = beforePrice.match(/^(\d+)x?\s*/);
        const qty = qtyMatch ? qtyMatch[1] : '1';
        const itemName = qtyMatch ? beforePrice.substring(qtyMatch[0].length).trim() : beforePrice;
        
        // Format with perfect alignment
        const formattedLine = formatCalibratedLine(qty, itemName, price, config);
        formattedLines.push(formattedLine);
      } else {
        // Non-price line, align as text
        const alignedLine = alignTextInField(trimmed, config.total_chars, 'left');
        formattedLines.push(alignedLine);
      }
    } else {
      // Non-price lines (modifications, notes) - preserve with proper alignment
      const alignedLine = alignTextInField(trimmed, config.total_chars, 'left');
      formattedLines.push(alignedLine);
    }
  }
  
  return formattedLines.join('\n');
}

/**
 * Get sample formatted content for testing
 */
export function getSampleFormattedContent(paperWidth: 58 | 80, fillStyle: 'dots' | 'spaces'): string {
  const sampleItems: EnhancedThermalItem[] = [
    {
      quantity: 1,
      name: 'Spicy Chicken Tikka Masala',
      price: 12.95,
      customizations: ['Extra Spicy', 'No Dairy']
    },
    {
      quantity: 2,
      name: 'Pilau Rice',
      price: 5.50
    },
    {
      quantity: 1,
      name: 'Garlic Naan',
      price: 3.25
    },
    {
      quantity: 3,
      name: 'Chicken Madras',
      price: 11.50,
      customizations: ['Medium Spice']
    }
  ];
  
  return formatEnhancedThermalReceipt(sampleItems, paperWidth, fillStyle);
}

/**
 * Validate column alignment for debugging
 */
export function validateAlignment(content: string, config: CalibratedThermalConfig): {
  isValid: boolean;
  issues: string[];
  lineCount: number;
} {
  const lines = content.split('\n');
  const issues: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check line length
    if (line.length > config.total_chars) {
      issues.push(`Line ${i + 1}: Exceeds character limit (${line.length} > ${config.total_chars})`);
    }
    
    // Check for price alignment
    if (line.includes('£')) {
      const priceIndex = line.lastIndexOf('£');
      if (priceIndex < config.columns.price_start) {
        issues.push(`Line ${i + 1}: Price not in designated column area`);
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    lineCount: lines.length
  };
}
