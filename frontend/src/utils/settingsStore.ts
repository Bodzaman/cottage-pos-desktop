import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RestaurantSettingsData {
  // Security settings
  salesReportPassword: string;
  
  // Add other settings here as needed
}

// Define the store interface
export interface RestaurantSettingsStore {
  settings: RestaurantSettingsData;
  updateSettings: (newSettings: Partial<RestaurantSettingsData>) => void;
}

// Create the store with persistence
export const useSettingsStore = create<RestaurantSettingsStore>(
  persist(
    (set) => ({
      settings: {
        salesReportPassword: "Noor",
      },
      updateSettings: (newSettings) => set((state) => ({
        settings: {
          ...state.settings,
          ...newSettings
        }
      })),
    }),
    {
      name: 'restaurant-settings',
    }
  )
);
