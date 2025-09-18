
/**
 * Header View Change Store - View state management for POS navigation
 * 
 * ADAPTED FOR ELECTRON: This store manages view state changes triggered by
 * header navigation and provides unified event handling for POS view switching.
 * 
 * CHANGES FROM DATABUTTON VERSION:
 * - Enhanced with Zustand store for better state management
 * - Added view history and navigation breadcrumbs
 * - Improved type safety and event handling
 * - Added persistence for view state across sessions
 * - Enhanced for desktop POS environment
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Enhanced header view types for Electron POS
export type HeaderViewType = 
  | 'pos' 
  | 'reservations' 
  | 'kitchen' 
  | 'online-orders' 
  | 'ai-orders' 
  | 'voice-orders'  // ELECTRON: Added voice orders view
  | 'website' 
  | 'reconciliation' 
  | 'admin'
  | 'settings'      // ELECTRON: Added settings view
  | 'analytics'     // ELECTRON: Added analytics view
  | 'staff-management'; // ELECTRON: Added staff management view

export interface HeaderViewChangeEvent {
  view: HeaderViewType;
  timestamp: number;
  source?: string; // ELECTRON: Track what triggered the view change
}

// ELECTRON: Enhanced view metadata for better navigation
export interface ViewMetadata {
  title: string;
  description: string;
  requiresAuth: boolean;
  requiredPermissions: string[];
  isDefault: boolean;
  canGoBack: boolean;
}

// ELECTRON: View state with navigation history
interface HeaderViewState {
  currentView: HeaderViewType;
  previousView: HeaderViewType | null;
  viewHistory: HeaderViewType[];
  lastViewChange: number;

  // Navigation state
  canGoBack: boolean;
  canGoForward: boolean;
  breadcrumbs: string[];

  // View metadata
  viewMetadata: Record<HeaderViewType, ViewMetadata>;

  // Actions
  changeView: (view: HeaderViewType, source?: string) => void;
  goBack: () => void;
  goForward: () => void;
  clearHistory: () => void;
  getViewTitle: (view: HeaderViewType) => string;
  isViewAllowed: (view: HeaderViewType, userPermissions: string[]) => boolean;

  // Event handling
  addEventListener: (callback: (event: HeaderViewChangeEvent) => void) => () => void;
  removeEventListener: (callback: (event: HeaderViewChangeEvent) => void) => void;
  dispatchViewChange: (view: HeaderViewType, source?: string) => void;
}

// ELECTRON: View metadata definitions
const VIEW_METADATA: Record<HeaderViewType, ViewMetadata> = {
  pos: {
    title: 'Point of Sale',
    description: 'Main POS interface for processing orders',
    requiresAuth: true,
    requiredPermissions: ['pos.access'],
    isDefault: true,
    canGoBack: false
  },
  reservations: {
    title: 'Reservations',
    description: 'Manage table reservations and bookings',
    requiresAuth: true,
    requiredPermissions: ['reservations.view'],
    isDefault: false,
    canGoBack: true
  },
  kitchen: {
    title: 'Kitchen Display',
    description: 'Kitchen order management and preparation status',
    requiresAuth: true,
    requiredPermissions: ['kitchen.access'],
    isDefault: false,
    canGoBack: true
  },
  'online-orders': {
    title: 'Online Orders',
    description: 'Manage orders from online ordering system',
    requiresAuth: true,
    requiredPermissions: ['orders.view'],
    isDefault: false,
    canGoBack: true
  },
  'ai-orders': {
    title: 'AI Orders',
    description: 'AI-generated and automated order processing',
    requiresAuth: true,
    requiredPermissions: ['ai_orders.view'],
    isDefault: false,
    canGoBack: true
  },
  'voice-orders': {
    title: 'Voice Orders',
    description: 'Ultravox voice-based order management',
    requiresAuth: true,
    requiredPermissions: ['voice_orders.view'],
    isDefault: false,
    canGoBack: true
  },
  website: {
    title: 'Website Management',
    description: 'Manage restaurant website and online presence',
    requiresAuth: true,
    requiredPermissions: ['website.manage'],
    isDefault: false,
    canGoBack: true
  },
  reconciliation: {
    title: 'Reconciliation',
    description: 'Daily sales reconciliation and reporting',
    requiresAuth: true,
    requiredPermissions: ['reconciliation.access'],
    isDefault: false,
    canGoBack: true
  },
  admin: {
    title: 'Admin Panel',
    description: 'Administrative settings and management',
    requiresAuth: true,
    requiredPermissions: ['admin.access'],
    isDefault: false,
    canGoBack: true
  },
  settings: {
    title: 'Settings',
    description: 'Application settings and configuration',
    requiresAuth: true,
    requiredPermissions: ['settings.view'],
    isDefault: false,
    canGoBack: true
  },
  analytics: {
    title: 'Analytics',
    description: 'Sales analytics and business insights',
    requiresAuth: true,
    requiredPermissions: ['analytics.view'],
    isDefault: false,
    canGoBack: true
  },
  'staff-management': {
    title: 'Staff Management',
    description: 'Manage staff accounts and permissions',
    requiresAuth: true,
    requiredPermissions: ['staff.manage'],
    isDefault: false,
    canGoBack: true
  }
};

/**
 * Enhanced Header View Change Store for Electron POS
 * 
 * This store provides comprehensive view state management with:
 * - Navigation history and breadcrumbs
 * - Permission-based view access control
 * - Event-driven view change notifications
 * - Persistent view state across sessions
 * - Enhanced navigation controls for desktop environment
 */
export const useHeaderViewStore = create<HeaderViewState>()(
  persist(
    (set, get) => {
      // Event listeners for view change notifications
      const eventListeners = new Set<(event: HeaderViewChangeEvent) => void>();

      return {
        currentView: 'pos',
        previousView: null,
        viewHistory: ['pos'],
        lastViewChange: Date.now(),

        canGoBack: false,
        canGoForward: false,
        breadcrumbs: ['Point of Sale'],

        viewMetadata: VIEW_METADATA,

        changeView: (view: HeaderViewType, source?: string) => {
          const state = get();

          if (state.currentView === view) {
            console.log(`Already on view: ${view}`);
            return;
          }

          const timestamp = Date.now();
          const previousView = state.currentView;

          // Update view history (limit to last 10 views)
          const newHistory = [...state.viewHistory, view].slice(-10);

          // Generate breadcrumbs
          const newBreadcrumbs = [
            ...state.breadcrumbs,
            VIEW_METADATA[view].title
          ].slice(-5); // Keep last 5 breadcrumbs

          set({
            currentView: view,
            previousView,
            viewHistory: newHistory,
            lastViewChange: timestamp,
            canGoBack: newHistory.length > 1,
            canGoForward: false, // Reset forward navigation on new view
            breadcrumbs: newBreadcrumbs
          });

          // Dispatch view change event
          get().dispatchViewChange(view, source);

          console.log(`🔄 View changed: ${previousView} → ${view} (source: ${source || 'unknown'})`);
        },

        goBack: () => {
          const state = get();

          if (state.viewHistory.length > 1) {
            const newHistory = [...state.viewHistory];
            newHistory.pop(); // Remove current view
            const previousView = newHistory[newHistory.length - 1];

            if (previousView) {
              set({
                currentView: previousView,
                previousView: state.currentView,
                viewHistory: newHistory,
                lastViewChange: Date.now(),
                canGoBack: newHistory.length > 1,
                canGoForward: true,
                breadcrumbs: state.breadcrumbs.slice(0, -1)
              });

              console.log(`⬅️ Navigated back to: ${previousView}`);
            }
          }
        },

        goForward: () => {
          // Implement forward navigation if needed
          console.log('Forward navigation not implemented yet');
        },

        clearHistory: () => {
          const state = get();
          set({
            viewHistory: [state.currentView],
            canGoBack: false,
            canGoForward: false,
            breadcrumbs: [VIEW_METADATA[state.currentView].title]
          });
          console.log('🧹 View history cleared');
        },

        getViewTitle: (view: HeaderViewType) => {
          return VIEW_METADATA[view]?.title || view;
        },

        isViewAllowed: (view: HeaderViewType, userPermissions: string[]) => {
          const metadata = VIEW_METADATA[view];
          if (!metadata) return false;

          // Check if user has required permissions
          return metadata.requiredPermissions.every(permission => 
            userPermissions.includes(permission) || userPermissions.includes('admin.access')
          );
        },

        // Enhanced event handling for Electron
        addEventListener: (callback: (event: HeaderViewChangeEvent) => void) => {
          eventListeners.add(callback);

          // Return cleanup function
          return () => {
            eventListeners.delete(callback);
          };
        },

        removeEventListener: (callback: (event: HeaderViewChangeEvent) => void) => {
          eventListeners.delete(callback);
        },

        dispatchViewChange: (view: HeaderViewType, source?: string) => {
          const event: HeaderViewChangeEvent = {
            view,
            timestamp: Date.now(),
            source
          };

          // Notify all listeners
          eventListeners.forEach(listener => {
            try {
              listener(event);
            } catch (error) {
              console.error('Error in view change listener:', error);
            }
          });

          // Also dispatch DOM event for compatibility
          if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('header-view-change', { 
              detail: event 
            }));
          }
        }
      };
    },
    {
      name: 'header-view-store', // ELECTRON: Persist view state
      partialize: (state) => ({
        currentView: state.currentView,
        viewHistory: state.viewHistory.slice(-5), // Persist last 5 views
        breadcrumbs: state.breadcrumbs
      })
    }
  )
);

// ELECTRON: Enhanced utility functions for React components
export function setupHeaderViewChangeListener(
  callback: (event: HeaderViewChangeEvent) => void
): () => void {
  return useHeaderViewStore.getState().addEventListener(callback);
}

export function dispatchHeaderViewChange(view: HeaderViewType, source?: string): void {
  useHeaderViewStore.getState().changeView(view, source);
}

// ELECTRON: React hook for view changes with enhanced functionality
export function useHeaderViewChange(
  onViewChange: (view: HeaderViewType, event: HeaderViewChangeEvent) => void
) {
  return () => {
    return setupHeaderViewChangeListener((event) => {
      onViewChange(event.view, event);
    });
  };
}

// ELECTRON: Helper functions for view management
export const headerViewHelpers = {
  // Get current view information
  getCurrentViewInfo: () => {
    const state = useHeaderViewStore.getState();
    return {
      view: state.currentView,
      title: state.getViewTitle(state.currentView),
      metadata: state.viewMetadata[state.currentView],
      canGoBack: state.canGoBack,
      breadcrumbs: state.breadcrumbs
    };
  },

  // Check if view is accessible for user
  isViewAccessible: (view: HeaderViewType, userPermissions: string[]) => {
    return useHeaderViewStore.getState().isViewAllowed(view, userPermissions);
  },

  // Get navigation state
  getNavigationState: () => {
    const state = useHeaderViewStore.getState();
    return {
      currentView: state.currentView,
      previousView: state.previousView,
      canGoBack: state.canGoBack,
      canGoForward: state.canGoForward,
      breadcrumbs: state.breadcrumbs,
      viewHistory: state.viewHistory
    };
  },

  // Bulk view permission check
  getAccessibleViews: (userPermissions: string[]): HeaderViewType[] => {
    const state = useHeaderViewStore.getState();
    return Object.keys(state.viewMetadata).filter(view => 
      state.isViewAllowed(view as HeaderViewType, userPermissions)
    ) as HeaderViewType[];
  }
};

// ELECTRON: Export store actions for external usage
export const headerViewActions = {
  changeView: (view: HeaderViewType, source?: string) => 
    useHeaderViewStore.getState().changeView(view, source),
  goBack: () => useHeaderViewStore.getState().goBack(),
  clearHistory: () => useHeaderViewStore.getState().clearHistory(),
  addEventListener: (callback: (event: HeaderViewChangeEvent) => void) => 
    useHeaderViewStore.getState().addEventListener(callback)
};
