
// Thermal Receipt Font Library - Modern fonts optimized for receipt printing

import { FontFamily } from './visualTemplateTypes';

export interface ThermalFont {
  name: string;
  family: FontFamily;
  cssFamily: string; // CSS font-family value
  category: 'monospace' | 'sans-serif' | 'specialized';
  subcategory: 'receipt-optimized' | 'customer-friendly' | 'industry-standard';
  description: string;
  thermalOptimized: boolean;
  recommendedSizes: {
    kitchen: { min: number; max: number; optimal: number };
    customer: { min: number; max: number; optimal: number };
  };
  googleFont: boolean;
  fallback: string;
  preview: string;
  bestFor: 'customer' | 'kitchen' | 'both';
}

// Google Fonts URL generator
export const generateGoogleFontsUrl = (fonts: ThermalFont[]): string => {
  const googleFonts = fonts
    .filter(font => font.googleFont)
    .map(font => font.cssFamily.replace(/ /g, '+'))
    .map(family => `${family}:400,700`) // Normal and bold weights
    .join('&family=');
  
  return `https://fonts.googleapis.com/css2?family=${googleFonts}&display=swap`;
};

// Comprehensive thermal font library
export const THERMAL_FONTS: ThermalFont[] = [
  // CONTEMPORARY MONOSPACE (Receipt-Optimized)
  {
    name: 'JetBrains Mono',
    family: 'JetBrains Mono',
    cssFamily: 'JetBrains Mono, monospace',
    category: 'monospace',
    subcategory: 'receipt-optimized',
    description: 'Modern, highly legible monospace perfect for receipts',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 10, max: 16, optimal: 12 },
      customer: { min: 8, max: 14, optimal: 10 }
    },
    googleFont: true,
    fallback: 'Courier, monospace',
    preview: 'COTTAGE TANDOORI\nChicken Tikka......£12.95\nNaan Bread.........£3.50\n========================\nTOTAL..............£16.45',
    bestFor: 'both'
  },
  {
    name: 'Fira Code',
    family: 'Fira Code',
    cssFamily: 'Fira Code, monospace',
    category: 'monospace',
    subcategory: 'receipt-optimized',
    description: 'Clean, professional monospace with excellent clarity',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 10, max: 16, optimal: 12 },
      customer: { min: 8, max: 14, optimal: 10 }
    },
    googleFont: true,
    fallback: 'Courier, monospace',
    preview: 'COTTAGE TANDOORI\nChicken Tikka......£12.95\nRice...............£2.50\n========================\nTOTAL..............£15.45',
    bestFor: 'both'
  },
  {
    name: 'Inconsolata',
    family: 'Inconsolata',
    cssFamily: 'Inconsolata, monospace',
    category: 'monospace',
    subcategory: 'receipt-optimized',
    description: 'Humanist monospace, friendly yet professional',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 10, max: 16, optimal: 13 },
      customer: { min: 9, max: 14, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Courier, monospace',
    preview: 'COTTAGE TANDOORI\nLamb Curry.........£14.95\nPilau Rice.........£3.50\n========================\nTOTAL..............£18.45',
    bestFor: 'both'
  },
  {
    name: 'Space Mono',
    family: 'Space Mono',
    cssFamily: 'Space Mono, monospace',
    category: 'monospace',
    subcategory: 'receipt-optimized',
    description: 'Google font optimized for thermal printing',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 9, max: 15, optimal: 11 },
      customer: { min: 8, max: 13, optimal: 10 }
    },
    googleFont: true,
    fallback: 'Courier, monospace',
    preview: 'COTTAGE TANDOORI\nButter Chicken.....£13.95\nGarlic Naan........£3.95\n========================\nTOTAL..............£17.90',
    bestFor: 'both'
  },
  {
    name: 'IBM Plex Mono',
    family: 'IBM Plex Mono',
    cssFamily: 'IBM Plex Mono, monospace',
    category: 'monospace',
    subcategory: 'receipt-optimized',
    description: 'Professional, clean lines ideal for business receipts',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 10, max: 16, optimal: 12 },
      customer: { min: 8, max: 14, optimal: 10 }
    },
    googleFont: true,
    fallback: 'Courier, monospace',
    preview: 'COTTAGE TANDOORI\nTandoori Chicken...£12.50\nChapati............£2.00\n========================\nTOTAL..............£14.50',
    bestFor: 'both'
  },
  
  // MODERN SANS-SERIF (Customer-Friendly)
  {
    name: 'Inter',
    family: 'Inter',
    cssFamily: 'Inter, sans-serif',
    category: 'sans-serif',
    subcategory: 'customer-friendly',
    description: 'Optimized for screens and low-res printing',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nChicken Tikka Masala - £12.95\nNaan Bread - £3.50\nTotal: £16.45',
    bestFor: 'customer'
  },
  {
    name: 'Poppins',
    family: 'Poppins',
    cssFamily: 'Poppins, sans-serif',
    category: 'sans-serif',
    subcategory: 'customer-friendly',
    description: 'Rounded, friendly for customer receipts',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nButter Chicken - £13.95\nRice - £2.50\nTotal: £16.45',
    bestFor: 'customer'
  },
  {
    name: 'Nunito Sans',
    family: 'Nunito Sans',
    cssFamily: 'Nunito Sans, sans-serif',
    category: 'sans-serif',
    subcategory: 'customer-friendly',
    description: 'Clean, modern, excellent legibility',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nLamb Curry - £14.95\nPilau Rice - £3.50\nTotal: £18.45',
    bestFor: 'customer'
  },
  {
    name: 'Work Sans',
    family: 'Work Sans',
    cssFamily: 'Work Sans, sans-serif',
    category: 'sans-serif',
    subcategory: 'customer-friendly',
    description: 'Optimized for web/print clarity',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nTandoori Mixed Grill - £16.95\nNaan Bread - £3.95\nTotal: £20.90',
    bestFor: 'customer'
  },
  {
    name: 'Lato',
    family: 'Lato',
    cssFamily: 'Lato, sans-serif',
    category: 'sans-serif',
    subcategory: 'customer-friendly',
    description: 'Humanist, warm feeling for customer service',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nChicken Korma - £12.50\nChapati - £2.00\nTotal: £14.50',
    bestFor: 'customer'
  },
  {
    name: 'Open Sans',
    family: 'Open Sans',
    cssFamily: 'Open Sans, sans-serif',
    category: 'sans-serif',
    subcategory: 'customer-friendly',
    description: "Google's most popular, excellent readability",
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nVegetable Curry - £10.95\nRice - £2.50\nTotal: £13.45',
    bestFor: 'customer'
  },
  
  // SPECIALIZED/INDUSTRY
  {
    name: 'Montserrat',
    family: 'Montserrat',
    cssFamily: 'Montserrat, sans-serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Modern, geometric, great for branding',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nSpecial Biryani - £15.95\nRaita - £2.95\nTotal: £18.90',
    bestFor: 'customer'
  },
  {
    name: 'Source Sans Pro',
    cssFamily: 'Source Sans Pro, sans-serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: "Adobe's workhorse, excellent clarity",
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nFish Curry - £13.95\nPlain Naan - £3.50\nTotal: £17.45',
    bestFor: 'both'
  },
  {
    name: 'Playfair Display',
    family: 'Playfair Display',
    cssFamily: 'Playfair Display, serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Elegant serif for high-end restaurant feel',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 12, max: 18, optimal: 14 },
      customer: { min: 10, max: 16, optimal: 12 }
    },
    googleFont: true,
    fallback: 'Georgia, serif',
    preview: 'COTTAGE TANDOORI\nSignature Dishes\nChef Special - £18.95\nTotal: £18.95',
    bestFor: 'customer'
  },
  {
    name: 'Merriweather',
    family: 'Merriweather',
    cssFamily: 'Merriweather, serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Highly readable serif, sophisticated',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 11, max: 17, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Georgia, serif',
    preview: 'COTTAGE TANDOORI\nPremium Selection\nLamb Shank - £16.95\nTotal: £16.95',
    bestFor: 'customer'
  },
  {
    name: 'Crimson Text',
    family: 'Crimson Text',
    cssFamily: 'Crimson Text, serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Classic serif, bookish premium feel',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 11, max: 17, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Georgia, serif',
    preview: 'COTTAGE TANDOORI\nTraditional Cuisine\nGrandma Recipe - £14.95\nTotal: £14.95',
    bestFor: 'customer'
  },
  {
    name: 'Oswald',
    family: 'Oswald',
    cssFamily: 'Oswald, sans-serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Bold, impactful headers and emphasis',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 12, max: 18, optimal: 14 },
      customer: { min: 10, max: 16, optimal: 12 }
    },
    googleFont: true,
    fallback: 'Arial Black, sans-serif',
    preview: 'COTTAGE TANDOORI\nSPECIAL OFFER\nBuy 2 Get 1 FREE\nTotal Savings: £12.95',
    bestFor: 'both'
  },
  {
    name: 'Raleway',
    family: 'Raleway',
    cssFamily: 'Raleway, sans-serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Thin, elegant, modern display font',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 11, max: 17, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nFine Dining Experience\nTasting Menu - £45.00\nTotal: £45.00',
    bestFor: 'customer'
  },
  {
    name: 'Rubik',
    family: 'Rubik',
    cssFamily: 'Rubik, sans-serif',
    category: 'specialized',
    subcategory: 'customer-friendly',
    description: 'Rounded corners, friendly appearance',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nPrawn Curry - £14.95\nGarlic Rice - £3.95\nTotal: £18.90',
    bestFor: 'customer'
  },
  {
    name: 'Barlow',
    family: 'Barlow',
    cssFamily: 'Barlow, sans-serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Grotesk style, very legible at small sizes',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 10, max: 16, optimal: 12 },
      customer: { min: 8, max: 14, optimal: 10 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nChicken Jalfrezi - £12.95\nBoiled Rice - £2.50\nTotal: £15.45',
    bestFor: 'both'
  },
  
  // CLASSIC SYSTEM FONTS (Fallbacks)
  {
    name: 'Roboto',
    family: 'Roboto',
    cssFamily: 'Roboto, sans-serif',
    category: 'sans-serif',
    subcategory: 'industry-standard',
    description: 'Modern Android system font, reliable',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: true,
    fallback: 'Arial, sans-serif',
    preview: 'COTTAGE TANDOORI\nMadras Curry - £13.50\nNaan - £3.50\nTotal: £17.00',
    bestFor: 'both'
  },
  {
    name: 'Arial',
    family: 'Arial',
    cssFamily: 'Arial, sans-serif',
    category: 'sans-serif',
    subcategory: 'industry-standard',
    description: 'Universal system font, always available',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 10, max: 16, optimal: 12 },
      customer: { min: 8, max: 14, optimal: 10 }
    },
    googleFont: false,
    fallback: 'sans-serif',
    preview: 'COTTAGE TANDOORI\nChicken Tikka - £12.95\nRice - £2.50\nTotal: £15.45',
    bestFor: 'both'
  },
  {
    name: 'Courier',
    family: 'Courier',
    cssFamily: 'Courier, monospace',
    category: 'monospace',
    subcategory: 'industry-standard',
    description: 'Classic thermal printer font, maximum compatibility',
    thermalOptimized: true,
    recommendedSizes: {
      kitchen: { min: 10, max: 16, optimal: 12 },
      customer: { min: 8, max: 14, optimal: 10 }
    },
    googleFont: false,
    fallback: 'monospace',
    preview: 'COTTAGE TANDOORI\nChicken Tikka......£12.95\nNaan Bread.........£3.50\n========================\nTOTAL..............£16.45',
    bestFor: 'both'
  },
  {
    name: 'Times',
    family: 'Times',
    cssFamily: 'Times, serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Traditional serif, good for formal receipts',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 11, max: 16, optimal: 13 },
      customer: { min: 9, max: 15, optimal: 11 }
    },
    googleFont: false,
    fallback: 'serif',
    preview: 'COTTAGE TANDOORI\nChicken Curry - £12.95\nRice - £2.50\nTotal: £15.45',
    bestFor: 'customer'
  },
  {
    name: 'Impact',
    family: 'Impact',
    cssFamily: 'Impact, sans-serif',
    category: 'specialized',
    subcategory: 'industry-standard',
    description: 'Bold display font, headers only',
    thermalOptimized: false,
    recommendedSizes: {
      kitchen: { min: 14, max: 20, optimal: 16 },
      customer: { min: 12, max: 18, optimal: 14 }
    },
    googleFont: false,
    fallback: 'sans-serif',
    preview: 'COTTAGE TANDOORI\nSPECIAL OFFERS\nTOTAL: £15.45',
    bestFor: 'customer'
  }
];

// Font recommendation engine
export const getRecommendedFonts = (templateType: 'kitchen' | 'foh'): ThermalFont[] => {
  if (templateType === 'kitchen') {
    return THERMAL_FONTS.filter(font => 
      font.bestFor === 'kitchen' || 
      (font.bestFor === 'both' && font.thermalOptimized)
    ).slice(0, 8); // Top 8 for kitchen
  } else {
    return THERMAL_FONTS.filter(font => 
      font.bestFor === 'customer' || font.bestFor === 'both'
    ).slice(0, 12); // Top 12 for customer
  }
};

// Font categories for organized display
export const getFontsByCategory = () => {
  return {
    monospace: THERMAL_FONTS.filter(f => f.category === 'monospace'),
    'sans-serif': THERMAL_FONTS.filter(f => f.category === 'sans-serif'),
    specialized: THERMAL_FONTS.filter(f => f.category === 'specialized')
  };
};

// Get optimal font size for template type
export const getOptimalFontSize = (font: ThermalFont, templateType: 'kitchen' | 'foh'): number => {
  return templateType === 'kitchen' ? font.recommendedSizes.kitchen.optimal : font.recommendedSizes.customer.optimal;
};

// CSS injection utility
export const injectGoogleFonts = () => {
  if (typeof document === 'undefined') return;
  
  const existingLink = document.querySelector('link[data-thermal-fonts]');
  if (existingLink) existingLink.remove();
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = generateGoogleFontsUrl(THERMAL_FONTS);
  link.setAttribute('data-thermal-fonts', 'true');
  document.head.appendChild(link);
};
