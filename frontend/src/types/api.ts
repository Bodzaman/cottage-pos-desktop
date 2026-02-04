/**
 * API Types
 *
 * Types for API requests and responses that are not auto-generated.
 */

import type { AgentProfileOutput } from '../brain/data-contracts';

// ================================
// EXTENDED AGENT TYPES
// ================================

/**
 * Extended AgentProfileOutput with additional fields that may be present
 * but not in the auto-generated types
 */
export interface ExtendedAgentProfile extends AgentProfileOutput {
  image_id?: string | null;
  is_admin_visible?: boolean;
  agent_role?: string;
}

// ================================
// AGENT CONFIGURATION
// ================================

export interface AgentCustomization {
  name: string;
  isActive: boolean;
}

export interface AgentConfig {
  activeAgentId: string;
  agentCustomizations: Record<string, AgentCustomization>;
}

export interface AgentConfigResponse {
  success: boolean;
  config?: AgentConfig;
  error?: string;
}

export interface AgentConfigRequest {
  activeAgentId: string;
  agentCustomizations: Record<string, AgentCustomization>;
}

export interface AgentTestCallResponse {
  success: boolean;
  message?: string;
  audioUrl?: string;
  error?: string;
}

// ================================
// FILE UPLOAD
// ================================

export interface UploadFileRequest {
  file: File;
  filename?: string;
  folder?: string;
  contentType?: string;
}

export interface UploadFileResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

// ================================
// VOICE CART SESSION
// ================================

export interface CreateAuthenticatedVoiceCartSessionRequest {
  customer_id?: string;
  user_id?: string; // Alias for customer_id
  session_id?: string;
  phone_number?: string;
}

export interface VoiceCartSessionResponse {
  success: boolean;
  session_id?: string;
  cart_id?: string;
  error?: string;
}

// ================================
// ORDER TRACKING
// ================================

export interface EnrichedOrderItem {
  id: string;
  menu_item_id: string;
  menuItemId?: string; // camelCase alias
  variant_id?: string | null;
  variantId?: string | null; // camelCase alias
  name: string;
  quantity: number;
  price: number;
  variant_name?: string;
  variantName?: string; // camelCase alias
  customizations?: Array<{
    id: string;
    name: string;
    price_adjustment: number;
  }>;
  notes?: string;
  status?: string;
}
