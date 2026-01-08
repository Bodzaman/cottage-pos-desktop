/**
 * ReceiptDesignerStoreV2 - Zustand Store
 * Single source of truth for all receipt designer state
 * Features:
 * - FormData management
 * - Active tab state (default: 'header')
 * - Format toggle (FOH/Kitchen) with localStorage persistence
 * - Template management
 * - Loading states
 * - Unsaved changes tracking
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FormData,
  TabValue,
  ReceiptFormat,
  Template,
  ReceiptDesignerState,
  DEFAULT_FORM_DATA
} from 'utils/receiptDesignerTypes';

// Helper: Deep clone to avoid mutations
const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Helper: Check if formData has changes from default
const hasChanges = (formData: FormData): boolean => {
  return JSON.stringify(formData) !== JSON.stringify(DEFAULT_FORM_DATA);
};

export const useReceiptDesignerStoreV2 = create<ReceiptDesignerState>()(persist(
  (set, get) => ({
    // ==================== Initial State ====================
    
    formData: deepClone(DEFAULT_FORM_DATA),
    
    // UI State - DEFAULT TAB IS 'header' (MYA-1038 fix)
    activeTab: 'header',
    formatToggle: 'front_of_house', // Will be overridden by persisted value
    paperWidth: 80, // 80mm thermal paper
    
    // Loading States
    isLoading: false,
    isSaving: false,
    isLoadingTemplates: false,
    
    // Template State
    currentTemplate: null,
    templatesList: [],
    
    // Unsaved Changes
    hasUnsavedChanges: false,
    
    // ==================== Form Data Actions ====================
    
    updateFormData: (updates: Partial<FormData>) => {
      set((state) => {
        const newFormData = { ...state.formData, ...updates };
        return {
          formData: newFormData,
          hasUnsavedChanges: true
        };
      });
    },
    
    // Initialize business data from restaurant settings (does NOT trigger unsaved changes)
    initializeBusinessData: (businessData: {
      businessName: string;
      address: string;
      phone: string;
      email: string;
      website: string;
      vatNumber: string;
    }) => {
      set((state) => {
        return {
          formData: { ...state.formData, ...businessData },
          hasUnsavedChanges: false // Don't mark as unsaved on initialization
        };
      });
    },
    
    // ==================== UI State Actions ====================
    
    setActiveTab: (tab: TabValue) => {
      set({ activeTab: tab });
    },
    
    toggleFormat: () => {
      set((state) => ({
        formatToggle: state.formatToggle === 'front_of_house' 
          ? 'kitchen_customer' 
          : 'front_of_house'
      }));
    },
    
    setFormatToggle: (format: ReceiptFormat) => {
      set({ formatToggle: format });
    },
    
    setPaperWidth: (width: number) => {
      set({ paperWidth: width });
    },
    
    // ==================== Loading State Actions ====================
    
    setIsLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },
    
    setIsSaving: (saving: boolean) => {
      set({ isSaving: saving });
    },
    
    setIsLoadingTemplates: (loading: boolean) => {
      set({ isLoadingTemplates: loading });
    },
    
    // ==================== Template Actions ====================
    
    setCurrentTemplate: (template: Template | null) => {
      set({ currentTemplate: template });
    },
    
    setTemplatesList: (templates: Template[]) => {
      set({ templatesList: templates });
    },
    
    loadTemplate: (template: Template) => {
      set({
        formData: deepClone(template.design_data),
        currentTemplate: template,
        paperWidth: template.paper_width || 80,
        hasUnsavedChanges: false
      });
    },
    
    // ==================== Utility Actions ====================
    
    resetForm: () => {
      set({
        formData: deepClone(DEFAULT_FORM_DATA),
        currentTemplate: null,
        hasUnsavedChanges: true, // Changed from false - makes form visible
        activeTab: 'header' // Reset to default tab
      });
    },
    
    markAsSaved: () => {
      set({ hasUnsavedChanges: false });
    }
  }),
  {
    name: 'receipt-designer-v2-storage', // localStorage key
    // Only persist specific UI preferences, not the entire state
    partialize: (state) => ({
      formatToggle: state.formatToggle,
      paperWidth: state.paperWidth
    })
  }
));

// ==================== Selectors (for performance) ====================

// Use these selectors in components to avoid unnecessary re-renders
export const selectFormData = (state: ReceiptDesignerState) => state.formData;
export const selectActiveTab = (state: ReceiptDesignerState) => state.activeTab;
export const selectFormatToggle = (state: ReceiptDesignerState) => state.formatToggle;
export const selectHasUnsavedChanges = (state: ReceiptDesignerState) => state.hasUnsavedChanges;
export const selectIsLoading = (state: ReceiptDesignerState) => state.isLoading;
export const selectIsSaving = (state: ReceiptDesignerState) => state.isSaving;
export const selectCurrentTemplate = (state: ReceiptDesignerState) => state.currentTemplate;
export const selectTemplatesList = (state: ReceiptDesignerState) => state.templatesList;
