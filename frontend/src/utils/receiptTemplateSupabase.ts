/**
 * Receipt Template Supabase Service
 * Direct Supabase queries for template operations - no backend server required
 * This enables the web app to work like the Electron version
 */

import { supabase } from './supabaseClient';
import { Template, FormData } from './receiptDesignerTypes';

// ==================== Types ====================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TemplateAssignment {
  id?: string;
  order_mode: string;
  customer_template_id: string | null;
  kitchen_template_id: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TemplateAssignmentsMap {
  [orderMode: string]: TemplateAssignment;
}

// ==================== Template Operations ====================

/**
 * List all receipt templates
 */
export const listReceiptTemplates = async (): Promise<ApiResponse<Template[]>> => {
  console.log('📋 [Supabase Direct] list_receipt_templates called');
  try {
    const { data, error } = await supabase
      .from('receipt_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Supabase Direct] Failed to fetch receipt templates:', error);
      return { success: false, error: error.message };
    }

    // Transform backend flat structure to frontend nested Template structure
    const templates: Template[] = (data || []).map((t: any) => ({
      id: t.id,
      metadata: {
        name: t.name,
        description: t.description
      },
      design_data: t.design_data,
      paper_width: t.paper_width || 80
    }));

    console.log(`✅ [Supabase Direct] Loaded ${templates.length} receipt templates`);
    return { success: true, data: templates };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception fetching receipt templates:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get a single receipt template by ID
 */
export const getReceiptTemplate = async (templateId: string): Promise<ApiResponse<Template>> => {
  console.log('📋 [Supabase Direct] get_receipt_template called with templateId:', templateId);
  try {
    if (!templateId) {
      return { success: false, error: 'Template ID required' };
    }

    const { data, error } = await supabase
      .from('receipt_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('❌ [Supabase Direct] Failed to fetch receipt template:', error);
      return { success: false, error: error.message };
    }

    // Transform to frontend Template structure
    const template: Template = {
      id: data.id,
      metadata: {
        name: data.name,
        description: data.description
      },
      design_data: data.design_data,
      paper_width: data.paper_width || 80
    };

    console.log('✅ [Supabase Direct] Loaded template:', template.metadata.name);
    return { success: true, data: template };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception fetching receipt template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Create a new receipt template
 */
export const createReceiptTemplate = async (
  name: string,
  description: string,
  design_data: FormData,
  paper_width: number = 80
): Promise<ApiResponse<Template>> => {
  console.log('💾 [Supabase Direct] create_receipt_template called:', name);
  try {
    const { data, error } = await supabase
      .from('receipt_templates')
      .insert({
        name,
        description,
        design_data,
        paper_width
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [Supabase Direct] Failed to create receipt template:', error);
      return { success: false, error: error.message };
    }

    // Transform to frontend Template structure
    const template: Template = {
      id: data.id,
      metadata: {
        name: data.name,
        description: data.description
      },
      design_data: data.design_data,
      paper_width: data.paper_width || 80
    };

    console.log('✅ [Supabase Direct] Created template:', template.id);
    return { success: true, data: template };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception creating receipt template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Update an existing receipt template
 */
export const updateReceiptTemplate = async (
  templateId: string,
  updates: {
    name?: string;
    description?: string;
    design_data?: FormData;
    paper_width?: number;
  }
): Promise<ApiResponse<Template>> => {
  console.log('🔄 [Supabase Direct] update_receipt_template called:', templateId);
  try {
    if (!templateId) {
      return { success: false, error: 'Template ID required' };
    }

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.design_data !== undefined) updateData.design_data = updates.design_data;
    if (updates.paper_width !== undefined) updateData.paper_width = updates.paper_width;

    const { data, error } = await supabase
      .from('receipt_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Supabase Direct] Failed to update receipt template:', error);
      return { success: false, error: error.message };
    }

    // Transform to frontend Template structure
    const template: Template = {
      id: data.id,
      metadata: {
        name: data.name,
        description: data.description
      },
      design_data: data.design_data,
      paper_width: data.paper_width || 80
    };

    console.log('✅ [Supabase Direct] Updated template:', template.id);
    return { success: true, data: template };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception updating receipt template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Delete a receipt template
 */
export const deleteReceiptTemplate = async (templateId: string): Promise<ApiResponse<void>> => {
  console.log('🗑️ [Supabase Direct] delete_receipt_template called:', templateId);
  try {
    if (!templateId) {
      return { success: false, error: 'Template ID required' };
    }

    const { error } = await supabase
      .from('receipt_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('❌ [Supabase Direct] Failed to delete receipt template:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [Supabase Direct] Deleted template:', templateId);
    return { success: true };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception deleting receipt template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ==================== Template Assignment Operations ====================

/**
 * Get all template assignments (returns object keyed by order_mode)
 */
export const getTemplateAssignments = async (): Promise<ApiResponse<TemplateAssignmentsMap>> => {
  console.log('📋 [Supabase Direct] get_template_assignments called');
  try {
    const { data, error } = await supabase
      .from('template_assignments')
      .select('*');

    if (error) {
      console.error('❌ [Supabase Direct] Failed to fetch template assignments:', error);
      return { success: false, error: error.message };
    }

    // Transform array to object keyed by order_mode (like Electron does)
    const assignmentsMap: TemplateAssignmentsMap = {};
    (data || []).forEach((assignment: any) => {
      assignmentsMap[assignment.order_mode.toUpperCase()] = assignment;
    });

    console.log('✅ [Supabase Direct] Loaded template assignments for order modes:', Object.keys(assignmentsMap));
    return { success: true, data: assignmentsMap };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception fetching template assignments:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get template assignment for a specific order mode
 */
export const getTemplateAssignment = async (orderMode: string): Promise<ApiResponse<TemplateAssignment | null>> => {
  console.log('📋 [Supabase Direct] get_template_assignment called:', orderMode);
  try {
    if (!orderMode) {
      return { success: false, error: 'Order mode required' };
    }

    const { data, error } = await supabase
      .from('template_assignments')
      .select('*')
      .eq('order_mode', orderMode.toUpperCase())
      .single();

    if (error) {
      // PGRST116 = no rows returned - this is OK, just means no assignment exists yet
      if (error.code === 'PGRST116') {
        console.log('📋 [Supabase Direct] No assignment found for', orderMode, '(returning null)');
        return { success: true, data: null };
      }
      console.error('❌ [Supabase Direct] get_template_assignment error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [Supabase Direct] Found template assignment for', orderMode);
    return { success: true, data: data };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception fetching template assignment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Set/update template assignment for an order mode (upsert)
 */
export const setTemplateAssignment = async (
  orderMode: string,
  customerTemplateId: string | null,
  kitchenTemplateId: string | null
): Promise<ApiResponse<TemplateAssignment>> => {
  console.log('💾 [Supabase Direct] set_template_assignment called:', orderMode);
  try {
    if (!orderMode) {
      return { success: false, error: 'Order mode required' };
    }

    const { data, error } = await supabase
      .from('template_assignments')
      .upsert(
        {
          order_mode: orderMode.toUpperCase(),
          customer_template_id: customerTemplateId,
          kitchen_template_id: kitchenTemplateId,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'order_mode'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ [Supabase Direct] Failed to set template assignment:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [Supabase Direct] Set template assignment for', orderMode);
    return { success: true, data: data };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception setting template assignment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ==================== Convenience Export ====================

export const ReceiptTemplateSupabase = {
  listTemplates: listReceiptTemplates,
  getTemplate: getReceiptTemplate,
  createTemplate: createReceiptTemplate,
  updateTemplate: updateReceiptTemplate,
  deleteTemplate: deleteReceiptTemplate,
  getAssignments: getTemplateAssignments,
  getAssignment: getTemplateAssignment,
  setAssignment: setTemplateAssignment
};

export default ReceiptTemplateSupabase;
