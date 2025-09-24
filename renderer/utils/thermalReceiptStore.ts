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

export const useThermalReceiptStore = create<ThermalReceiptStore>()(subscribeWithSelector(
  (set, get) => ({
    // Initial state
    isLoading: false,
    currentTemplate: null,
    templates: [],
    
    // Actions
    setLoading: (loading) => set({ isLoading: loading }),
    setCurrentTemplate: (template) => set({ currentTemplate: template }),
    setTemplates: (templates) => set({ templates: templates })
  })
));
