/**
 * Receipt Template Supabase Service
 * Direct Supabase queries for template operations - no backend server required
 * This enables the web app to work like the Electron version
 *
 * Kitchen Variant System:
 * - When a customer template is created, a kitchen variant is auto-created
 * - Kitchen variants are linked via parent_template_id
 * - Shared fields sync automatically when parent is updated
 */

import { supabase } from './supabaseClient';
import { Template, FormData } from './receiptDesignerTypes';

// ==================== Types ====================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;  // For partial success scenarios (e.g., kitchen variant failed)
}

/**
 * SYNC_FIELDS: Fields that propagate from parent template to kitchen variant
 *
 * Why these fields sync:
 * - Business info: Shared across all receipts (name, address, phone, etc.)
 * - Logo/QR codes: Same branding for customer and kitchen
 * - Fonts: Kitchen uses same fonts as parent
 * - Header/Footer: Consistent messaging across all receipts
 * - Kitchen visibility: Parent controls what appears on kitchen tickets
 */
const SYNC_FIELDS: (keyof FormData)[] = [
  // Business Information (6 fields)
  'businessName', 'vatNumber', 'address', 'phone', 'email', 'website',
  // Visibility Toggles (5 fields)
  'showPhone', 'showEmail', 'showWebsite', 'showVatNumber', 'showCategorySubheadings',
  // Logo (6 fields)
  'logoFile', 'logoUrl', 'logoImage', 'logoPosition', 'logoWidth', 'logoHeight',
  // QR Codes (3 fields)
  'qrCodes', 'headerQRCodes', 'footerQRCodes',
  // Header (1 field)
  'headerText',
  // Font System (7 fields) - includes new businessNameFont and businessNameFontSize
  'selectedFont', 'useItemsFont', 'useItemsThermalFont', 'receiptFont', 'itemsFont',
  'businessNameFont', 'businessNameFontSize',
  // Footer (5 fields)
  'footerMessage', 'terms', 'socialMedia', 'customFooterText', 'showCustomFooter',
  // Kitchen visibility settings (11 fields)
  'kitchenShowHeader', 'kitchenShowBusinessInfo', 'kitchenShowLogo', 'kitchenShowQRCodes',
  'kitchenShowOrderInfo', 'kitchenShowTableInfo', 'kitchenShowCustomerDetails',
  'kitchenShowTiming', 'kitchenShowSpecialInstructions', 'kitchenShowTotals', 'kitchenShowFooter'
];

/**
 * Create kitchen variant design data from parent template
 */
const createKitchenVariantDesignData = (parentDesignData: FormData): FormData => {
  return {
    ...parentDesignData,
    receiptFormat: 'kitchen_customer',
    showKitchenTotals: true,
    showContainerQtyField: true,
    showCheckedField: true
  };
};

/**
 * Merge synced fields from parent to existing kitchen variant data
 */
const syncKitchenVariantDesignData = (
  kitchenData: FormData,
  parentData: FormData
): FormData => {
  const synced = { ...kitchenData };
  for (const field of SYNC_FIELDS) {
    (synced as any)[field] = (parentData as any)[field];
  }
  return synced;
};

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
      paper_width: t.paper_width || 80,
      parent_template_id: t.parent_template_id || null
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
      paper_width: data.paper_width || 80,
      parent_template_id: data.parent_template_id || null
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
 * Automatically creates a linked kitchen variant
 */
export const createReceiptTemplate = async (
  name: string,
  description: string,
  design_data: FormData,
  paper_width: number = 80
): Promise<ApiResponse<Template>> => {
  console.log('💾 [Supabase Direct] create_receipt_template called:', name);
  try {
    // Get current user for user_id field
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ [Supabase Direct] No authenticated user:', userError);
      return { success: false, error: 'Authentication required to create template' };
    }

    // Ensure we're creating a customer template (not a kitchen variant)
    const customerDesignData = {
      ...design_data,
      receiptFormat: 'front_of_house' as const
    };

    // Create the customer (parent) template
    const { data, error } = await supabase
      .from('receipt_templates')
      .insert({
        name,
        description,
        design_data: customerDesignData,
        paper_width,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [Supabase Direct] Failed to create receipt template:', error);
      return { success: false, error: error.message };
    }

    // Auto-create the kitchen variant
    const kitchenDesignData = createKitchenVariantDesignData(customerDesignData);
    const kitchenName = `${name} - KITCHEN`;

    const { error: kitchenError } = await supabase
      .from('receipt_templates')
      .insert({
        name: kitchenName,
        description: `Kitchen variant of ${name}`,
        design_data: kitchenDesignData,
        paper_width,
        parent_template_id: data.id,
        user_id: user.id
      });

    // Track if kitchen variant creation failed
    let kitchenVariantWarning: string | undefined;

    if (kitchenError) {
      console.warn('⚠️ [Supabase Direct] Failed to create kitchen variant:', kitchenError);
      kitchenVariantWarning = 'Template created but kitchen variant failed. Kitchen printing may not work correctly.';
    } else {
      console.log('✅ [Supabase Direct] Auto-created kitchen variant:', kitchenName);
    }

    // Transform to frontend Template structure
    const template: Template = {
      id: data.id,
      metadata: {
        name: data.name,
        description: data.description
      },
      design_data: data.design_data,
      paper_width: data.paper_width || 80,
      parent_template_id: null
    };

    console.log('✅ [Supabase Direct] Created template:', template.id);
    return {
      success: true,
      data: template,
      warning: kitchenVariantWarning
    };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception creating receipt template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Update an existing receipt template
 * Automatically syncs shared fields to linked kitchen variant
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

    // Track sync warnings
    let syncWarning: string | undefined;

    // If this is a parent template (not a kitchen variant), sync to kitchen variant
    if (!data.parent_template_id && updates.design_data) {
      try {
        // Find the kitchen variant
        const { data: kitchenVariant, error: findError } = await supabase
          .from('receipt_templates')
          .select('*')
          .eq('parent_template_id', templateId)
          .single();

        if (findError) {
          // PGRST116 = no rows returned - kitchen variant doesn't exist
          if (findError.code !== 'PGRST116') {
            console.warn('⚠️ [Supabase Direct] Error finding kitchen variant:', findError);
            syncWarning = 'Could not sync kitchen variant - it may be out of sync.';
          }
          // If PGRST116 (not found), that's expected for some templates - no warning needed
        } else if (kitchenVariant) {
          // Sync shared fields to kitchen variant
          const syncedKitchenData = syncKitchenVariantDesignData(
            kitchenVariant.design_data,
            updates.design_data
          );

          const kitchenUpdateData: any = {
            design_data: syncedKitchenData
          };

          // Sync name if changed
          if (updates.name !== undefined) {
            kitchenUpdateData.name = `${updates.name} - KITCHEN`;
          }

          // Sync paper width if changed
          if (updates.paper_width !== undefined) {
            kitchenUpdateData.paper_width = updates.paper_width;
          }

          const { error: syncError } = await supabase
            .from('receipt_templates')
            .update(kitchenUpdateData)
            .eq('id', kitchenVariant.id);

          if (syncError) {
            console.warn('⚠️ [Supabase Direct] Failed to sync kitchen variant:', syncError);
            syncWarning = 'Template saved but kitchen variant sync failed. Kitchen receipts may show old data.';
          } else {
            console.log('✅ [Supabase Direct] Synced kitchen variant:', kitchenVariant.id);
          }
        }
      } catch (syncException) {
        console.warn('⚠️ [Supabase Direct] Exception during kitchen variant sync:', syncException);
        syncWarning = 'Template saved but kitchen variant sync failed unexpectedly.';
      }
    }

    // Transform to frontend Template structure
    const template: Template = {
      id: data.id,
      metadata: {
        name: data.name,
        description: data.description
      },
      design_data: data.design_data,
      paper_width: data.paper_width || 80,
      parent_template_id: data.parent_template_id || null
    };

    console.log('✅ [Supabase Direct] Updated template:', template.id);
    return {
      success: true,
      data: template,
      warning: syncWarning
    };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception updating receipt template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Delete a receipt template
 * Handles cascading deletes for:
 * 1. Kitchen variant (if this is a parent template)
 * 2. Template assignments referencing this template
 */
export const deleteReceiptTemplate = async (templateId: string): Promise<ApiResponse<void>> => {
  console.log('🗑️ [Supabase Direct] delete_receipt_template called:', templateId);
  try {
    if (!templateId) {
      return { success: false, error: 'Template ID required' };
    }

    // Step 1: Delete kitchen variant if this is a parent template
    const { error: kitchenDeleteError } = await supabase
      .from('receipt_templates')
      .delete()
      .eq('parent_template_id', templateId);

    if (kitchenDeleteError) {
      console.warn('⚠️ [Supabase Direct] Failed to delete kitchen variant:', kitchenDeleteError);
      // Continue anyway - kitchen variant may not exist
    } else {
      console.log('✅ [Supabase Direct] Deleted kitchen variant for parent:', templateId);
    }

    // Step 2: Clear template assignments referencing this template
    // Set to null rather than delete to preserve assignment records
    const { error: assignmentError1 } = await supabase
      .from('template_assignments')
      .update({ customer_template_id: null })
      .eq('customer_template_id', templateId);

    if (assignmentError1) {
      console.warn('⚠️ [Supabase Direct] Failed to clear customer template assignments:', assignmentError1);
    }

    const { error: assignmentError2 } = await supabase
      .from('template_assignments')
      .update({ kitchen_template_id: null })
      .eq('kitchen_template_id', templateId);

    if (assignmentError2) {
      console.warn('⚠️ [Supabase Direct] Failed to clear kitchen template assignments:', assignmentError2);
    }

    // Step 3: Delete the template itself
    const { error } = await supabase
      .from('receipt_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('❌ [Supabase Direct] Failed to delete receipt template:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [Supabase Direct] Deleted template and cleaned up references:', templateId);
    return { success: true };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception deleting receipt template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get the kitchen variant for a parent template
 */
export const getKitchenVariant = async (parentTemplateId: string): Promise<ApiResponse<Template | null>> => {
  console.log('🍳 [Supabase Direct] get_kitchen_variant called for parent:', parentTemplateId);
  try {
    if (!parentTemplateId) {
      return { success: false, error: 'Parent template ID required' };
    }

    const { data, error } = await supabase
      .from('receipt_templates')
      .select('*')
      .eq('parent_template_id', parentTemplateId)
      .single();

    if (error) {
      // PGRST116 = no rows returned - means no kitchen variant exists
      if (error.code === 'PGRST116') {
        console.log('📋 [Supabase Direct] No kitchen variant found for parent:', parentTemplateId);
        return { success: true, data: null };
      }
      console.error('❌ [Supabase Direct] Failed to fetch kitchen variant:', error);
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
      paper_width: data.paper_width || 80,
      parent_template_id: data.parent_template_id
    };

    console.log('✅ [Supabase Direct] Found kitchen variant:', template.metadata.name);
    return { success: true, data: template };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception fetching kitchen variant:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * List only parent templates (exclude kitchen variants)
 * Used by the simplified assignment modal
 */
export const listParentTemplates = async (): Promise<ApiResponse<Template[]>> => {
  console.log('📋 [Supabase Direct] list_parent_templates called');
  try {
    const { data, error } = await supabase
      .from('receipt_templates')
      .select('*')
      .is('parent_template_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Supabase Direct] Failed to fetch parent templates:', error);
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
      paper_width: t.paper_width || 80,
      parent_template_id: null
    }));

    console.log(`✅ [Supabase Direct] Loaded ${templates.length} parent templates`);
    return { success: true, data: templates };
  } catch (error) {
    console.error('❌ [Supabase Direct] Exception fetching parent templates:', error);
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
 * Validates that referenced templates exist before saving
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

    // Validate that referenced templates exist before saving
    if (customerTemplateId) {
      const { data: customerTemplate, error: customerError } = await supabase
        .from('receipt_templates')
        .select('id')
        .eq('id', customerTemplateId)
        .single();

      if (customerError || !customerTemplate) {
        console.error('❌ [Supabase Direct] Customer template not found:', customerTemplateId);
        return { success: false, error: `Customer template ${customerTemplateId} not found. It may have been deleted.` };
      }
    }

    if (kitchenTemplateId) {
      const { data: kitchenTemplate, error: kitchenError } = await supabase
        .from('receipt_templates')
        .select('id')
        .eq('id', kitchenTemplateId)
        .single();

      if (kitchenError || !kitchenTemplate) {
        console.error('❌ [Supabase Direct] Kitchen template not found:', kitchenTemplateId);
        return { success: false, error: `Kitchen template ${kitchenTemplateId} not found. It may have been deleted.` };
      }
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
  listParentTemplates: listParentTemplates,
  getTemplate: getReceiptTemplate,
  getKitchenVariant: getKitchenVariant,
  createTemplate: createReceiptTemplate,
  updateTemplate: updateReceiptTemplate,
  deleteTemplate: deleteReceiptTemplate,
  getAssignments: getTemplateAssignments,
  getAssignment: getTemplateAssignment,
  setAssignment: setTemplateAssignment
};

export default ReceiptTemplateSupabase;
