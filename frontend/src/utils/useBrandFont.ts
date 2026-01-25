/**
 * Hook to get CMS-configured brand fonts with automatic font loading.
 * Uses TanStack Query caching - multiple components calling this hook
 * will share the same cached data (no duplicate API calls).
 */

import { useEffect } from 'react';
import { useWebsiteData } from './useWebsiteData';
import { loadFont, getFontFamily, DEFAULT_TITLE_FONT } from './cmsFonts';

interface HeroFontContent {
  title_font?: string;
}

export function useBrandFont() {
  const heroData = useWebsiteData<HeroFontContent>('hero');
  const titleFont = heroData?.title_font || DEFAULT_TITLE_FONT;

  useEffect(() => {
    loadFont(titleFont);
  }, [titleFont]);

  return {
    titleFontFamily: getFontFamily(titleFont, DEFAULT_TITLE_FONT),
  };
}
