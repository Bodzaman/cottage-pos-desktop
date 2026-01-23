/**
 * Structured Events - Unified Event Protocol for AI Chat & Voice
 *
 * This module defines the structured event types shared between chat and voice channels.
 * Menu cards come from model structured output (menu item IDs), NOT transcript detection.
 *
 * @module structured-events
 */

// ================================
// BASE EVENT TYPE
// ================================

/**
 * All structured events extend this base interface
 */
export interface BaseStructuredEvent {
  type: StructuredEventType;
}

/**
 * Discriminated union of all event types
 */
export type StructuredEventType =
  | 'text_delta'
  | 'menu_refs'
  | 'suggested_actions'
  | 'cart_proposal'
  | 'metadata'
  | 'complete'
  | 'error';

// ================================
// TEXT DELTA EVENT
// ================================

/**
 * Streaming text content from AI response
 */
export interface TextDeltaEvent extends BaseStructuredEvent {
  type: 'text_delta';
  /** Incremental text content */
  text: string;
}

// ================================
// MENU REFS EVENT
// ================================

/**
 * Reference to a menu item for card rendering
 * CRITICAL: Only emitted for browse/recommendation intents, NOT detail questions
 */
export interface MenuRef {
  /** Database ID of the menu item (MUST be validated against published=true AND active=true) */
  menu_item_id: string;
  /** Optional variant ID */
  variant_id?: string;
  /** Where to render the card relative to text content */
  position: 'inline' | 'after';
}

/**
 * Menu item references for rendering cards
 * Intent-gated: Only emitted for browse/recommendation intents
 */
export interface MenuRefsEvent extends BaseStructuredEvent {
  type: 'menu_refs';
  /** Array of menu item references (max 3 per response) */
  items: MenuRef[];
}

// ================================
// SUGGESTED ACTIONS EVENT
// ================================

/**
 * Quick-reply action chip type
 */
export type SuggestedActionType = 'quick_reply' | 'confirm_add' | 'confirm_remove';

/**
 * A suggested action that appears as a quick-reply chip
 */
export interface SuggestedAction {
  /** Unique ID for the action */
  id: string;
  /** Display label for the chip (e.g., "Add to cart", "View allergens") */
  label: string;
  /** Message to send when clicked */
  message: string;
  /** Type of action */
  type: SuggestedActionType;
}

/**
 * Suggested quick-reply actions
 */
export interface SuggestedActionsEvent extends BaseStructuredEvent {
  type: 'suggested_actions';
  /** Array of suggested actions (2-4 recommended) */
  actions: SuggestedAction[];
}

// ================================
// CART PROPOSAL EVENT
// ================================

/**
 * Cart operation type
 */
export type CartOperation = 'add' | 'remove' | 'update' | 'clear';

/**
 * Customization selection for a cart item
 */
export interface CartProposalCustomization {
  id: string;
  name: string;
  price: number;
}

/**
 * Individual item in a cart proposal
 */
export interface CartProposalItem {
  /** Menu item database ID */
  menu_item_id: string;
  /** Optional variant ID */
  variant_id?: string;
  /** Quantity to add/update */
  quantity: number;
  /** Selected customizations */
  customizations?: CartProposalCustomization[];
  // Preview fields (populated by backend for UI display)
  /** Item name for preview display */
  item_name?: string;
  /** Variant name for preview display */
  variant_name?: string;
  /** Unit price for preview display */
  unit_price?: number;
  /** Special notes */
  notes?: string;
}

/**
 * Cart modification proposal
 * CRITICAL: Cart changes ALWAYS require explicit user confirmation
 */
export interface CartProposal {
  /** Type of cart operation */
  operation: CartOperation;
  /** Items to add/remove/update */
  items: CartProposalItem[];
  /** Calculated price delta for preview */
  total_delta: number;
  /** ALWAYS true - user must confirm before cart is modified */
  confirmation_required: boolean;
  /** Whether user can edit quantity in confirmation dialog */
  allow_qty_edit?: boolean;
}

/**
 * Cart proposal event - NEVER executes directly, requires confirmation
 */
export interface CartProposalEvent extends BaseStructuredEvent {
  type: 'cart_proposal';
  /** The cart modification proposal */
  proposal: CartProposal;
}

// ================================
// METADATA EVENT
// ================================

/**
 * Metadata about the AI response for analytics/debugging
 */
export interface MetadataEvent extends BaseStructuredEvent {
  type: 'metadata';
  /** Detected intent (e.g., 'menu_search', 'price_inquiry') */
  intent: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Tools/functions called during this response */
  toolsUsed: string[];
}

// ================================
// COMPLETE EVENT
// ================================

/**
 * Signals streaming is complete
 */
export interface CompleteEvent extends BaseStructuredEvent {
  type: 'complete';
}

// ================================
// ERROR EVENT
// ================================

/**
 * Error event for recoverable/non-recoverable errors
 */
export interface ErrorEvent extends BaseStructuredEvent {
  type: 'error';
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Whether the error is recoverable (retry may succeed) */
  recoverable: boolean;
}

// ================================
// UNION TYPE
// ================================

/**
 * Discriminated union of all structured event types
 */
export type StructuredEvent =
  | TextDeltaEvent
  | MenuRefsEvent
  | SuggestedActionsEvent
  | CartProposalEvent
  | MetadataEvent
  | CompleteEvent
  | ErrorEvent;

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for TextDeltaEvent
 */
export function isTextDeltaEvent(event: StructuredEvent): event is TextDeltaEvent {
  return event.type === 'text_delta';
}

/**
 * Type guard for MenuRefsEvent
 */
export function isMenuRefsEvent(event: StructuredEvent): event is MenuRefsEvent {
  return event.type === 'menu_refs';
}

/**
 * Type guard for SuggestedActionsEvent
 */
export function isSuggestedActionsEvent(event: StructuredEvent): event is SuggestedActionsEvent {
  return event.type === 'suggested_actions';
}

/**
 * Type guard for CartProposalEvent
 */
export function isCartProposalEvent(event: StructuredEvent): event is CartProposalEvent {
  return event.type === 'cart_proposal';
}

/**
 * Type guard for MetadataEvent
 */
export function isMetadataEvent(event: StructuredEvent): event is MetadataEvent {
  return event.type === 'metadata';
}

/**
 * Type guard for CompleteEvent
 */
export function isCompleteEvent(event: StructuredEvent): event is CompleteEvent {
  return event.type === 'complete';
}

/**
 * Type guard for ErrorEvent
 */
export function isErrorEvent(event: StructuredEvent): event is ErrorEvent {
  return event.type === 'error';
}

// ================================
// CHAT MESSAGE EXTENSIONS
// ================================

/**
 * Extended chat message interface with structured event support
 */
export interface StructuredChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
  /** Menu item references for rendering cards */
  menuRefs?: MenuRef[];
  /** Suggested follow-up actions */
  suggestedActions?: SuggestedAction[];
  /** Response metadata for analytics */
  metadata?: {
    intent?: string;
    confidence?: number;
    toolsUsed?: string[];
    userId?: string;
    sessionId?: string;
    modelUsed?: string;
    latencyMs?: number;
  };
}

// ================================
// PENDING CART PROPOSAL STATE
// ================================

/**
 * State for pending cart proposal requiring user confirmation
 */
export interface PendingCartProposalState {
  /** The pending proposal */
  proposal: CartProposal | null;
  /** Whether the confirmation dialog is open */
  isOpen: boolean;
}

// ================================
// INTENT CONSTANTS
// ================================

/**
 * Intents where menu_refs SHOULD be emitted (browse/recommendation)
 */
export const CARD_EMIT_INTENTS = new Set([
  'menu_search',
  'browse_menu',
  'recommendations',
  'show_menu',
  'what_do_you_have',
  'popular_items',
  'specials',
]);

/**
 * Intents where menu_refs should NOT be emitted (detail questions)
 */
export const CARD_SUPPRESS_INTENTS = new Set([
  'item_detail_question',
  'price_inquiry',
  'allergen_check',
  'ingredient_question',
  'spice_level_question',
]);

/**
 * Deterministic intents that MUST use tools (never hallucinate)
 */
export const DETERMINISTIC_INTENTS = new Set([
  'menu_query',
  'menu_search',
  'item_details',
  'price_inquiry',
  'cart_add',
  'cart_remove',
  'cart_view',
  'cart_clear',
  'order_status',
  'order_history',
  'reorder',
  'restaurant_info',
  'hours',
  'delivery_zone',
  'allergen_check',
]);
