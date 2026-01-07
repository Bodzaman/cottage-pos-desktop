import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from 'app';
import { toast } from 'sonner';

interface OnboardingStatus {
  customer_id: string;
  tour_completed: boolean;
  wizard_completed: boolean;
  email_series_started: boolean;
  last_email_sent_at?: string | null;
  email_series_step: number;
  created_at?: string;
}

interface OnboardingStore {
  // State
  status: OnboardingStatus | null;
  isLoading: boolean;
  tourDismissed: boolean; // Local dismissal (user clicked skip)
  wizardDismissed: boolean; // Local dismissal
  
  // Computed: Should show tour?
  shouldShowTour: () => boolean;
  shouldShowWizard: () => boolean;
  
  // Actions
  fetchStatus: (customerId: string) => Promise<void>;
  markTourComplete: (customerId: string) => Promise<void>;
  markWizardComplete: (customerId: string) => Promise<void>;
  dismissTour: () => void;
  dismissWizard: () => void;
  reset: () => void;
  resetDismissals: () => void; // New: Reset dismissal flags for testing
}

export const useOnboardingStore = create<OnboardingStore>()(persist(
  (set, get) => ({
    // Initial state
    status: null,
    isLoading: false,
    tourDismissed: false,
    wizardDismissed: false,

    // Computed: Should show tour?
    shouldShowTour: () => {
      const { status, tourDismissed } = get();
      return status ? !status.tour_completed && !tourDismissed : false;
    },

    // Computed: Should show wizard?
    shouldShowWizard: () => {
      const { status, wizardDismissed } = get();
      const shouldShow = status ? !status.wizard_completed && !wizardDismissed : false;
      return shouldShow;
    },

    // Fetch onboarding status (backend auto-creates if missing)
    fetchStatus: async (customerId: string) => {
      set({ isLoading: true });
      
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 10s')), 10000)
        );
        
        const fetchPromise = apiClient.get_onboarding_progress();
        
        const response = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (response.ok) {
          const data = await response.json();
          
          // Backend returns flat structure now
          const newStatus = {
            customer_id: data.customer_id,
            tour_completed: data.tour_completed,
            wizard_completed: data.wizard_completed,
            email_series_started: data.email_series_started,
            email_series_step: data.email_series_step,
            last_email_sent_at: data.last_email_sent_at,
            created_at: data.created_at
          };
          
          // Reset dismissal flags if database says not completed but localStorage has them dismissed
          const currentState = get();
          const updates: any = {
            status: newStatus,
            isLoading: false
          };
          
          // Sync dismissal flags with database truth
          if (!newStatus.tour_completed && currentState.tourDismissed) {
            updates.tourDismissed = false;
          }
          if (!newStatus.wizard_completed && currentState.wizardDismissed) {
            updates.wizardDismissed = false;
          }
          
          set(updates);
        } else {
          console.error('Failed to fetch onboarding status');
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('Failed to load onboarding status:', error);
        set({ isLoading: false });
      }
    },

    // Mark tour as completed
    markTourComplete: async (customerId: string) => {
      try {
        const response = await apiClient.update_onboarding_progress({
          customer_id: customerId,
          tour_completed: true
        });
        
        if (response.ok) {
          // Optimistic update
          const currentStatus = get().status;
          if (currentStatus) {
            set({
              status: { ...currentStatus, tour_completed: true },
              tourDismissed: true
            });
          }
          console.log('✅ Welcome tour completed!');
        }
      } catch (error) {
        console.error('Failed to mark tour complete:', error);
        toast.error('Failed to save tour progress');
      }
    },

    // Mark wizard as completed
    markWizardComplete: async (customerId: string) => {
      try {
        const response = await apiClient.update_onboarding_progress({
          customer_id: customerId,
          wizard_completed: true
        });
        
        if (response.ok) {
          // Optimistic update
          const currentStatus = get().status;
          if (currentStatus) {
            set({
              status: { ...currentStatus, wizard_completed: true },
              wizardDismissed: true
            });
          }
          
          console.log('✅ Profile setup complete!');
        }
      } catch (error) {
        console.error('Failed to mark wizard complete:', error);
        toast.error('Failed to save wizard progress');
      }
    },

    // Dismiss tour (user skipped it)
    dismissTour: () => {
      set({ tourDismissed: true });
    },

    // Dismiss wizard (user skipped it)
    dismissWizard: () => {
      set({ wizardDismissed: true });
    },

    // Reset store (for testing)
    reset: () => {
      set({
        status: null,
        isLoading: false,
        tourDismissed: false,
        wizardDismissed: false
      });
    },

    // Reset dismissal flags (for testing)
    resetDismissals: () => {
      set({
        tourDismissed: false,
        wizardDismissed: false
      });
    }
  }),
  {
    name: 'cottage-onboarding-v2', // Changed from v1 to force fresh state
    partialize: (state) => ({
      // Only persist local dismissal state
      tourDismissed: state.tourDismissed,
      wizardDismissed: state.wizardDismissed
    })
  }
));
