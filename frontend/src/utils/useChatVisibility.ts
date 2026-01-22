import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

// Check if running in Electron environment (evaluated once at module load)
const isElectron = typeof window !== 'undefined' &&
  (window.navigator.userAgent.toLowerCase().includes('electron') ||
   // @ts-expect-error - electronAPI is injected by Electron preload
   typeof window.electronAPI !== 'undefined');

/**
 * Internal hook that calls useLocation - only used in web builds
 * This is the actual hook implementation with router dependencies
 */
function useChatVisibilityInternal(): boolean {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location.pathname;

    // Excluded routes where chat should NOT appear
    // NOTE: Routes have dual aliases (hyphenated and non-hyphenated), so we must include BOTH
    const excludedRoutes = [
      // Auth flows (no chat during authentication)
      '/pos-login',
      '/poslogin',
      '/login',
      '/sign-up',
      '/signup',
      '/forgot-password',
      '/forgotpassword',

      // Checkout flow (focused experience)
      '/checkout-payment',
      '/checkoutpayment',

      // POS System (internal staff tool)
      '/pos-desktop',
      '/posdesktop',
      '/pos-settings',
      '/possettings',
      '/update-pos-desktop',
      '/updateposdesktop',

      // Kitchen Display System (internal)
      '/kds-v2',
      '/kds_v2',
      '/update-kds',
      '/updatekds',

      // Admin & Management (internal)
      '/admin',
      '/reconciliation',
      '/all-orders',
      '/allorders',

      // Staff Tools (internal)
      '/ai-staff-management-hub',
      '/aistaffmanagementhub',
      '/printer-management',
      '/printermanagement',
      '/thermal-receipt-designer-v2',
      '/thermalreceiptdesignerv2',
      '/media-library',
      '/medialibrary',
      '/chatbot-configuration',
      '/chatbotconfiguration',
      '/health-monitor',
      '/healthmonitor',
      '/gemini-voice-lab',
      '/geminivoicelab',
    ];

    // Check if current path starts with any excluded route
    const isExcluded = excludedRoutes.some(route => pathname.startsWith(route));

    // Chat is allowed on all public/customer pages
    return !isExcluded;
  }, [location.pathname]);
}

/**
 * Determines if chat components should be rendered on the current page
 *
 * Chat is ONLY for customer-facing pages.
 * Internal/staff/auth pages should not show chat at all.
 * In Electron POS, chat is always disabled.
 *
 * KEY DESIGN DECISION:
 * - In Electron: This is NOT a hook - it's a simple function that returns false
 * - In Web: This IS a hook that uses useLocation() to determine visibility
 *
 * This conditional export is evaluated at module load time, ensuring
 * Electron never calls useLocation() which would fail due to module
 * version mismatches between react-router instances.
 *
 * @returns {boolean} true if chat should be visible, false otherwise
 */
export const useChatVisibility = isElectron
  ? () => false  // Electron: Simple function, no hooks called
  : useChatVisibilityInternal;  // Web: Actual hook with useLocation
