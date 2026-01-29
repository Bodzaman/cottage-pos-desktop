/**
 * ReceiptDesignerService - Supabase Direct API Layer
 * Uses direct Supabase queries - no backend server required
 * Centralized error handling and response parsing
 */

import { supabase } from './supabaseClient';
import { Template, FormData } from 'utils/receiptDesignerTypes';
import {
  listParentTemplates,
  getReceiptTemplate,
  createReceiptTemplate,
  updateReceiptTemplate,
  deleteReceiptTemplate
} from './receiptTemplateSupabase';

// ==================== Type Guards ====================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== Template Service ====================

export const ReceiptDesignerService = {
  /**
   * Fetch all templates (shared resources)
   * Uses direct Supabase query - no backend server needed
   * Returns only parent templates (excludes auto-created kitchen variants)
   */
  fetchTemplates: async (): Promise<ApiResponse<Template[]>> => {
    console.log('📡 [ReceiptDesignerService] Fetching parent templates via Supabase direct...');
    return await listParentTemplates();
  },

  /**
   * Fetch a specific template by ID
   * Uses direct Supabase query - no backend server needed
   */
  fetchTemplate: async (templateId: string): Promise<ApiResponse<Template>> => {
    console.log('📡 [ReceiptDesignerService] Fetching template via Supabase direct:', templateId);
    return await getReceiptTemplate(templateId);
  },

  /**
   * Save a new template
   * Uses direct Supabase query - no backend server needed
   */
  saveTemplate: async (
    name: string,
    description: string,
    design_data: FormData,
    paper_width: number = 80
  ): Promise<ApiResponse<Template>> => {
    console.log('💾 [ReceiptDesignerService] Saving template via Supabase direct:', name);
    console.log('📦 Request payload:', { name, description, paper_width });
    console.log('📊 Design data keys:', Object.keys(design_data));
    return await createReceiptTemplate(name, description, design_data, paper_width);
  },

  /**
   * Update an existing template
   * Uses direct Supabase query - no backend server needed
   */
  updateTemplate: async (
    templateId: string,
    updates: {
      name?: string;
      description?: string;
      design_data?: FormData;
      paper_width?: number;
    }
  ): Promise<ApiResponse<Template>> => {
    console.log('🔄 [ReceiptDesignerService] Updating template via Supabase direct:', templateId);
    return await updateReceiptTemplate(templateId, updates);
  },

  /**
   * Delete a template
   * Uses direct Supabase query - no backend server needed
   */
  deleteTemplate: async (templateId: string): Promise<ApiResponse<void>> => {
    console.log('🗑️ [ReceiptDesignerService] Deleting template via Supabase direct:', templateId);
    return await deleteReceiptTemplate(templateId);
  },

  /**
   * Fetch restaurant settings for smart defaults
   * Uses direct Supabase query - no backend server needed
   */
  fetchRestaurantSettings: async (): Promise<ApiResponse<any>> => {
    try {
      console.log('📊 [ReceiptDesignerService] Fetching restaurant settings via Supabase direct...');

      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .single();

      if (error) {
        console.error('❌ [ReceiptDesignerService] Failed to fetch restaurant settings:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (data?.business_profile) {
        console.log('✅ [ReceiptDesignerService] Restaurant settings loaded');
        return {
          success: true,
          data: data.business_profile
        };
      }

      return {
        success: false,
        error: 'Restaurant settings not found'
      };
    } catch (error) {
      console.error('❌ [ReceiptDesignerService] Error fetching restaurant settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch settings'
      };
    }
  },

  /**
   * Generate smart defaults from restaurant settings
   */
  generateSmartDefaults: async (): Promise<Partial<FormData>> => {
    const response = await ReceiptDesignerService.fetchRestaurantSettings();

    if (response.success && response.data) {
      const profile = response.data;
      return {
        businessName: profile.name || 'Cottage Tandoori Restaurant',
        address: profile.address && profile.postcode
          ? `${profile.address}, ${profile.postcode}`
          : '123 High Street, London, SW1A 1AA',
        phone: profile.phone || '020 7123 4567',
        email: profile.email || 'orders@cottagetandoori.co.uk',
        website: profile.website || 'www.cottagetandoori.co.uk',
        vatNumber: profile.tax_id || 'GB123456789'
      };
    }

    // Return empty object if settings fetch fails (will use DEFAULT_FORM_DATA)
    return {};
  }
};
