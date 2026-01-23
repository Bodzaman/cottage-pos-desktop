/**
 * Types - Central Type Definitions
 *
 * This is the main entry point for all type definitions in the application.
 * Import types from here rather than individual files for consistency.
 *
 * @example
 * import { MenuItem, OrderItem, CartItem, OrderMode } from 'types';
 */

// Import base CustomerProfile for extension
import type { CustomerProfile as BaseCustomerProfileType } from '../brain/data-contracts';

// ================================
// COMMON TYPES
// ================================
export {
  // Order modes
  type OrderMode,
  type OrderType,
  orderTypeToMode,
  orderModeToType,

  // Status types
  type OrderStatus,
  type KitchenItemStatus,
  type PaymentStatus,
  type TableStatus,

  // Payment
  type PaymentMethodType,
  type PaymentResult,

  // Item types
  type ItemType,
  type InheritanceState,
  type ImageSource,

  // Form status
  type StepStatus,

  // Utility types
  type EntityId,
  type ISOTimestamp,
  type Nullable,
  type Optional,
  type DeepPartial,
  type RequiredFields,
} from './common';

// ================================
// API TYPES (Re-exports from data-contracts)
// ================================
export type {
  // Agent profiles
  AgentProfileOutput as AgentProfile,
  AgentProfileOutput,
  AgentProfileInput,
  AgentProfilesResponse,

  // Tables
  PosTableResponse,
  TablesResponse,

  // Enriched types
  EnrichedDineInOrderItem,
  EnrichedFavoriteItem,
  FavoriteList,
  FavoriteListItem,
  EnrichedFavoritesResponse,

  // POS types
  POSBundleMenuItem,

  // Variant info (API version)
  VariantInfo as ApiVariantInfo,

  // Orders
  OrderModel,
  RecentOrder,
  SharedListResponse,

  // Customer
  CustomerProfileResponse,

  // Cart/Item requests
  AddItemRequest,
  RemoveItemRequest,
  UpdateQuantityRequest,
  ChatRequest,

  // Templates
  TemplateAssignment,
  TemplateAssignmentsResponse,
} from '../brain/data-contracts';

// Create OrderModelResponse as an alias (commonly expected pattern)
export type OrderModelResponse = {
  success: boolean;
  orders: import('../brain/data-contracts').OrderModel[];
  total?: number;
};

// Extended CustomerProfile with additional fields for profile image and auth provider
export interface CustomerProfile extends BaseCustomerProfileType {
  image_url?: string | null;
  google_profile_image?: string | null;
  auth_provider?: string | null;
}

// ================================
// MENU TYPES
// ================================
export {
  // Category
  type MenuCategory,
  type ExtendedMenuCategory,
  type Category, // Legacy alias

  // Protein
  type ProteinType,

  // Variants
  type ItemVariant,
  type CartMenuItemVariant,
  type MenuItemVariant, // Legacy alias

  // Menu items
  type MenuItem,
  type SuggestedMenuItem,

  // Set meals
  type SetMeal,
  type SetMealItem,

  // Customizations & modifiers
  type Customization,
  type Modifier,
  type ModifierSelection,
  type CustomizationSelection,

  // Form data
  type MenuItemFormData,

  // Signature dishes
  type SignatureDish,
  type SignatureVariantInfo,
  type VariantInfo, // Alias for SignatureVariantInfo

  // API mappers
  mapApiCategoryToMenuCategory,
  mapApiItemToMenuItem,
  mapApiVariantToItemVariant,
  mapApiProteinToProteinType,
  mapMenuItemToApi,
} from './menu';

// ================================
// ORDER TYPES
// ================================
export {
  // Order items
  type OrderItem,
  type ReceiptOrderItem,

  // Orders
  type Order,
  type CompletedOrder,
  type OnlineOrder,
  type KitchenOrder,

  // Delivery
  type DeliveryAddress,
  type CustomerAddress,
  type DeliveryValidationRequest,
  type DeliveryValidationResponse,
  type DeliverySettings,

  // Tips
  type TipSelection,

  // API mappers
  mapApiOrderToOrder,
  mapApiOrderItemToOrderItem,
  mapOrderToApi,
  mapOrderItemToApi,
  mapApiDeliveryAddress,
} from './orders';

// ================================
// CART TYPES
// ================================
export {
  // Cart customization
  type CartCustomization,
  type SelectedCustomization,

  // Cart items
  type CartItem,
  type CartItemVariant,

  // Cart input types
  type MenuItemInput,

  // Cart state
  type CartState,

  // Selectors
  type CartItemsSelector,
  type CartTotalSelector,
  type CartItemCountSelector,
  type OrderModeSelector,

  // Helpers
  getPriceForMode,
  calculateTotalItems,
  calculateTotalAmount,
  generateCartItemId,

  // Events
  type CartEvent,
  type CartAnalyticsPayload,
} from './cart';

// ================================
// TABLE TYPES
// ================================
export {
  // Tables
  type Table,
  type TableData,

  // Table orders
  type TableOrder,
  type PersistentTableOrder,
  type TableOrderItem,

  // Customer tabs
  type CustomerTab,
  type CustomerTabSummary,

  // Store state
  type TableOrdersState,

  // API mappers
  mapApiTableOrderToTableOrder,
  mapApiTableOrderItem,
  mapApiCustomerTab,
} from './tables';

// ================================
// SETTINGS TYPES
// ================================
export {
  // Opening hours
  type DayOfWeek,
  type TimeShift,
  type DaySchedule,
  type OpeningHours,

  // Custom serving sizes
  type CustomServingSizeResponse,
  type CustomServingSizeCreate,
  type CustomServingSizeUpdate,
} from './settings';

// ================================
// MEDIA TYPES
// ================================
export {
  // Asset types
  type AssetCategory,
  type MediaAsset,
  type MediaAssetDetails,
  type ImageVariant,
  type MediaImagePreviewMetadata,
  type MediaItem,
  type MenuItemInfo,
  type EnhancedMediaItem,
} from './media';

// ================================
// API TYPES (Custom)
// ================================
export {
  // Agent configuration
  type AgentCustomization,
  type AgentConfig,
  type AgentConfigResponse,
  type AgentConfigRequest,
  type AgentTestCallResponse,

  // File upload
  type UploadFileRequest,
  type UploadFileResponse,

  // Voice cart
  type CreateAuthenticatedVoiceCartSessionRequest,
  type VoiceCartSessionResponse,

  // Order tracking
  type EnrichedOrderItem,
} from './api';

// ================================
// STRUCTURED EVENTS (AI Chat & Voice)
// ================================
export {
  // Base types
  type BaseStructuredEvent,
  type StructuredEventType,

  // Event types
  type TextDeltaEvent,
  type MenuRefsEvent,
  type SuggestedActionsEvent,
  type CartProposalEvent,
  type MetadataEvent,
  type CompleteEvent,
  type ErrorEvent,
  type StructuredEvent,

  // Sub-types
  type MenuRef,
  type SuggestedAction,
  type SuggestedActionType,
  type CartOperation,
  type CartProposal,
  type CartProposalItem,
  type CartProposalCustomization,

  // Chat message extensions
  type StructuredChatMessage,
  type PendingCartProposalState,

  // Type guards
  isTextDeltaEvent,
  isMenuRefsEvent,
  isSuggestedActionsEvent,
  isCartProposalEvent,
  isMetadataEvent,
  isCompleteEvent,
  isErrorEvent,

  // Intent constants
  CARD_EMIT_INTENTS,
  CARD_SUPPRESS_INTENTS,
  DETERMINISTIC_INTENTS,
} from './structured-events';

// ================================
// RE-EXPORTS FOR COMPATIBILITY
// ================================

// These are commonly imported types that should be available from 'types'
// This maintains backward compatibility with existing imports

/**
 * @deprecated Import directly from 'types' instead of using this namespace
 */
export const Types = {
  // This object is for IDE autocomplete hints only
  // Use direct exports instead
};
