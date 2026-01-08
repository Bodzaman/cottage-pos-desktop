/**
 * ReceiptDesignerService - Brain API Layer
 * Isolates all brain client calls for receipt designer
 * Centralized error handling and response parsing
 */

import { apiClient } from 'app';
import { Template, FormData } from 'utils/receiptDesignerTypes';

// ==================== Type Guards ====================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== Template Service ====================

export const ReceiptDesignerService = {
  /**
   * Fetch all templates for a user
   */
  fetchTemplates: async (userId: string): Promise<ApiResponse<Template[]>> => {
    try {
      console.log('📡 Fetching templates for user:', userId);
      const response = await apiClient.list_receipt_templates({ user_id: userId });
      const data = await response.json();
      
      if (data.templates) {
        console.log('✅ Templates loaded:', data.templates.length);
        
        // Transform backend TemplateResponse (flat) to frontend Template (nested)
        const transformedTemplates: Template[] = data.templates.map((t: any) => ({
          id: t.id,
          metadata: {
            name: t.name,
            description: t.description
          },
          design_data: t.design_data,
          paper_width: t.paper_width || 80
        }));
        
        return {
          success: true,
          data: transformedTemplates
        };
      }
      
      return {
        success: false,
        error: 'No templates found'
      };
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates'
      };
    }
  },

  /**
   * Fetch a specific template by ID
   * Templates are shared resources - userId is optional for display purposes
   */
  fetchTemplate: async (templateId: string, userId?: string): Promise<ApiResponse<Template>> => {
    try {
      console.log('📡 Fetching template:', templateId);
      
      // Call API with optional userId (backward compatible)
      const params: any = { templateId };
      if (userId) {
        params.user_id = userId;
      }
      
      const response = await apiClient.get_receipt_template(params);
      const data = await response.json();
      
      if (data.template) {
        // Transform backend TemplateResponse (flat) to frontend Template (nested)
        const transformedTemplate: Template = {
          id: data.template.id,
          metadata: {
            name: data.template.name,
            description: data.template.description
          },
          design_data: data.template.design_data,
          paper_width: data.template.paper_width || 80
        };
        
        console.log('✅ Template loaded:', transformedTemplate.metadata.name);
        return {
          success: true,
          data: transformedTemplate
        };
      }
      
      return {
        success: false,
        error: 'Template not found'
      };
    } catch (error) {
      console.error('❌ Error fetching template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch template'
      };
    }
  },

  /**
   * Save a new template
   */
  saveTemplate: async (
    userId: string,
    name: string,
    description: string,
    design_data: FormData,
    paper_width: number = 80
  ): Promise<ApiResponse<Template>> => {
    try {
      console.log('💾 Saving template:', name);
      console.log('📦 Request payload:', { userId, name, description, paper_width });
      console.log('📊 Design data keys:', Object.keys(design_data));
      
      const requestData = {
        user_id: userId,
        name,
        description,
        design_data,
        paper_width
      };
      
      console.log('🚀 Sending request to backend...');
      const response = await apiClient.create_receipt_template(requestData);
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📨 Response data:', data);
      
      // Backend returns TemplateResponse directly (flat structure)
      // Check for 'id' field to verify successful response
      if (data.id) {
        console.log('✅ Template saved:', data.id);
        
        // Transform backend response to frontend Template format
        const template: Template = {
          id: data.id,
          metadata: {
            name: data.name,
            description: data.description
          },
          design_data: data.design_data,
          paper_width: data.paper_width || 80
        };
        
        return {
          success: true,
          data: template
        };
      }
      
      console.error('❌ Save failed - no id in response:', data);
      return {
        success: false,
        error: data.error || data.detail || 'Failed to save template'
      };
    } catch (error) {
      console.error('❌ Exception during save:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save template'
      };
    }
  },

  /**
   * Update an existing template
   */
  updateTemplate: async (
    templateId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      design_data?: FormData;
      paper_width?: number;
    }
  ): Promise<ApiResponse<Template>> => {
    try {
      console.log('🔄 Updating template:', templateId);
      
      const requestData: any = {
        user_id: userId
      };
      
      if (updates.name !== undefined) requestData.name = updates.name;
      if (updates.description !== undefined) requestData.description = updates.description;
      if (updates.design_data !== undefined) requestData.design_data = updates.design_data;
      if (updates.paper_width !== undefined) requestData.paper_width = updates.paper_width;
      
      const response = await apiClient.update_receipt_template({ templateId: templateId }, requestData);
      const data = await response.json();
      
      // Backend returns TemplateResponse directly (flat structure)
      // Check for 'id' field to verify successful response
      if (data.id) {
        console.log('✅ Template updated:', data.id);
        
        // Transform backend response to frontend Template format
        const template: Template = {
          id: data.id,
          metadata: {
            name: data.name,
            description: data.description
          },
          design_data: data.design_data,
          paper_width: data.paper_width || 80
        };
        
        return {
          success: true,
          data: template
        };
      }
      
      return {
        success: false,
        error: data.error || data.detail || 'Failed to update template'
      };
    } catch (error) {
      console.error('❌ Error updating template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update template'
      };
    }
  },

  /**
   * Delete a template
   */
  deleteTemplate: async (templateId: string, userId: string): Promise<ApiResponse<void>> => {
    try {
      console.log('🗑️ Deleting template:', templateId);
      const response = await apiClient.delete_receipt_template(
        { templateId: templateId },
        { user_id: userId }
      );
      const data = await response.json();
      
      if (response.ok || data.success) {
        console.log('✅ Template deleted successfully');
        return {
          success: true
        };
      }
      
      return {
        success: false,
        error: data.error || 'Failed to delete template'
      };
    } catch (error) {
      console.error('❌ Delete template error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Fetch restaurant settings for smart defaults
   */
  fetchRestaurantSettings: async (): Promise<ApiResponse<any>> => {
    try {
      console.log('📊 Fetching restaurant settings...');
      const response = await apiClient.get_restaurant_settings();
      const data = await response.json();
      
      if (data.success && data.settings?.business_profile) {
        console.log('✅ Restaurant settings loaded');
        return {
          success: true,
          data: data.settings.business_profile
        };
      }
      
      return {
        success: false,
        error: 'Restaurant settings not found'
      };
    } catch (error) {
      console.error('❌ Error fetching restaurant settings:', error);
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
