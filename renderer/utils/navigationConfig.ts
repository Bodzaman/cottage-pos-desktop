import { SimpleUser } from "../utils/simple-auth-context";

export type NavigationContext = 'PUBLIC_NAV' | 'AUTH_NAV' | 'ORDERING_NAV';

export interface NavigationItem {
  name: string;
  path: string;
  requiresAuth?: boolean;
  showWhenLoggedIn?: boolean;
  showWhenLoggedOut?: boolean;
  icon?: string;
}

export interface NavigationConfig {
  context: NavigationContext;
  showLogo: boolean;
  showCart: boolean;
  showAuthButtons: boolean;
  navigationItems: NavigationItem[];
  ctaButton?: {
    text: string;
    path: string;
    variant: 'primary' | 'secondary' | 'outline';
    requiresAuth?: boolean;
    showWhenLoggedIn?: boolean;
    showWhenLoggedOut?: boolean;
  };
}

// Navigation configurations for different contexts
export const navigationConfigs: Record<NavigationContext, NavigationConfig> = {
  PUBLIC_NAV: {
    context: 'PUBLIC_NAV',
    showLogo: true,
    showCart: true,
    showAuthButtons: true,
    navigationItems: [
      { name: "Home", path: "/" },
      { name: "Order Online", path: "/online-orders" },
      { name: "About", path: "/About" },
      { name: "Gallery", path: "/Gallery" },
      { name: "Contact", path: "/Contact" },
    ],
  },
  
  AUTH_NAV: {
    context: 'AUTH_NAV',
    showLogo: true,
    showCart: false,
    showAuthButtons: false,
    navigationItems: [
      { name: "← Back to Home", path: "/" },
    ],
    ctaButton: {
      text: "Order Online",
      path: "/online-orders",
      variant: "outline"
    }
  },
  
  ORDERING_NAV: {
    context: 'ORDERING_NAV',
    showLogo: true,
    showCart: true,
    showAuthButtons: false, // Custom auth handling for ordering context
    navigationItems: [
      { name: "← Continue Browsing", path: "/online-orders" },
      { name: "Home", path: "/" },
    ],
    ctaButton: {
      text: "My Account",
      path: "/customer-portal",
      variant: "outline",
      showWhenLoggedIn: true
    }
  }
};

// Function to determine navigation context based on current route
export function getNavigationContext(pathname: string): NavigationContext {
  // Auth pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/sign-up') {
    return 'AUTH_NAV';
  }
  
  // Ordering/checkout related pages
  if (pathname === '/order' || pathname === '/online-orders' || pathname === '/checkout') {
    return 'ORDERING_NAV';
  }
  
  // Customer portal pages (could be considered ordering context or separate)
  if (pathname.startsWith('/customer-portal')) {
    return 'ORDERING_NAV';
  }
  
  // Admin/POS pages (could have their own context later)
  if (pathname.startsWith('/pos') || pathname.startsWith('/admin')) {
    return 'ORDERING_NAV'; // For now, treat as streamlined
  }
  
  // Default to public navigation for all other pages
  return 'PUBLIC_NAV';
}

// Function to get filtered navigation items based on user authentication state
export function getFilteredNavigationItems(
  items: NavigationItem[], 
  user: SimpleUser | null
): NavigationItem[] {
  return items.filter(item => {
    // If no auth requirements, show item
    if (!item.requiresAuth && !item.showWhenLoggedIn && !item.showWhenLoggedOut) {
      return true;
    }
    
    // Check authentication requirements
    if (item.requiresAuth && !user) {
      return false;
    }
    
    if (item.showWhenLoggedIn && !user) {
      return false;
    }
    
    if (item.showWhenLoggedOut && user) {
      return false;
    }
    
    return true;
  });
}

// Function to check if CTA button should be shown
export function shouldShowCtaButton(
  ctaButton: NavigationConfig['ctaButton'], 
  user: SimpleUser | null
): boolean {
  if (!ctaButton) return false;
  
  // Check authentication requirements
  if (ctaButton.requiresAuth && !user) {
    return false;
  }
  
  if (ctaButton.showWhenLoggedIn && !user) {
    return false;
  }
  
  if (ctaButton.showWhenLoggedOut && user) {
    return false;
  }
  
  return true;
}

// Helper function to get the appropriate navigation config
export function getNavigationConfig(pathname: string): NavigationConfig {
  const context = getNavigationContext(pathname);
  return navigationConfigs[context];
}
