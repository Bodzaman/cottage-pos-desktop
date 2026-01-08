import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Determines if chat components should be rendered on the current page
 * 
 * Chat is ONLY for customer-facing pages.
 * Internal/staff/auth pages should not show chat at all.
 * 
 * @returns {boolean} true if chat should be visible, false otherwise
 */
export function useChatVisibility(): boolean {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location.pathname;

    // Excluded routes where chat should NOT appear
    const excludedRoutes = [
      // Auth flows (no chat during authentication)
      '/pos-login',
      '/login',
      '/sign-up',
      '/forgot-password',
      
      // Checkout flow (focused experience)
      '/checkout-payment',
      
      // POS System (internal staff tool)
      '/pos-desktop',
      '/pos-settings',
      '/update-pos-desktop',
      
      // Kitchen Display System (internal)
      '/kds-v2',
      '/update-kds',
      
      // Admin & Management (internal)
      '/admin',
      '/reconciliation',
      '/all-orders',
      
      // Staff Tools (internal)
      '/ai-staff-management-hub',
      '/printer-management',
      '/voice-staff-control-center',
      '/thermal-receipt-designer-v2',
      '/media-library',
      '/chatbot-configuration',
      '/ai-voice-agent-settings',
      '/health-monitor',
    ];

    // Check if current path starts with any excluded route
    const isExcluded = excludedRoutes.some(route => pathname.startsWith(route));

    // Chat is allowed on all public/customer pages
    return !isExcluded;
  }, [location.pathname]);
}
