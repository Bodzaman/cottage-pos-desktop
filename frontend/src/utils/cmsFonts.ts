export interface CMSFontOption {
  id: string;
  name: string;
  family: string;
  googleFontParam?: string;
  category: 'serif' | 'sans-serif' | 'script' | 'display' | 'decorative';
}

export const CMS_FONT_OPTIONS: CMSFontOption[] = [
  {
    id: 'old-english',
    name: 'Old English',
    family: '"Cloister Black", serif',
    category: 'decorative',
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    family: '"Playfair Display", serif',
    googleFontParam: 'Playfair+Display:wght@400;600;700',
    category: 'serif',
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    family: '"Cinzel", serif',
    googleFontParam: 'Cinzel:wght@400;600;700',
    category: 'serif',
  },
  {
    id: 'lora',
    name: 'Lora',
    family: '"Lora", serif',
    googleFontParam: 'Lora:wght@400;500;600;700',
    category: 'serif',
  },
  {
    id: 'cormorant-garamond',
    name: 'Cormorant Garamond',
    family: '"Cormorant Garamond", serif',
    googleFontParam: 'Cormorant+Garamond:wght@400;500;600;700',
    category: 'serif',
  },
  {
    id: 'inter',
    name: 'Inter',
    family: '"Inter", sans-serif',
    googleFontParam: 'Inter:wght@300;400;500;600;700',
    category: 'sans-serif',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: '"Poppins", sans-serif',
    googleFontParam: 'Poppins:wght@400;500;600;700',
    category: 'sans-serif',
  },
  {
    id: 'oswald',
    name: 'Oswald',
    family: '"Oswald", sans-serif',
    googleFontParam: 'Oswald:wght@400;500;600;700',
    category: 'sans-serif',
  },
  {
    id: 'raleway',
    name: 'Raleway',
    family: '"Raleway", sans-serif',
    googleFontParam: 'Raleway:wght@300;400;500;600;700',
    category: 'sans-serif',
  },
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    family: '"Bebas Neue", sans-serif',
    googleFontParam: 'Bebas+Neue',
    category: 'sans-serif',
  },
  {
    id: 'great-vibes',
    name: 'Great Vibes',
    family: '"Great Vibes", cursive',
    googleFontParam: 'Great+Vibes',
    category: 'script',
  },
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    family: '"Dancing Script", cursive',
    googleFontParam: 'Dancing+Script:wght@400;500;600;700',
    category: 'script',
  },
  {
    id: 'abril-fatface',
    name: 'Abril Fatface',
    family: '"Abril Fatface", serif',
    googleFontParam: 'Abril+Fatface',
    category: 'display',
  },
  {
    id: 'lobster',
    name: 'Lobster',
    family: '"Lobster", cursive',
    googleFontParam: 'Lobster',
    category: 'display',
  },
];

export const DEFAULT_TITLE_FONT = 'old-english';
export const DEFAULT_BODY_FONT = 'playfair-display';

const loadedFonts = new Set<string>();

export function loadFont(fontId: string | undefined): void {
  if (!fontId) return;
  if (loadedFonts.has(fontId)) return;
  const font = CMS_FONT_OPTIONS.find(f => f.id === fontId);
  if (!font?.googleFontParam) {
    loadedFonts.add(fontId);
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontParam}&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(fontId);
}

export function loadAllFonts(): void {
  CMS_FONT_OPTIONS.forEach(font => loadFont(font.id));
}

export function getFontFamily(fontId: string | undefined, defaultId?: string): string {
  const id = fontId || defaultId;
  if (!id) return '"Playfair Display", serif';
  const font = CMS_FONT_OPTIONS.find(f => f.id === id);
  return font?.family || '"Playfair Display", serif';
}
