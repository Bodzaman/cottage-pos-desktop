import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../utils/simple-auth-context';

interface NavigationItem {
  path: string;
  title: string;
  icon?: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  category: 'public' | 'customer' | 'staff' | 'admin';
  description?: string;
}

interface NavigationContextType {
  currentPage: NavigationItem | null;
  breadcrumbs: NavigationItem[];
  navigationItems: NavigationItem[];
  getAvailableRoutes: () => NavigationItem[];
  navigateWithHistory: (path: string) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// Define all app routes with metadata
const allRoutes: NavigationItem[] = [
  // Public routes
  { path: '/', title: 'Home', category: 'public', description: 'Main landing page' },
  { path: '/about', title: 'About Us', category: 'public' },
  { path: '/menu', title: 'Menu', category: 'public' },
  { path: '/gallery', title: 'Gallery', category: 'public' },
  { path: '/login', title: 'Login', category: 'public' },
  { path: '/register', title: 'Register', category: 'public' },
  
  // Customer routes
  { path: '/customer-portal', title: 'Customer Portal', category: 'customer', requireAuth: true },
  { path: '/cart', title: 'Shopping Cart', category: 'customer' },
  { path: '/checkout', title: 'Checkout', category: 'customer' },
  { path: '/order', title: 'Place Order', category: 'customer' },
  { path: '/order-success', title: 'Order Success', category: 'customer' },
  { path: '/order-confirmation', title: 'Order Confirmation', category: 'customer' },
  { path: '/reservations', title: 'Reservations', category: 'customer' },
  
  // Staff routes
  { path: '/pos', title: 'Point of Sale', category: 'staff', requireAuth: true, description: 'Staff POS system' },
  { path: '/kds', title: 'Kitchen Display', category: 'staff', requireAuth: true, description: 'Kitchen order display' },
  { path: '/all-orders', title: 'All Orders', category: 'staff', requireAuth: true },
  { path: '/online-orders-page', title: 'Online Orders', category: 'staff', requireAuth: true },
  
  // Admin routes
  { path: '/admin-portal', title: 'Admin Portal', category: 'admin', requireAdmin: true },
  { path: '/admin-dashboard', title: 'Admin Dashboard', category: 'admin', requireAdmin: true },
  { path: '/admin-menu', title: 'Menu Management', category: 'admin', requireAdmin: true },
  { path: '/admin-settings', title: 'Settings', category: 'admin', requireAdmin: true },
  { path: '/reconciliation', title: 'All Orders', category: 'admin', requireAdmin: true },
  { path: '/pos-settings', title: 'POS Settings', category: 'admin', requireAdmin: true },
  { path: '/online-order-settings', title: 'Order Settings', category: 'admin', requireAdmin: true },
  { path: '/ai-voice-agent-settings', title: 'AI Voice Settings', category: 'admin', requireAdmin: true },
  { path: '/ai-staff-management-hub', title: 'AI Staff Hub', category: 'admin', requireAdmin: true },
  { path: '/delivery-zones', title: 'Delivery Zones', category: 'admin', requireAdmin: true },
  { path: '/media-library', title: 'Media Library', category: 'admin', requireAdmin: true },
  { path: '/reservations-dashboard', title: 'Reservations Dashboard', category: 'admin', requireAdmin: true },
];

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  console.log('🟢 NavigationProvider: Component rendering started');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Safely get auth state - handle case where auth provider isn't ready
  let user = null;
  let isAdmin = false;
  
  try {
    const authState = useSimpleAuth();
    user = authState?.user || null;
    isAdmin = authState?.isAdmin || false;
  } catch (error) {
    // Auth provider not ready yet, use defaults
    console.log('Auth provider not ready, using default values');
  }
  
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // Get current page info
  const currentPage = allRoutes.find(route => {
    // Handle query parameters and exact matches
    if (route.path === location.pathname) return true;
    if (route.path === '/' && location.pathname === '/') return true;
    return false;
  });

  // Generate breadcrumbs
  const breadcrumbs = React.useMemo(() => {
    const crumbs: NavigationItem[] = [];
    
    // Always include home if not on home page
    if (location.pathname !== '/') {
      crumbs.push(allRoutes.find(r => r.path === '/') || allRoutes[0]);
    }
    
    // Add current page if found
    if (currentPage && currentPage.path !== '/') {
      crumbs.push(currentPage);
    }
    
    return crumbs;
  }, [location.pathname, currentPage]);

  // Filter available routes based on user permissions
  const getAvailableRoutes = () => {
    return allRoutes.filter(route => {
      if (route.requireAdmin && !isAdmin) return false;
      if (route.requireAuth && !user) return false;
      return true;
    });
  };

  // Enhanced navigation with history tracking
  const navigateWithHistory = (path: string) => {
    setNavigationHistory(prev => [...prev.slice(-10), location.pathname]); // Keep last 10 pages
    navigate(path);
  };

  // Go back function
  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previousPath = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      navigate(previousPath);
    } else {
      navigate(-1); // Fallback to browser back
    }
  };

  const canGoBack = navigationHistory.length > 0;

  // Update history when location changes
  useEffect(() => {
    // Don't add to history if it's the same as the last entry
    if (navigationHistory[navigationHistory.length - 1] !== location.pathname) {
      // This will be handled by navigateWithHistory for intentional navigation
    }
  }, [location.pathname]);

  const value: NavigationContextType = {
    currentPage,
    breadcrumbs,
    navigationItems: allRoutes,
    getAvailableRoutes,
    navigateWithHistory,
    goBack,
    canGoBack
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export type { NavigationItem, NavigationContextType };
