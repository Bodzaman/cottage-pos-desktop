import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Store interface for thermal receipt designer
interface ThermalReceiptStore {
  // Will be used for future state management
  isLoading: boolean;
  currentTemplate: any;
  templates: any[];

  // Actions
  setLoading: (loading: boolean) => void;
  setCurrentTemplate: (template: any) => void;
  setTemplates: (templates: any[]) => void;
}

// Create the thermal receipt store
export const useThermalReceiptStore = create<ThermalReceiptStore>()(
  subscribeWithSelector((set) => ({
    isLoading: false,
    currentTemplate: null,
    templates: [],

    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setCurrentTemplate: (template: any) => set({ currentTemplate: template }),
    setTemplates: (templates: any[]) => set({ templates }),
  }))
);
