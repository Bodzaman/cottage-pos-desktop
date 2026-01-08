// =============================================================================
// MODERN VISUAL DESIGNER DATA MODELS
// Enhanced and simplified models for the rebuilt Visual Designer
// =============================================================================

import { CanvasElement, ElementType, ElementStyle } from './visualTemplateTypes';

// =============================================================================
// ELEMENT PALETTE DEFINITIONS
// =============================================================================

export interface PaletteElement {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  icon: string;
  category: 'header' | 'content' | 'footer' | 'decoration';
  defaultData: {
    text?: string;
    placeholder?: string;
    dynamic_field?: string;
    image_url?: string;
  };
  defaultStyle: ElementStyle;
}

// =============================================================================
// VISUAL DESIGNER ELEMENT LIBRARY
// =============================================================================

export const ELEMENT_LIBRARY: PaletteElement[] = [
  // HEADER ELEMENTS
  {
    id: 'logo',
    type: 'logo',
    name: 'Restaurant Logo',
    description: 'Upload and display restaurant logo',
    icon: 'Image',
    category: 'header',
    defaultData: {
      text: '🏪 LOGO',
      placeholder: 'Click to upload logo'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 16,
      font_weight: 'bold',
      text_align: 'center',
      color: '#000000',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 0,
      padding_right: 0,
      margin_top: 0,
      margin_bottom: 0
    }
  },
  {
    id: 'business_info',
    type: 'business_info',
    name: 'Business Info',
    description: 'Restaurant name, address, contact details',
    icon: 'Building',
    category: 'header',
    defaultData: {
      text: 'Cottage Tandoori Restaurant\n25 West St, Storrington\nPhone: 01903 741 777',
      placeholder: 'Edit business information'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'center',
      color: '#000000',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 3,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 0,
      margin_bottom: 8
    }
  },
  {
    id: 'order_header',
    type: 'order_header',
    name: 'Order Header',
    description: 'Order number, date, time, type',
    icon: 'Receipt',
    category: 'header',
    defaultData: {
      text: 'Order #{order.id} - {order.type}\n{order.date} at {order.time}',
      placeholder: 'Order information'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 11,
      font_weight: 'bold',
      text_align: 'center',
      color: '#000000',
      background_color: 'transparent',
      border_width: 1,
      border_color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 3,
      padding_right: 3,
      margin_top: 5,
      margin_bottom: 8
    }
  },

  // CONTENT ELEMENTS
  {
    id: 'customer_info',
    type: 'customer_info',
    name: 'Customer Details',
    description: 'Customer name and contact information',
    icon: 'User',
    category: 'content',
    defaultData: {
      text: 'Customer: {customer.name}\nPhone: {customer.phone}',
      placeholder: 'Customer information'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 3,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 0,
      margin_bottom: 5
    }
  },
  {
    id: 'items_list',
    type: 'items_list',
    name: 'Order Items',
    description: 'Detailed list of ordered items with prices',
    icon: 'List',
    category: 'content',
    defaultData: {
      text: '{items.list}',
      placeholder: 'Order items will appear here'
    },
    defaultStyle: {
      font_family: 'Courier',
      font_size: 9,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 0,
      padding_right: 0,
      margin_top: 8,
      margin_bottom: 8
    }
  },
  {
    id: 'order_totals',
    type: 'order_totals',
    name: 'Order Totals',
    description: 'Subtotal, tax, discounts, and final total',
    icon: 'Calculator',
    category: 'content',
    defaultData: {
      text: 'Subtotal: {order.subtotal}\nTax: {order.tax}\nTotal: {order.total}',
      placeholder: 'Order totals'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 11,
      font_weight: 'bold',
      text_align: 'right',
      color: '#000000',
      background_color: 'transparent',
      border_width: 1,
      border_color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 3,
      padding_right: 3,
      margin_top: 8,
      margin_bottom: 5
    }
  },
  {
    id: 'payment_info',
    type: 'payment_info',
    name: 'Payment Details',
    description: 'Payment method and transaction details',
    icon: 'CreditCard',
    category: 'content',
    defaultData: {
      text: 'Payment: {payment.method}\nChange: {payment.change}',
      placeholder: 'Payment information'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 3,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 5,
      margin_bottom: 5
    }
  },

  // FOOTER ELEMENTS
  {
    id: 'thank_you',
    type: 'thank_you',
    name: 'Thank You Message',
    description: 'Appreciation message to customers',
    icon: 'Heart',
    category: 'footer',
    defaultData: {
      text: 'Thank you for your order!\nPlease visit us again soon.',
      placeholder: 'Thank you message'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'center',
      color: '#000000',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 8,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 10,
      margin_bottom: 5
    }
  },
  {
    id: 'contact_footer',
    type: 'contact_footer',
    name: 'Contact Info',
    description: 'Website, social media, hours',
    icon: 'Globe',
    category: 'footer',
    defaultData: {
      text: 'www.cottagetandoori.co.uk\nFollow us @CottageTandoori\nOpen 7 days a week',
      placeholder: 'Contact and social information'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 8,
      font_weight: 'normal',
      text_align: 'center',
      color: '#666666',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 5,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 8,
      margin_bottom: 0
    }
  },
  {
    id: 'legal_footer',
    type: 'legal_footer',
    name: 'Legal Info',
    description: 'VAT number, company registration, etc.',
    icon: 'Scale',
    category: 'footer',
    defaultData: {
      text: 'VAT No: GB123456789\nCompany Reg: 12345678',
      placeholder: 'Legal information'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 7,
      font_weight: 'normal',
      text_align: 'center',
      color: '#999999',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 3,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 5,
      margin_bottom: 0
    }
  },

  // DECORATION ELEMENTS
  {
    id: 'separator_line',
    type: 'separator',
    name: 'Separator Line',
    description: 'Horizontal line to separate sections',
    icon: 'Minus',
    category: 'decoration',
    defaultData: {
      text: '--------------------------------',
      placeholder: 'Separator line'
    },
    defaultStyle: {
      font_family: 'Courier',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'center',
      color: '#000000',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 2,
      padding_bottom: 2,
      padding_left: 0,
      padding_right: 0,
      margin_top: 3,
      margin_bottom: 3
    }
  },
  {
    id: 'custom_text',
    type: 'text',
    name: 'Custom Text',
    description: 'Free-form text element',
    icon: 'Type',
    category: 'decoration',
    defaultData: {
      text: 'Custom text here',
      placeholder: 'Enter your text'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000',
      padding_top: 2,
      padding_bottom: 2,
      padding_left: 0,
      padding_right: 0,
      margin_top: 3,
      margin_bottom: 3
    }
  },
  {
    id: 'qr_code',
    type: 'qr_code',
    name: 'QR Code',
    description: 'QR code for feedback, menu, or website',
    icon: 'QrCode',
    category: 'decoration',
    defaultData: {
      text: 'Scan for our menu:\n{qr:menu_url}',
      placeholder: 'QR code content'
    },
    defaultStyle: {
      font_family: 'Arial',
      font_size: 8,
      font_weight: 'normal',
      text_align: 'center',
      color: '#000000',
      background_color: 'transparent',
      border_width: 1,
      border_color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 5,
      padding_right: 5,
      margin_top: 8,
      margin_bottom: 5
    }
  }
];

// =============================================================================
// CANVAS HELPER FUNCTIONS
// =============================================================================

/**
 * Create a new canvas element from a palette element
 */
export function createCanvasElementFromPalette(
  paletteElement: PaletteElement,
  x: number = 0,
  y: number = 0,
  width: number = 200,
  height: number = 40
): CanvasElement {
  return {
    id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: paletteElement.type,
    x,
    y,
    width,
    height,
    rotation: 0,
    visible: true,
    locked: false,
    zIndex: 1,
    data: {
      text: paletteElement.defaultData.text || '',
      placeholder: paletteElement.defaultData.placeholder || '',
      dynamic_field: paletteElement.defaultData.dynamic_field || '',
      image_url: paletteElement.defaultData.image_url || ''
    },
    style: { ...paletteElement.defaultStyle }
  };
}

/**
 * Get palette element by ID
 */
export function getPaletteElementById(id: string): PaletteElement | undefined {
  return ELEMENT_LIBRARY.find(element => element.id === id);
}

/**
 * Get palette elements by category
 */
export function getPaletteElementsByCategory(category: 'header' | 'content' | 'footer' | 'decoration'): PaletteElement[] {
  return ELEMENT_LIBRARY.filter(element => element.category === category);
}

/**
 * Calculate automatic positioning for new elements
 */
export function calculateAutoPosition(
  existingElements: CanvasElement[],
  newElementHeight: number = 40
): { x: number; y: number } {
  if (existingElements.length === 0) {
    return { x: 10, y: 10 };
  }

  // Find the bottom-most element
  const bottomElement = existingElements.reduce((bottom, current) => 
    (current.y + current.height) > (bottom.y + bottom.height) ? current : bottom
  );

  return {
    x: 10,
    y: bottomElement.y + bottomElement.height + 10
  };
}

/**
 * Validate element positioning within canvas bounds
 */
export function validateElementPosition(
  element: CanvasElement,
  canvasWidth: number = 300,
  canvasHeight: number = 800
): CanvasElement {
  const validated = { ...element };

  // Ensure element stays within canvas bounds
  validated.x = Math.max(0, Math.min(validated.x, canvasWidth - validated.width));
  validated.y = Math.max(0, Math.min(validated.y, canvasHeight - validated.height));

  // Ensure minimum size
  validated.width = Math.max(20, validated.width);
  validated.height = Math.max(10, validated.height);

  return validated;
}

/**
 * Sort elements by their vertical position (for rendering order)
 */
export function sortElementsByPosition(elements: CanvasElement[]): CanvasElement[] {
  return [...elements].sort((a, b) => {
    // First sort by Y position
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    // Then by Z-index
    return a.zIndex - b.zIndex;
  });
}

/**
 * Get element bounds for collision detection
 */
export function getElementBounds(element: CanvasElement) {
  return {
    left: element.x,
    top: element.y,
    right: element.x + element.width,
    bottom: element.y + element.height
  };
}

/**
 * Check if two elements overlap
 */
export function elementsOverlap(element1: CanvasElement, element2: CanvasElement): boolean {
  const bounds1 = getElementBounds(element1);
  const bounds2 = getElementBounds(element2);

  return !(bounds1.right < bounds2.left || 
           bounds1.left > bounds2.right || 
           bounds1.bottom < bounds2.top || 
           bounds1.top > bounds2.bottom);
}

/**
 * Snap position to grid
 */
export function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Generate element preview text for display
 */
export function generateElementPreview(element: CanvasElement, maxLength: number = 50): string {
  const text = element.data.text || element.data.placeholder || 'Empty element';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export default {
  ELEMENT_LIBRARY,
  createCanvasElementFromPalette,
  getPaletteElementById,
  getPaletteElementsByCategory,
  calculateAutoPosition,
  validateElementPosition,
  sortElementsByPosition,
  getElementBounds,
  elementsOverlap,
  snapToGrid,
  generateElementPreview
};
