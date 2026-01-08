import { useLocation } from 'react-router-dom';

/**
 * Page context types for chat functionality
 */
export type PageContext = 'menu-enabled' | 'marketing';

/**
 * Page configuration for chat features
 */
export interface PageConfig {
  context: PageContext;
  enableDishDetection: boolean;
  requiresMenuStore: boolean;
  displayName: string;
}

/**
 * Page mappings for chat functionality - ALL PAGES HAVE DISH DETECTION ENABLED
 */
const PAGE_CONFIGS: Record<string, PageConfig> = {
  '/': {
    context: 'marketing',
    enableDishDetection: true, // ENABLED on Home page
    requiresMenuStore: true,   // ENABLED on Home page
    displayName: 'Home'
  },
  '/about': {
    context: 'marketing', 
    enableDishDetection: true, // ENABLED on About page
    requiresMenuStore: true,   // ENABLED on About page
    displayName: 'About'
  },
  '/gallery': {
    context: 'marketing',
    enableDishDetection: true, // ENABLED on Gallery page
    requiresMenuStore: true,   // ENABLED on Gallery page
    displayName: 'Gallery'
  },
  '/contact': {
    context: 'marketing',
    enableDishDetection: true, // ENABLED on Contact page
    requiresMenuStore: true,   // ENABLED on Contact page
    displayName: 'Contact'
  },
  '/online-orders': {
    context: 'menu-enabled',
    enableDishDetection: true,
    requiresMenuStore: true,
    displayName: 'OnlineOrders'
  },
  '/website-management': {
    context: 'marketing',
    enableDishDetection: false, // Admin page - no dish detection needed
    requiresMenuStore: false,   // Admin page - no menu data needed
    displayName: 'WebsiteManagement'
  }
};

/**
 * Hook to get current page context for chat functionality
 */
export function usePageContext(): PageConfig {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Find exact match first
  const exactConfig = PAGE_CONFIGS[pathname];
  if (exactConfig) {
    return exactConfig;
  }
  
  // Default to marketing context for unknown pages
  const defaultConfig: PageConfig = {
    context: 'marketing',
    enableDishDetection: false,
    requiresMenuStore: false,
    displayName: 'Unknown'
  };
  
  console.log(`⚠️ Unknown page context for: ${pathname}, using marketing default`);
  return defaultConfig;
}

/**
 * Utility to check if current page should load menu data
 */
export function shouldLoadMenuStore(pathname?: string): boolean {
  if (!pathname) {
    const location = window.location;
    pathname = location.pathname;
  }
  
  const config = PAGE_CONFIGS[pathname];
  return config?.requiresMenuStore ?? false;
}

/**
 * Utility to check if dish detection should be enabled
 */
export function shouldEnableDishDetection(pathname?: string): boolean {
  if (!pathname) {
    const location = window.location;
    pathname = location.pathname;
  }
  
  const config = PAGE_CONFIGS[pathname];
  return config?.enableDishDetection ?? false;
}

/**
 * Debug utility to log current page context
 */
export function logPageContext(pathname: string): void {
  const config = PAGE_CONFIGS[pathname] || { context: 'unknown' };
  console.log(`🔍 Page Context [${pathname}]:`, {
    context: config.context,
    enableDishDetection: config.enableDishDetection,
    requiresMenuStore: config.requiresMenuStore,
    displayName: config.displayName
  });
}
