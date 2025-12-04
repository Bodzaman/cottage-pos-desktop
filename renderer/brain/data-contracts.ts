/** AIContentSuggestionRequest */
export interface AIContentSuggestionRequest {
  /** Menu Item Id */
  menu_item_id: string;
  /** Name */
  name: string;
  /**
   * Description
   * @default ""
   */
  description?: string;
  /**
   * Categories
   * @default []
   */
  categories?: string[];
  /** Variant Id */
  variant_id?: string | null;
  /**
   * Field Type
   * @default "item_description"
   */
  field_type?: string | null;
}

/** AIContentSuggestionResponse */
export interface AIContentSuggestionResponse {
  /** Voice Description */
  voice_description: string;
  /** Spoken Alias */
  spoken_alias: string[];
  /** Voice Upsell Suggestion */
  voice_upsell_suggestion: string;
  /** Ai Tags */
  ai_tags: Record<string, any>;
  /** Success */
  success: boolean;
  /** Error */
  error?: string | null;
}

/** AIFieldsStatusResponse */
export interface AIFieldsStatusResponse {
  /** Exists */
  exists: boolean;
  /** Message */
  message: string;
}

/** AIMenuContextResponse */
export interface AIMenuContextResponse {
  /** Success */
  success: boolean;
  /** Categories */
  categories: CategoryContext[];
  /** Menu Items */
  menu_items: MenuItemContext[];
  /** Total Items */
  total_items: number;
  /** Last Updated */
  last_updated: string;
  /** Context Size */
  context_size: number;
  /** Metadata */
  metadata: Record<string, any>;
}

/**
 * AIRecommendationsResponse
 * Response containing AI-generated menu recommendations
 */
export interface AIRecommendationsResponse {
  /** Status */
  status: string;
  /** Recommendations */
  recommendations: AppApisAiMenuRecommendationsRecommendationItem[];
  /** Message */
  message?: string | null;
}

/** AIVoiceSettings */
export interface AIVoiceSettings {
  /**
   * Restaurant Id
   * @default "cottage_tandoori"
   */
  restaurant_id?: string;
  /**
   * Enabled
   * @default false
   */
  enabled?: boolean;
  /** Selected Agent Id */
  selected_agent_id?: string | null;
  /** Custom Name */
  custom_name?: string | null;
  /** Avatar Url */
  avatar_url?: string | null;
  /**
   * Auto Approve Orders
   * @default true
   */
  auto_approve_orders?: boolean;
  /**
   * Respect Time Windows
   * @default true
   */
  respect_time_windows?: boolean;
  /**
   * Time Windows
   * @default {"monday":{"enabled":true,"end":"22:00","start":"12:00"},"tuesday":{"enabled":true,"end":"22:00","start":"12:00"},"wednesday":{"enabled":true,"end":"22:00","start":"12:00"},"thursday":{"enabled":true,"end":"22:00","start":"12:00"},"friday":{"enabled":true,"end":"22:00","start":"12:00"},"saturday":{"enabled":true,"end":"22:30","start":"12:00"},"sunday":{"enabled":true,"end":"22:00","start":"12:00"}}
   */
  time_windows?: Record<string, any>;
  /**
   * Phone Number
   * @default "+447883319535"
   */
  phone_number?: string;
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
  /**
   * Under Maintenance
   * @default true
   */
  under_maintenance?: boolean;
}

/** AIVoiceSettingsResponse */
export interface AIVoiceSettingsResponse {
  /** Success */
  success: boolean;
  settings?: AIVoiceSettings | null;
  /** Message */
  message?: string | null;
  /** Error */
  error?: string | null;
}

/** AIVoiceSettingsUpdate */
export interface AIVoiceSettingsUpdate {
  /** Enabled */
  enabled?: boolean | null;
  /** Selected Agent Id */
  selected_agent_id?: string | null;
  /** Custom Name */
  custom_name?: string | null;
  /** Avatar Url */
  avatar_url?: string | null;
  /** Auto Approve Orders */
  auto_approve_orders?: boolean | null;
  /** Respect Time Windows */
  respect_time_windows?: boolean | null;
  /** Time Windows */
  time_windows?: Record<string, any> | null;
  /** Phone Number */
  phone_number?: string | null;
  /** Under Maintenance */
  under_maintenance?: boolean | null;
}

/** AbbreviationRequest */
export interface AbbreviationRequest {
  /** Text */
  text: string;
  /**
   * Max Length
   * @default 25
   */
  max_length?: number | null;
  /**
   * Context
   * @default "general"
   */
  context?: string | null;
}

/** AbbreviationResponse */
export interface AbbreviationResponse {
  /** Original Text */
  original_text: string;
  /** Abbreviated Text */
  abbreviated_text: string;
  /** Length Saved */
  length_saved: number;
  /** Suggestions */
  suggestions: string[];
  /** Confidence */
  confidence: string;
}

/**
 * ActiveCorpusResponse
 * Response with full active corpus data
 */
export interface ActiveCorpusResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Corpus Id */
  corpus_id?: string | null;
  /** Corpus Type */
  corpus_type?: string | null;
  /** Version */
  version?: number | null;
  /** Structured Data */
  structured_data?: Record<string, any> | null;
  /** Formatted Text */
  formatted_text?: string | null;
  metadata?: CorpusMetadata | null;
  /** Published At */
  published_at?: string | null;
}

/** AddFavoriteRequest */
export interface AddFavoriteRequest {
  /** Menu Item Id */
  menu_item_id: string;
  /** Menu Item Name */
  menu_item_name: string;
  /** Variant Id */
  variant_id?: string | null;
  /** Variant Name */
  variant_name?: string | null;
  /** Image Url */
  image_url?: string | null;
  /** Customer Id */
  customer_id: string;
}

/**
 * AddItemRequest
 * Request to add item to cart
 */
export interface AddItemRequest {
  /**
   * Item Id
   * Menu item ID (if known)
   */
  item_id?: string | null;
  /**
   * Item Name
   * Name of the item to add (fuzzy match)
   */
  item_name: string;
  /**
   * Quantity
   * Quantity to add
   * @min 1
   * @default 1
   */
  quantity?: number;
  /**
   * Variant Id
   * Specific variant ID if known
   */
  variant_id?: string | null;
  /**
   * Customizations
   * Selected customizations
   * @default []
   */
  customizations?: CartCustomization[];
  /**
   * Notes
   * Special instructions
   */
  notes?: string | null;
  /**
   * User Id
   * User ID for authenticated users
   */
  user_id?: string | null;
  /**
   * Session Id
   * Session ID for cart persistence
   */
  session_id?: string | null;
  /**
   * Order Mode
   * Order mode: delivery or collection
   * @default "collection"
   */
  order_mode?: string;
  /**
   * Cart Context
   * Current cart state for sync
   */
  cart_context?: CartItemData[] | null;
}

/**
 * AddItemResponse
 * Response from add item operation
 */
export interface AddItemResponse {
  /**
   * Action
   * @default "add_item"
   */
  action?: string;
  /** Success */
  success: boolean;
  /** Item */
  item?: Record<string, any> | null;
  /**
   * Variants
   * @default []
   */
  variants?: Record<string, any>[];
  /** Quantity */
  quantity: number;
  /**
   * Requires Clarification
   * @default false
   */
  requires_clarification?: boolean;
  /** Message */
  message: string;
}

/** AddToListRequest */
export interface AddToListRequest {
  /** List Id */
  list_id: string;
  /** Favorite Id */
  favorite_id: string;
  /** Customer Id */
  customer_id: string;
}

/** AddressListResponse */
export interface AddressListResponse {
  /** Success */
  success: boolean;
  /** Addresses */
  addresses: AppApisCustomerAddressesCustomerAddress[];
  /** Message */
  message: string;
}

/** AddressResponse */
export interface AddressResponse {
  /** Success */
  success: boolean;
  address?: AppApisCustomerAddressesCustomerAddress | null;
  /** Message */
  message: string;
}

/** AgentProfile */
export interface AgentProfileInput {
  /** Id */
  id?: string | null;
  /**
   * Name
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /** Voice Type */
  voice_type: string;
  /** Personality */
  personality?: string | null;
  /** System Prompt */
  system_prompt?: string | null;
  /** Speed */
  speed?: number | null;
  /** Pitch */
  pitch?: number | null;
  /** Gender */
  gender?: string | null;
  /** Passport Nationality */
  passport_nationality?: string | null;
  /** Description */
  description?: string | null;
  /** Image Id */
  image_id?: string | null;
  /** Is Default */
  is_default?: boolean | null;
  /** Is Admin Visible */
  is_admin_visible?: boolean | null;
  /** Avatar Url */
  avatar_url?: string | null;
  /** Image Filename */
  image_filename?: string | null;
  /** Passport Number */
  passport_number?: string | null;
}

/**
 * AgentProfile
 * Agent profile model matching frontend expectations
 */
export interface AgentProfileOutput {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Avatar Url */
  avatar_url?: string | null;
  /** Voice Type */
  voice_type?: string | null;
  /** Personality */
  personality?: string | null;
  /** Gender */
  gender?: string | null;
  /** Nationality */
  nationality?: string | null;
  /** Passport Nationality */
  passport_nationality?: string | null;
  /** Creation Date */
  creation_date?: string | null;
  /** Created At */
  created_at?: string | null;
  /**
   * Is Default
   * @default false
   */
  is_default?: boolean | null;
}

/**
 * AgentProfilesResponse
 * Response model for agent profiles endpoint
 */
export interface AgentProfilesResponse {
  /** Success */
  success: boolean;
  /** Agents */
  agents: AgentProfileOutput[];
  /** Message */
  message?: string | null;
  /**
   * Total Count
   * @default 0
   */
  total_count?: number;
}

/** AgentSelection */
export interface AgentSelection {
  /** Agent Id */
  agent_id: string;
  /** Customer Session Id */
  customer_session_id?: string | null;
}

/** AllOrderSamplesResponse */
export interface AllOrderSamplesResponse {
  /** Samples */
  samples: Record<string, Record<string, any>>;
}

/**
 * AnalyzeDependenciesResponse
 * Response model for dependency analysis.
 */
export interface AnalyzeDependenciesResponse {
  /** Success */
  success: boolean;
  /** Total Imports */
  total_imports: number;
  /** Already Mapped */
  already_mapped: string[];
  /** Unmapped */
  unmapped: Record<string, string>[];
  /** Total Coverage */
  total_coverage: number;
  /** Message */
  message: string;
}

/** AssetResponse */
export interface AssetResponse {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Label */
  label: string | null;
  /** Size */
  size: number;
  /** Download Count */
  download_count: number;
  /** Browser Download Url */
  browser_download_url: string;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** AssetUsageResponse */
export interface AssetUsageResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Asset Id */
  asset_id: string;
  /** Asset Name */
  asset_name?: string | null;
  /** Total Usage Count */
  total_usage_count: number;
  /** Menu Items */
  menu_items: MenuItemUsage[];
  /** Can Delete */
  can_delete: boolean;
}

/**
 * AssetValidationResult
 * Result for a single asset validation
 */
export interface AssetValidationResult {
  /** Asset Id */
  asset_id: string;
  /** Is Valid */
  is_valid: boolean;
  /** Friendly Name */
  friendly_name?: string | null;
  /** Error */
  error?: string | null;
}

/**
 * AuditResponse
 * API response
 */
export interface AuditResponse {
  /** Success */
  success: boolean;
  report?: AppApisDatabaseAuditAuditReport | null;
  /** Error */
  error?: string | null;
}

/** AutoConfirmEmailRequest */
export interface AutoConfirmEmailRequest {
  /** User Id */
  user_id: string;
}

/** AutoConfirmEmailResponse */
export interface AutoConfirmEmailResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** AutoLinkResponse */
export interface AutoLinkResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Linked Count */
  linked_count: number;
  /** Results */
  results: AutoLinkResult[];
  /** Unmatched Media */
  unmatched_media: Record<string, any>[];
  /** Unmatched Items */
  unmatched_items: Record<string, any>[];
}

/** AutoLinkResult */
export interface AutoLinkResult {
  /** Menu Item Id */
  menu_item_id: string;
  /** Menu Item Name */
  menu_item_name: string;
  /** Media Asset Id */
  media_asset_id: string;
  /** Media Friendly Name */
  media_friendly_name: string;
  /** Confidence */
  confidence: string;
}

/** AutoSyncConfig */
export interface AutoSyncConfig {
  /**
   * Enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Sync Interval Seconds
   * @default 30
   */
  sync_interval_seconds?: number;
  /**
   * Batch Size
   * @default 10
   */
  batch_size?: number;
  /**
   * Auto Corpus Update
   * @default true
   */
  auto_corpus_update?: boolean;
  /**
   * Webhook Notifications
   * @default true
   */
  webhook_notifications?: boolean;
}

/**
 * AvatarLimitResponse
 * Response for avatar limit validation
 */
export interface AvatarLimitResponse {
  /**
   * Count
   * Current number of avatars
   */
  count: number;
  /**
   * Limit
   * Maximum allowed avatars
   * @default 8
   */
  limit?: number;
  /**
   * Can Upload
   * Whether upload is allowed
   */
  can_upload: boolean;
  /**
   * Remaining
   * Number of avatars remaining before limit
   */
  remaining: number;
  /**
   * Existing Avatars
   * List of existing avatar assets
   */
  existing_avatars?: any[];
}

/** AvatarUploadResponse */
export interface AvatarUploadResponse {
  /** Avatar Url */
  avatar_url: string;
  /** Filename */
  filename: string;
  /** Uploaded At */
  uploaded_at: string;
}

/** BackfillResult */
export interface BackfillResult {
  /** Success */
  success: boolean;
  /** Total Processed */
  total_processed: number;
  /** Updated Count */
  updated_count: number;
  /** Skipped Count */
  skipped_count: number;
  /** Error Count */
  error_count: number;
  /**
   * Details
   * @default []
   */
  details?: Record<string, any>[];
  /** Error */
  error?: string | null;
}

/** BatchCodeGenerationRequest */
export interface BatchCodeGenerationRequest {
  /**
   * Reset Existing
   * @default false
   */
  reset_existing?: boolean;
}

/** BatchCodeGenerationResponse */
export interface BatchCodeGenerationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Items Processed */
  items_processed: number;
  /** Variants Processed */
  variants_processed: number;
  /** Errors */
  errors?: string[] | null;
}

/**
 * BatchGenerationResponse
 * Response for batch variant generation
 */
export interface BatchGenerationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Total Processed */
  total_processed: number;
  /** Successful */
  successful: number;
  /** Failed */
  failed: number;
  /** Results */
  results: BatchVariantResult[];
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/** BatchPricingRequest */
export interface BatchPricingRequest {
  /** Updates */
  updates: PriceBreakdownRequest[];
}

/** BatchSchemaRequest */
export interface BatchSchemaRequest {
  /** Operations */
  operations: string[];
  /**
   * Force Recreate
   * @default false
   */
  force_recreate?: boolean;
}

/**
 * BatchVariantResult
 * Result for a single media asset variant generation
 */
export interface BatchVariantResult {
  /** Media Id */
  media_id: string;
  /** Friendly Name */
  friendly_name: string | null;
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Variants Generated */
  variants_generated: number;
  /** Error */
  error?: string | null;
}

/** Body_upload_avatar */
export interface BodyUploadAvatar {
  /**
   * File
   * @format binary
   */
  file: File;
  /**
   * Tags
   * @default "[]"
   */
  tags?: string;
  /** Description */
  description?: string | null;
}

/** Body_upload_general_file */
export interface BodyUploadGeneralFile {
  /**
   * File
   * @format binary
   */
  file: File;
  /**
   * Category
   * @default "general"
   */
  category?: string;
  /** Subcategory */
  subcategory?: string | null;
  /**
   * Tags
   * @default "[]"
   */
  tags?: string;
  /** Description */
  description?: string | null;
  /**
   * Asset Category
   * @default "general"
   */
  asset_category?: string | null;
}

/** Body_upload_menu_image */
export interface BodyUploadMenuImage {
  /**
   * File
   * @format binary
   */
  file: File;
  /** Item Id */
  item_id: string;
  /** Item Name */
  item_name?: string | null;
  /**
   * Is Widescreen
   * @default "false"
   */
  is_widescreen?: string;
  /**
   * Category
   * @default "menu_images"
   */
  category?: string;
  /**
   * Tags
   * @default "[]"
   */
  tags?: string;
  /**
   * Asset Category
   * @default "menu-item"
   */
  asset_category?: string | null;
  /** Menu Section Id */
  menu_section_id?: string | null;
  /** Menu Category Id */
  menu_category_id?: string | null;
}

/** Body_upload_menu_item_image */
export interface BodyUploadMenuItemImage {
  /**
   * File
   * Image file (JPEG, PNG, WebP)
   * @format binary
   */
  file: File;
  /**
   * Asset Category
   * Asset category (menu-item, ai-avatar, general)
   * @default "menu-item"
   */
  asset_category?: string;
  /**
   * Alt Text
   * Alt text for accessibility
   */
  alt_text?: string | null;
  /**
   * Menu Section Id
   * Menu section ID
   */
  menu_section_id?: string | null;
  /**
   * Menu Category Id
   * Menu category ID
   */
  menu_category_id?: string | null;
  /**
   * Menu Item Name
   * Menu item name for friendly labeling
   */
  menu_item_name?: string | null;
  /**
   * Friendly Name
   * Custom friendly name (auto-generated if not provided)
   */
  friendly_name?: string | null;
}

/** Body_upload_optimized_menu_image */
export interface BodyUploadOptimizedMenuImage {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** Body_upload_primary_agent_avatar */
export interface BodyUploadPrimaryAgentAvatar {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** Body_upload_profile_image */
export interface BodyUploadProfileImage {
  /** User Id */
  user_id: string;
  /**
   * File
   * @format binary
   */
  file: File;
}

/** BulkOperationResponse */
export interface BulkOperationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Affected Count
   * @default 0
   */
  affected_count?: number;
}

/**
 * BulkTestRequest
 * Request for running all cart operation tests.
 */
export interface BulkTestRequest {
  /** User Id */
  user_id?: string | null;
  /** Session Id */
  session_id: string;
  /**
   * Clean Cart First
   * @default true
   */
  clean_cart_first?: boolean;
}

/** BulkToggleRequest */
export interface BulkToggleRequest {
  /** Item Ids */
  item_ids: string[];
  /** Item Type */
  item_type: "categories" | "proteins" | "menu_items";
  /** Active */
  active: boolean;
}

/** BulkTrackingUpdate */
export interface BulkTrackingUpdate {
  /** Updates */
  updates: OrderTrackingUpdate[];
}

/** BusinessDataResponse */
export interface BusinessDataResponse {
  /** Business Data */
  business_data: Record<string, any>;
}

/** BusinessRulesValidationResponse */
export interface BusinessRulesValidationResponse {
  /** Valid */
  valid: boolean;
  /** Message */
  message: string;
  /** Data */
  data?: Record<string, any> | null;
  /** Errors */
  errors?: string[] | null;
}

/** CacheInfo */
export interface CacheInfo {
  /** Name */
  name: string;
  /** Display Name */
  display_name: string;
  /** Created */
  created: string;
  /** Expires */
  expires: string;
  /** Remaining Hours */
  remaining_hours: number;
  /** Token Count */
  token_count?: number | null;
}

/**
 * CapabilitiesResponse
 * Printer capabilities response model
 */
export interface CapabilitiesResponse {
  /** Version */
  version: string;
  /** Name */
  name: string;
  /** Capabilities */
  capabilities: Record<string, boolean>;
  /** Supported Formats */
  supported_formats: Record<string, boolean>;
  /** Thermal Features */
  thermal_features: Record<string, any>;
  /** Build Status */
  build_status: Record<string, boolean>;
  /** Printers */
  printers: Record<string, string>;
}

/** CartContextRequest */
export interface CartContextRequest {
  /** User Id */
  user_id?: string | null;
  /** Session Id */
  session_id?: string | null;
  /**
   * Include Pricing
   * @default true
   */
  include_pricing?: boolean;
  /**
   * Include Summary
   * @default true
   */
  include_summary?: boolean;
}

/** CartContextResponse */
export interface CartContextResponse {
  /** Has Items */
  has_items: boolean;
  /** Total Items */
  total_items: number;
  /** Total Amount */
  total_amount: number;
  /** Items */
  items: Record<string, any>[];
  /** Summary Text */
  summary_text: string;
  /** Cart Metadata */
  cart_metadata: Record<string, any>;
}

/**
 * CartCustomization
 * Customization for a cart item
 */
export interface CartCustomization {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Price */
  price: number;
  /** Group */
  group?: string | null;
}

/** CartEventRequest */
export interface CartEventRequest {
  /** Session Id */
  session_id: string;
  /** Customer Id */
  customer_id?: string | null;
  /** Event Type */
  event_type: string;
  /** Event Data */
  event_data: Record<string, any>;
}

/** CartEventResponse */
export interface CartEventResponse {
  /** Success */
  success: boolean;
  /** Event Id */
  event_id?: string | null;
  /** Message */
  message: string;
}

/**
 * CartItem
 * Cart item for chat context - simplified structure
 */
export interface CartItem {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Price */
  price: number;
  /** Quantity */
  quantity: number;
  /** Variant Name */
  variant_name?: string | null;
  /** Notes */
  notes?: string | null;
}

/**
 * CartItemData
 * Cart item structure
 */
export interface CartItemData {
  /** Id */
  id: string;
  /** Menuitemid */
  menuItemId: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Price */
  price: number;
  /** Quantity */
  quantity: number;
  /** Variant */
  variant?: Record<string, any> | null;
  /**
   * Customizations
   * @default []
   */
  customizations?: CartCustomization[];
  /** Image Url */
  image_url?: string | null;
  /** Notes */
  notes?: string | null;
  /**
   * Ordermode
   * @default "collection"
   */
  orderMode?: string;
}

/**
 * CartItemInput
 * Cart item for recommendation context
 */
export interface CartItemInput {
  /** Name */
  name: string;
  /** Quantity */
  quantity: number;
  /** Price */
  price: number;
  /** Category */
  category?: string | null;
}

/** CartMetricsResponse */
export interface CartMetricsResponse {
  /** Total Events */
  total_events: number;
  /** Abandonment Rate */
  abandonment_rate: number;
  /** Avg Cart Value */
  avg_cart_value: number;
  /** Popular Items */
  popular_items: Record<string, any>[];
  /** Mode Switches */
  mode_switches: number;
}

/** CartRemoveRequest */
export interface CartRemoveRequest {
  /** Session Id */
  session_id: string;
  /** Item Id */
  item_id: string;
  /**
   * Quantity
   * @default 1
   */
  quantity?: number;
}

/** CartRemoveResponse */
export interface CartRemoveResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Cart Total */
  cart_total: number;
  /** Item Count */
  item_count: number;
}

/** CartSetupResponse */
export interface CartSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Migration Id */
  migration_id?: string | null;
  /**
   * Warnings
   * @default []
   */
  warnings?: string[];
}

/** CashPaymentRequest */
export interface CashPaymentRequest {
  /**
   * Order Id
   * Order ID for cash payment
   */
  order_id: string;
  /**
   * Cash Received
   * Amount of cash received from customer
   */
  cash_received: number;
  /**
   * Order Total
   * Total amount due
   */
  order_total: number;
  /** Staff Id */
  staff_id?: string | null;
  /** Notes */
  notes?: string | null;
}

/** CashPaymentResponse */
export interface CashPaymentResponse {
  /** Success */
  success: boolean;
  /** Change Due */
  change_due: number;
  /** Payment Recorded */
  payment_recorded: boolean;
  /** Transaction Id */
  transaction_id: string;
  /** Message */
  message: string;
}

/** CategoryContext */
export interface CategoryContext {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /** Item Count */
  item_count: number;
  /** Featured Items */
  featured_items: string[];
}

/**
 * CategoryDeleteCheckResponse
 * Response for pre-delete check
 */
export interface CategoryDeleteCheckResponse {
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name: string;
  /** Item Count */
  item_count: number;
  /** Can Delete */
  can_delete: boolean;
  /** Message */
  message: string;
  /** Items */
  items?: Record<string, any>[] | null;
}

/**
 * CategoryDeleteRequest
 * Request for safe category deletion
 */
export interface CategoryDeleteRequest {
  /** Category Id */
  category_id: string;
  /** Action */
  action: string;
  /** Target Category Id */
  target_category_id?: string | null;
}

/**
 * CategoryDeleteResponse
 * Response for category deletion
 */
export interface CategoryDeleteResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Items Affected */
  items_affected: number;
  /** Items Reassigned */
  items_reassigned?: number | null;
  /** Items Deleted */
  items_deleted?: number | null;
}

/**
 * CategoryDelta
 * Category for delta sync
 */
export interface CategoryDelta {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Parent Category Id */
  parent_category_id?: string | null;
  /** Display Order */
  display_order: number;
  /** Active */
  active: boolean;
  /** Updated At */
  updated_at: string;
}

/** CategoryDiagnostic */
export interface CategoryDiagnostic {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Parent Category Id */
  parent_category_id: string | null;
  /** Active */
  active: boolean;
}

/**
 * CategoryGroup
 * Category with its media assets.
 */
export interface CategoryGroup {
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name: string;
  /** Section Id */
  section_id?: string | null;
  /** Section Name */
  section_name?: string | null;
  /** Assets */
  assets: AppApisMediaLibraryHierarchicalMediaAsset[];
  /** Asset Count */
  asset_count: number;
}

/** CategoryIssue */
export interface CategoryIssue {
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name: string;
  /** Issue Type */
  issue_type: string;
  /** Details */
  details: string;
}

/** CategoryPrefixResponse */
export interface CategoryPrefixResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Updated Categories */
  updated_categories: Record<string, any>[];
}

/** CategorySectionMapping */
export interface CategorySectionMapping {
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name: string;
  /** Print Order */
  print_order: number;
  /** Section Name */
  section_name: string;
}

/** CategorySectionResponse */
export interface CategorySectionResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Mappings */
  mappings: CategorySectionMapping[];
  /** Total Categories */
  total_categories: number;
}

/** CategorySnapshot */
export interface CategorySnapshot {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Parent Category Id */
  parent_category_id: string | null;
  /** Sort Order */
  sort_order: number | null;
  /** Is Active */
  is_active: boolean;
}

/** CategoryUpdate */
export interface CategoryUpdate {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Sort Order */
  sort_order?: number | null;
  /** Print Order */
  print_order?: number | null;
  /** Is Active */
  is_active?: boolean | null;
  /** Parent Id */
  parent_id?: string | null;
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
}

/** CategoryWithIsProteinType */
export interface CategoryWithIsProteinType {
  /** Id */
  id?: string | null;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Display Order */
  display_order: number;
  /**
   * Print Order
   * @default 0
   */
  print_order?: number;
  /**
   * Print To Kitchen
   * @default true
   */
  print_to_kitchen?: boolean;
  /** Parent Category Id */
  parent_category_id?: string | null;
  /**
   * Active
   * @default true
   */
  active?: boolean;
  /**
   * Is Protein Type
   * @default false
   */
  is_protein_type?: boolean;
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
}

/**
 * ChatConfigResponse
 * Response model for chat system - mirrors old chatbot_config structure
 */
export interface ChatConfigResponse {
  /** Name */
  name?: string | null;
  /** Avatar Url */
  avatar_url?: string | null;
}

/** ChatMessage */
export interface ChatMessage {
  /** Role */
  role: string;
  /** Content */
  content: string;
}

/** ChatRequest */
export interface ChatRequest {
  /** Message */
  message: string;
  /**
   * Conversation History
   * @default []
   */
  conversation_history?: ChatMessage[] | null;
  /** User Id */
  user_id?: string | null;
  /** Session Id */
  session_id?: string | null;
  /**
   * Model Preference
   * @default "auto"
   */
  model_preference?: string | null;
  /**
   * Temperature
   * @default 0.7
   */
  temperature?: number | null;
  /**
   * Max Tokens
   * @default 800
   */
  max_tokens?: number | null;
  /**
   * Cart Context
   * @default []
   */
  cart_context?: CartItem[] | null;
}

/** ChatbotPromptCreate */
export interface ChatbotPromptCreate {
  /**
   * Name
   * @minLength 1
   * @maxLength 255
   */
  name: string;
  /** Description */
  description?: string | null;
  /**
   * System Prompt
   * @minLength 10
   */
  system_prompt: string;
  /**
   * Model Provider
   * @pattern ^(openai|google)$
   */
  model_provider: string;
  /**
   * Model Name
   * @minLength 1
   * @maxLength 100
   */
  model_name: string;
  /**
   * Temperature
   * @min 0
   * @max 2
   * @default 0.7
   */
  temperature?: number;
  /**
   * Max Tokens
   * @exclusiveMin 0
   * @default 1000
   */
  max_tokens?: number;
  /**
   * Reasoning Effort
   * @default "medium"
   * @pattern ^(minimal|low|medium|high)$
   */
  reasoning_effort?: string;
  /**
   * Verbosity
   * @default "medium"
   * @pattern ^(low|medium|high)$
   */
  verbosity?: string;
  /**
   * Safety Threshold
   * @default "medium"
   * @pattern ^(low|medium|high|block_none)$
   */
  safety_threshold?: string;
  /**
   * Top P
   * @min 0
   * @max 1
   * @default 0.9
   */
  top_p?: number;
  /**
   * Top K
   * @exclusiveMin 0
   * @default 40
   */
  top_k?: number;
  /**
   * Published
   * @default false
   */
  published?: boolean;
}

/** ChatbotPromptResponse */
export interface ChatbotPromptResponse {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /** System Prompt */
  system_prompt: string;
  /** Model Provider */
  model_provider: string;
  /** Model Name */
  model_name: string;
  /** Temperature */
  temperature: number;
  /** Max Tokens */
  max_tokens: number;
  /** Reasoning Effort */
  reasoning_effort: string;
  /** Verbosity */
  verbosity: string;
  /** Safety Threshold */
  safety_threshold: string;
  /** Top P */
  top_p: number;
  /** Top K */
  top_k: number;
  /** Published */
  published: boolean;
  /** Is Active */
  is_active: boolean;
  /** Version */
  version: number;
  /** Created By */
  created_by: string | null;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** ChatbotPromptUpdate */
export interface ChatbotPromptUpdate {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** System Prompt */
  system_prompt?: string | null;
  /** Model Provider */
  model_provider?: string | null;
  /** Model Name */
  model_name?: string | null;
  /** Temperature */
  temperature?: number | null;
  /** Max Tokens */
  max_tokens?: number | null;
  /** Reasoning Effort */
  reasoning_effort?: string | null;
  /** Verbosity */
  verbosity?: string | null;
  /** Safety Threshold */
  safety_threshold?: string | null;
  /** Top P */
  top_p?: number | null;
  /** Top K */
  top_k?: number | null;
  /** Published */
  published?: boolean | null;
}

/** CheckDeviceTrustRequest */
export interface CheckDeviceTrustRequest {
  /** User Id */
  user_id: string;
  /** Device Fingerprint */
  device_fingerprint: string;
}

/** CheckDeviceTrustResponse */
export interface CheckDeviceTrustResponse {
  /** Success */
  success: boolean;
  /** Is Trusted */
  is_trusted: boolean;
  /** Message */
  message: string;
}

/** CheckPOSAccessRequest */
export interface CheckPOSAccessRequest {
  /** User Id */
  user_id: string;
}

/** CheckPOSAccessResponse */
export interface CheckPOSAccessResponse {
  /** Success */
  success: boolean;
  /** Has Access */
  has_access: boolean;
  /** Role */
  role?: string | null;
  /** Message */
  message: string;
}

/** CheckSchemaStatusResponse */
export interface CheckSchemaStatusResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Ready */
  ready: boolean;
  /** Missing Columns */
  missing_columns?: string[] | null;
}

/** CheckTrustRequest */
export interface CheckTrustRequest {
  /** Device Fingerprint */
  device_fingerprint: string;
}

/** CleanupResponse */
export interface CleanupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Items Removed
   * @default 0
   */
  items_removed?: number;
  /**
   * Table Reset
   * @default false
   */
  table_reset?: boolean;
}

/**
 * ClearCartRequest
 * Request to clear cart
 */
export interface ClearCartRequest {
  /**
   * Session Id
   * Session ID
   */
  session_id: string;
}

/**
 * ClearCartResponse
 * Response from clear cart operation
 */
export interface ClearCartResponse {
  /**
   * Action
   * @default "clear_cart"
   */
  action?: string;
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** CodeGenerationRequest */
export interface CodeGenerationRequest {
  /**
   * Menu Item Id
   * Menu item ID to generate code for
   */
  menu_item_id: string;
  /**
   * Custom Code
   * Optional custom code override
   */
  custom_code?: string | null;
}

/** CodeGenerationResponse */
export interface CodeGenerationResponse {
  /** Success */
  success: boolean;
  /** Generated Code */
  generated_code: string | null;
  /** Menu Item Id */
  menu_item_id: string;
  /** Message */
  message: string;
}

/**
 * CodeStandard
 * Model representing a code standard
 *
 * Following the naming convention: {Resource}[{Context}]
 */
export interface CodeStandard {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description: string;
  /** Category */
  category: string;
  /** Examples */
  examples: string[];
  /**
   * Is Required
   * @default true
   */
  is_required?: boolean;
}

/** CodeValidationResponse */
export interface CodeValidationResponse {
  /** Success */
  success: boolean;
  /** Is Unique */
  is_unique: boolean;
  /** Message */
  message: string;
  /** Existing Item */
  existing_item?: string | null;
  /** Existing Variant */
  existing_variant?: string | null;
}

/** ComprehensiveValidationResponse */
export interface ComprehensiveValidationResponse {
  /** Valid */
  valid: boolean;
  /** Message */
  message: string;
  /**
   * Delivery Valid
   * @default false
   */
  delivery_valid?: boolean;
  /**
   * Delivery Message
   * @default ""
   */
  delivery_message?: string;
  /**
   * Hours Valid
   * @default false
   */
  hours_valid?: boolean;
  /**
   * Hours Message
   * @default ""
   */
  hours_message?: string;
  /**
   * Minimum Order Valid
   * @default false
   */
  minimum_order_valid?: boolean;
  /**
   * Minimum Order Message
   * @default ""
   */
  minimum_order_message?: string;
  /**
   * Kitchen Open
   * @default false
   */
  kitchen_open?: boolean;
  /**
   * Kitchen Message
   * @default ""
   */
  kitchen_message?: string;
  /** Data */
  data?: Record<string, any> | null;
}

/**
 * ConfirmPaymentRequest
 * Request to confirm payment on backend
 */
export interface ConfirmPaymentRequest {
  /**
   * Payment Intent Id
   * Stripe Payment Intent ID
   */
  payment_intent_id: string;
  /**
   * Order Id
   * Order ID to update
   */
  order_id: string;
}

/**
 * ConfirmPaymentResponse
 * Response after confirming payment
 */
export interface ConfirmPaymentResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Payment Status */
  payment_status?: string | null;
}

/**
 * CorpusHealthResponse
 * Response for corpus health check
 */
export interface CorpusHealthResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Corpus Types
   * @default {}
   */
  corpus_types?: Record<string, Record<string, any>>;
  /** Timestamp */
  timestamp: string;
}

/**
 * CorpusMetadata
 * Metadata about the corpus content
 */
export interface CorpusMetadata {
  /**
   * Total Items
   * @default 0
   */
  total_items?: number;
  /**
   * Categories
   * @default []
   */
  categories?: string[];
  /** Price Range */
  price_range?: Record<string, number> | null;
  /** Last Updated */
  last_updated: string;
  /**
   * Source
   * @default "menu_items"
   */
  source?: string;
}

/**
 * CorpusResponse
 * Response for corpus operations
 */
export interface CorpusResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Corpus Id */
  corpus_id?: string | null;
  /** Version */
  version?: number | null;
  /** Corpus Type */
  corpus_type?: string | null;
  /** Is Active */
  is_active?: boolean | null;
  /** Published At */
  published_at?: string | null;
}

/**
 * CorpusVersionInfo
 * Information about a corpus version
 */
export interface CorpusVersionInfo {
  /** Corpus Id */
  corpus_id: string;
  /** Version */
  version: number;
  /** Is Active */
  is_active: boolean;
  /** Published At */
  published_at: string;
  /** Published By */
  published_by: string;
  /** Item Count */
  item_count: number;
}

/**
 * CorpusVersionsResponse
 * Response with list of corpus versions
 */
export interface CorpusVersionsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Corpus Type */
  corpus_type: string;
  /**
   * Versions
   * @default []
   */
  versions?: CorpusVersionInfo[];
  /**
   * Total Versions
   * @default 0
   */
  total_versions?: number;
}

/** CreateAddressRequest */
export interface CreateAddressRequest {
  /** Customer Id */
  customer_id: string;
  /** Address Line1 */
  address_line1: string;
  /** Address Line2 */
  address_line2?: string | null;
  /** City */
  city: string;
  /** Postal Code */
  postal_code: string;
  /**
   * Is Default
   * @default false
   */
  is_default?: boolean;
  /** Delivery Instructions */
  delivery_instructions?: string | null;
}

/** CreateCacheRequest */
export interface CreateCacheRequest {
  /**
   * Ttl Hours
   * @default 24
   */
  ttl_hours?: number | null;
  /**
   * Display Name
   * @default "cottage-tandoori-base-prompt"
   */
  display_name?: string | null;
}

/** CreateCacheResponse */
export interface CreateCacheResponse {
  /** Success */
  success: boolean;
  /** Cache Name */
  cache_name?: string | null;
  /** Display Name */
  display_name?: string | null;
  /** Expires */
  expires?: string | null;
  /** Token Count */
  token_count?: number | null;
  /** Error */
  error?: string | null;
}

/** CreateCustomerTabRequest */
export interface CreateCustomerTabRequest {
  /** Table Number */
  table_number: number;
  /** Tab Name */
  tab_name: string;
  /** Guest Id */
  guest_id?: string | null;
}

/** CreateCustomizationRequest */
export interface CreateCustomizationRequest {
  /** Name */
  name: string;
  /** Customization Group */
  customization_group?: string | null;
  /**
   * Display Order
   * @default 0
   */
  display_order?: number | null;
  /**
   * Price
   * @default 0
   */
  price?: number | null;
  /**
   * Is Active
   * @default true
   */
  is_active?: boolean;
  /**
   * Show On Pos
   * @default true
   */
  show_on_pos?: boolean;
  /**
   * Show On Website
   * @default true
   */
  show_on_website?: boolean;
  /**
   * Ai Voice Agent
   * @default false
   */
  ai_voice_agent?: boolean;
  /** Item Ids */
  item_ids?: string[] | null;
}

/** CreateFileRequest */
export interface CreateFileRequest {
  /**
   * Path
   * File path in repository
   */
  path: string;
  /**
   * Content
   * File content (will be base64 encoded)
   */
  content: string;
  /**
   * Message
   * Commit message
   */
  message: string;
  /**
   * Branch
   * Branch to commit to
   * @default "main"
   */
  branch?: string;
  /**
   * Sha
   * SHA of file to update (for existing files)
   */
  sha?: string | null;
}

/** CreateListRequest */
export interface CreateListRequest {
  /** Customer Id */
  customer_id: string;
  /** List Name */
  list_name: string;
}

/** CreateListResponse */
export interface CreateListResponse {
  /** Success */
  success: boolean;
  /** List Id */
  list_id: string;
  /** List Name */
  list_name: string;
  /** Message */
  message: string;
}

/**
 * CreateOnlineOrderRequest
 * Request to create an online order BEFORE payment
 */
export interface CreateOnlineOrderRequest {
  /**
   * Items
   * Order items
   */
  items: AppApisOnlineOrdersOrderItem[];
  /** Delivery/collection details */
  delivery: DeliveryDetails;
  /**
   * Total
   * Total amount including fees
   */
  total: number;
  /**
   * Subtotal
   * Subtotal before fees
   */
  subtotal: number;
  /**
   * Delivery Fee
   * Delivery fee
   * @default 0
   */
  delivery_fee?: number;
  /**
   * Tip Amount
   * Tip amount
   * @default 0
   */
  tip_amount?: number;
  /**
   * Customer Id
   * Customer ID (authenticated user)
   */
  customer_id?: string | null;
  /**
   * Order Notes
   * Additional order notes
   */
  order_notes?: string | null;
  /**
   * Customer Email
   * Customer email
   */
  customer_email?: string | null;
  /**
   * Customer Name
   * Customer name
   */
  customer_name?: string | null;
  /**
   * Customer Phone
   * Customer phone
   */
  customer_phone?: string | null;
}

/**
 * CreateOnlineOrderResponse
 * Response after creating online order
 */
export interface CreateOnlineOrderResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Order Id */
  order_id?: string | null;
  /** Created At */
  created_at?: string | null;
}

/**
 * CreatePaymentIntentRequest
 * Request model for creating a Stripe Payment Intent
 */
export interface CreatePaymentIntentRequest {
  /**
   * Amount
   * Payment amount in pence (e.g., 3250 = £32.50)
   */
  amount: number;
  /**
   * Currency
   * Three-letter ISO currency code (lowercase)
   * @default "gbp"
   */
  currency?: string;
  /**
   * Order Id
   * Unique order identifier
   */
  order_id: string;
  /**
   * Order Type
   * DELIVERY, COLLECTION, or DINE-IN
   */
  order_type: string;
  /**
   * Customer Email
   * Customer email for receipt
   */
  customer_email?: string | null;
  /**
   * Customer Name
   * Customer name
   */
  customer_name?: string | null;
  /**
   * Description
   * Payment description
   */
  description?: string | null;
}

/**
 * CreatePaymentIntentResponse
 * Response after creating Payment Intent
 */
export interface CreatePaymentIntentResponse {
  /** Success */
  success: boolean;
  /** Client Secret */
  client_secret?: string | null;
  /** Payment Intent Id */
  payment_intent_id?: string | null;
  /** Message */
  message?: string | null;
  /** Order Id */
  order_id?: string | null;
}

/** CreatePromoCodeRequest */
export interface CreatePromoCodeRequest {
  /**
   * Code
   * Promo code (uppercase, alphanumeric)
   */
  code: string;
  /**
   * Name
   * Display name for the promo
   */
  name: string;
  /**
   * Discount Type
   * Type: percentage, fixed_amount, free_delivery
   */
  discount_type: string;
  /**
   * Discount Value
   * Discount value (percentage or amount)
   */
  discount_value: number;
  /**
   * Minimum Order
   * Minimum order amount required
   * @default 0
   */
  minimum_order?: number;
  /**
   * Maximum Discount
   * Maximum discount cap
   */
  maximum_discount?: number | null;
  /**
   * Valid From
   * Start date (ISO format)
   */
  valid_from: string;
  /**
   * Valid To
   * End date (ISO format)
   */
  valid_to: string;
  /**
   * Usage Limit
   * Total usage limit
   */
  usage_limit?: number | null;
  /**
   * Applicable Order Types
   * @default ["DINE_IN","COLLECTION","DELIVERY","WAITING"]
   */
  applicable_order_types?: string[];
  /**
   * Active
   * @default true
   */
  active?: boolean;
}

/** CreateRPCResponse */
export interface CreateRPCResponse {
  /** Success */
  success: boolean;
  /** Function Name */
  function_name: string;
  /** Migration Id */
  migration_id?: string | null;
  /** Sql Hash */
  sql_hash?: string | null;
  /** Message */
  message: string;
  /**
   * Warnings
   * @default []
   */
  warnings?: string[];
}

/** CreateReleaseRequest */
export interface CreateReleaseRequest {
  /**
   * Tag Name
   * Git tag for release
   */
  tag_name: string;
  /**
   * Name
   * Release title
   */
  name: string;
  /**
   * Body
   * Release notes
   * @default ""
   */
  body?: string;
  /**
   * Draft
   * @default false
   */
  draft?: boolean;
  /**
   * Prerelease
   * @default false
   */
  prerelease?: boolean;
  /**
   * Target Commitish
   * @default "main"
   */
  target_commitish?: string;
}

/** CreateRepoRequest */
export interface CreateRepoRequest {
  /** Repo Name */
  repo_name: string;
  /** Description */
  description: string;
  /**
   * Private
   * @default false
   */
  private?: boolean;
}

/** CreateRepoResponse */
export interface CreateRepoResponse {
  /** Success */
  success: boolean;
  /** Repo Url */
  repo_url: string;
  /** Clone Url */
  clone_url: string;
  /** Message */
  message: string;
}

/** CreateRepositoryRequest */
export interface CreateRepositoryRequest {
  /**
   * Name
   * @default "cottage-tandoori-kds"
   */
  name?: string;
  /**
   * Description
   * @default "Kitchen Display System for Cottage Tandoori Restaurant - Real-time order management with AI voice integration"
   */
  description?: string;
  /**
   * Private
   * @default false
   */
  private?: boolean;
  /**
   * Auto Init
   * @default true
   */
  auto_init?: boolean;
  /**
   * Topics
   * @default ["restaurant","kds","kitchen-display","electron","pos","point-of-sale","real-time","supabase","react","typescript","pwa"]
   */
  topics?: string[];
  /**
   * Homepage
   * @default "https://exoticcreations.databutton.app/cottage-tandoori-restaurant"
   */
  homepage?: string;
  /**
   * Has Issues
   * @default true
   */
  has_issues?: boolean;
  /**
   * Has Projects
   * @default true
   */
  has_projects?: boolean;
  /**
   * Has Wiki
   * @default false
   */
  has_wiki?: boolean;
}

/** CreateTableOrderRequest */
export interface CreateTableOrderRequest {
  /** Table Number */
  table_number: number;
  /** Guest Count */
  guest_count: number;
  /**
   * Linked Tables
   * @default []
   */
  linked_tables?: number[];
}

/** CreateTableRequest */
export interface CreateTableRequest {
  /**
   * Table Number
   * Table number (auto-generated if not provided)
   */
  table_number?: number | null;
  /**
   * Capacity
   * Number of seats at the table
   * @exclusiveMin 0
   */
  capacity: number;
  /**
   * Status
   * Current status of the table
   * @default "available"
   */
  status?: "available" | "occupied" | "reserved" | "unavailable";
}

/** CreateTableResponse */
export interface CreateTableResponse {
  table: PosTableResponse;
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** CreateViewResponse */
export interface CreateViewResponse {
  /** Success */
  success: boolean;
  /** View Name */
  view_name: string;
  /** Migration Id */
  migration_id: string;
  /** Sql Hash */
  sql_hash: string;
  /** Message */
  message: string;
  /** Warnings */
  warnings: string[];
}

/** CustomerContextRequest */
export interface CustomerContextRequest {
  /** Customer Id */
  customer_id: string;
  /**
   * Include Favorites
   * @default true
   */
  include_favorites?: boolean;
  /**
   * Include Order History
   * @default true
   */
  include_order_history?: boolean;
  /**
   * Include Preferences
   * @default true
   */
  include_preferences?: boolean;
  /**
   * Max Recent Orders
   * @default 3
   */
  max_recent_orders?: number;
  /**
   * Max Favorites
   * @default 5
   */
  max_favorites?: number;
}

/** CustomerContextSummary */
export interface CustomerContextSummary {
  /** Customer Name */
  customer_name: string;
  /** Greeting Context */
  greeting_context: string;
  /** Favorites Summary */
  favorites_summary: string;
  /** Order History Summary */
  order_history_summary: string;
  /** Preferences Summary */
  preferences_summary: string;
  /** Personalization Enabled */
  personalization_enabled: boolean;
}

/** CustomerCountResponse */
export interface CustomerCountResponse {
  /** Success */
  success: boolean;
  /** Count */
  count: number;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/**
 * CustomerFavorite
 * Customer favorite item model
 */
export interface CustomerFavorite {
  /** Menu Item Id */
  menu_item_id: string;
  /** Name */
  name: string;
  /** Category */
  category?: string | null;
  /** Typical Variant */
  typical_variant?: string | null;
  /** Image Url */
  image_url?: string | null;
}

/**
 * CustomerLookupRequest
 * Request to lookup customer by various identifiers
 */
export interface CustomerLookupRequest {
  /** Email */
  email?: string | null;
  /** Phone */
  phone?: string | null;
  /** Customer Id */
  customer_id?: string | null;
  /** Customer Reference */
  customer_reference?: string | null;
}

/**
 * CustomerProfile
 * Customer profile model
 */
export interface CustomerProfile {
  /** Id */
  id: string;
  /** Email */
  email: string;
  /** First Name */
  first_name?: string | null;
  /** Last Name */
  last_name?: string | null;
  /** Phone */
  phone?: string | null;
  /** Customer Reference Number */
  customer_reference_number?: string | null;
  /**
   * Is Admin
   * @default false
   */
  is_admin?: boolean | null;
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
}

/**
 * CustomerProfileResponse
 * Response model for customer profile
 */
export interface CustomerProfileResponse {
  /** Success */
  success: boolean;
  customer?: CustomerProfile | null;
  profile?: CustomerProfile | null;
  default_address?: AppApisCustomerProfileApiCustomerAddress | null;
  /** Recent Orders */
  recent_orders?: RecentOrder[] | null;
  /** Favorites */
  favorites?: CustomerFavorite[] | null;
  /** Message */
  message?: string | null;
  /** Error */
  error?: string | null;
}

/**
 * CustomerReceiptRequest
 * Customer receipt print request with Supabase order structure
 */
export interface CustomerReceiptRequest {
  /** Ordernumber */
  orderNumber: string;
  /** Ordertype */
  orderType: string;
  /** Items */
  items: Record<string, any>[];
  /**
   * Tax
   * @default 0
   */
  tax?: number | null;
  /**
   * Deliveryfee
   * @default 0
   */
  deliveryFee?: number | null;
  /** Template Data */
  template_data?: Record<string, any> | null;
  /**
   * Ordersource
   * @default "POS"
   */
  orderSource?: string | null;
  /** Table */
  table?: string | null;
  /** Estimatedtime */
  estimatedTime?: string | null;
  /** Collectiontime */
  collectionTime?: string | null;
  /**
   * Paymentmethod
   * @default "Card"
   */
  paymentMethod?: string | null;
  /** Customername */
  customerName?: string | null;
  /** Deliveryaddress */
  deliveryAddress?: string | null;
}

/** CustomerReferenceResponse */
export interface CustomerReferenceResponse {
  /** Success */
  success: boolean;
  /** Customer Id */
  customer_id: string;
  /** Customer Reference Number */
  customer_reference_number?: string | null;
  /** Message */
  message: string;
  /** Error */
  error?: string | null;
}

/** CustomerTab */
export interface CustomerTab {
  /** Id */
  id?: string | null;
  /** Table Number */
  table_number: number;
  /** Tab Name */
  tab_name: string;
  /** Order Items */
  order_items: AppApisCustomerTabsOrderItem[];
  /** Status */
  status: string;
  /** Guest Id */
  guest_id?: string | null;
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
}

/** CustomerTabResponse */
export interface CustomerTabResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  customer_tab?: CustomerTab | null;
}

/** CustomerTabsListResponse */
export interface CustomerTabsListResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Customer Tabs
   * @default []
   */
  customer_tabs?: CustomerTab[];
}

/** CustomizationDebugResponse */
export interface CustomizationDebugResponse {
  /** Table Exists */
  table_exists: boolean;
  /** Columns Info */
  columns_info: any[];
  /** Row Count */
  row_count: number;
  /** Sample Data */
  sample_data: any[];
  /** Error Details */
  error_details?: string | null;
}

/**
 * CustomizationDelta
 * Customization for delta sync
 */
export interface CustomizationDelta {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Type */
  type: string;
  /** Options */
  options: Record<string, any>[];
  /** Updated At */
  updated_at: string;
}

/**
 * CustomizationGroup
 * Grouped customizations by category
 */
export interface CustomizationGroup {
  /** Group */
  group: string;
  /** Options */
  options: CustomizationOption[];
}

/** CustomizationItem */
export interface CustomizationItem {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Customization Group */
  customization_group?: string | null;
  /**
   * Display Order
   * @default 0
   */
  display_order?: number | null;
  /**
   * Price
   * @default 0
   */
  price?: number | null;
  /** Description */
  description?: string | null;
  /**
   * Is Active
   * @default true
   */
  is_active?: boolean;
  /**
   * Ai Voice Agent
   * @default false
   */
  ai_voice_agent?: boolean;
}

/**
 * CustomizationOption
 * Individual customization option
 */
export interface CustomizationOption {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Price */
  price: number;
  /**
   * Is Exclusive
   * @default false
   */
  is_exclusive?: boolean;
  /**
   * Display Order
   * @default 0
   */
  display_order?: number;
}

/** CustomizationResponse */
export interface CustomizationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  customization?: CustomizationItem | null;
}

/**
 * CustomizationTestRequest
 * Request to test customizations.
 */
export interface CustomizationTestRequest {
  /** Session Id */
  session_id: string;
  /** User Id */
  user_id?: string | null;
  /**
   * Clean Cart First
   * @default true
   */
  clean_cart_first?: boolean;
}

/**
 * CustomizationTestResponse
 * Test results.
 */
export interface CustomizationTestResponse {
  /** Success */
  success: boolean;
  /** Test Name */
  test_name: string;
  /** Steps */
  steps: Record<string, any>[];
  /** Summary */
  summary: Record<string, any>;
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/** CustomizationsResponse */
export interface CustomizationsResponse {
  /** Customizations */
  customizations: CustomizationItem[];
  /** Total Count */
  total_count: number;
}

/** DatabaseAuditResponse */
export interface DatabaseAuditResponse {
  /** Total Tables */
  total_tables: number;
  /** Tables Analysis */
  tables_analysis: TableUsageAnalysis[];
  /** Safe To Delete */
  safe_to_delete: string[];
  /** In Use */
  in_use: string[];
  /** Critical */
  critical: string[];
  /** Review Needed */
  review_needed: string[];
  /** Summary */
  summary: Record<string, any>;
}

/** DatabaseConnectionTest */
export interface DatabaseConnectionTest {
  /** Connection Status */
  connection_status: string;
  /** Response Time Ms */
  response_time_ms?: number | null;
  /** Database Version */
  database_version?: string | null;
  /** Error */
  error?: string | null;
}

/** DatabaseProcedureResponse */
export interface DatabaseProcedureResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Procedures Created */
  procedures_created: string[];
  /** Procedures Verified */
  procedures_verified: string[];
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/** DatabaseResponse */
export interface DatabaseResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Data */
  data?: Record<string, any> | null;
}

/** DatabaseSetupResponse */
export interface DatabaseSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Tables Created */
  tables_created: string[];
}

/** DeleteCacheResponse */
export interface DeleteCacheResponse {
  /** Success */
  success: boolean;
  /** Error */
  error?: string | null;
}

/** DeleteItemRequest */
export interface DeleteItemRequest {
  /** Item Id */
  item_id: string;
  /** Item Type */
  item_type: "categories" | "proteins" | "menu_items";
}

/** DeleteItemResponse */
export interface DeleteItemResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** DeleteListRequest */
export interface DeleteListRequest {
  /** List Id */
  list_id: string;
  /** Customer Id */
  customer_id: string;
}

/** DeleteTableResponse */
export interface DeleteTableResponse {
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/**
 * DeliveryAddress
 * Delivery address details
 */
export interface DeliveryAddress {
  /**
   * Address Line1
   * Street address
   */
  address_line1: string;
  /**
   * Address Line2
   * Apt/Suite/Unit
   */
  address_line2?: string | null;
  /**
   * City
   * City
   */
  city: string;
  /**
   * Postal Code
   * Postal code
   */
  postal_code: string;
}

/** DeliveryConfigResponse */
export interface DeliveryConfigResponse {
  /** Enabled */
  enabled: boolean;
  /** Radius Km */
  radius_km: number;
  /** Min Order */
  min_order: number;
  /** Fee */
  fee: number;
  /** Free Over */
  free_over: number;
  /** Message */
  message: string;
}

/**
 * DeliveryDetails
 * Delivery or collection details
 */
export interface DeliveryDetails {
  /**
   * Method
   * DELIVERY or COLLECTION
   */
  method: string;
  /** Delivery address (required for delivery) */
  address?: DeliveryAddress | null;
  /**
   * Scheduled Time
   * Scheduled delivery/collection time
   */
  scheduled_time?: string | null;
}

/** DeliveryRequest */
export interface DeliveryRequest {
  /** Destination Lat */
  destination_lat: number;
  /** Destination Lng */
  destination_lng: number;
  /** Destination Postcode */
  destination_postcode: string;
  /** Destination Address */
  destination_address: string;
}

/** DeliveryResponse */
export interface DeliveryResponse {
  /** Success */
  success: boolean;
  /** Eta Minutes */
  eta_minutes?: number | null;
  /** Eta Text */
  eta_text?: string | null;
  /** Distance Miles */
  distance_miles?: number | null;
  /** Distance Text */
  distance_text?: string | null;
  /** Error */
  error?: string | null;
}

/** DeliveryValidationRequest */
export interface DeliveryValidationRequest {
  /**
   * Postcode
   * Postcode to validate
   */
  postcode: string;
  /**
   * Order Value
   * Order value for minimum order check
   * @default 0
   */
  order_value?: number | null;
}

/** DeliveryZone */
export interface DeliveryZone {
  /** Zone Id */
  zone_id: string;
  /** Zone Name */
  zone_name: string;
  /**
   * Postcodes
   * List of postcodes/patterns
   */
  postcodes: string[];
  /**
   * Base Fee
   * Base delivery fee
   */
  base_fee: number;
  /**
   * Minimum Order
   * Minimum order for delivery
   * @default 0
   */
  minimum_order?: number;
  /** Maximum Distance */
  maximum_distance?: number | null;
  /**
   * Active
   * @default true
   */
  active?: boolean;
}

/**
 * DeltaSyncResponse
 * Response for delta sync requests
 */
export interface DeltaSyncResponse {
  /** Categories */
  categories: CategoryDelta[];
  /** Menu Items */
  menu_items: MenuItemDelta[];
  /** Variants */
  variants: VariantDelta[];
  /** Customizations */
  customizations: CustomizationDelta[];
  /** Last Updated */
  last_updated: string;
  /**
   * Has More
   * @default false
   */
  has_more?: boolean;
  /** Total Changes */
  total_changes: number;
  /** Cache Version */
  cache_version: string;
}

/** DiagnosticsResponse */
export interface DiagnosticsResponse {
  /** Success */
  success: boolean;
  /** Timestamp */
  timestamp: string;
  /** Summary */
  summary: Record<string, any>;
  /** Orphaned Items */
  orphaned_items: OrphanedItem[];
  /** Category Issues */
  category_issues: CategoryIssue[];
  /** Section Stats */
  section_stats: SectionStats[];
  /** Recommendations */
  recommendations: string[];
}

/** DiscoveryResponse */
export interface DiscoveryResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Printers Found */
  printers_found: Printer[];
  /** Discovery Method */
  discovery_method: string;
}

/** DropRPCResponse */
export interface DropRPCResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** DropTablesResponse */
export interface DropTablesResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any>;
}

/** DropViewResponse */
export interface DropViewResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/**
 * DualPrintResponse
 * Response model for dual printing operations
 */
export interface DualPrintResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Method */
  method: string;
  /** Kitchen Job */
  kitchen_job: Record<string, any>;
  /** Customer Job */
  customer_job: Record<string, any>;
  /** Error */
  error?: string | null;
}

/** EmailReceiptRequest */
export interface EmailReceiptRequest {
  /** Receipt Id */
  receipt_id: string;
  /** Customer Email */
  customer_email: string;
  /** Customer Name */
  customer_name?: string | null;
}

/** EmailVerificationStatusResponse */
export interface EmailVerificationStatusResponse {
  /** Email Verified */
  email_verified: boolean;
  /** Email */
  email: string;
  /** Message */
  message: string;
}

/** EmitEventRequest */
export interface EmitEventRequest {
  /** Event Type */
  event_type: string;
  /** Data */
  data: Record<string, any>;
}

/** EnhancedDeliveryResponse */
export interface EnhancedDeliveryResponse {
  /** Success */
  success: boolean;
  /** Error */
  error?: string | null;
  /** Delivery Time Minutes */
  delivery_time_minutes?: number | null;
  /** Base Eta Minutes */
  base_eta_minutes?: number | null;
  /** Eta Text */
  eta_text?: string | null;
  /** Distance Km */
  distance_km?: number | null;
  /** Distance Miles */
  distance_miles?: number | null;
  /** Distance Text */
  distance_text?: string | null;
  /** Duration Text */
  duration_text?: string | null;
  /** Restaurant */
  restaurant?: Record<string, any> | null;
  /** Destination */
  destination?: Record<string, any> | null;
  /** Polyline */
  polyline?: string | null;
  traffic?: TrafficCondition | null;
  weather?: WeatherData | null;
  location_intelligence?: LocationIntelligence | null;
  street_view?: StreetViewData | null;
}

/** EnhancedMediaAsset */
export interface EnhancedMediaAsset {
  /** Id */
  id: string;
  /** File Name */
  file_name: string;
  /** Friendly Name */
  friendly_name?: string | null;
  /** Type */
  type: string;
  /** Url */
  url: string;
  /** Tags */
  tags?: string[] | null;
  /** Description */
  description?: string | null;
  /** Usage */
  usage?: string | null;
  /** Upload Date */
  upload_date?: string | null;
  /** File Size */
  file_size?: number | null;
  /** Bucket Name */
  bucket_name?: string | null;
  /**
   * Linked Menu Items
   * @default []
   */
  linked_menu_items?: MediaItemLink[];
  primary_item?: MediaItemLink | null;
  /** Display Name */
  display_name?: string | null;
  /** Secondary Info */
  secondary_info?: string | null;
}

/** EnhancedMediaLibraryResponse */
export interface EnhancedMediaLibraryResponse {
  /** Success */
  success: boolean;
  /** Assets */
  assets: EnhancedMediaAsset[];
  /** Total Count */
  total_count: number;
  /** Message */
  message?: string | null;
  /** Error */
  error?: string | null;
}

/** EnrichedFavoriteItem */
export interface EnrichedFavoriteItem {
  /** Favorite Id */
  favorite_id: string;
  /** Customer Id */
  customer_id: string;
  /** Created At */
  created_at: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Menu Item Name */
  menu_item_name: string;
  /** Description */
  description?: string | null;
  /** Price */
  price?: number | null;
  /** Category */
  category?: string | null;
  /** Image Url */
  image_url?: string | null;
  /**
   * Is Available
   * @default true
   */
  is_available?: boolean;
  /** Spice Level */
  spice_level?: number | null;
  /** Dietary Info */
  dietary_info?: string[] | null;
  /** Variant Id */
  variant_id?: string | null;
  /** Variant Name */
  variant_name?: string | null;
  /** Variant Description */
  variant_description?: string | null;
  /** Variant Price */
  variant_price?: number | null;
  /** Variant Image Url */
  variant_image_url?: string | null;
  /** Variant Spice Level */
  variant_spice_level?: number | null;
  /**
   * Variant Is Available
   * @default true
   */
  variant_is_available?: boolean;
  /** Display Name */
  display_name: string;
  /** Display Description */
  display_description?: string | null;
  /** Display Price */
  display_price?: number | null;
  /** Display Image Url */
  display_image_url?: string | null;
  /** Display Spice Level */
  display_spice_level?: number | null;
  /**
   * Display Is Available
   * @default true
   */
  display_is_available?: boolean;
}

/** EnrichedFavoritesResponse */
export interface EnrichedFavoritesResponse {
  /** Favorites */
  favorites: EnrichedFavoriteItem[];
  /** Count */
  count: number;
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default "Favorites loaded successfully"
   */
  message?: string;
}

/** EpsonPrintRequest */
export interface EpsonPrintRequest {
  /** Header */
  header: string;
  /** Subheader */
  subheader: string;
  /** Content */
  content: string[];
  /** Footer */
  footer: string;
  /** Printer Id */
  printer_id?: string | null;
}

/** EventListResponse */
export interface EventListResponse {
  /** Events */
  events: EventNotification[];
  /** Count */
  count: number;
}

/** EventNotification */
export interface EventNotification {
  /** Event Type */
  event_type: string;
  /** Data */
  data: Record<string, any>;
  /** Timestamp */
  timestamp: number;
}

/** ExtendCacheRequest */
export interface ExtendCacheRequest {
  /** Cache Name */
  cache_name: string;
  /**
   * Additional Hours
   * @default 24
   */
  additional_hours?: number;
}

/** ExtendCacheResponse */
export interface ExtendCacheResponse {
  /** Success */
  success: boolean;
  /** New Expiry */
  new_expiry?: string | null;
  /** Error */
  error?: string | null;
}

/** FavoriteActionResponse */
export interface FavoriteActionResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Favorite Id */
  favorite_id?: string | null;
}

/** FavoriteItem */
export interface FavoriteItem {
  /** Id */
  id: string;
  /** Customer Id */
  customer_id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Menu Item Name */
  menu_item_name: string;
  /** Variant Id */
  variant_id?: string | null;
  /** Variant Name */
  variant_name?: string | null;
  /** Image Url */
  image_url?: string | null;
  /** Created At */
  created_at: string;
}

/** FavoriteList */
export interface FavoriteList {
  /** Id */
  id: string;
  /** List Name */
  list_name: string;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
  /** Item Count */
  item_count: number;
  /** Items */
  items: FavoriteListItem[];
}

/** FavoriteListItem */
export interface FavoriteListItem {
  /** Id */
  id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Menu Item Name */
  menu_item_name: string;
  /** Menu Item Price */
  menu_item_price: number | null;
  /** Menu Item Image */
  menu_item_image: string | null;
  /** Added At */
  added_at: string;
  /** Favorite Id */
  favorite_id: string;
}

/** FavoriteStatusResponse */
export interface FavoriteStatusResponse {
  /** Is Favorite */
  is_favorite: boolean;
  /** Favorite Id */
  favorite_id?: string | null;
}

/** FavoritesResponse */
export interface FavoritesResponse {
  /** Favorites */
  favorites: FavoriteItem[];
  /** Count */
  count: number;
}

/** FeeBreakdown */
export interface FeeBreakdown {
  /**
   * Service Charge
   * Service charge amount
   * @default 0
   */
  service_charge?: number;
  /** Service Charge Percentage */
  service_charge_percentage?: number | null;
  /**
   * Delivery Fee
   * Delivery fee amount
   * @default 0
   */
  delivery_fee?: number;
  /** Delivery Zone */
  delivery_zone?: string | null;
  /** Delivery Distance */
  delivery_distance?: number | null;
  /**
   * Packaging Fee
   * Packaging/container fee
   * @default 0
   */
  packaging_fee?: number;
  /**
   * Total Fees
   * Total fees amount
   */
  total_fees: number;
  /**
   * Discount On Fees
   * Discount applied to fees (e.g., free delivery)
   * @default 0
   */
  discount_on_fees?: number;
  /**
   * Final Fees
   * Final fees after discounts
   */
  final_fees: number;
}

/** FeeCalculationRequest */
export interface FeeCalculationRequest {
  /**
   * Order Type
   * Order type: DINE_IN, COLLECTION, DELIVERY, WAITING
   */
  order_type: string;
  /**
   * Order Subtotal
   * Order subtotal before fees and discounts
   */
  order_subtotal: number;
  /** Delivery Address */
  delivery_address?: Record<string, any> | null;
  /** Customer Postcode */
  customer_postcode?: string | null;
  /** Promo Code */
  promo_code?: string | null;
  /**
   * Customer Tier
   * Customer tier: standard, vip, staff
   * @default "standard"
   */
  customer_tier?: string | null;
}

/** FeeCalculationResponse */
export interface FeeCalculationResponse {
  /** Success */
  success: boolean;
  /** Order Type */
  order_type: string;
  /** Order Subtotal */
  order_subtotal: number;
  fee_breakdown: FeeBreakdown;
  /** Order Total */
  order_total: number;
  /** Message */
  message?: string | null;
}

/** FileContent */
export interface FileContent {
  /** Path */
  path: string;
  /** Content */
  content: string;
  /** Message */
  message: string;
}

/** FileUploadResponse */
export interface FileUploadResponse {
  /** Success */
  success: boolean;
  /** Url */
  url?: string | null;
  /** Asset Id */
  asset_id?: string | null;
  /** Filename */
  filename?: string | null;
  /** File Size */
  file_size?: number | null;
  /** Dimensions */
  dimensions?: Record<string, number> | null;
  /** Error */
  error?: string | null;
}

/** FilterDiagnosticResponse */
export interface FilterDiagnosticResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Data */
  data: Record<string, any>;
}

/** FinalizeCutoverRequest */
export interface FinalizeCutoverRequest {
  /**
   * Confirm
   * Set true to drop compat view and revoke legacy grants
   */
  confirm: boolean;
}

/** FixCustomizationsResponse */
export interface FixCustomizationsResponse {
  /** Status */
  status: string;
  /** Table Created */
  table_created: boolean;
  /** Sample Data Inserted */
  sample_data_inserted: boolean;
  /** Error */
  error?: string | null;
  /** Verification Result */
  verification_result?: Record<string, any> | null;
}

/** FixResponse */
export interface FixResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Details
   * @default {}
   */
  details?: Record<string, any>;
}

/** FixResult */
export interface FixResult {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/** ForceRefreshResponse */
export interface ForceRefreshResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Timestamp */
  timestamp: string;
}

/** FullRunRequest */
export interface FullRunRequest {
  /**
   * Confirm
   * Set true to run all steps 1→5
   */
  confirm: boolean;
}

/** FullRunResponse */
export interface FullRunResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Steps
   * @default []
   */
  steps?: StepResponse[];
}

/** GalleryMenuItem */
export interface GalleryMenuItem {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name: string;
  /** Price */
  price: string;
  /** Image Url */
  image_url?: string | null;
  /** Image Widescreen Url */
  image_widescreen_url?: string | null;
  /** Image Asset Id */
  image_asset_id?: string | null;
  /** Image Widescreen Asset Id */
  image_widescreen_asset_id?: string | null;
}

/** GalleryMenuItemsResponse */
export interface GalleryMenuItemsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Items
   * @default []
   */
  items?: GalleryMenuItem[];
  /**
   * Total Count
   * @default 0
   */
  total_count?: number;
  /**
   * Items With Images
   * @default 0
   */
  items_with_images?: number;
  /** Error */
  error?: string | null;
}

/** GeminiVoiceSessionResponse */
export interface GeminiVoiceSessionResponse {
  /** Success */
  success: boolean;
  /** Api Key */
  api_key?: string | null;
  /** Token */
  token?: string | null;
  /** Expires At */
  expires_at?: string | null;
  /** Error */
  error?: string | null;
}

/**
 * GenerateOrderNumberRequest
 * Request to generate a new order number
 */
export interface GenerateOrderNumberRequest {
  /** Order Source */
  order_source: string;
  /** Order Type */
  order_type: string;
}

/**
 * GenerateOrderNumberResponse
 * Response containing generated order number
 */
export interface GenerateOrderNumberResponse {
  /** Success */
  success: boolean;
  /** Order Number */
  order_number: string;
  /** Sequence Number */
  sequence_number: number;
  /** Message */
  message: string;
}

/** GenerateReceiptRequest */
export interface GenerateReceiptRequest {
  /** Order Id */
  order_id: string;
  /** Payment Id */
  payment_id: string;
  /** Transaction Id */
  transaction_id: string;
  customer: ReceiptCustomer;
  /** Items */
  items: ReceiptItem[];
  /** Order Type */
  order_type: string;
  /** Delivery Method */
  delivery_method: string;
  delivery_address?: ReceiptAddress | null;
  /** Table Number */
  table_number?: string | null;
  /** Subtotal */
  subtotal: number;
  /**
   * Tax Amount
   * @default 0
   */
  tax_amount?: number;
  /**
   * Delivery Fee
   * @default 0
   */
  delivery_fee?: number;
  /**
   * Tip Amount
   * @default 0
   */
  tip_amount?: number;
  /**
   * Discount Amount
   * @default 0
   */
  discount_amount?: number;
  /** Total Amount */
  total_amount: number;
  /**
   * Currency
   * @default "GBP"
   */
  currency?: string;
  /**
   * Payment Method
   * @default "Card"
   */
  payment_method?: string;
  /** Payment Status */
  payment_status: string;
  /**
   * Order Date
   * @format date-time
   */
  order_date: string;
  /** Special Instructions */
  special_instructions?: string | null;
  /**
   * Send Email
   * @default true
   */
  send_email?: boolean;
}

/**
 * GenerateSystemPromptResponse
 * @example {"agent_name":"Uncle Raj","channel":"chat","complete_prompt":"# CRITICAL AI OPERATIONAL RULES...\n\n# WHO YOU ARE...","metadata":{"complete_prompt_chars":8000,"has_menu_knowledge":true,"has_restaurant_data":true,"user_portion_chars":2000},"nationality":"british-indian","prompt":"# CRITICAL AI OPERATIONAL RULES...","user_portion":"# WHO YOU ARE\nYou are Uncle Raj..."}
 */
export interface GenerateSystemPromptResponse {
  /**
   * Prompt
   * Legacy field for backward compatibility - contains complete assembled prompt
   */
  prompt: string;
  /**
   * User Portion
   * Editable USER customization only (personality, style, greetings)
   */
  user_portion: string;
  /**
   * Complete Prompt
   * Full assembled prompt (CORE + USER + CHANNEL) - read-only preview
   */
  complete_prompt: string;
  /**
   * Agent Name
   * Agent's display name
   */
  agent_name: string;
  /**
   * Nationality
   * Agent's nationality/cultural background
   */
  nationality: string;
  /**
   * Channel
   * Channel type (chat or voice)
   */
  channel: string;
  /**
   * Metadata
   * Optional metadata (char counts, feature flags)
   */
  metadata?: Record<string, any> | null;
}

/** GeocodingRequest */
export interface GeocodingRequest {
  /** Postcode */
  postcode?: string;
  /** Locationname */
  locationName?: string;
}

/** GeocodingResponse */
export interface GeocodingResponse {
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default ""
   */
  message?: string;
  /** Postcode */
  postcode?: string;
  /** Locationname */
  locationName?: string;
  /** Coordinates */
  coordinates?: Record<string, any>;
}

/**
 * GetCartResponse
 * Response with cart items
 */
export interface GetCartResponse {
  /** Success */
  success: boolean;
  /**
   * Items
   * @default []
   */
  items?: Record<string, any>[];
  /**
   * Total Amount
   * @default 0
   */
  total_amount?: number;
  /**
   * Total Items
   * @default 0
   */
  total_items?: number;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** GetListsResponse */
export interface GetListsResponse {
  /** Success */
  success: boolean;
  /** Lists */
  lists: FavoriteList[];
}

/** GetPOSSettingsResponse */
export interface GetPOSSettingsResponse {
  settings: POSSettings;
  /**
   * Message
   * @default "Settings retrieved successfully"
   */
  message?: string;
}

/** GetSettingsResponse */
export interface GetSettingsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Settings */
  settings?: Record<string, any> | null;
}

/**
 * GetSummaryRequest
 * Request to get cart summary
 */
export interface GetSummaryRequest {
  /**
   * Session Id
   * Session ID
   */
  session_id: string;
  /**
   * Cart Context
   * Current cart state
   */
  cart_context?: CartItemData[] | null;
}

/**
 * GetSummaryResponse
 * Response with cart summary
 */
export interface GetSummaryResponse {
  /**
   * Action
   * @default "get_summary"
   */
  action?: string;
  /** Success */
  success: boolean;
  /** Items */
  items: CartItemData[];
  /** Total Items */
  total_items: number;
  /** Total Amount */
  total_amount: number;
  /** Summary Text */
  summary_text: string;
}

/** GitHubReleaseResponse */
export interface GitHubReleaseResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Release Data */
  release_data?: Record<string, any> | null;
  /** Version */
  version?: string | null;
  /** Html Url */
  html_url?: string | null;
  /** Error */
  error?: string | null;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/**
 * HealthHistoryEntry
 * Single entry in health check history
 */
export interface HealthHistoryEntry {
  /** Timestamp */
  timestamp: string;
  /** Overall Status */
  overall_status: string;
  /** Services */
  services: HealthStatusResponse[];
}

/**
 * HealthHistoryResponse
 * Response for health check history
 */
export interface HealthHistoryResponse {
  /** Entries */
  entries: HealthHistoryEntry[];
  /** Total Entries */
  total_entries: number;
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/**
 * HealthStatusResponse
 * Response for service health status
 */
export interface HealthStatusResponse {
  /** Service */
  service: string;
  /** Status */
  status: string;
  /** Latency Ms */
  latency_ms: number;
  /** Details */
  details: Record<string, any>;
  /** Last Checked */
  last_checked: string;
  /** Error */
  error?: string | null;
}

/**
 * HierarchicalMediaResponse
 * Complete hierarchical media library structure.
 */
export interface HierarchicalMediaResponse {
  /** Menu Images */
  menu_images: SectionGroup[];
  /** Uncategorized assets that need organization. */
  menu_images_orphaned: OrphanedAssets;
  /** Ai Avatars */
  ai_avatars: AppApisMediaLibraryHierarchicalMediaAsset[];
  /** Uncategorized assets that need organization. */
  ai_avatars_orphaned: OrphanedAssets;
  /** General Media */
  general_media: AppApisMediaLibraryHierarchicalMediaAsset[];
  /** Total Assets */
  total_assets: number;
  /** Categorized Count */
  categorized_count: number;
  /** Orphaned Count */
  orphaned_count: number;
}

/** ImageUploadResponse */
export interface ImageUploadResponse {
  /** Success */
  success: boolean;
  /** Asset Id */
  asset_id?: string | null;
  /** File Url */
  file_url?: string | null;
  /** Thumbnail Url */
  thumbnail_url?: string | null;
  /**
   * File Size
   * @default 0
   */
  file_size?: number;
  /**
   * Thumbnail Size
   * @default 0
   */
  thumbnail_size?: number;
  /**
   * Mime Type
   * @default ""
   */
  mime_type?: string;
  /**
   * Dimensions
   * @default {}
   */
  dimensions?: Record<string, number>;
  /** Error */
  error?: string | null;
}

/**
 * ImageVariant
 * Single image variant with both WebP and JPEG versions
 */
export interface ImageVariant {
  /** Webp Url */
  webp_url: string;
  /** Jpeg Url */
  jpeg_url: string;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Size Kb */
  size_kb: number;
  /** Webp Size Kb */
  webp_size_kb: number;
  /** Jpeg Size Kb */
  jpeg_size_kb: number;
}

/** InitializeOnboardingRequest */
export interface InitializeOnboardingRequest {
  /** Customer Id */
  customer_id: string;
  /** Email */
  email: string;
  /** First Name */
  first_name?: string | null;
}

/** InitializeResponse */
export interface InitializeResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Config Id */
  config_id?: string | null;
}

/**
 * InstallationBundleResponse
 * Installation bundle metadata
 */
export interface InstallationBundleResponse {
  /** Service Name */
  service_name: string;
  /** Version */
  version: string;
  /** Files */
  files: Record<string, string>[];
  /** Installation Instructions */
  installation_instructions: string;
}

/**
 * InstallationScriptResponse
 * Installation script generation response
 */
export interface InstallationScriptResponse {
  /** Success */
  success: boolean;
  /** Script Type */
  script_type: string;
  /** Script Content */
  script_content: string;
  /** Instructions */
  instructions: string[];
}

/** InstallerSyncResponse */
export interface InstallerSyncResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Files Pushed
   * @default []
   */
  files_pushed?: string[];
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/** ItemCodeRequest */
export interface ItemCodeRequest {
  /** Category Id */
  category_id: string;
  /** Item Name */
  item_name: string;
}

/** ItemCodeResponse */
export interface ItemCodeResponse {
  /** Success */
  success: boolean;
  /** Item Code */
  item_code: string;
  /** Category Prefix */
  category_prefix: string;
  /** Message */
  message: string;
}

/**
 * ItemCustomizationsResponse
 * Response for item customizations query
 */
export interface ItemCustomizationsResponse {
  /** Success */
  success: boolean;
  /** Item Id */
  item_id: string;
  /** Customizations */
  customizations: CustomizationGroup[];
  /** Total Count */
  total_count: number;
  /** Formatted Text */
  formatted_text: string;
  /** Error */
  error?: string | null;
}

/** Job */
export interface Job {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Status */
  status: string;
  /** Conclusion */
  conclusion?: string | null;
  /** Html Url */
  html_url: string;
  /** Steps */
  steps: JobStep[];
}

/** JobLogsResponse */
export interface JobLogsResponse {
  /** Job Name */
  job_name: string;
  /** Logs */
  logs: string;
}

/** JobStep */
export interface JobStep {
  /** Name */
  name: string;
  /** Status */
  status: string;
  /** Conclusion */
  conclusion?: string | null;
  /** Number */
  number: number;
}

/**
 * KitchenAndCustomerRequest
 * Combined kitchen + customer print request model for POSDesktop standardization
 */
export interface KitchenAndCustomerRequest {
  /** Ordernumber */
  orderNumber: string;
  /** Ordertype */
  orderType: string;
  /** Items */
  items: Record<string, any>[];
  /** Table */
  table?: string | null;
  /** Specialinstructions */
  specialInstructions?: string | null;
  /** Notes */
  notes?: string | null;
  /**
   * Tax
   * @default 0
   */
  tax?: number | null;
  /**
   * Deliveryfee
   * @default 0
   */
  deliveryFee?: number | null;
  /**
   * Ordersource
   * @default "POS"
   */
  orderSource?: string | null;
  /**
   * Guestcount
   * @default 1
   */
  guestCount?: number | null;
  /** Customername */
  customerName?: string | null;
  /** Collectiontime */
  collectionTime?: string | null;
  /** Deliveryaddress */
  deliveryAddress?: string | null;
  /** Preparationtime */
  preparationTime?: string | null;
  /** Estimatedtime */
  estimatedTime?: string | null;
  /**
   * Paymentmethod
   * @default "Card"
   */
  paymentMethod?: string | null;
}

/** KitchenNameSuggestion */
export interface KitchenNameSuggestion {
  /** Menu Item Name */
  menu_item_name: string;
  /** Protein Name */
  protein_name?: string | null;
  /** Combined Original */
  combined_original: string;
  /** Suggested Kitchen Name */
  suggested_kitchen_name: string;
  /** Suggested Protein Short */
  suggested_protein_short?: string | null;
  /** Length Reduction */
  length_reduction: number;
  /** Fits Thermal */
  fits_thermal: boolean;
}

/** KitchenPrintRequest */
export interface KitchenPrintRequest {
  /** Table Number */
  table_number: number;
  /** Order Id */
  order_id: string;
  /** Items */
  items: Record<string, any>[];
  /** Timestamp */
  timestamp?: string | null;
  /**
   * Only New Items
   * @default false
   */
  only_new_items?: boolean;
  /** Template Id */
  template_id?: string | null;
}

/**
 * KitchenTicketRequest
 * Kitchen ticket print request with Supabase order structure
 */
export interface KitchenTicketRequest {
  /** Ordernumber */
  orderNumber: string;
  /** Ordertype */
  orderType: string;
  /** Items */
  items: Record<string, any>[];
  /** Table */
  table?: string | null;
  /** Specialinstructions */
  specialInstructions?: string | null;
  /** Notes */
  notes?: string | null;
  /** Template Data */
  template_data?: Record<string, any> | null;
  /**
   * Ordersource
   * @default "POS"
   */
  orderSource?: string | null;
  /**
   * Guestcount
   * @default 1
   */
  guestCount?: number | null;
  /** Customername */
  customerName?: string | null;
  /** Collectiontime */
  collectionTime?: string | null;
  /** Deliveryaddress */
  deliveryAddress?: string | null;
  /** Preparationtime */
  preparationTime?: string | null;
}

/**
 * LatestPrinterReleaseResponse
 * Response model for latest printer release info.
 */
export interface LatestPrinterReleaseResponse {
  /** Success */
  success: boolean;
  /** Version */
  version?: string | null;
  /** Download Url */
  download_url?: string | null;
  /** Release Notes */
  release_notes?: string | null;
  /** Published At */
  published_at?: string | null;
  /** File Size */
  file_size?: number | null;
}

/**
 * LatestReleaseInfo
 * Response model for get_latest_release endpoint.
 */
export interface LatestReleaseInfo {
  /** Success */
  success: boolean;
  /** Version */
  version?: string | null;
  /** Download Url */
  download_url?: string | null;
  /** Release Url */
  release_url?: string | null;
  /** Release Name */
  release_name?: string | null;
  /** Published At */
  published_at?: string | null;
  /** Error Message */
  error_message?: string | null;
}

/** LatestReleaseResponse */
export interface LatestReleaseResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Release Data */
  release_data?: Record<string, any> | null;
  /** Version */
  version?: string | null;
  /** Html Url */
  html_url?: string | null;
  /** Published At */
  published_at?: string | null;
  /** Error */
  error?: string | null;
}

/** ListCachesResponse */
export interface ListCachesResponse {
  /** Success */
  success: boolean;
  /** Caches */
  caches: CacheInfo[];
  /** Total */
  total: number;
}

/** LiveCallStatus */
export interface LiveCallStatus {
  /** Call Id */
  call_id: string;
  /** Agent Name */
  agent_name: string;
  /** Customer Phone */
  customer_phone: string;
  /** Duration Seconds */
  duration_seconds: number;
  /** Status */
  status: string;
  /**
   * Order Items
   * @default []
   */
  order_items?: any[];
  /**
   * Order Total
   * @default 0
   */
  order_total?: number;
}

/** LiveCallsResponse */
export interface LiveCallsResponse {
  /** Success */
  success: boolean;
  /**
   * Active Calls
   * @default []
   */
  active_calls?: LiveCallStatus[];
  /**
   * Total Calls
   * @default 0
   */
  total_calls?: number;
  /** Message */
  message?: string | null;
  /** Error */
  error?: string | null;
}

/** LocationIntelligence */
export interface LocationIntelligence {
  /** Area Type */
  area_type: string;
  /** Building Type */
  building_type: string;
  /** Parking Context */
  parking_context: string;
  /** Access Notes */
  access_notes: string[];
  /** Landmarks */
  landmarks: string[];
  /** Neighborhood */
  neighborhood?: string | null;
}

/** LockStatusResponse */
export interface LockStatusResponse {
  /** Is Locked */
  is_locked: boolean;
  /** Cooldown Until */
  cooldown_until?: string | null;
  /** Failed Attempts */
  failed_attempts: number;
}

/** MarkTourCompleteRequest */
export interface MarkTourCompleteRequest {
  /** Customer Id */
  customer_id: string;
}

/** MarkWizardCompleteRequest */
export interface MarkWizardCompleteRequest {
  /** Customer Id */
  customer_id: string;
}

/** MasterSwitchRequest */
export interface MasterSwitchRequest {
  /** Enabled */
  enabled: boolean;
  /** Reason */
  reason?: string | null;
}

/** MediaBulkUpdateRequest */
export interface MediaBulkUpdateRequest {
  /** Asset Ids */
  asset_ids: string[];
  /** Tags */
  tags?: string[] | null;
  /** Category */
  category?: string | null;
  /** Subcategory */
  subcategory?: string | null;
}

/** MediaItemLink */
export interface MediaItemLink {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Category Name */
  category_name?: string | null;
  /** Variant Info */
  variant_info?: string | null;
}

/** MediaLibraryResponse */
export interface MediaLibraryResponse {
  /** Success */
  success: boolean;
  /** Assets */
  assets: AppApisUnifiedMediaStorageMediaAsset[];
  /** Total Count */
  total_count: number;
  /** Page */
  page: number;
  /** Page Size */
  page_size: number;
  /** Has More */
  has_more: boolean;
}

/** MediaLinkRequest */
export interface MediaLinkRequest {
  /** Asset Id */
  asset_id: string;
  /** Item Id */
  item_id: string;
  /**
   * Item Type
   * @default "menu_item"
   */
  item_type?: string;
  /**
   * Link Type
   * @default "primary"
   */
  link_type?: string;
}

/** MediaLinkResponse */
export interface MediaLinkResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Image Asset Id */
  image_asset_id?: string | null;
  /** Image Widescreen Asset Id */
  image_widescreen_asset_id?: string | null;
  /** Error */
  error?: string | null;
}

/** MediaUsageResponse */
export interface MediaUsageResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Updated Count */
  updated_count?: number | null;
  /** Error */
  error?: string | null;
}

/** MenuCategoryData */
export interface MenuCategoryData {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Display Order */
  display_order: number;
  /** Active */
  active: boolean;
  /** Description */
  description?: string | null;
  /** Parent Category Id */
  parent_category_id?: string | null;
}

/** MenuChangeEvent */
export interface MenuChangeEvent {
  /** Event Type */
  event_type: string;
  /** Entity Type */
  entity_type: string;
  /** Entity Id */
  entity_id: string;
  /** Change Type */
  change_type: string;
  /** Timestamp */
  timestamp: string;
  /** User Id */
  user_id?: string | null;
  /**
   * Changes
   * @default {}
   */
  changes?: Record<string, any>;
}

/**
 * MenuContextRequest
 * Context for generating AI menu recommendations
 */
export interface MenuContextRequest {
  /** Availableitems */
  availableItems: Record<string, any>[];
  /**
   * Currentcart
   * @default []
   */
  currentCart?: string[];
  /** Selectedcategory */
  selectedCategory?: string | null;
  /**
   * Searchquery
   * @default ""
   */
  searchQuery?: string;
  /**
   * Maxrecommendations
   * @default 8
   */
  maxRecommendations?: number;
  /**
   * Includereasons
   * @default true
   */
  includeReasons?: boolean;
  /**
   * Constraintodatabase
   * @default true
   */
  constrainToDatabase?: boolean;
}

/**
 * MenuContextResponse
 * Menu context formatted for AI assistant
 */
export interface MenuContextResponse {
  /** Success */
  success: boolean;
  /** Menu Text */
  menu_text: string;
  /** Total Items */
  total_items: number;
  /** Categories */
  categories: string[];
}

/**
 * MenuCorpusResponse
 * Response model for menu corpus endpoints
 *
 * This model follows the standardized naming convention for response models.
 */
export interface MenuCorpusResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Corpus */
  corpus?: MenuItem[];
  /** Version */
  version: string;
  /** Timestamp */
  timestamp: string;
  /**
   * Entry Count
   * @default 0
   */
  entry_count?: number;
  /**
   * Is Mock
   * @default false
   */
  is_mock?: boolean;
}

/** MenuDataDiagnostics */
export interface MenuDataDiagnostics {
  /** Success */
  success: boolean;
  /** Categories Count */
  categories_count: number;
  /** Proteins Count */
  proteins_count: number;
  /** Categories Sample */
  categories_sample: Record<string, any>[];
  /** Proteins Sample */
  proteins_sample: Record<string, any>[];
  /** Errors */
  errors: string[];
  /** Database Health */
  database_health: string;
}

/**
 * MenuItem
 * Model representing a menu item for the menu corpus
 *
 * This model follows the standardized naming convention for models.
 */
export interface MenuItem {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /**
   * Description
   * @default ""
   */
  description?: string | null;
  /**
   * Category
   * @default "Uncategorized"
   */
  category?: string;
  /** Section Name */
  section_name?: string | null;
  /** Section Id */
  section_id?: string | null;
  /** Section Order */
  section_order?: number | null;
  /** Price */
  price?: number | null;
  /** Price Takeaway */
  price_takeaway?: number | null;
  /** Price Delivery */
  price_delivery?: number | null;
  /** Price Dine In */
  price_dine_in?: number | null;
  /** Dietary Info */
  dietary_info?: string[];
  /** Allergens */
  allergens?: string[];
  /**
   * Image Url
   * @default ""
   */
  image_url?: string | null;
  /** Image Variants */
  image_variants?: Record<string, string> | null;
  /** Keywords */
  keywords?: string[];
  /** Variant Name */
  variant_name?: string | null;
  /** Protein Type */
  protein_type?: string | null;
  /** Spice Level */
  spice_level?: string | null;
  /**
   * Is Vegetarian
   * @default false
   */
  is_vegetarian?: boolean;
  /**
   * Is Vegan
   * @default false
   */
  is_vegan?: boolean;
  /**
   * Is Gluten Free
   * @default false
   */
  is_gluten_free?: boolean;
  /** Item Code */
  item_code?: string | null;
}

/**
 * MenuItemBase
 * Menu item base model - aligned with frontend validation (menuFormValidation.ts)
 */
export interface MenuItemBase {
  /**
   * Name
   * Item name (2-100 characters)
   * @minLength 2
   * @maxLength 100
   */
  name: string;
  /** Description */
  description?: string | null;
  /**
   * Category Id
   * Category is required
   * @minLength 1
   */
  category_id: string;
  /**
   * Item Type
   * Item type: food, drinks_wine, coffee_desserts
   */
  item_type?: string | null;
  /**
   * Base Price
   * Base price for the item
   * @min 0
   * @default 0
   */
  base_price?: number;
  /** Price Dine In */
  price_dine_in?: number | null;
  /** Price Takeaway */
  price_takeaway?: number | null;
  /** Price Delivery */
  price_delivery?: number | null;
  /**
   * Has Variants
   * @default false
   */
  has_variants?: boolean;
  /**
   * Default Spice Level
   * @min 0
   * @max 5
   * @default 0
   */
  default_spice_level?: number;
  /**
   * Featured
   * @default false
   */
  featured?: boolean;
  /**
   * Active
   * @default true
   */
  active?: boolean;
  /**
   * Display Order
   * @min 0
   * @default 0
   */
  display_order?: number;
  /**
   * Print To Kitchen
   * @default true
   */
  print_to_kitchen?: boolean;
  /** Dietary Tags */
  dietary_tags?: string[] | null;
  /** Image Url */
  image_url?: string | null;
  /** Image Url Widescreen */
  image_url_widescreen?: string | null;
  /** Image Asset Id */
  image_asset_id?: string | null;
  /**
   * Variants
   * Item variants with proteins
   */
  variants?: MenuItemVariant[] | null;
}

/** MenuItemCodeRequest */
export interface MenuItemCodeRequest {
  /**
   * Item Code
   * Structured item code (e.g., ST-NV-001)
   */
  item_code: string;
}

/** MenuItemCodeResponse */
export interface MenuItemCodeResponse {
  /** Success */
  success: boolean;
  item: MenuItemMatch | null;
  /** Message */
  message: string;
}

/** MenuItemContext */
export interface MenuItemContext {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description: string | null;
  /** Category */
  category: string;
  /** Price Range */
  price_range: string;
  /** Variants */
  variants: Record<string, any>[];
  /** Dietary Tags */
  dietary_tags: string[];
  /** Spice Level */
  spice_level: string | null;
  /** Featured */
  featured: boolean;
  /** Active */
  active: boolean;
  /** Aliases */
  aliases: string[];
  /** Confidence Keywords */
  confidence_keywords: string[];
}

/**
 * MenuItemDelta
 * Menu item for delta sync
 */
export interface MenuItemDelta {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Menu Item Description */
  menu_item_description?: string | null;
  /** Image Url */
  image_url?: string | null;
  /** Category Id */
  category_id: string;
  /** Price */
  price: number;
  /** Active */
  active: boolean;
  /** Featured */
  featured: boolean;
  /** Spice Indicators */
  spice_indicators?: string | null;
  /** Dietary Tags */
  dietary_tags?: string[] | null;
  /** Item Code */
  item_code?: string | null;
  /** Display Order */
  display_order: number;
  /** Updated At */
  updated_at: string;
}

/** MenuItemMatch */
export interface MenuItemMatch {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Item Code */
  item_code: string | null;
  /** Category Name */
  category_name: string;
  /** Description */
  description: string | null;
  /** Price */
  price: number;
  /** Image Url */
  image_url: string | null;
  /** Spice Level */
  spice_level: number | null;
  /** Dietary Tags */
  dietary_tags: string[] | null;
  /**
   * Confidence Score
   * Match confidence (0.0 - 1.0)
   */
  confidence_score: number;
  /**
   * Match Reason
   * Why this item was matched
   */
  match_reason: string;
}

/**
 * MenuItemResult
 * Single menu item result
 */
export interface MenuItemResult {
  /** Name */
  name: string;
  /** Description */
  description: string;
  /** Price */
  price: number;
  /** Category */
  category: string;
  /** Allergens */
  allergens: string[];
  /** Is Vegetarian */
  is_vegetarian: boolean;
  /** Is Vegan */
  is_vegan: boolean;
}

/**
 * MenuItemUpdate
 * Menu item update model - aligned with frontend validation
 */
export interface MenuItemUpdate {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Category Id */
  category_id?: string | null;
  /**
   * Item Type
   * Item type: food, drinks_wine, coffee_desserts
   */
  item_type?: string | null;
  /**
   * Base Price
   * Base price for the item
   */
  base_price?: number | null;
  /** Spice Level */
  spice_level?: number | null;
  /** Is Vegetarian */
  is_vegetarian?: boolean | null;
  /** Is Vegan */
  is_vegan?: boolean | null;
  /** Allergens */
  allergens?: string[] | null;
  /** Item Code */
  item_code?: string | null;
  /** Default Spice Level */
  default_spice_level?: number | null;
  /** Featured */
  featured?: boolean | null;
  /** Active */
  active?: boolean | null;
  /** Display Order */
  display_order?: number | null;
  /** Print To Kitchen */
  print_to_kitchen?: boolean | null;
  /** Dietary Tags */
  dietary_tags?: string[] | null;
  /** Image Url */
  image_url?: string | null;
  /** Image Url Widescreen */
  image_url_widescreen?: string | null;
  /** Image Asset Id */
  image_asset_id?: string | null;
  /** Image Widescreen Asset Id */
  image_widescreen_asset_id?: string | null;
  /** Preferred Aspect Ratio */
  preferred_aspect_ratio?: string | null;
  /** Price Dine In */
  price_dine_in?: number | null;
  /** Price Takeaway */
  price_takeaway?: number | null;
  /** Price Delivery */
  price_delivery?: number | null;
  /** Has Variants */
  has_variants?: boolean | null;
  /** Variants */
  variants?: MenuItemVariant[] | null;
}

/** MenuItemUsage */
export interface MenuItemUsage {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Asset Field */
  asset_field: string;
  /** Asset Type */
  asset_type: string;
}

/**
 * MenuItemVariant
 * Menu item variant model - aligned with frontend validation (menuFormValidation.ts)
 */
export interface MenuItemVariant {
  /** Id */
  id?: string | null;
  /** Protein Type Id */
  protein_type_id?: string | null;
  /**
   * Name
   * Variant name (2-100 characters, letters, numbers, spaces, hyphens, apostrophes only)
   * @minLength 2
   * @maxLength 100
   */
  name: string;
  /**
   * Name Pattern
   * Name pattern: suffix | prefix | infix | custom
   * @default "suffix"
   */
  name_pattern?: string | null;
  /** Description */
  description?: string | null;
  /**
   * Price
   * Price must be between £0.01 and £999.99
   * @min 0.01
   * @max 999.99
   */
  price: number;
  /** Price Dine In */
  price_dine_in?: number | null;
  /** Price Delivery */
  price_delivery?: number | null;
  /**
   * Is Default
   * @default false
   */
  is_default?: boolean;
  /**
   * Display Order
   * @min 0
   * @default 0
   */
  display_order?: number;
  /**
   * Active
   * @default true
   */
  active?: boolean;
  /** Image Url */
  image_url?: string | null;
  /** Image Asset Id */
  image_asset_id?: string | null;
  /**
   * Spice Level
   * Spice level: 0-5
   */
  spice_level?: number | null;
  /** Allergens */
  allergens?: string[] | null;
  /** Allergen Notes */
  allergen_notes?: string | null;
  /**
   * Featured
   * @default false
   */
  featured?: boolean;
  /**
   * Is Vegetarian
   * @default false
   */
  is_vegetarian?: boolean;
  /**
   * Is Vegan
   * @default false
   */
  is_vegan?: boolean;
  /**
   * Is Gluten Free
   * @default false
   */
  is_gluten_free?: boolean;
  /**
   * Is Halal
   * @default false
   */
  is_halal?: boolean;
  /**
   * Is Dairy Free
   * @default false
   */
  is_dairy_free?: boolean;
  /**
   * Is Nut Free
   * @default false
   */
  is_nut_free?: boolean;
}

/** MenuItemVariantData */
export interface MenuItemVariantData {
  /** Id */
  id: string;
  /** Name */
  name?: string | null;
  /** Variant Name */
  variant_name?: string | null;
  /** Price */
  price: number;
  /** Active */
  active: boolean;
}

/** MenuItemWithVariantsView */
export interface MenuItemWithVariantsView {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Has Variants */
  has_variants?: boolean | null;
  /** Featured */
  featured?: boolean | null;
  /** Image Url */
  image_url?: string | null;
  /**
   * Variants
   * @default []
   */
  variants?: VariantInfo[];
}

/** MenuMediaRelationshipResponse */
export interface MenuMediaRelationshipResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Updated Count */
  updated_count?: number | null;
  /** Error */
  error?: string | null;
}

/** MenuResponse */
export interface MenuResponse {
  /** Success */
  success: boolean;
  /** Data */
  data?: Record<string, any> | null;
  /** Performance */
  performance?: Record<string, any> | null;
  /** Error */
  error?: string | null;
}

/** MenuSetupResponse */
export interface MenuSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Tables Created */
  tables_created: string[];
  /** Items Inserted */
  items_inserted: number;
  /** Categories Inserted */
  categories_inserted: number;
  /** Error */
  error?: string | null;
}

/**
 * MenuStatusResponse
 * Response model for menu status checks
 */
export interface MenuStatusResponse {
  /** Success */
  success: boolean;
  /** Corpus Connected */
  corpus_connected: boolean;
  /**
   * Menu Items
   * @default 0
   */
  menu_items?: number;
  /** Status */
  status: string;
  /** Last Check */
  last_check: string;
  /** Error */
  error?: string | null;
  /**
   * Draft Items
   * @default 0
   */
  draft_items?: number | null;
  /**
   * Published Items
   * @default 0
   */
  published_items?: number | null;
  /**
   * Total Active Items
   * @default 0
   */
  total_active_items?: number | null;
}

/** MenuSystemResponse */
export interface MenuSystemResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/** MenuTablesResponse */
export interface MenuTablesResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/** MenuValidationRequest */
export interface MenuValidationRequest {
  /** Item Query */
  item_query: string;
  /** Category Filter */
  category_filter?: string | null;
  /**
   * Max Suggestions
   * @default 3
   */
  max_suggestions?: number;
}

/** MenuValidationResult */
export interface MenuValidationResult {
  /** Item Found */
  item_found: boolean;
  /** Confidence Score */
  confidence_score: number;
  matched_item: MenuItemContext | null;
  /** Suggestions */
  suggestions: MenuItemContext[];
  /** Reason */
  reason: string;
}

/** MergeTabsRequest */
export interface MergeTabsRequest {
  /** Source Tab Id */
  source_tab_id: string;
  /** Target Tab Id */
  target_tab_id: string;
}

/** MergeTabsResponse */
export interface MergeTabsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  target_tab?: CustomerTab | null;
}

/** MigrationAnalysisResult */
export interface MigrationAnalysisResult {
  /** Success */
  success: boolean;
  /** Phase */
  phase: string;
  /** Total Categories */
  total_categories: number;
  /** Categories To Migrate */
  categories_to_migrate: number;
  /** Sections To Create */
  sections_to_create: number;
  /** Migration Plan */
  migration_plan: MigrationPlanItem[];
  /** Warnings */
  warnings: string[];
  /** Pre Migration Snapshot */
  pre_migration_snapshot: CategorySnapshot[];
}

/** MigrationExecutionResult */
export interface MigrationExecutionResult {
  /** Success */
  success: boolean;
  /** Phase */
  phase: string;
  /** Sections Created */
  sections_created: number;
  /** Categories Migrated */
  categories_migrated: number;
  /** Execution Log */
  execution_log: string[];
  /** Post Migration Snapshot */
  post_migration_snapshot: CategorySnapshot[];
}

/** MigrationPlanItem */
export interface MigrationPlanItem {
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name: string;
  /** Current Parent */
  current_parent: string | null;
  /** New Parent */
  new_parent: string;
  /** Action */
  action: string;
  /** Section Name */
  section_name: string;
  /** Child Count */
  child_count: number;
}

/** MigrationReport */
export interface MigrationReport {
  /** Success */
  success: boolean;
  /** Timestamp */
  timestamp: string;
  schema_migration?: AppApisMediaHierarchicalMigrationMigrationResult | null;
  menu_items_backfill?: BackfillResult | null;
  ai_avatars_backfill?: BackfillResult | null;
  /**
   * Total Assets
   * @default 0
   */
  total_assets?: number;
  /**
   * Categorized Assets
   * @default 0
   */
  categorized_assets?: number;
  /**
   * Orphaned Assets
   * @default 0
   */
  orphaned_assets?: number;
  /**
   * Summary
   * @default ""
   */
  summary?: string;
}

/** MigrationRollbackResult */
export interface MigrationRollbackResult {
  /** Success */
  success: boolean;
  /** Phase */
  phase: string;
  /** Categories Restored */
  categories_restored: number;
  /** Sections Removed */
  sections_removed: number;
  /** Message */
  message: string;
}

/** MigrationVerificationResult */
export interface MigrationVerificationResult {
  /** Success */
  success: boolean;
  /** Phase */
  phase: string;
  /** All Sections Exist */
  all_sections_exist: boolean;
  /** All Categories Assigned */
  all_categories_assigned: boolean;
  /** Orphaned Categories */
  orphaned_categories: number;
  /** Section Assignments */
  section_assignments: Record<string, number>;
  /** Issues */
  issues: string[];
}

/** ModelInfo */
export interface ModelInfo {
  /** Name */
  name: string;
  /** Provider */
  provider: string;
  /** Supports Streaming */
  supports_streaming: boolean;
  /** Description */
  description: string;
}

/** MoveCategorySectionRequest */
export interface MoveCategorySectionRequest {
  /** Category Id */
  category_id: string;
  /** New Section Id */
  new_section_id: string;
}

/** MoveCategorySectionResponse */
export interface MoveCategorySectionResponse {
  /** Status */
  status: string;
  /** Message */
  message: string;
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name: string;
  /** Old Section Id */
  old_section_id: string | null;
  /** New Section Id */
  new_section_id: string;
  /** Items Affected */
  items_affected: number;
  /** Subcategories Affected */
  subcategories_affected: number;
}

/** MoveItemsRequest */
export interface MoveItemsRequest {
  /** Source Tab Id */
  source_tab_id: string;
  /** Target Tab Id */
  target_tab_id: string;
  /** Item Indices */
  item_indices: number[];
}

/** MoveItemsResponse */
export interface MoveItemsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  source_tab?: CustomerTab | null;
  target_tab?: CustomerTab | null;
}

/**
 * NamingStandard
 * Model representing a naming standard
 *
 * Following the naming convention: {Resource}[{Context}]
 */
export interface NamingStandard {
  /** Area */
  area: string;
  /** Pattern */
  pattern: string;
  /** Examples */
  examples: Record<string, string[]>;
  /** Description */
  description: string;
}

/** NaturalLanguageSearchRequest */
export interface NaturalLanguageSearchRequest {
  /**
   * Search Query
   * Natural language search query
   * @minLength 1
   */
  search_query: string;
  /**
   * Confidence Threshold
   * Minimum confidence score for matches
   * @default 0.7
   */
  confidence_threshold?: number;
  /**
   * Max Results
   * Maximum number of results to return
   * @default 5
   */
  max_results?: number;
}

/** NaturalLanguageSearchResponse */
export interface NaturalLanguageSearchResponse {
  /** Success */
  success: boolean;
  /** Matches */
  matches: MenuItemMatch[];
  /** Query */
  query: string;
  /** Total Matches */
  total_matches: number;
  /** Message */
  message: string;
}

/** NewCategory */
export interface NewCategory {
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Sort Order */
  sort_order?: number | null;
  /** Print Order */
  print_order?: number | null;
  /**
   * Is Active
   * @default true
   */
  is_active?: boolean | null;
  /** Parent Id */
  parent_id?: string | null;
}

/** NextOrderRequest */
export interface NextOrderRequest {
  /** Parent Category Id */
  parent_category_id?: string | null;
  /** Category Id */
  category_id?: string | null;
}

/** NotificationMarkRequest */
export interface NotificationMarkRequest {
  /** Notification Ids */
  notification_ids: string[];
  /** Action */
  action: string;
}

/** NotificationPreferences */
export interface NotificationPreferences {
  /**
   * Order Confirmation
   * @default true
   */
  order_confirmation?: boolean;
  /**
   * Payment Receipt
   * @default true
   */
  payment_receipt?: boolean;
  /**
   * Order Status Updates
   * @default true
   */
  order_status_updates?: boolean;
  /**
   * Delivery Tracking
   * @default true
   */
  delivery_tracking?: boolean;
  /**
   * Marketing
   * @default false
   */
  marketing?: boolean;
  /**
   * Opt Out All
   * @default false
   */
  opt_out_all?: boolean;
}

/** NotificationRequest */
export interface NotificationRequest {
  /** Order Id */
  order_id: string;
  /** Notification Type */
  notification_type: string;
  /** Title */
  title: string;
  /** Message */
  message: string;
  /**
   * Priority
   * @default "normal"
   */
  priority?: string;
  /**
   * Sound Alert
   * @default false
   */
  sound_alert?: boolean;
  /** User Id */
  user_id?: string | null;
  /** Role Target */
  role_target?: string | null;
  /** Data */
  data?: Record<string, any> | null;
}

/** NotificationResponse */
export interface NotificationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** NotificationStatsResponse */
export interface NotificationStatsResponse {
  /** Total Unread */
  total_unread: number;
  /** Urgent Count */
  urgent_count: number;
  /** Recent Notifications */
  recent_notifications: RealTimeNotification[];
  /** Notifications By Type */
  notifications_by_type: Record<string, number>;
}

/** NotificationsResponse */
export interface NotificationsResponse {
  /** Notifications */
  notifications: Record<string, any>[];
}

/** OnboardingStatusResponse */
export interface OnboardingStatusResponse {
  /** Customer Id */
  customer_id: string;
  /** Tour Completed */
  tour_completed: boolean;
  /** Wizard Completed */
  wizard_completed: boolean;
  /** Email Series Started */
  email_series_started: boolean;
  /** Email Series Step */
  email_series_step: number;
  /** Last Email Sent At */
  last_email_sent_at: string | null;
  /** Created At */
  created_at: string;
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** OnlineOrderResponse */
export interface OnlineOrderResponse {
  /** Success */
  success: boolean;
  /** Orders */
  orders: OrderModel[];
  /** Total Orders */
  total_orders: number;
  /** Page */
  page: number;
  /** Page Size */
  page_size: number;
  /** Total Pages */
  total_pages: number;
  /** Message */
  message?: string | null;
}

/** OpeningHoursValidationRequest */
export interface OpeningHoursValidationRequest {
  /**
   * Delivery Date
   * Date for delivery (YYYY-MM-DD format)
   */
  delivery_date?: string | null;
  /**
   * Delivery Time
   * Time for delivery (HH:MM format)
   */
  delivery_time?: string | null;
  /**
   * Order Type
   * Order type: delivery or collection
   * @default "delivery"
   */
  order_type?: string;
}

/** OptimizationResponse */
export interface OptimizationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/**
 * OptimizedMediaResponse
 * Response after successful image optimization
 */
export interface OptimizedMediaResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Media Id */
  media_id: string;
  /** Variants */
  variants: Record<string, ImageVariant>;
  /** Original Size Mb */
  original_size_mb: number;
  /** Optimized Total Kb */
  optimized_total_kb: number;
  /** Savings Percent */
  savings_percent: number;
  /** Error */
  error?: string | null;
}

/** OrderConfirmationRequest */
export interface OrderConfirmationRequest {
  /** Order Id */
  order_id: string;
  /** Order Number */
  order_number: string;
  /** Customer Email */
  customer_email: string;
  /** Customer Name */
  customer_name: string;
  order_details: OrderDetails;
}

/** OrderDetails */
export interface OrderDetails {
  /** Deliverymethod */
  deliveryMethod: string;
  /** Customaddress */
  customAddress?: Record<string, any> | null;
  /** Timeslot */
  timeSlot: Record<string, string>;
  /** Contactphone */
  contactPhone: string;
  /** Totalamount */
  totalAmount: number;
  /** Items */
  items: AppApisOrderNotificationsOrderItem[];
}

/**
 * OrderHistoryListResponse
 * Response wrapper for order history list
 */
export interface OrderHistoryListResponse {
  /** Success */
  success: boolean;
  /** Orders */
  orders: OrderHistoryResponse[];
  /** Total Count */
  total_count: number;
  /** Message */
  message?: string | null;
}

/**
 * OrderHistoryResponse
 * Transformed order response for CustomerPortal
 */
export interface OrderHistoryResponse {
  /** Id */
  id: string;
  /** Order Number */
  order_number: string;
  /** Status */
  status: string;
  /** Created At */
  created_at: string;
  /** Total Amount */
  total_amount: number;
  /** Order Type */
  order_type: string;
  /** Delivery Address */
  delivery_address?: string | null;
  /** Order Items */
  order_items: OrderItemResponse[];
}

/**
 * OrderItemDetail
 * Full order item detail for reordering
 */
export interface OrderItemDetail {
  /** Id */
  id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Variant Id */
  variant_id?: string | null;
  /** Name */
  name: string;
  /** Quantity */
  quantity: number;
  /** Price */
  price: number;
  /** Variant Name */
  variant_name?: string | null;
  /** Protein Type */
  protein_type?: string | null;
  /** Notes */
  notes?: string | null;
  /** Modifiers */
  modifiers?: Record<string, any>[] | null;
  /** Image Url */
  image_url?: string | null;
}

/**
 * OrderItemResponse
 * Transformed order item matching frontend expectations
 */
export interface OrderItemResponse {
  /** Menu Item Name */
  menu_item_name: string;
  /** Variant Name */
  variant_name?: string | null;
  /** Quantity */
  quantity: number;
  /** Price */
  price: number;
  /**
   * Customizations
   * @default []
   */
  customizations?: string[];
  /** Image Url */
  image_url?: string | null;
}

/**
 * OrderItemsResponse
 * Response model for order items
 */
export interface OrderItemsResponse {
  /** Success */
  success: boolean;
  /** Order Id */
  order_id: string;
  /**
   * Items
   * @default []
   */
  items?: OrderItemDetail[];
  /** Message */
  message?: string | null;
  /** Error */
  error?: string | null;
}

/** OrderListResponse */
export interface OrderListResponse {
  /** Orders */
  orders: OrderModel[];
  /** Total Count */
  total_count: number;
  /** Page */
  page: number;
  /** Page Size */
  page_size: number;
}

/** OrderModel */
export interface OrderModel {
  /**
   * Order Id
   * Unique order ID
   */
  order_id: string;
  /**
   * Order Number
   * Human-friendly order number (e.g., DEL-001, V-123456)
   */
  order_number?: string | null;
  /**
   * Order Type
   * Order type (DINE-IN, DELIVERY, COLLECTION, WAITING)
   */
  order_type: string;
  /**
   * Order Source
   * Source of the order (POS, ONLINE, PHONE)
   */
  order_source: string;
  /** Customer Name */
  customer_name?: string | null;
  /** Customer Phone */
  customer_phone?: string | null;
  /** Customer Email */
  customer_email?: string | null;
  /** Table Number */
  table_number?: number | null;
  /** Guest Count */
  guest_count?: number | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Completed At
   * @format date-time
   */
  completed_at: string;
  /** Items */
  items: AppApisOrderManagementOrderItem[];
  /** Subtotal */
  subtotal: number;
  /** Tax */
  tax: number;
  /**
   * Service Charge
   * @default 0
   */
  service_charge?: number;
  /**
   * Discount
   * @default 0
   */
  discount?: number;
  /**
   * Tip
   * @default 0
   */
  tip?: number;
  /** Total */
  total: number;
  payment: PaymentInfo;
  /**
   * Status
   * Order status (COMPLETED, REFUNDED, PARTIAL_REFUND, PENDING_PAYMENT)
   */
  status: string;
  /** Notes */
  notes?: string | null;
  /** Staff Id */
  staff_id?: string | null;
  /** Pickup Time */
  pickup_time?: string | null;
  /** Pickup Date */
  pickup_date?: string | null;
  /** Delivery Timing Type */
  delivery_timing_type?: "deliver_at" | "not_before" | "deliver_after" | null;
  /** Delivery Timing Value */
  delivery_timing_value?: string | null;
  /** Delivery Timing Date */
  delivery_timing_date?: string | null;
}

/** OrderSampleRequest */
export interface OrderSampleRequest {
  /** Template Type */
  template_type?: string | null;
  /** Order Type */
  order_type?: string | null;
}

/** OrderSampleResponse */
export interface OrderSampleResponse {
  /** Sample Data */
  sample_data: Record<string, any>;
}

/** OrderStatus */
export enum OrderStatus {
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  COLLECTED = "COLLECTED",
  CANCELLED = "CANCELLED",
}

/** OrderStoreResponse */
export interface OrderStoreResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Order Id */
  order_id?: string | null;
}

/** OrderTrackingDetails */
export interface OrderTrackingDetails {
  /** Order Id */
  order_id: string;
  current_status: OrderStatus;
  /** Order Type */
  order_type: string;
  /** Customer Name */
  customer_name?: string | null;
  /** Customer Phone */
  customer_phone?: string | null;
  /** Total Amount */
  total_amount: number;
  /** Created At */
  created_at: string;
  /** Estimated Completion */
  estimated_completion?: string | null;
  /** Status History */
  status_history: OrderTrackingHistory[];
  /** Next Possible Statuses */
  next_possible_statuses: OrderStatus[];
  /** Progress Percentage */
  progress_percentage: number;
}

/** OrderTrackingHistory */
export interface OrderTrackingHistory {
  /** Order Id */
  order_id: string;
  status: OrderStatus;
  /** Timestamp */
  timestamp: string;
  /** Staff Id */
  staff_id?: string | null;
  /** Notes */
  notes?: string | null;
  /** Estimated Time */
  estimated_time?: number | null;
}

/** OrderTrackingResponse */
export interface OrderTrackingResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Order Id */
  order_id: string;
  current_status: OrderStatus;
  /** Estimated Completion */
  estimated_completion?: string | null;
  /** Next Possible Statuses */
  next_possible_statuses: OrderStatus[];
}

/** OrderTrackingUpdate */
export interface OrderTrackingUpdate {
  /** Order Id */
  order_id: string;
  new_status: OrderStatus;
  /** Staff Id */
  staff_id?: string | null;
  /** Notes */
  notes?: string | null;
  /** Estimated Time */
  estimated_time?: number | null;
}

/** OrderValidationRequest */
export interface OrderValidationRequest {
  /** Postcode */
  postcode?: string | null;
  /**
   * Order Value
   * Total order value
   */
  order_value: number;
  /**
   * Order Type
   * Order type: delivery or collection
   */
  order_type: string;
  /** Delivery Date */
  delivery_date?: string | null;
  /** Delivery Time */
  delivery_time?: string | null;
}

/** OrderingResponse */
export interface OrderingResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Data */
  data?: Record<string, any> | null;
}

/**
 * OrphanedAssets
 * Uncategorized assets that need organization.
 */
export interface OrphanedAssets {
  /** Asset Category */
  asset_category: string;
  /** Assets */
  assets: AppApisMediaLibraryHierarchicalMediaAsset[];
  /** Count */
  count: number;
}

/** OrphanedItem */
export interface OrphanedItem {
  /** Item Id */
  item_id: string;
  /** Item Name */
  item_name: string;
  /** Category Id */
  category_id: string;
  /** Is Active */
  is_active: boolean;
  /** Created At */
  created_at?: string | null;
}

/** PINResponse */
export interface PINResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/**
 * POSBundleCategory
 * Minimal category data for POS bundle
 */
export interface POSBundleCategory {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Display Order */
  display_order: number;
  /** Active */
  active: boolean;
  /** Parent Category Id */
  parent_category_id: string | null;
  /** Item Count */
  item_count: number;
}

/**
 * POSBundleMenuItem
 * Essential menu item fields for initial POS rendering
 */
export interface POSBundleMenuItem {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Price */
  price: number;
  /** Category Id */
  category_id: string;
  /** Display Order */
  display_order: number;
  /** Active */
  active: boolean;
  /** Image Url */
  image_url: string | null;
  /** Image Thumb Url */
  image_thumb_url: string | null;
  /** Featured */
  featured: boolean;
  /** Spice Indicators */
  spice_indicators: string | null;
  /** Item Code */
  item_code: string | null;
  /** Has Variants */
  has_variants: boolean;
  /** Variant Count */
  variant_count: number;
  /** Image Priority */
  image_priority: string | null;
  /** Image Width */
  image_width: number | null;
  /** Image Height */
  image_height: number | null;
  /** Preload Order */
  preload_order: number | null;
  /** Estimated Load Time Ms */
  estimated_load_time_ms: number | null;
}

/**
 * POSBundleResponse
 * Lightweight response for fast POS startup
 */
export interface POSBundleResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Data */
  data: Record<string, any>;
  /** Categories */
  categories: POSBundleCategory[];
  /** Items */
  items: POSBundleMenuItem[];
  /** Total Categories */
  total_categories: number;
  /** Total Items */
  total_items: number;
  /** Bundle Size Kb */
  bundle_size_kb: number;
}

/** POSDeliveryChargeSettings */
export interface POSDeliveryChargeSettings {
  /**
   * Enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Amount
   * Delivery charge amount
   * @min 0
   * @default 3
   */
  amount?: number;
  /**
   * Print On Receipt
   * @default true
   */
  print_on_receipt?: boolean;
}

/** POSDeliverySettings */
export interface POSDeliverySettings {
  /**
   * Radius Miles
   * Delivery radius in miles
   * @min 0
   * @default 6
   */
  radius_miles?: number;
  /**
   * Minimum Order Value
   * Minimum order value for delivery
   * @min 0
   * @default 15
   */
  minimum_order_value?: number;
  /**
   * Allowed Postcodes
   * Allowed postcodes for delivery
   */
  allowed_postcodes?: string[];
}

/** POSLoginRequest */
export interface POSLoginRequest {
  /** Email */
  email: string;
  /** Password */
  password: string;
  /** Device Fingerprint */
  device_fingerprint?: string | null;
  /**
   * Trust Device
   * @default false
   */
  trust_device?: boolean;
  /** Device Label */
  device_label?: string | null;
}

/** POSLoginResponse */
export interface POSLoginResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Has Pos Access */
  has_pos_access: boolean;
  /** User Id */
  user_id?: string | null;
  /** Email */
  email?: string | null;
  /** Role */
  role?: string | null;
  /** Session */
  session?: Record<string, any> | null;
}

/** POSOrderRequest */
export interface POSOrderRequest {
  /** Order Id */
  order_id: string;
  /** Customer Name */
  customer_name?: string | null;
  /** Customer Phone */
  customer_phone?: string | null;
  /** Customer Email */
  customer_email?: string | null;
  /**
   * Order Type
   * @default "dine_in"
   */
  order_type?: string;
  /** Table Number */
  table_number?: string | null;
  /** Guest Count */
  guest_count?: number | null;
  /** Subtotal */
  subtotal: number;
  /**
   * Tax Amount
   * @default 0
   */
  tax_amount?: number;
  /**
   * Service Charge
   * @default 0
   */
  service_charge?: number;
  /**
   * Discount Amount
   * @default 0
   */
  discount_amount?: number;
  /**
   * Tip Amount
   * @default 0
   */
  tip_amount?: number;
  /** Total Amount */
  total_amount: number;
  /** Payment Method */
  payment_method?: string | null;
  /**
   * Payment Status
   * @default "pending"
   */
  payment_status?: string;
  /** Notes */
  notes?: string | null;
  /** Staff Id */
  staff_id?: string | null;
  /**
   * Items
   * @default []
   */
  items?: Record<string, any>[];
  /** Timing Type */
  timing_type?: string | null;
  /** Timing Value */
  timing_value?: string | null;
  /** Timing Date */
  timing_date?: string | null;
}

/** POSOrderResponse */
export interface POSOrderResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Order Id */
  order_id: string;
  /** Order Number */
  order_number?: string | null;
  /** Database Order Id */
  database_order_id?: string | null;
  /** Error */
  error?: string | null;
}

/** POSServiceChargeSettings */
export interface POSServiceChargeSettings {
  /**
   * Enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Percentage
   * Service charge percentage (0-100)
   * @min 0
   * @max 100
   * @default 10
   */
  percentage?: number;
  /**
   * Print On Receipt
   * @default true
   */
  print_on_receipt?: boolean;
}

/** POSSettings */
export interface POSSettings {
  /** @default {"enabled":true,"percentage":10,"print_on_receipt":true} */
  service_charge?: POSServiceChargeSettings;
  /** @default {"enabled":true,"amount":3,"print_on_receipt":true} */
  delivery_charge?: POSDeliveryChargeSettings;
  /** @default {"radius_miles":6,"minimum_order_value":15,"allowed_postcodes":["RH20","BN5","RH13","BN6","RH14"]} */
  delivery?: POSDeliverySettings;
  /**
   * Variant Carousel Enabled
   * Enable variant image carousel in POS menu items
   * @default true
   */
  variant_carousel_enabled?: boolean;
}

/**
 * PackageInfo
 * Package metadata response.
 */
export interface PackageInfo {
  /** Version */
  version: string;
  /** Generated At */
  generated_at: string;
  /** Files Count */
  files_count: number;
  /** Description */
  description: string;
}

/** PasswordUpdateRequest */
export interface PasswordUpdateRequest {
  /** Password */
  password: string;
}

/** PasswordUpdateResponse */
export interface PasswordUpdateResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** PasswordVerificationRequest */
export interface PasswordVerificationRequest {
  /** Password */
  password: string;
}

/** PasswordVerificationResponse */
export interface PasswordVerificationResponse {
  /** Authenticated */
  authenticated: boolean;
  /**
   * Is Default Password
   * @default false
   */
  is_default_password?: boolean | null;
  /** Message */
  message?: string | null;
}

/** PaymentInfo */
export interface PaymentInfo {
  /**
   * Method
   * Payment method (CASH, CARD, ONLINE, SPLIT)
   */
  method: string;
  /**
   * Amount
   * Payment amount
   */
  amount: number;
  /** Cash Received */
  cash_received?: number | null;
  /** Change Given */
  change_given?: number | null;
  /** Tip */
  tip?: number | null;
  /** Transaction Id */
  transaction_id?: string | null;
  /** Split Payments */
  split_payments?: Record<string, any>[] | null;
  /** Staff Id */
  staff_id?: string | null;
  /** Timestamp */
  timestamp?: string | null;
}

/** PaymentLinkStatusRequest */
export interface PaymentLinkStatusRequest {
  /** Payment Link Id */
  payment_link_id: string;
}

/** PaymentLinkStatusResponse */
export interface PaymentLinkStatusResponse {
  /** Success */
  success: boolean;
  /** Status */
  status: string;
  /** Payment Intent Id */
  payment_intent_id?: string | null;
  /** Paid At */
  paid_at?: string | null;
  /** Amount Paid */
  amount_paid?: number | null;
}

/** PerformanceReport */
export interface PerformanceReport {
  /** Success */
  success: boolean;
  /** Timestamp */
  timestamp: string;
  /** Overall Performance */
  overall_performance: string;
  /** Endpoint Stats */
  endpoint_stats: PerformanceStats[];
  /** Cache Hit Rate */
  cache_hit_rate: number;
  /** Alerts */
  alerts: string[];
  /** Recommendations */
  recommendations: string[];
}

/** PerformanceStats */
export interface PerformanceStats {
  /** Endpoint */
  endpoint: string;
  /** Avg Response Time */
  avg_response_time: number;
  /** Target Time */
  target_time: number;
  /** Performance Status */
  performance_status: string;
  /** Request Count */
  request_count: number;
  /** Success Rate */
  success_rate: number;
}

/** PersonalizationSettingsRequest */
export interface PersonalizationSettingsRequest {
  /** Customer Id */
  customer_id: string;
  /** Personalization Enabled */
  personalization_enabled: boolean;
}

/** PersonalizationSettingsResponse */
export interface PersonalizationSettingsResponse {
  /** Customer Id */
  customer_id: string;
  /** Personalization Enabled */
  personalization_enabled: boolean;
  /**
   * Message
   * @default "Settings retrieved successfully"
   */
  message?: string;
}

/** PosTableConfig */
export interface PosTableConfig {
  /**
   * Total Tables
   * Total number of tables
   * @exclusiveMin 0
   */
  total_tables: number;
  /**
   * Max Seats Per Table
   * Maximum seats per table
   */
  max_seats_per_table?: number | null;
}

/** PosTableResponse */
export interface PosTableResponse {
  /** Table Number */
  table_number: number;
  /** Capacity */
  capacity: number;
  /** Status */
  status: string;
  /** Last Updated */
  last_updated: string;
  /** Is Linked Table */
  is_linked_table: boolean;
  /** Is Linked Primary */
  is_linked_primary: boolean;
  /** Guest Count */
  guest_count?: number | null;
}

/** PreviewGenerationRequest */
export interface PreviewGenerationRequest {
  /** Template Id */
  template_id: string;
  /** Design Data */
  design_data: Record<string, any>;
}

/** PreviewPromptRequest */
export interface PreviewPromptRequest {
  /** Agent Config */
  agent_config: Record<string, any>;
  /** Channel */
  channel: "chat" | "voice";
  /** Menu Snapshot */
  menu_snapshot?: Record<string, any> | null;
}

/** PreviewPromptResponse */
export interface PreviewPromptResponse {
  /** Prompt */
  prompt: string;
  /** Agent Name */
  agent_name: string;
  /** Nationality */
  nationality: string;
  /** Channel */
  channel: string;
  /** Generated At */
  generated_at: string;
  /**
   * Is Preview
   * @default true
   */
  is_preview?: boolean;
}

/** PreviewResponse */
export interface PreviewResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Foh Preview Url */
  foh_preview_url?: string | null;
  /** Kitchen Preview Url */
  kitchen_preview_url?: string | null;
}

/** PriceBreakdownRequest */
export interface PriceBreakdownRequest {
  /** Variant Id */
  variant_id: string;
  /** Price Takeaway */
  price_takeaway: number;
  /** Price Delivery */
  price_delivery?: number | null;
  /** Price Dine In */
  price_dine_in?: number | null;
}

/** PricingResponse */
export interface PricingResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Data */
  data?: Record<string, any> | null;
}

/**
 * PrintJob
 * Print job model for tracking print requests
 */
export interface PrintJob {
  /** Id */
  id?: string;
  /**
   * Order Id
   * Order ID to print
   */
  order_id: string;
  /**
   * Template Id
   * Template ID used for printing
   */
  template_id: string;
  /**
   * Template Type
   * Template type: customer_receipt, kitchen_copy, order_summary
   */
  template_type: string;
  /**
   * Order Data
   * Order data for template variables
   */
  order_data: Record<string, any>;
  /**
   * Printer Id
   * Specific printer ID to use
   */
  printer_id?: string | null;
  /**
   * Priority
   * Print priority: low, normal, high, urgent
   * @default "normal"
   */
  priority?: string;
  /**
   * Copies
   * Number of copies to print
   * @default 1
   */
  copies?: number;
  /**
   * Status
   * Print status: pending, processing, completed, failed
   * @default "pending"
   */
  status?: string;
  /**
   * Error Message
   * Error message if printing failed
   */
  error_message?: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at?: string;
  /**
   * Processed At
   * When the job was processed
   */
  processed_at?: string | null;
  /**
   * Completed At
   * When the job was completed
   */
  completed_at?: string | null;
  /**
   * Created By
   * User ID who created the print job
   */
  created_by?: string | null;
  /**
   * Processed By
   * Helper app/printer that processed the job
   */
  processed_by?: string | null;
}

/**
 * PrintJobUpdateRequest
 * Request to update print job status
 */
export interface PrintJobUpdateRequest {
  /**
   * Status
   * New status: pending, processing, completed, failed
   */
  status: string;
  /**
   * Error Message
   * Error message if failed
   */
  error_message?: string | null;
  /**
   * Processed By
   * Helper app/printer processing the job
   */
  processed_by?: string | null;
}

/** PrintTemplate */
export interface PrintTemplate {
  /** Template Id */
  template_id: string;
  /** Name */
  name: string;
  /** Type */
  type: string;
  /** Content Template */
  content_template: string;
  /** Variables */
  variables: string[];
  /** Printer Settings */
  printer_settings?: Record<string, any> | null;
}

/**
 * PrintTemplateRequest
 * Rich template print request model
 */
export interface PrintTemplateRequest {
  /** Template Data */
  template_data: Record<string, any>;
  /**
   * Items
   * @default []
   */
  items?: Record<string, any>[] | null;
}

/** Printer */
export interface Printer {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Type */
  type: string;
  /** Connected */
  connected: boolean;
  /** Model */
  model?: string | null;
  /** Ip */
  ip?: string | null;
  /** Port */
  port?: number | null;
  /** Settings */
  settings?: Record<string, any> | null;
}

/**
 * PrinterReleaseRequest
 * Request model for creating a printer service release.
 */
export interface PrinterReleaseRequest {
  /** Version */
  version: string;
  /** Release Notes */
  release_notes: string;
  /**
   * Prerelease
   * @default false
   */
  prerelease?: boolean;
}

/**
 * PrinterReleaseResponse
 * Response model for printer release operations.
 */
export interface PrinterReleaseResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Release Url */
  release_url?: string | null;
  /** Download Url */
  download_url?: string | null;
  /** Version */
  version?: string | null;
}

/** PrinterStatusResponse */
export interface PrinterStatusResponse {
  /** Success */
  success: boolean;
  /** Helper App Running */
  helper_app_running: boolean;
  /** Printers */
  printers: Printer[];
  /** Last Check */
  last_check: string;
  /** System Status */
  system_status: Record<string, any>;
}

/**
 * ProcessQueueRequest
 * Request to process the print queue
 */
export interface ProcessQueueRequest {
  /**
   * Max Jobs
   * @default 10
   */
  max_jobs?: number;
  /**
   * Force Retry Failed
   * @default false
   */
  force_retry_failed?: boolean;
}

/**
 * ProcessQueueResponse
 * Response from queue processing
 */
export interface ProcessQueueResponse {
  /** Processed Jobs */
  processed_jobs: number;
  /** Successful Jobs */
  successful_jobs: number;
  /** Failed Jobs */
  failed_jobs: number;
  /** Skipped Jobs */
  skipped_jobs: number;
  /** Details */
  details: Record<string, any>[];
}

/** ProfileImageResponse */
export interface ProfileImageResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Image Url */
  image_url?: string | null;
  /** Error */
  error?: string | null;
}

/** PromoCodeInfo */
export interface PromoCodeInfo {
  /** Code */
  code: string;
  /** Name */
  name: string;
  /** Discount Type */
  discount_type: string;
  /** Discount Value */
  discount_value: number;
  /** Minimum Order */
  minimum_order: number;
  /** Maximum Discount */
  maximum_discount: number | null;
  /** Valid From */
  valid_from: string;
  /** Valid To */
  valid_to: string;
  /** Usage Limit */
  usage_limit: number | null;
  /** Uses Count */
  uses_count: number;
  /** Applicable Order Types */
  applicable_order_types: string[];
  /** Active */
  active: boolean;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** PromoCodeRequest */
export interface PromoCodeRequest {
  /**
   * Code
   * Promo code to validate
   */
  code: string;
  /**
   * Order Total
   * Order subtotal before discount
   */
  order_total: number;
  /**
   * Order Type
   * Order type: DINE_IN, COLLECTION, DELIVERY, WAITING
   */
  order_type: string;
  /** Customer Email */
  customer_email?: string | null;
  /** Customer Phone */
  customer_phone?: string | null;
}

/** PromoCodeResponse */
export interface PromoCodeResponse {
  /** Success */
  success: boolean;
  /** Valid */
  valid: boolean;
  /** Code */
  code: string;
  /** Discount Type */
  discount_type?: string | null;
  /** Discount Value */
  discount_value?: number | null;
  /** Discount Amount */
  discount_amount?: number | null;
  /** Minimum Order */
  minimum_order?: number | null;
  /** Maximum Discount */
  maximum_discount?: number | null;
  /** Message */
  message: string;
  /** Expires At */
  expires_at?: string | null;
  /** Usage Limit */
  usage_limit?: number | null;
  /** Uses Remaining */
  uses_remaining?: number | null;
}

/** ProteinType */
export interface ProteinType {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** ProteinTypeCreate */
export interface ProteinTypeCreate {
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
}

/** ProteinTypeResponse */
export interface ProteinTypeResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  protein_type?: ProteinType | null;
}

/** ProteinTypeUpdate */
export interface ProteinTypeUpdate {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
}

/** ProteinTypesListResponse */
export interface ProteinTypesListResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Protein Types
   * @default []
   */
  protein_types?: ProteinType[];
}

/** PublicRestaurantInfo */
export interface PublicRestaurantInfo {
  /** Name */
  name: string;
  /** Address */
  address: string;
  /** Phone Number */
  phone_number: string;
  /** Email */
  email: string;
  /** Website */
  website: string;
  /** Opening Hours */
  opening_hours: Record<string, string>;
  /** Cuisine Type */
  cuisine_type: string;
  /** Description */
  description: string;
  /** Last Updated */
  last_updated: string;
}

/**
 * PublishCorpusRequest
 * Request to publish a new corpus version
 */
export interface PublishCorpusRequest {
  /** Corpus Type */
  corpus_type: "menu" | "restaurant_info" | "policies" | "faq";
  /** Structured Data */
  structured_data: Record<string, any>;
  /** Formatted Text */
  formatted_text: string;
  /** Metadata about the corpus content */
  metadata: CorpusMetadata;
  /**
   * Published By
   * @default "system"
   */
  published_by?: string;
}

/**
 * PublishMenuResponse
 * Response model for menu publish operations
 */
export interface PublishMenuResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Menu Items
   * @default 0
   */
  menu_items?: number;
  /**
   * Corpus Updated
   * @default false
   */
  corpus_updated?: boolean;
  /** Published At */
  published_at: string;
}

/**
 * PublishWizardConfigRequest
 * Request model for publishing wizard configuration
 */
export interface PublishWizardConfigRequest {
  /** Agent Name */
  agent_name: string;
  /** Agent Role */
  agent_role: string;
  /** Nationality */
  nationality: string;
  /** Personality */
  personality?: string | null;
  /** Agent Avatar Url */
  agent_avatar_url?: string | null;
  /** Chat System Prompt */
  chat_system_prompt: string;
  /** Chat Custom Instructions */
  chat_custom_instructions?: string | null;
  /** Voice System Prompt */
  voice_system_prompt: string;
  /** Voice First Response */
  voice_first_response: string;
  /** Voice Model */
  voice_model: string;
}

/**
 * QueueStatsResponse
 * Print queue statistics
 */
export interface QueueStatsResponse {
  /** Total Jobs */
  total_jobs: number;
  /** Queued Jobs */
  queued_jobs: number;
  /** Processing Jobs */
  processing_jobs: number;
  /** Completed Jobs */
  completed_jobs: number;
  /** Failed Jobs */
  failed_jobs: number;
  /** Oldest Queued Job */
  oldest_queued_job?: string | null;
  /** Printer Online */
  printer_online: boolean;
}

/** RLSFixResponse */
export interface RLSFixResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Policies Created */
  policies_created: string[];
}

/** RLSPolicyResponse */
export interface RLSPolicyResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/** RealMenuData */
export interface RealMenuData {
  /** Categories */
  categories: MenuCategoryData[];
  /** Items */
  items: AppApisMenuDataRealMenuItemData[];
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default "Real menu data loaded successfully"
   */
  message?: string;
  /** Timestamp */
  timestamp: string;
  /** Total Categories */
  total_categories: number;
  /** Total Items */
  total_items: number;
  /**
   * Is Real
   * @default true
   */
  is_real?: boolean;
}

/** RealMenuDataEnhanced */
export interface RealMenuDataEnhanced {
  /** Categories */
  categories: MenuCategoryData[];
  /** Items */
  items: AppApisMenuDataRealEnhancedMenuItemData[];
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default "Enhanced real menu data loaded successfully"
   */
  message?: string;
  /** Timestamp */
  timestamp: string;
  /** Total Categories */
  total_categories: number;
  /** Total Items */
  total_items: number;
  /** Total Variants */
  total_variants: number;
  /**
   * Is Real
   * @default true
   */
  is_real?: boolean;
}

/** RealTimeNotification */
export interface RealTimeNotification {
  /** Notification Id */
  notification_id: string;
  /** Order Id */
  order_id: string;
  /** Notification Type */
  notification_type: string;
  /** Title */
  title: string;
  /** Message */
  message: string;
  /**
   * Priority
   * @default "normal"
   */
  priority?: string;
  /**
   * Sound Alert
   * @default false
   */
  sound_alert?: boolean;
  /** User Id */
  user_id?: string | null;
  /** Role Target */
  role_target?: string | null;
  /** Created At */
  created_at: string;
  /** Read At */
  read_at?: string | null;
  /** Acknowledged At */
  acknowledged_at?: string | null;
  /** Data */
  data?: Record<string, any> | null;
}

/** RealTimeSyncResponse */
export interface RealTimeSyncResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Synced Changes
   * @default 0
   */
  synced_changes?: number;
  /**
   * Corpus Updated
   * @default false
   */
  corpus_updated?: boolean;
  /** Next Sync Time */
  next_sync_time?: string | null;
}

/** ReceiptAddress */
export interface ReceiptAddress {
  /** Line1 */
  line1: string;
  /** Line2 */
  line2?: string | null;
  /** City */
  city: string;
  /** Postal Code */
  postal_code: string;
  /**
   * Country
   * @default "GB"
   */
  country?: string;
}

/** ReceiptCustomer */
export interface ReceiptCustomer {
  /** Name */
  name?: string | null;
  /** Email */
  email?: string | null;
  /** Phone */
  phone?: string | null;
}

/** ReceiptData */
export interface ReceiptData {
  /** Order Id */
  order_id: string;
  /** Order Number */
  order_number: string;
  /** Table Number */
  table_number?: string | null;
  /** Order Type */
  order_type: string;
  /** Items */
  items: AppApisSystemPrinterOrderItem[];
  /** Subtotal */
  subtotal: number;
  /** Tax */
  tax: number;
  /** Total */
  total: number;
  /** Payment Method */
  payment_method?: string | null;
  /** Customer Name */
  customer_name?: string | null;
  /** Customer Phone */
  customer_phone?: string | null;
  /** Special Instructions */
  special_instructions?: string | null;
  /** Timestamp */
  timestamp?: string | null;
}

/** ReceiptItem */
export interface ReceiptItem {
  /** Item Name */
  item_name: string;
  /** Item Category */
  item_category?: string | null;
  /** Variant Name */
  variant_name?: string | null;
  /** Unit Price */
  unit_price: number;
  /** Quantity */
  quantity: number;
  /** Line Total */
  line_total: number;
  /** Customizations */
  customizations?: Record<string, any> | null;
  /** Special Instructions */
  special_instructions?: string | null;
}

/** ReceiptPrintRequest */
export interface ReceiptPrintRequest {
  /** Order Id */
  order_id: string;
  /** Total */
  total: number;
  /** Items */
  items: Record<string, any>[];
  /** Customer Data */
  customer_data?: Record<string, any> | null;
  /**
   * Payment Method
   * @default "CARD"
   */
  payment_method?: string;
  /** Transaction Id */
  transaction_id?: string | null;
  /** Template Id */
  template_id?: string | null;
}

/** ReceiptResponse */
export interface ReceiptResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Receipt Id */
  receipt_id?: string | null;
  /**
   * Pdf Generated
   * @default false
   */
  pdf_generated?: boolean;
  /**
   * Email Sent
   * @default false
   */
  email_sent?: boolean;
  /** Error */
  error?: string | null;
}

/**
 * RecentOrder
 * Recent order model
 */
export interface RecentOrder {
  /** Order Id */
  order_id: string;
  /** Order Date */
  order_date: string;
  /** Total Amount */
  total_amount?: number | null;
  /** Order Type */
  order_type: string;
  /** Status */
  status?: string | null;
  /** Items Summary */
  items_summary?: string | null;
  /** Source Table */
  source_table?: string | null;
}

/**
 * RecommendationRequest
 * Request for AI-powered recommendations
 */
export interface RecommendationRequest {
  /** Cart Items */
  cart_items: CartItemInput[];
  /** Customer Id */
  customer_id?: string | null;
  /**
   * Order Mode
   * @default "collection"
   */
  order_mode?: string;
  /**
   * Limit
   * @default 3
   */
  limit?: number;
}

/**
 * RecommendationsResponse
 * Response with AI recommendations
 */
export interface RecommendationsResponse {
  /** Success */
  success: boolean;
  /** Recommendations */
  recommendations: AppApisAiRecommendationsRecommendationItem[];
  /** Personalized */
  personalized: boolean;
  /** Cached */
  cached: boolean;
  /** Processing Time Ms */
  processing_time_ms: number;
  /**
   * Model Used
   * @default "gemini-2.5-flash"
   */
  model_used?: string;
}

/** ReconciliationSummary */
export interface ReconciliationSummary {
  /** Date Range */
  date_range: Record<string, string>;
  /** Total Revenue */
  total_revenue: number;
  /** Payment Breakdown */
  payment_breakdown: Record<string, number>;
  /** Refunds Total */
  refunds_total: number;
  /** Adjustments Total */
  adjustments_total: number;
  /** Net Revenue */
  net_revenue: number;
  /** Order Channel Breakdown */
  order_channel_breakdown: Record<string, Record<string, number>>;
}

/**
 * ReleaseAsset
 * GitHub release asset information.
 */
export interface ReleaseAsset {
  /** Name */
  name: string;
  /** Size */
  size: number;
  /** Download Count */
  download_count: number;
  /** Browser Download Url */
  browser_download_url: string;
  /** Created At */
  created_at: string;
}

/**
 * ReleaseInfo
 * GitHub release information.
 */
export interface ReleaseInfo {
  /** Tag Name */
  tag_name: string;
  /** Name */
  name: string;
  /** Body */
  body: string | null;
  /** Published At */
  published_at: string;
  /** Html Url */
  html_url: string;
  /** Assets */
  assets: ReleaseAsset[];
}

/** ReleaseResponse */
export interface ReleaseResponse {
  /** Id */
  id: number;
  /** Tag Name */
  tag_name: string;
  /** Name */
  name: string;
  /** Body */
  body: string;
  /** Draft */
  draft: boolean;
  /** Prerelease */
  prerelease: boolean;
  /** Created At */
  created_at: string;
  /** Published At */
  published_at: string | null;
  /** Html Url */
  html_url: string;
  /** Upload Url */
  upload_url: string;
  /** Assets */
  assets: Record<string, any>[];
}

/** RemoveFavoriteRequest */
export interface RemoveFavoriteRequest {
  /** Menu Item Id */
  menu_item_id: string;
  /** Variant Id */
  variant_id?: string | null;
  /** Customer Id */
  customer_id: string;
}

/** RemoveFromListRequest */
export interface RemoveFromListRequest {
  /** List Id */
  list_id: string;
  /** Favorite Id */
  favorite_id: string;
  /** Customer Id */
  customer_id: string;
}

/**
 * RemoveItemRequest
 * Request to remove item from cart
 */
export interface RemoveItemRequest {
  /**
   * Item Name
   * Name of item to remove (fuzzy match)
   */
  item_name?: string | null;
  /**
   * Cart Item Id
   * Specific cart item ID
   */
  cart_item_id?: string | null;
  /**
   * Session Id
   * Session ID
   */
  session_id: string;
  /**
   * Cart Context
   * Current cart state
   */
  cart_context?: CartItemData[] | null;
}

/**
 * RemoveItemResponse
 * Response from remove item operation
 */
export interface RemoveItemResponse {
  /**
   * Action
   * @default "remove_item"
   */
  action?: string;
  /** Success */
  success: boolean;
  /** Cart Item Id */
  cart_item_id?: string | null;
  /** Item Name */
  item_name?: string | null;
  /** Message */
  message: string;
}

/** RenameListRequest */
export interface RenameListRequest {
  /** List Id */
  list_id: string;
  /** New Name */
  new_name: string;
  /** Customer Id */
  customer_id: string;
}

/** ReorderRequest */
export interface ReorderRequest {
  /** Category Ids */
  category_ids: string[];
  /** Parent Category Id */
  parent_category_id?: string | null;
}

/** ReplaceAssetRequest */
export interface ReplaceAssetRequest {
  /** Old Asset Id */
  old_asset_id: string;
  /** New Asset Id */
  new_asset_id: string;
  /** Menu Item Ids */
  menu_item_ids?: string[] | null;
}

/** ReplaceAssetResponse */
export interface ReplaceAssetResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Items Updated */
  items_updated: number;
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/** RepositoryInfoResponse */
export interface RepositoryInfoResponse {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Full Name */
  full_name: string;
  /** Html Url */
  html_url: string;
  /** Clone Url */
  clone_url: string;
  /** Ssh Url */
  ssh_url: string;
  /** Description */
  description: string | null;
  /** Homepage */
  homepage: string | null;
  /** Topics */
  topics: string[];
  /** Private */
  private: boolean;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
  /** Pushed At */
  pushed_at: string | null;
  /** Size */
  size: number;
  /** Stargazers Count */
  stargazers_count: number;
  /** Watchers Count */
  watchers_count: number;
  /** Forks Count */
  forks_count: number;
  /** Default Branch */
  default_branch: string;
}

/** ResetCodeSystemResponse */
export interface ResetCodeSystemResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Items Reset */
  items_reset: number;
  /** Variants Reset */
  variants_reset: number;
  /** Categories Updated */
  categories_updated: number;
}

/** ResetMenuStructureResponse */
export interface ResetMenuStructureResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Categories Created */
  categories_created: number;
  /** Categories Updated */
  categories_updated: number;
  /** Errors */
  errors?: string[] | null;
}

/** RestaurantConfig */
export interface RestaurantConfig {
  /** Name */
  name: string;
  /** Address */
  address: string;
  /** Postcode */
  postcode: string;
  /** Phone */
  phone: string;
  /** Email */
  email?: string | null;
  /** Delivery Fee */
  delivery_fee: number;
  /** Delivery Free Over */
  delivery_free_over: number;
  /** Delivery Min Order */
  delivery_min_order: number;
  /** Estimated Delivery Time */
  estimated_delivery_time: string;
  /** Estimated Collection Time */
  estimated_collection_time: string;
  /** Delivery Enabled */
  delivery_enabled: boolean;
}

/** RestaurantConfigResponse */
export interface RestaurantConfigResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  config?: RestaurantConfig | null;
}

/** RestaurantSettings */
export interface RestaurantSettings {
  /** Name */
  name?: string | null;
  /** Cuisine */
  cuisine?: string | null;
  /** Logo Url */
  logo_url?: string | null;
  /** Theme */
  theme?: Record<string, any> | null;
  /** Banner Url */
  banner_url?: string | null;
}

/** RevokeDeviceResponse */
export interface RevokeDeviceResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** SMSPaymentLinkRequest */
export interface SMSPaymentLinkRequest {
  /** Order Id */
  order_id: string;
  /** Order Number */
  order_number: string;
  /** Customer Phone */
  customer_phone: string;
  /** Customer Name */
  customer_name?: string | null;
  /** Order Total */
  order_total: number;
  /** Delivery Address */
  delivery_address?: string | null;
  /** Estimated Delivery Time */
  estimated_delivery_time?: string | null;
}

/** SMSPaymentLinkResponse */
export interface SMSPaymentLinkResponse {
  /** Success */
  success: boolean;
  /** Payment Link Id */
  payment_link_id?: string | null;
  /** Payment Url */
  payment_url?: string | null;
  /**
   * Sms Sent
   * @default false
   */
  sms_sent?: boolean;
  /** Message */
  message?: string | null;
  /** Expires At */
  expires_at?: string | null;
}

/** SQLExecuteRequest */
export interface SQLExecuteRequest {
  /** Sql */
  sql: string;
  /**
   * Description
   * @default "SQL execution"
   */
  description?: string;
}

/** SQLExecuteResponse */
export interface SQLExecuteResponse {
  /** Success */
  success: boolean;
  /** Result */
  result?: any[] | Record<string, any> | null;
  /** Error */
  error?: string | null;
  /** Rows Affected */
  rows_affected?: number | null;
}

/** SQLQuery */
export interface SQLQuery {
  /** Query */
  query: string;
}

/** SQLQueryResponse */
export interface SQLQueryResponse {
  /** Sql */
  sql: string;
  /** Data */
  data: any[];
  /** Success */
  success: boolean;
  /** Error */
  error?: string | null;
}

/** SampleDataRequest */
export interface SampleDataRequest {
  /** Template Type */
  template_type?: string | null;
  /** Order Type */
  order_type?: string | null;
}

/** SampleDataResponse */
export interface SampleDataResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Sample Data */
  sample_data?: Record<string, any> | null;
}

/** SavePOSSettingsRequest */
export interface SavePOSSettingsRequest {
  settings: POSSettings;
}

/** SavePOSSettingsResponse */
export interface SavePOSSettingsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** SaveSettingsRequest */
export interface SaveSettingsRequest {
  settings?: RestaurantSettings | null;
  /** Profile */
  profile?: Record<string, any> | null;
  /** Operation Hours */
  operation_hours?: Record<string, any> | null;
  /** Opening Hours */
  opening_hours?: Record<string, any>[] | null;
  /** Delivery */
  delivery?: Record<string, any> | null;
}

/** SaveSettingsResponse */
export interface SaveSettingsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** SchemaRefreshResponse */
export interface SchemaRefreshResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** SchemaSetupResponse */
export interface SchemaSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: string | null;
  /**
   * Affected Customers
   * @default 0
   */
  affected_customers?: number;
}

/** SchemaStatusResponse */
export interface SchemaStatusResponse {
  /** Schema Ready */
  schema_ready: boolean;
  /** Has Pin Set */
  has_pin_set: boolean;
  /** Message */
  message: string;
}

/**
 * SearchMenuRequest
 * Request to search menu items
 */
export interface SearchMenuRequest {
  /** Query */
  query?: string | null;
  /** Category */
  category?: string | null;
}

/**
 * SearchMenuResponse
 * Search results for menu items
 */
export interface SearchMenuResponse {
  /** Success */
  success: boolean;
  /** Items */
  items: MenuItemResult[];
  /** Total Count */
  total_count: number;
  /** Categories Available */
  categories_available: string[];
}

/** SectionChangeImpactRequest */
export interface SectionChangeImpactRequest {
  /** Category Id */
  category_id: string;
  /** New Section Id */
  new_section_id: string;
}

/** SectionChangeImpactResponse */
export interface SectionChangeImpactResponse {
  /** Status */
  status: string;
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name: string;
  /** Current Section Id */
  current_section_id: string | null;
  /** Current Section Name */
  current_section_name: string | null;
  /** New Section Id */
  new_section_id: string;
  /** New Section Name */
  new_section_name: string;
  /** Items Affected */
  items_affected: number;
  /** Subcategories Affected */
  subcategories_affected: number;
  /** Message */
  message: string;
}

/** SectionCreationResult */
export interface SectionCreationResult {
  /** Success */
  success: boolean;
  /** Sections Created */
  sections_created: Record<string, any>[];
  /** Categories Updated */
  categories_updated: number;
  /** Message */
  message: string;
}

/**
 * SectionGroup
 * Section with nested categories.
 */
export interface SectionGroup {
  /** Section Id */
  section_id: string;
  /** Section Name */
  section_name: string;
  /** Categories */
  categories: CategoryGroup[];
  /** Total Assets */
  total_assets: number;
}

/** SectionStats */
export interface SectionStats {
  /** Section Id */
  section_id: string | null;
  /** Section Name */
  section_name: string;
  /** Category Count */
  category_count: number;
  /** Item Count */
  item_count: number;
}

/** SendVerificationEmailRequest */
export interface SendVerificationEmailRequest {
  /** User Id */
  user_id: string;
}

/** SendVerificationEmailResponse */
export interface SendVerificationEmailResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Error */
  error?: string | null;
}

/** ServiceChargeConfig */
export interface ServiceChargeConfig {
  /**
   * Dine In Percentage
   * Service charge % for dine-in
   * @default 10
   */
  dine_in_percentage?: number;
  /**
   * Collection Percentage
   * Service charge % for collection
   * @default 0
   */
  collection_percentage?: number;
  /**
   * Delivery Percentage
   * Service charge % for delivery
   * @default 0
   */
  delivery_percentage?: number;
  /**
   * Waiting Percentage
   * Service charge % for waiting orders
   * @default 5
   */
  waiting_percentage?: number;
  /**
   * Minimum Charge
   * Minimum service charge amount
   * @default 0.5
   */
  minimum_charge?: number;
  /** Maximum Charge */
  maximum_charge?: number | null;
  /**
   * Apply To Discounted Total
   * Apply service charge after discounts
   * @default false
   */
  apply_to_discounted_total?: boolean;
}

/**
 * ServiceHealthResponse
 * Service health check response
 */
export interface ServiceHealthResponse {
  /** Status */
  status: string;
  /** Timestamp */
  timestamp: string;
  /** Service Running */
  service_running: boolean;
  /** Port Accessible */
  port_accessible: boolean;
  /** Last Print */
  last_print: string | null;
  /** Error */
  error: string | null;
}

/**
 * ServiceSpecResponse
 * Service specification response
 */
export interface ServiceSpecResponse {
  /** Spec */
  spec: Record<string, any>;
  /** Timestamp */
  timestamp: string;
}

/**
 * ServiceSpecification
 * Printer service specification
 */
export interface ServiceSpecification {
  /** Name */
  name: string;
  /** Version */
  version: string;
  /** Port */
  port: number;
  /** Host */
  host: string;
  /** Endpoints */
  endpoints: string[];
  /** Features */
  features: string[];
  /** Dependencies */
  dependencies: Record<string, string>;
  /** Installation Path */
  installation_path: string;
  /** Log Path */
  log_path: string;
}

/** SetActivePromptRequest */
export interface SetActivePromptRequest {
  /**
   * Prompt Id
   * @minLength 1
   */
  prompt_id: string;
}

/** SetMealCreateResponse */
export interface SetMealCreateResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  set_meal?: SetMealResponse | null;
  /** Code Generated */
  code_generated?: string | null;
}

/** SetMealDeleteResponse */
export interface SetMealDeleteResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** SetMealItemRequest */
export interface SetMealItemRequest {
  /** Menu Item Id */
  menu_item_id: string;
  /**
   * Quantity
   * @default 1
   */
  quantity?: number;
}

/** SetMealItemResponse */
export interface SetMealItemResponse {
  /** Id */
  id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Menu Item Name */
  menu_item_name: string;
  /** Menu Item Image Url */
  menu_item_image_url?: string | null;
  /** Quantity */
  quantity: number;
  /** Item Price */
  item_price: number;
  /** Category Name */
  category_name?: string | null;
}

/** SetMealListResponse */
export interface SetMealListResponse {
  /** Id */
  id: string;
  /** Code */
  code: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Hero Image Url */
  hero_image_url?: string | null;
  /** Set Price */
  set_price: number;
  /** Active */
  active: boolean;
  /** Item Count */
  item_count: number;
  /** Individual Items Total */
  individual_items_total: number;
  /** Savings */
  savings: number;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** SetMealRequest */
export interface SetMealRequest {
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Hero Image Url */
  hero_image_url?: string | null;
  /** Hero Image Asset Id */
  hero_image_asset_id?: string | null;
  /** Set Price */
  set_price: number;
  /**
   * Active
   * @default true
   */
  active?: boolean;
  /** Items */
  items: SetMealItemRequest[];
}

/** SetMealResponse */
export interface SetMealResponse {
  /** Id */
  id: string;
  /** Code */
  code: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Hero Image Url */
  hero_image_url?: string | null;
  /** Hero Image Asset Id */
  hero_image_asset_id?: string | null;
  /** Set Price */
  set_price: number;
  /** Active */
  active: boolean;
  /** Items */
  items: SetMealItemResponse[];
  /** Individual Items Total */
  individual_items_total: number;
  /** Savings */
  savings: number;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** SetMealSyncResponse */
export interface SetMealSyncResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Category Created
   * @default false
   */
  category_created?: boolean;
  /** Category Id */
  category_id?: string | null;
  /**
   * Menu Items Created
   * @default 0
   */
  menu_items_created?: number;
  /**
   * Menu Items Updated
   * @default 0
   */
  menu_items_updated?: number;
  /** Errors */
  errors?: string[] | null;
}

/** SetMealUpdateRequest */
export interface SetMealUpdateRequest {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Hero Image Url */
  hero_image_url?: string | null;
  /** Hero Image Asset Id */
  hero_image_asset_id?: string | null;
  /** Set Price */
  set_price?: number | null;
  /** Active */
  active?: boolean | null;
  /** Items */
  items?: SetMealItemRequest[] | null;
}

/** SetPINRequest */
export interface SetPINRequest {
  /** Pin */
  pin: string;
}

/**
 * SetTemplateAssignmentRequest
 * Request to set template assignment for an order mode
 */
export interface SetTemplateAssignmentRequest {
  /**
   * Order Mode
   * Order mode: DINE_IN, COLLECTION, DELIVERY, WAITING
   */
  order_mode: string;
  /**
   * Kitchen Template Id
   * Template ID for kitchen receipts
   */
  kitchen_template_id?: string | null;
  /**
   * Customer Template Id
   * Template ID for customer receipts
   */
  customer_template_id?: string | null;
}

/**
 * SetTemplateAssignmentResponse
 * Response for setting template assignment
 */
export interface SetTemplateAssignmentResponse {
  /** Success */
  success: boolean;
  /** Template assignment for order modes */
  assignment: TemplateAssignment;
  /** Message */
  message: string;
}

/** SetupTriggerResponse */
export interface SetupTriggerResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Function Created */
  function_created: boolean;
  /** Trigger Created */
  trigger_created: boolean;
  /** Details */
  details?: string | null;
}

/** ShareListRequest */
export interface ShareListRequest {
  /** List Id */
  list_id: string;
  /** Customer Id */
  customer_id: string;
  /**
   * Expires In Hours
   * @default 48
   */
  expires_in_hours?: number;
}

/** ShareListResponse */
export interface ShareListResponse {
  /** Success */
  success: boolean;
  /** Token */
  token?: string | null;
  /** Url */
  url?: string | null;
  /** Expires At */
  expires_at?: string | null;
  /** Message */
  message: string;
}

/** SharedListItem */
export interface SharedListItem {
  /** Menu Item Id */
  menu_item_id: string;
  /** Menu Item Name */
  menu_item_name: string;
  /** Description */
  description?: string | null;
  /** Price */
  price?: number | null;
  /** Image Url */
  image_url?: string | null;
  /** Spice Level */
  spice_level?: number | null;
  /**
   * Is Available
   * @default true
   */
  is_available?: boolean;
  /** Variant Id */
  variant_id?: string | null;
  /** Variant Name */
  variant_name?: string | null;
}

/** SharedListResponse */
export interface SharedListResponse {
  /** Success */
  success: boolean;
  /** List Name */
  list_name?: string | null;
  /** Shared By Name */
  shared_by_name?: string | null;
  /**
   * Items
   * @default []
   */
  items?: SharedListItem[];
  /** Created At */
  created_at?: string | null;
  /** Expires At */
  expires_at?: string | null;
  /**
   * Is Expired
   * @default false
   */
  is_expired?: boolean;
  /** Message */
  message: string;
}

/** ShowMenuItemResponse */
export interface ShowMenuItemResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Suggestion Id */
  suggestion_id?: string | null;
}

/** SimpleMigrationResponse */
export interface SimpleMigrationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Columns Dropped
   * @default []
   */
  columns_dropped?: string[];
  /**
   * Sql Executed
   * @default ""
   */
  sql_executed?: string;
  /**
   * Error
   * @default ""
   */
  error?: string;
}

/**
 * SourceFileResponse
 * Source file content response
 */
export interface SourceFileResponse {
  /** Filename */
  filename: string;
  /** Content */
  content: string;
  /** Description */
  description: string;
}

/** SplitTabRequest */
export interface SplitTabRequest {
  /** Source Tab Id */
  source_tab_id: string;
  /** New Tab Name */
  new_tab_name: string;
  /** Item Indices */
  item_indices: number[];
  /** Guest Id */
  guest_id?: string | null;
}

/** SplitTabResponse */
export interface SplitTabResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  original_tab?: CustomerTab | null;
  new_tab?: CustomerTab | null;
}

/**
 * StandardsResponse
 * Response model for standards endpoints
 *
 * Following the naming convention: {Resource}{Action}Response
 */
export interface StandardsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Code Standards
   * @default []
   */
  code_standards?: CodeStandard[];
  /**
   * Naming Standards
   * @default []
   */
  naming_standards?: NamingStandard[];
}

/** StaticMapRequest */
export interface StaticMapRequest {
  /**
   * Latitude
   * Latitude coordinate
   */
  latitude: number;
  /**
   * Longitude
   * Longitude coordinate
   */
  longitude: number;
  /**
   * Width
   * Map width in pixels
   * @default 150
   */
  width?: number;
  /**
   * Height
   * Map height in pixels
   * @default 100
   */
  height?: number;
  /**
   * Zoom
   * Zoom level (1-20)
   * @default 15
   */
  zoom?: number;
  /**
   * Marker Color
   * Marker color in hex (burgundy for theme)
   * @default "0x8B1538"
   */
  marker_color?: string;
}

/** StaticMapResponse */
export interface StaticMapResponse {
  /** Success */
  success: boolean;
  /** Map Url */
  map_url?: string | null;
  /** Error */
  error?: string | null;
}

/** StatusResponse */
export interface StatusResponse {
  /** Initialized */
  initialized: boolean;
  /** Config Exists */
  config_exists: boolean;
}

/** StepResponse */
export interface StepResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any>;
}

/** StoragePermissionsResponse */
export interface StoragePermissionsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any>;
}

/** StreetViewData */
export interface StreetViewData {
  /** Available */
  available: boolean;
  /** Pano Id */
  pano_id?: string | null;
  /** Lat */
  lat?: number | null;
  /** Lng */
  lng?: number | null;
  /** Heading */
  heading?: number | null;
  /** Pitch */
  pitch?: number | null;
  /** Fov */
  fov?: number | null;
}

/**
 * StripeConfigResponse
 * Response containing Stripe publishable key for frontend
 */
export interface StripeConfigResponse {
  /** Publishable Key */
  publishable_key: string;
}

/** StructuredChatMessage */
export interface StructuredChatMessage {
  /** Role */
  role: string;
  /** Content */
  content: string;
}

/** StructuredChatRequest */
export interface StructuredChatRequest {
  /** Message */
  message: string;
  /**
   * Conversation Context
   * @default []
   */
  conversation_context?: Record<string, string>[] | null;
  /**
   * Scenario Type
   * @default "general"
   */
  scenario_type?: string | null;
  /**
   * User Preferences
   * @default {}
   */
  user_preferences?: Record<string, any> | null;
  /**
   * Include Menu Context
   * @default true
   */
  include_menu_context?: boolean;
}

/** StructuredChatResponse */
export interface StructuredChatResponse {
  /** Id */
  id: string;
  /** Content */
  content: string;
  /** Structured Elements */
  structured_elements: StructuredElement[];
  /** Metadata */
  metadata: Record<string, any>;
  /** Parse Success */
  parse_success: boolean;
  /** Processing Time Ms */
  processing_time_ms: number;
}

/** StructuredElement */
export interface StructuredElement {
  /** Id */
  id: string;
  /** Type */
  type: string;
  /** Confidence */
  confidence: number;
  /**
   * Metadata
   * @default {}
   */
  metadata?: Record<string, any> | null;
  /** Placeholder Text */
  placeholder_text: string;
}

/** StructuredStreamingRequest */
export interface StructuredStreamingRequest {
  /** Message */
  message: string;
  /**
   * Conversation History
   * @default []
   */
  conversation_history?: StructuredChatMessage[] | null;
  /** User Id */
  user_id?: string | null;
  /** Session Id */
  session_id?: string | null;
  /**
   * Cart Context
   * @default []
   */
  cart_context?: Record<string, any>[] | null;
  /**
   * Enable Structured Parsing
   * @default true
   */
  enable_structured_parsing?: boolean;
  /**
   * Include Menu Context
   * @default true
   */
  include_menu_context?: boolean;
  /**
   * Include Cart Context
   * @default true
   */
  include_cart_context?: boolean;
}

/** SupabaseConfigResponse */
export interface SupabaseConfigResponse {
  /** Url */
  url: string;
  /** Anon Key */
  anon_key: string;
}

/**
 * SyncElectronBuilderConfigResponse
 * Response model for syncing electron-builder configuration files.
 */
export interface SyncElectronBuilderConfigResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Files Synced */
  files_synced: Record<string, string>[];
  /** Github Urls */
  github_urls: string[];
  /** Summary */
  summary: Record<string, number>;
}

/** SyncFileResult */
export interface SyncFileResult {
  /** File Path */
  file_path: string;
  /** Source Path */
  source_path: string;
  /** Status */
  status: "success" | "skipped" | "error";
  /** Message */
  message: string;
  /** Github Url */
  github_url?: string | null;
}

/** SyncPOSFilesRequest */
export interface SyncPOSFilesRequest {
  /**
   * Commit Message
   * @default "Sync POS Desktop files from Databutton"
   */
  commit_message?: string;
  /** File Filter */
  file_filter?: string | null;
  /**
   * Create Release
   * @default false
   */
  create_release?: boolean;
  /**
   * Version Increment
   * @default "patch"
   */
  version_increment?: "patch" | "minor" | "major" | null;
  /** Release Notes */
  release_notes?: string | null;
}

/** SyncPOSFilesResponse */
export interface SyncPOSFilesResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Results */
  results: SyncFileResult[];
  /** Summary */
  summary: Record<string, number>;
  /** Release Data */
  release_data?: Record<string, any> | null;
}

/** SyncPrinterServiceRequest */
export interface SyncPrinterServiceRequest {
  /**
   * Commit Message
   * @default "Sync Printer Helper Service from Databutton"
   */
  commit_message?: string;
}

/** SyncPrinterServiceResponse */
export interface SyncPrinterServiceResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Files Synced */
  files_synced: SyncFileResult[];
  /** Summary */
  summary: Record<string, number>;
}

/** SyncStatus */
export interface SyncStatus {
  /** Is Syncing */
  is_syncing: boolean;
  /** Last Sync Time */
  last_sync_time?: string | null;
  /**
   * Last Sync Status
   * @default "none"
   */
  last_sync_status?: string;
  /**
   * Pending Changes
   * @default 0
   */
  pending_changes?: number;
  /** Error Message */
  error_message?: string | null;
  /** Corpus Version */
  corpus_version?: string | null;
}

/**
 * TableCheckResult
 * Result of table existence check
 */
export interface TableCheckResult {
  /** Exists */
  exists: boolean;
  /** Table Name */
  table_name: string;
  /**
   * Column Count
   * @default 0
   */
  column_count?: number;
  /**
   * Columns
   * @default []
   */
  columns?: string[];
}

/** TableCleanupRequest */
export interface TableCleanupRequest {
  /** Table Number */
  table_number: number;
  /**
   * Remove Test Items
   * @default true
   */
  remove_test_items?: boolean;
  /**
   * Reset Table Status
   * @default true
   */
  reset_table_status?: boolean;
}

/** TableListResponse */
export interface TableListResponse {
  /** Success */
  success: boolean;
  /** Tables */
  tables: string[];
  /** Count */
  count: number;
  /** Message */
  message: string;
}

/**
 * TableMetadata
 * Complete metadata for a table
 */
export interface TableMetadata {
  /** Table Name */
  table_name: string;
  /** Row Count */
  row_count: number;
  /** Size Bytes */
  size_bytes: number;
  /** Size Pretty */
  size_pretty: string;
  /** Has Foreign Keys */
  has_foreign_keys: boolean;
  /** Foreign Key Count */
  foreign_key_count: number;
  /** Referenced By Count */
  referenced_by_count: number;
  /** Code References */
  code_references: TableReference[];
  /** Reference Count */
  reference_count: number;
  /** Risk Level */
  risk_level: string;
  /** Recommendation */
  recommendation: string;
  /** Reasoning */
  reasoning: string;
}

/** TableOrder */
export interface TableOrder {
  /** Id */
  id?: string | null;
  /** Table Number */
  table_number: number;
  /** Order Items */
  order_items: AppApisTableOrdersOrderItem[];
  /** Status */
  status: string;
  /** Guest Count */
  guest_count?: number | null;
  /**
   * Linked Tables
   * @default []
   */
  linked_tables?: number[];
  /** Order Number */
  order_number?: string | null;
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
}

/** TableOrderResponse */
export interface TableOrderResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  table_order?: TableOrder | null;
}

/** TableOrdersListResponse */
export interface TableOrdersListResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Table Orders
   * @default []
   */
  table_orders?: TableOrder[];
}

/**
 * TableReference
 * Code reference to a table
 */
export interface TableReference {
  /** File Path */
  file_path: string;
  /** Line Number */
  line_number?: number | null;
  /** Context */
  context: string;
}

/** TableSchemaResponse */
export interface TableSchemaResponse {
  /** Tables Exist */
  tables_exist: boolean;
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** TableSchemaSetupResponse */
export interface TableSchemaSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** TableUsageAnalysis */
export interface TableUsageAnalysis {
  /** Table Name */
  table_name: string;
  /** Status */
  status: string;
  /** Reason */
  reason: string;
  /** References Found */
  references_found: string[];
  /** Row Count */
  row_count: number;
  /** Recommendation */
  recommendation: string;
}

/** TablesConfigResponse */
export interface TablesConfigResponse {
  /** Total Tables */
  total_tables: number;
  /** Max Seats Per Table */
  max_seats_per_table?: number | null;
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** TablesResponse */
export interface TablesResponse {
  /** Tables */
  tables: PosTableResponse[];
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /**
   * Message
   * @default ""
   */
  message?: string;
}

/** TemplateApplicationRequest */
export interface TemplateApplicationRequest {
  /** Updated Categories */
  updated_categories: CategoryUpdate[];
  /** New Categories */
  new_categories: NewCategory[];
}

/** TemplateApplicationResponse */
export interface TemplateApplicationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Updated Count */
  updated_count: number;
  /** Created Count */
  created_count: number;
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/**
 * TemplateAssignment
 * Template assignment for order modes
 */
export interface TemplateAssignment {
  /**
   * Order Mode
   * Order mode: DINE_IN, COLLECTION, DELIVERY, WAITING
   */
  order_mode: string;
  /**
   * Kitchen Template Id
   * Template ID for kitchen receipts
   */
  kitchen_template_id?: string | null;
  /**
   * Customer Template Id
   * Template ID for customer receipts
   */
  customer_template_id?: string | null;
  /** Created At */
  created_at?: string;
  /** Updated At */
  updated_at?: string;
}

/**
 * TemplateAssignmentsResponse
 * Response containing all template assignments
 */
export interface TemplateAssignmentsResponse {
  /** Success */
  success: boolean;
  /** Assignments */
  assignments: Record<string, TemplateAssignment>;
  /** Message */
  message?: string | null;
}

/**
 * TemplateCreateRequest
 * Request model for creating a new receipt template
 */
export interface TemplateCreateRequest {
  /** User Id */
  user_id: string;
  /** Name */
  name: string;
  /**
   * Description
   * @default ""
   */
  description?: string | null;
  /** Design Data */
  design_data: Record<string, any>;
  /**
   * Paper Width
   * @default 80
   */
  paper_width?: number | null;
}

/**
 * TemplateDeleteRequest
 * Request model for deleting a template
 */
export interface TemplateDeleteRequest {
  /** User Id */
  user_id: string;
}

/**
 * TemplateGetResponse
 * Response model for single template get
 */
export interface TemplateGetResponse {
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /** Response model for receipt template */
  template: TemplateResponse;
}

/**
 * TemplateListResponse
 * Response model for list of templates
 */
export interface TemplateListResponse {
  /**
   * Success
   * @default true
   */
  success?: boolean;
  /** Templates */
  templates: TemplateResponse[];
}

/**
 * TemplateResponse
 * Response model for receipt template
 */
export interface TemplateResponse {
  /** Id */
  id: string;
  /** User Id */
  user_id: string;
  /** Name */
  name: string;
  /** Description */
  description: string;
  /** Design Data */
  design_data: Record<string, any>;
  /**
   * Paper Width
   * @default 80
   */
  paper_width?: number;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
  /**
   * Is User Template
   * @default true
   */
  is_user_template?: boolean;
}

/**
 * TemplateUpdateRequest
 * Request model for updating an existing receipt template
 */
export interface TemplateUpdateRequest {
  /** User Id */
  user_id: string;
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Design Data */
  design_data?: Record<string, any> | null;
  /** Paper Width */
  paper_width?: number | null;
}

/** TemplateVariablesRequest */
export interface TemplateVariablesRequest {
  /** Template Content */
  template_content: string;
  /** Order Data */
  order_data?: Record<string, any> | null;
  /** Business Data */
  business_data?: Record<string, any> | null;
  /** Customer Data */
  customer_data?: Record<string, any> | null;
}

/** TemplateVariablesResponse */
export interface TemplateVariablesResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Processed Content */
  processed_content?: string | null;
  /** Variables Used */
  variables_used?: string[] | null;
}

/** TestAISettingsRequest */
export interface TestAISettingsRequest {
  /** Enabled */
  enabled: boolean;
  /** Custom Name */
  custom_name: string;
  /** Selected Agent Id */
  selected_agent_id: string;
  /** Avatar Url */
  avatar_url?: string | null;
}

/**
 * TestRequest
 * Request model for testing voice executor.
 */
export interface TestRequest {
  /** User Id */
  user_id?: string | null;
  /** Session Id */
  session_id: string;
  /** Function Name */
  function_name: string;
  /**
   * Args
   * @default {}
   */
  args?: Record<string, any>;
}

/** TestResponse */
export interface TestResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Settings */
  settings?: Record<string, any> | null;
}

/**
 * TestResult
 * Result of a test operation
 */
export interface TestResult {
  /** Test Name */
  test_name: string;
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Details
   * @default {}
   */
  details?: Record<string, any>;
  /** Error */
  error?: string | null;
}

/**
 * TestSuiteResult
 * Result of entire test suite
 */
export interface TestSuiteResult {
  /** Total Tests */
  total_tests: number;
  /** Passed */
  passed: number;
  /** Failed */
  failed: number;
  /** Tests */
  tests: TestResult[];
  /** Summary */
  summary: string;
}

/** TrafficCondition */
export interface TrafficCondition {
  /** Status */
  status: string;
  /** Delay Minutes */
  delay_minutes: number;
  /** Description */
  description: string;
  /** Color */
  color: string;
}

/** TriggerFixResponse */
export interface TriggerFixResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Trigger Created
   * @default false
   */
  trigger_created?: boolean;
  /**
   * Function Created
   * @default false
   */
  function_created?: boolean;
  /** Error */
  error?: string | null;
}

/** TrustDeviceRequest */
export interface TrustDeviceRequest {
  /** User Id */
  user_id: string;
  /** Device Fingerprint */
  device_fingerprint: string;
  /** Label */
  label?: string | null;
}

/** TrustDeviceResponse */
export interface TrustDeviceResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Device Id */
  device_id?: string | null;
}

/** TrustedDevice */
export interface TrustedDevice {
  /** Id */
  id: string;
  /** Device Fingerprint Hash */
  device_fingerprint_hash: string;
  /** Label */
  label: string | null;
  /** Created At */
  created_at: string;
  /** Last Used At */
  last_used_at: string;
  /** Revoked At */
  revoked_at?: string | null;
}

/** UnifiedAgentConfigResponse */
export interface UnifiedAgentConfigResponse {
  /** Id */
  id: string;
  /** Agent Name */
  agent_name: string;
  /** Agent Avatar Url */
  agent_avatar_url: string | null;
  /** Agent Role */
  agent_role: string | null;
  /** Selected Voice Agent Id */
  selected_voice_agent_id: string | null;
  /** Selected Chatbot Prompt Id */
  selected_chatbot_prompt_id: string | null;
  /** Personality Settings */
  personality_settings: Record<string, any>;
  /** Channel Settings */
  channel_settings: Record<string, any>;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** UpdateCustomerTabRequest */
export interface UpdateCustomerTabRequest {
  /** Tab Name */
  tab_name?: string | null;
  /** Order Items */
  order_items?: AppApisCustomerTabsOrderItem[] | null;
  /** Status */
  status?: string | null;
}

/** UpdateCustomizationRequest */
export interface UpdateCustomizationRequest {
  /** Name */
  name?: string | null;
  /** Customization Group */
  customization_group?: string | null;
  /** Display Order */
  display_order?: number | null;
  /** Price */
  price?: number | null;
  /** Is Active */
  is_active?: boolean | null;
  /** Show On Pos */
  show_on_pos?: boolean | null;
  /** Show On Website */
  show_on_website?: boolean | null;
  /** Ai Voice Agent */
  ai_voice_agent?: boolean | null;
  /** Item Ids */
  item_ids?: string[] | null;
}

/**
 * UpdateCustomizationsRequest
 * Request to update item customizations
 */
export interface UpdateCustomizationsRequest {
  /**
   * Item Name
   * Name of item
   */
  item_name: string;
  /**
   * Customizations
   * New customizations list
   */
  customizations: CartCustomization[];
  /**
   * Session Id
   * Session ID
   */
  session_id: string;
  /**
   * Cart Context
   * Current cart state
   */
  cart_context?: CartItemData[] | null;
}

/**
 * UpdateCustomizationsResponse
 * Response from update customizations operation
 */
export interface UpdateCustomizationsResponse {
  /**
   * Action
   * @default "update_customizations"
   */
  action?: string;
  /** Success */
  success: boolean;
  /** Cart Item Id */
  cart_item_id?: string | null;
  /** Customizations */
  customizations: CartCustomization[];
  /** Message */
  message: string;
}

/**
 * UpdateFileMappingRequest
 * Request model for updating file mapping.
 */
export interface UpdateFileMappingRequest {
  /** Files To Add */
  files_to_add: Record<string, string>[];
}

/**
 * UpdateFileMappingResponse
 * Response model for file mapping updates.
 */
export interface UpdateFileMappingResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Added Count */
  added_count: number;
  /** New Total */
  new_total: number;
}

/** UpdateGoogleLiveVoiceSettingsRequest */
export interface UpdateGoogleLiveVoiceSettingsRequest {
  /** System Prompt */
  system_prompt?: string | null;
  /** First Response */
  first_response?: string | null;
  /** Voice Model */
  voice_model?: string | null;
}

/** UpdatePOSDesktopRequest */
export interface UpdatePOSDesktopRequest {
  /**
   * Version Increment
   * @default "patch"
   */
  version_increment?: "patch" | "minor" | "major";
  /** Release Notes */
  release_notes?: string | null;
  /**
   * Draft
   * @default false
   */
  draft?: boolean;
  /**
   * Prerelease
   * @default false
   */
  prerelease?: boolean;
}

/** UpdatePOSDesktopResponse */
export interface UpdatePOSDesktopResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Release Data */
  release_data?: Record<string, any> | null;
  /** Version */
  version?: string | null;
  /** Github Url */
  github_url?: string | null;
  /** Workflow Url */
  workflow_url?: string | null;
  /** Errors */
  errors?: string[] | null;
}

/** UpdatePersonalizationResponse */
export interface UpdatePersonalizationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Customer Id */
  customer_id: string;
  /** Personalization Enabled */
  personalization_enabled: boolean;
}

/**
 * UpdateQuantityRequest
 * Request to update item quantity
 */
export interface UpdateQuantityRequest {
  /**
   * Item Name
   * Name of item (fuzzy match)
   */
  item_name: string;
  /**
   * New Quantity
   * New quantity (0 to remove)
   * @min 0
   */
  new_quantity: number;
  /**
   * Session Id
   * Session ID
   */
  session_id: string;
  /**
   * Cart Context
   * Current cart state
   */
  cart_context?: CartItemData[] | null;
}

/**
 * UpdateQuantityResponse
 * Response from update quantity operation
 */
export interface UpdateQuantityResponse {
  /**
   * Action
   * @default "update_quantity"
   */
  action?: string;
  /** Success */
  success: boolean;
  /** Cart Item Id */
  cart_item_id?: string | null;
  /** New Quantity */
  new_quantity: number;
  /** Message */
  message: string;
}

/** UpdateTableOrderRequest */
export interface UpdateTableOrderRequest {
  /** Order Items */
  order_items: AppApisTableOrdersOrderItem[];
  /** Status */
  status?: string | null;
  /** Guest Count */
  guest_count?: number | null;
}

/** UpdateTableRequest */
export interface UpdateTableRequest {
  /**
   * Capacity
   * Number of seats at the table
   */
  capacity?: number | null;
  /**
   * Status
   * Current status of the table
   */
  status?: "available" | "occupied" | "reserved" | "unavailable" | null;
}

/** UpdateUnifiedAgentConfigRequest */
export interface UpdateUnifiedAgentConfigRequest {
  /** Agent Name */
  agent_name?: string | null;
  /** Agent Avatar Url */
  agent_avatar_url?: string | null;
  /** Agent Role */
  agent_role?: string | null;
  /** Selected Voice Agent Id */
  selected_voice_agent_id?: string | null;
  /** Selected Chatbot Prompt Id */
  selected_chatbot_prompt_id?: string | null;
  /** Personality Settings */
  personality_settings?: Record<string, any> | null;
  /** Channel Settings */
  channel_settings?: Record<string, any> | null;
}

/** UploadAssetRequest */
export interface UploadAssetRequest {
  /** Release Id */
  release_id: number;
  /** File Name */
  file_name: string;
  /**
   * File Content Base64
   * Base64 encoded file content
   */
  file_content_base64: string;
  /**
   * Content Type
   * @default "application/octet-stream"
   */
  content_type?: string;
}

/**
 * UserOrdersResponse
 * Response model for user orders
 */
export interface UserOrdersResponse {
  /** Success */
  success: boolean;
  /**
   * Orders
   * @default []
   */
  orders?: Record<string, any>[];
  /**
   * Total Count
   * @default 0
   */
  total_count?: number;
  /** Message */
  message?: string | null;
  /** Error */
  error?: string | null;
}

/** UserRoleSetupResponse */
export interface UserRoleSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Table Exists */
  table_exists: boolean;
  /** Policies Created */
  policies_created: number;
  /** Functions Created */
  functions_created: number;
}

/**
 * ValidateAssetsRequest
 * Request model for validating media asset IDs
 */
export interface ValidateAssetsRequest {
  /** Asset Ids */
  asset_ids: string[];
}

/**
 * ValidateAssetsResponse
 * Response model for asset validation
 */
export interface ValidateAssetsResponse {
  /** Success */
  success: boolean;
  /** Results */
  results: AssetValidationResult[];
  /** All Valid */
  all_valid: boolean;
  /** Message */
  message: string;
}

/**
 * ValidateCustomizationRequest
 * Request to validate a customization
 */
export interface ValidateCustomizationRequest {
  /** Menu Item Id */
  menu_item_id: string;
  /** Requested Customization */
  requested_customization: string;
}

/**
 * ValidateCustomizationResponse
 * Response for customization validation
 */
export interface ValidateCustomizationResponse {
  /** Is Valid */
  is_valid: boolean;
  /** Matched Option */
  matched_option?: Record<string, any> | null;
  /** Suggestion */
  suggestion?: string | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** VariableListRequest */
export interface VariableListRequest {
  /** Template Type */
  template_type?: string | null;
  /** Order Type */
  order_type?: string | null;
}

/** VariableListResponse */
export interface VariableListResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Variables */
  variables: Record<string, string[]>;
}

/** VariantCodeRequest */
export interface VariantCodeRequest {
  /** Item Id */
  item_id: string;
  /** Variant Name */
  variant_name: string;
}

/** VariantCodeResponse */
export interface VariantCodeResponse {
  /** Success */
  success: boolean;
  /** Variant Code */
  variant_code: string;
  /** Base Code */
  base_code: string;
  /** Variant Suffix */
  variant_suffix: string;
  /** Message */
  message: string;
}

/**
 * VariantCreationResult
 * Result of creating a variant for a menu item
 */
export interface VariantCreationResult {
  /** Menu Item Id */
  menu_item_id: string;
  /** Menu Item Name */
  menu_item_name: string;
  /** Variant Id */
  variant_id: string;
  /** Variant Name */
  variant_name: string;
  /** Price */
  price: number;
  /** Success */
  success: boolean;
  /** Error */
  error?: string | null;
}

/**
 * VariantDelta
 * Item variant for delta sync
 */
export interface VariantDelta {
  /** Id */
  id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Variant Name */
  variant_name: string;
  /** Price Adjustment */
  price_adjustment: number;
  /** Display Order */
  display_order: number;
  /** Active */
  active: boolean;
  /** Updated At */
  updated_at: string;
}

/** VariantInfo */
export interface VariantInfo {
  /** Id */
  id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Price */
  price?: number | null;
  /** Price Dine In */
  price_dine_in?: number | null;
  /** Price Delivery */
  price_delivery?: number | null;
  /** Is Default */
  is_default?: boolean | null;
  /** Variant Type */
  variant_type?: string | null;
  /** Variant Value */
  variant_value?: string | null;
  /** Image Url */
  image_url?: string | null;
  /** Featured */
  featured?: boolean | null;
  /** Is Vegetarian */
  is_vegetarian?: boolean | null;
  /** Is Vegan */
  is_vegan?: boolean | null;
  /** Is Gluten Free */
  is_gluten_free?: boolean | null;
  /** Is Halal */
  is_halal?: boolean | null;
  /** Is Dairy Free */
  is_dairy_free?: boolean | null;
  /** Is Nut Free */
  is_nut_free?: boolean | null;
}

/** VariantsViewResponse */
export interface VariantsViewResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Menu Items
   * @default []
   */
  menu_items?: MenuItemWithVariantsView[];
  /**
   * Total Items
   * @default 0
   */
  total_items?: number;
  /** Error */
  error?: string | null;
}

/** VerifyPINRequest */
export interface VerifyPINRequest {
  /** Pin */
  pin: string;
}

/** VerifyPasswordWithDeviceRequest */
export interface VerifyPasswordWithDeviceRequest {
  /** Password */
  password: string;
  /** Device Fingerprint */
  device_fingerprint?: string | null;
  /**
   * Trust Device
   * @default false
   */
  trust_device?: boolean;
}

/** VerifyPasswordWithDeviceResponse */
export interface VerifyPasswordWithDeviceResponse {
  /** Authenticated */
  authenticated: boolean;
  /** Device Trust Token */
  device_trust_token?: string | null;
  /**
   * Is Locked
   * @default false
   */
  is_locked?: boolean;
  /** Cooldown Until */
  cooldown_until?: string | null;
  /**
   * Failed Attempts
   * @default 0
   */
  failed_attempts?: number;
  /** Message */
  message?: string | null;
}

/**
 * VoiceAgentCustomization
 * Simplified model for voice agent consumption
 */
export interface VoiceAgentCustomization {
  /** Name */
  name: string;
  /** Price Description */
  price_description: string;
  /** Is Free */
  is_free: boolean;
}

/** VoiceAgentCustomizationsResponse */
export interface VoiceAgentCustomizationsResponse {
  /** Customizations */
  customizations: VoiceAgentCustomization[];
  /** Formatted List */
  formatted_list: string;
}

/**
 * VoiceAgentStatusResponse
 * Response model for voice agent status endpoint
 */
export interface VoiceAgentStatusResponse {
  /** Success */
  success: boolean;
  /** Enabled */
  enabled: boolean;
  /** Agent Name */
  agent_name: string;
  /** Avatar Url */
  avatar_url: string;
  /** Selected Agent Id */
  selected_agent_id?: string | null;
  /** Corpus Status */
  corpus_status: string;
  /** Voice System Status */
  voice_system_status: string;
  /** Overall Status */
  overall_status: string;
  /** Menu Item Count */
  menu_item_count: number;
  /** Set Meal Count */
  set_meal_count: number;
  /** Total Offerings */
  total_offerings: number;
  /** Last Check */
  last_check: string;
  /** Status Message */
  status_message: string;
}

/**
 * VoiceSessionRequest
 * Request to create a new voice session
 */
export interface VoiceSessionRequest {
  /** Agent Profile Id */
  agent_profile_id?: string | null;
  /** Customer Id */
  customer_id?: string | null;
  /**
   * Session Type
   * @default "voice_ordering"
   */
  session_type?: string;
}

/** WeatherData */
export interface WeatherData {
  /** Condition */
  condition: string;
  /** Temperature Celsius */
  temperature_celsius?: number | null;
  /** Description */
  description: string;
  /** Impact Minutes */
  impact_minutes: number;
  /** Icon */
  icon: string;
}

/**
 * WebhookEventResponse
 * Response for webhook events
 */
export interface WebhookEventResponse {
  /**
   * Received
   * @default true
   */
  received?: boolean;
  /**
   * Message
   * @default "Webhook received"
   */
  message?: string;
}

/** WorkflowRun */
export interface WorkflowRun {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Status */
  status: string;
  /** Conclusion */
  conclusion?: string | null;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
  /** Html Url */
  html_url: string;
  /** Head Commit Message */
  head_commit_message?: string | null;
}

/** WorkflowRunsResponse */
export interface WorkflowRunsResponse {
  /** Total Count */
  total_count: number;
  /** Runs */
  runs: WorkflowRun[];
}

/** RevokeDeviceRequest */
export interface AppApisAdminAuthRevokeDeviceRequest {
  /** Device Id */
  device_id: string;
}

/** BaseResponse */
export interface AppApisAgentGenderMigrationBaseResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/**
 * RecommendationItem
 * Individual recommendation with reasoning
 */
export interface AppApisAiMenuRecommendationsRecommendationItem {
  /** Type */
  type: string;
  /** Title */
  title: string;
  /** Reason */
  reason: string;
  /** Itemids */
  itemIds: string[];
  /** Confidence */
  confidence: number;
}

/**
 * RecommendationItem
 * Single recommendation with AI reasoning
 */
export interface AppApisAiRecommendationsRecommendationItem {
  /** Item Id */
  item_id: string;
  /** Item Name */
  item_name: string;
  /** Price */
  price: number;
  /** Category */
  category?: string | null;
  /** Reason */
  reason: string;
  /** Confidence */
  confidence: number;
  /** Pairing Type */
  pairing_type: string;
}

/** DiagnosticResponse */
export interface AppApisAuthSignupDiagnosticDiagnosticResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Findings
   * @default {}
   */
  findings?: Record<string, any>;
}

/** BackfillResponse */
export interface AppApisAuthSyncBackfillResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Auth Users Found */
  auth_users_found: number;
  /** Customers Created */
  customers_created: number;
  /** Already Synced */
  already_synced: number;
  /** Errors */
  errors: number;
  /** Error Details */
  error_details?: any[] | null;
}

/** SyncStatusResponse */
export interface AppApisAuthSyncSyncStatusResponse {
  /** Success */
  success: boolean;
  /** Trigger Exists */
  trigger_exists: boolean;
  /** Function Exists */
  function_exists: boolean;
  /** Auth Users Count */
  auth_users_count: number;
  /** Customers Count */
  customers_count: number;
  /** Unsynced Count */
  unsynced_count: number;
  /** Unsynced Users */
  unsynced_users?: any[] | null;
}

/** BulkDeleteRequest */
export interface AppApisBulkMenuOperationsBulkDeleteRequest {
  /** Item Ids */
  item_ids: string[];
  /** Item Type */
  item_type: string;
}

/** DiagnosticResponse */
export interface AppApisCategoryDiagnosticsDiagnosticResponse {
  /** Success */
  success: boolean;
  /** Sections */
  sections: Record<string, CategoryDiagnostic[]>;
  /** Orphaned */
  orphaned: CategoryDiagnostic[];
  /** Total Categories */
  total_categories: number;
}

/** CustomerAddress */
export interface AppApisCustomerAddressesCustomerAddress {
  /** Id */
  id: string;
  /** Customer Id */
  customer_id: string;
  /** Address Line1 */
  address_line1: string;
  /** Address Line2 */
  address_line2?: string | null;
  /** City */
  city: string;
  /** Postal Code */
  postal_code: string;
  /**
   * Is Default
   * @default false
   */
  is_default?: boolean;
  /** Delivery Instructions */
  delivery_instructions?: string | null;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/**
 * CustomerAddress
 * Customer address model
 */
export interface AppApisCustomerProfileApiCustomerAddress {
  /** Id */
  id?: string | null;
  /** Address Line1 */
  address_line1: string;
  /** Address Line2 */
  address_line2?: string | null;
  /** City */
  city: string;
  /** Postal Code */
  postal_code: string;
  /** Delivery Instructions */
  delivery_instructions?: string | null;
  /**
   * Is Default
   * @default false
   */
  is_default?: boolean | null;
}

/** OrderItem */
export interface AppApisCustomerTabsOrderItem {
  /** Id */
  id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Variant Id */
  variant_id?: string | null;
  /** Name */
  name: string;
  /** Quantity */
  quantity: number;
  /** Price */
  price: number;
  /** Variant Name */
  variant_name?: string | null;
  /** Notes */
  notes?: string | null;
  /** Protein Type */
  protein_type?: string | null;
  /** Image Url */
  image_url?: string | null;
  /**
   * Customizations
   * @default []
   */
  customizations?: Record<string, any>[];
  /**
   * Sent To Kitchen
   * @default false
   */
  sent_to_kitchen?: boolean;
  /** Created At */
  created_at?: string | null;
}

/** SetupSchemaResponse */
export interface AppApisCustomerTabsSetupSchemaResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Created Objects
   * @default []
   */
  created_objects?: string[];
}

/** MigrationResponse */
export interface AppApisCutoverMigrationMigrationResponse {
  /** Success */
  success: boolean;
  /** Profiles Scanned */
  profiles_scanned: number;
  /** Customers Created */
  customers_created: number;
  /** Customers Already Existed */
  customers_already_existed: number;
  /** Errors */
  errors: string[];
  /** Details */
  details: string;
}

/**
 * AuditReport
 * Complete database audit report
 */
export interface AppApisDatabaseAuditAuditReport {
  /** Total Tables */
  total_tables: number;
  /** Total Size Bytes */
  total_size_bytes: number;
  /** Total Size Pretty */
  total_size_pretty: string;
  /** Tables */
  tables: TableMetadata[];
  /** Summary */
  summary: Record<string, number>;
  /** Safe To Drop Count */
  safe_to_drop_count: number;
  /** Potential Savings Bytes */
  potential_savings_bytes: number;
  /** Potential Savings Pretty */
  potential_savings_pretty: string;
}

/**
 * MigrationResult
 * Overall migration result
 */
export interface AppApisDatabaseMigrationMigrationResult {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Total Items Checked */
  total_items_checked: number;
  /** Items Without Variants */
  items_without_variants: number;
  /** Variants Created */
  variants_created: number;
  /** Failed Creations */
  failed_creations: number;
  /** Results */
  results: VariantCreationResult[];
  /** Errors */
  errors: string[];
}

/** SetupResult */
export interface AppApisDatabaseSetupSetupResult {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/** SetupResponse */
export interface AppApisFavoriteListsSetupSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details: Record<string, any>;
}

/** SchemaFixResponse */
export interface AppApisFixMenuIsAvailableSchemaFixResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Column Added
   * @default false
   */
  column_added?: boolean;
  /**
   * Rows Updated
   * @default 0
   */
  rows_updated?: number;
}

/** CreateFileResponse */
export interface AppApisGithubElectronSetupCreateFileResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** File Url */
  file_url?: string | null;
}

/** CreateFileResponse */
export interface AppApisGithubKdsManagerCreateFileResponse {
  /** Content */
  content: Record<string, any>;
  /** Commit */
  commit: Record<string, any>;
}

/** BaseResponse */
export interface AppApisGoogleLiveVoiceConfigBaseResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Data */
  data?: Record<string, any> | null;
}

/**
 * HealthCheckResponse
 * Response for overall health check
 */
export interface AppApisHealthMonitoringHealthCheckResponse {
  /** Overall Status */
  overall_status: string;
  /** Services */
  services: HealthStatusResponse[];
  /** Checked At */
  checked_at: string;
  /** Total Services */
  total_services: number;
  /** Healthy Count */
  healthy_count: number;
  /** Degraded Count */
  degraded_count: number;
  /** Unhealthy Count */
  unhealthy_count: number;
  /**
   * Cached
   * @default false
   */
  cached?: boolean;
}

/** AuditReport */
export interface AppApisIdentityMigrationAuditReport {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Counts */
  counts?: Record<string, any>;
  /** Duplicates */
  duplicates?: Record<string, any>;
  /**
   * Orphan Orders
   * @default 0
   */
  orphan_orders?: number;
  /** Notes */
  notes?: string | null;
}

/** SchemaUpdateResponse */
export interface AppApisMediaAssetsOptimizerSchemaSchemaUpdateResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Migration Id */
  migration_id?: string | null;
  /** Sql Hash */
  sql_hash?: string | null;
  /** Warnings */
  warnings?: string[] | null;
  /** Columns Added */
  columns_added?: string[] | null;
  /** Error */
  error?: string | null;
}

/** MigrationResult */
export interface AppApisMediaHierarchicalMigrationMigrationResult {
  /** Success */
  success: boolean;
  /** Migration Id */
  migration_id?: string | null;
  /** Sql Hash */
  sql_hash?: string | null;
  /**
   * Warnings
   * @default []
   */
  warnings?: string[];
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
  /** Result */
  result?: null;
  /** Error */
  error?: string | null;
}

/**
 * MediaAsset
 * Individual media asset with metadata.
 */
export interface AppApisMediaLibraryHierarchicalMediaAsset {
  /** Id */
  id: string;
  /** File Name */
  file_name: string;
  /** Friendly Name */
  friendly_name?: string | null;
  /** Description */
  description?: string | null;
  /** Url */
  url: string;
  /** Type */
  type?: string | null;
  /** Asset Category */
  asset_category?: string | null;
  /** Menu Section Id */
  menu_section_id?: string | null;
  /** Menu Category Id */
  menu_category_id?: string | null;
  /** Bucket Name */
  bucket_name?: string | null;
  /** Usage Context */
  usage_context?: Record<string, any> | null;
  /** Tags */
  tags?: string[] | null;
  /** Upload Date */
  upload_date?: string | null;
  /** File Size */
  file_size?: number | null;
  /** Created At */
  created_at?: string | null;
}

/** MenuItemData */
export interface AppApisMenuDataRealMenuItemData {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Category Id */
  category_id?: string | null;
  /** Category Name */
  category_name?: string | null;
  /** Price */
  price: number;
  /** Price Dine In */
  price_dine_in?: number | null;
  /** Price Takeaway */
  price_takeaway?: number | null;
  /** Price Delivery */
  price_delivery?: number | null;
  /** Active */
  active: boolean;
  /** Display Order */
  display_order: number;
  /** Image Url */
  image_url?: string | null;
  /**
   * Has Variants
   * @default false
   */
  has_variants?: boolean | null;
  /**
   * Item Type
   * @default "food"
   */
  item_type?: string | null;
  /**
   * Variants
   * @default []
   */
  variants?: MenuItemVariantData[] | null;
}

/** MenuItemData */
export interface AppApisMenuDataRealEnhancedMenuItemData {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Description */
  description?: string | null;
  /** Category Id */
  category_id: string;
  /** Category Name */
  category_name?: string | null;
  /** Price */
  price: number;
  /** Price Dine In */
  price_dine_in?: number | null;
  /** Price Takeaway */
  price_takeaway?: number | null;
  /** Price Delivery */
  price_delivery?: number | null;
  /** Active */
  active: boolean;
  /** Display Order */
  display_order: number;
  /** Image Url */
  image_url?: string | null;
  /**
   * Has Variants
   * @default false
   */
  has_variants?: boolean | null;
  /**
   * Item Type
   * @default "food"
   */
  item_type?: string | null;
  /** Variant Name */
  variant_name?: string | null;
  /**
   * Is Variant
   * @default false
   */
  is_variant?: boolean | null;
  /** Parent Item Id */
  parent_item_id?: string | null;
}

/** SchemaUpdateResponse */
export interface AppApisMenuPrintSettingsSchemaUpdateResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/** DeleteResponse */
export interface AppApisMenuProteinTypesDeleteResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** SchemaFixResponse */
export interface AppApisMenuSchemaFixSchemaFixResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/** SchemaResponse */
export interface AppApisMenuStructureSchemaResponse {
  /** Status */
  status: string;
  /** Message */
  message: string;
}

/**
 * DryRunResult
 * Preview of what the migration would do
 */
export interface AppApisMigrateVariantNamesDryRunResult {
  /** Total Variants To Update */
  total_variants_to_update: number;
  /** Sample Preview */
  sample_preview: Record<string, any>[];
  /** Ready To Migrate */
  ready_to_migrate: boolean;
}

/** MigrationResult */
export interface AppApisMigrateVariantNamesMigrationResult {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Updated Count */
  updated_count: number;
  /** Sample Variants */
  sample_variants: Record<string, any>[];
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/**
 * SyncStatusResponse
 * Response for sync status check
 */
export interface AppApisOfflineSyncSyncStatusResponse {
  /** Server Last Updated */
  server_last_updated: string;
  /** Cache Version */
  cache_version: string;
  /** Needs Full Sync */
  needs_full_sync: boolean;
  /** Estimated Changes */
  estimated_changes: number;
}

/**
 * OrderItem
 * Individual item in an order
 */
export interface AppApisOnlineOrdersOrderItem {
  /**
   * Id
   * Menu item ID
   */
  id: string;
  /**
   * Name
   * Item name
   */
  name: string;
  /**
   * Price
   * Item price (per unit)
   */
  price: number;
  /**
   * Quantity
   * Quantity ordered
   */
  quantity: number;
  /**
   * Variant
   * Variant name if applicable
   */
  variant?: string | null;
  /**
   * Notes
   * Special instructions
   */
  notes?: string | null;
  /**
   * Image Url
   * Item image URL
   */
  image_url?: string | null;
}

/** SchemaFixResponse */
export interface AppApisOrderItemsSchemaFixSchemaFixResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Details
   * @default {}
   */
  details?: Record<string, any>;
}

/** OrderItem */
export interface AppApisOrderManagementOrderItem {
  /** Item Id */
  item_id: string;
  /** Name */
  name: string;
  /** Price */
  price: number;
  /** Quantity */
  quantity: number;
  /** Variant Name */
  variant_name?: string | null;
  /** Modifiers */
  modifiers?: Record<string, any>[] | null;
  /** Notes */
  notes?: string | null;
}

/** OrderItem */
export interface AppApisOrderNotificationsOrderItem {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Quantity */
  quantity: number;
  /** Price */
  price: number;
  /** Variant Name */
  variant_name?: string | null;
  /** Notes */
  notes?: string | null;
}

/** SetupResponse */
export interface AppApisPosAuthMigrationSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Operations Completed */
  operations_completed: string[];
  /** Operations Failed */
  operations_failed: string[];
  /**
   * Details
   * @default {}
   */
  details?: Record<string, any>;
}

/** RevokeDeviceRequest */
export interface AppApisPosSupabaseAuthRevokeDeviceRequest {
  /** User Id */
  user_id: string;
  /** Device Fingerprint */
  device_fingerprint: string;
}

/** MigrationResponse */
export interface AppApisPosTablesMigrationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any>;
}

/** MigrationResponse */
export interface AppApisPosTablesMigrationMigrationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Details
   * @default {}
   */
  details?: Record<string, any>;
}

/**
 * PrintJobRequest
 * Request to create a new print job
 */
export interface AppApisPrintJobsPrintJobRequest {
  /**
   * Order Id
   * Order ID to print
   */
  order_id: string;
  /**
   * Template Id
   * Template ID to use for printing
   */
  template_id: string;
  /**
   * Receipt Type
   * Receipt type: kitchen, customer, front_of_house
   */
  receipt_type?: string | null;
  /**
   * Template Type
   * Template type: customer_receipt, kitchen_copy, order_summary
   */
  template_type?: string | null;
  /**
   * Order Data
   * Order data for template variables
   */
  order_data: Record<string, any>;
  /**
   * Printer Id
   * Specific printer ID to use
   */
  printer_id?: string | null;
  /**
   * Priority
   * Print priority: low, normal, high, urgent
   * @default "normal"
   */
  priority?: string;
  /**
   * Copies
   * Number of copies to print
   * @default 1
   */
  copies?: number;
  /**
   * Created By
   * User ID who created the print job
   */
  created_by?: string | null;
  /**
   * Metadata
   * Additional metadata for the print job
   */
  metadata?: Record<string, any> | null;
}

/**
 * PrintJobResponse
 * Response for print job operations
 */
export interface AppApisPrintJobsPrintJobResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  job?: PrintJob | null;
  /** Jobs */
  jobs?: PrintJob[] | null;
}

/**
 * PrintJobRequest
 * Request to create a new print job
 */
export interface AppApisPrintQueuePrintJobRequest {
  /** Job Type */
  job_type: string;
  /** Order Data */
  order_data: Record<string, any>;
  /**
   * Priority
   * @default 5
   */
  priority?: number;
  /**
   * Retry Attempts
   * @default 0
   */
  retry_attempts?: number;
  /**
   * Max Retries
   * @default 3
   */
  max_retries?: number;
  /** Metadata */
  metadata?: Record<string, any> | null;
}

/**
 * PrintJobResponse
 * Response for print job operations
 */
export interface AppApisPrintQueuePrintJobResponse {
  /** Job Id */
  job_id: string;
  /** Status */
  status: string;
  /** Created At */
  created_at: string;
  /** Processed At */
  processed_at?: string | null;
  /** Error Message */
  error_message?: string | null;
  /**
   * Retry Count
   * @default 0
   */
  retry_count?: number;
}

/** HealthCheckResponse */
export interface AppApisPromptGeneratorHealthCheckResponse {
  /** Status */
  status: string;
  /** Agent Config Loaded */
  agent_config_loaded: boolean;
  /** Menu Corpus Version */
  menu_corpus_version: number | null;
  /** Last Generated */
  last_generated: string | null;
  /** Timestamp */
  timestamp: string;
}

/**
 * DeleteResponse
 * Response model for delete operations
 */
export interface AppApisReceiptTemplatesDeleteResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Cleaned Up
   * @default {}
   */
  cleaned_up?: Record<string, any>;
}

/** MigrationResponse */
export interface AppApisSchemaMigrationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Items Updated
   * @default 0
   */
  items_updated?: number;
  /** Errors */
  errors?: string[] | null;
}

/** SetupSchemaResponse */
export interface AppApisSchemaSetupSchemaResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Created Columns */
  created_columns?: string[] | null;
}

/** SetupResponse */
export interface AppApisSetupCartAnalyticsTableSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Details
   * @default {}
   */
  details?: Record<string, any>;
}

/**
 * SetupResult
 * Result of setup operation
 */
export interface AppApisSupabaseSetupSetupResult {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details: Record<string, any>;
}

/** OrderItem */
export interface AppApisSystemPrinterOrderItem {
  /** Name */
  name: string;
  /** Quantity */
  quantity: number;
  /** Price */
  price: number;
  /**
   * Modifiers
   * @default []
   */
  modifiers?: string[] | null;
}

/** PrintResponse */
export interface AppApisSystemPrinterPrintResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Html Content */
  html_content: string;
  /** Timestamp */
  timestamp: string;
}

/** OrderItem */
export interface AppApisTableOrdersOrderItem {
  /** Id */
  id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Variant Id */
  variant_id?: string | null;
  /** Name */
  name: string;
  /** Quantity */
  quantity: number;
  /** Price */
  price: number;
  /** Variant Name */
  variant_name?: string | null;
  /** Notes */
  notes?: string | null;
  /** Protein Type */
  protein_type?: string | null;
  /** Image Url */
  image_url?: string | null;
  /**
   * Customizations
   * @default []
   */
  customizations?: Record<string, any>[];
  /**
   * Sent To Kitchen
   * @default false
   */
  sent_to_kitchen?: boolean;
  /** Created At */
  created_at?: string | null;
}

/** SetupSchemaResponse */
export interface AppApisTableOrdersSetupSchemaResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Created Objects
   * @default []
   */
  created_objects?: string[];
}

/** DryRunResult */
export interface AppApisTestBatchVariantsDryRunResult {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Total Assets */
  total_assets: number;
  /** Assets Needing Variants */
  assets_needing_variants: number;
  /** Sample Assets */
  sample_assets: Record<string, any>[];
}

/**
 * PrintResponse
 * Print operation response model
 */
export interface AppApisThermalPrinterPrintResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Method */
  method: string;
  /** Printer */
  printer?: string | null;
  /**
   * Features Used
   * @default []
   */
  features_used?: string[] | null;
  /** Error */
  error?: string | null;
}

/** TestPrintRequest */
export interface AppApisThermalTestTestPrintRequest {
  /** Test Type */
  test_type: string;
  /** Printer Name */
  printer_name?: string | null;
  /** Options */
  options?: Record<string, any> | null;
}

/** TestPrintResponse */
export interface AppApisThermalTestTestPrintResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details: Record<string, any>;
  /** Timestamp */
  timestamp: string;
}

/** MediaAsset */
export interface AppApisUnifiedMediaStorageMediaAsset {
  /** Id */
  id?: string | null;
  /** Asset Id */
  asset_id?: string | null;
  /** Filename */
  filename?: string | null;
  /** Original Filename */
  original_filename?: string | null;
  /** File Type */
  file_type?: string | null;
  /** File Size */
  file_size?: number | null;
  /** Url */
  url?: string | null;
  /** Bucket Path */
  bucket_path?: string | null;
  /** Width */
  width?: number | null;
  /** Height */
  height?: number | null;
  /** Aspect Ratio */
  aspect_ratio?: number | string | null;
  /**
   * Tags
   * @default []
   */
  tags?: string[] | null;
  /**
   * Linked Items
   * @default []
   */
  linked_items?: string[] | null;
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
  /** Metadata */
  metadata?: Record<string, any> | null;
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Category */
  category?: string | null;
  /** Subcategory */
  subcategory?: string | null;
  /** Is Featured */
  is_featured?: boolean | null;
  /** Usage Count */
  usage_count?: number | null;
}

/** BulkDeleteRequest */
export interface AppApisUnifiedMenuOperationsBulkDeleteRequest {
  /** Item Ids */
  item_ids: string[];
  /** Item Type */
  item_type: "categories" | "proteins" | "menu_items";
}

/** PrintResponse */
export interface AppApisUnifiedPrintingSystemPrintResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Job Id */
  job_id?: string | null;
  /** Printer Id */
  printer_id?: string | null;
  /** Timestamp */
  timestamp: string;
  /** Error */
  error?: string | null;
}

/** SchemaResponse */
export interface AppApisUnifiedSchemaManagementSchemaResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Operations Completed */
  operations_completed: string[];
  /** Operations Failed */
  operations_failed: string[];
  /** Details */
  details?: Record<string, any> | null;
}

/** TestPrintRequest */
export interface AppApisUnifiedTestPrintTestPrintRequest {
  /**
   * Content
   * @default "COTTAGE TANDOORI TEST PRINT
   * Test print successful!
   * Time: {timestamp}"
   */
  content?: string;
  /**
   * Auto Cut
   * @default true
   */
  auto_cut?: boolean;
  /**
   * Printer Type
   * @default "thermal"
   */
  printer_type?: string;
  /**
   * Test Type
   * @default "basic"
   */
  test_type?: string;
}

/** TestPrintResponse */
export interface AppApisUnifiedTestPrintTestPrintResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /**
   * Helper Status
   * @default "unknown"
   */
  helper_status?: string;
  /** Printer Type */
  printer_type?: string | null;
  /** Connection Type */
  connection_type?: string | null;
  /**
   * Timestamp
   * @default "2025-12-04T11:08:27.016148"
   */
  timestamp?: string;
  /** Job Id */
  job_id?: string | null;
}

/** SchemaResponse */
export interface AppApisVariantFoodDetailsSchemaSchemaResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Columns Added */
  columns_added?: string[] | null;
  /** Error */
  error?: string | null;
}

/** MigrationResponse */
export interface AppApisVariantNameMigrationMigrationResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Columns Added */
  columns_added?: any[] | null;
  /** Records Updated */
  records_updated?: number | null;
  /** Error */
  error?: string | null;
}

/** SchemaResponse */
export interface AppApisVariantNamePatternSchemaSchemaResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Columns Added */
  columns_added?: string[] | null;
  /** Error */
  error?: string | null;
}

/** BackfillResponse */
export interface AppApisVariantNameTriggerSetupBackfillResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Variants Updated */
  variants_updated: number;
  /**
   * Errors
   * @default []
   */
  errors?: string[];
}

/** SetupResponse */
export interface AppApisVariantNameTriggerSetupSetupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Steps Completed */
  steps_completed: string[];
  /**
   * Warnings
   * @default []
   */
  warnings?: string[];
  /** Migration Id */
  migration_id?: string | null;
}

/** BaseResponse */
export interface AppApisVoiceAgentCoreBaseResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Data */
  data?: Record<string, any> | null;
}

export type CheckHealthData = HealthResponse;

export interface LinkMenuItemMediaParams {
  /** Primary Media Id */
  primary_media_id?: string | null;
  /** Secondary Media Id */
  secondary_media_id?: string | null;
  /** Menu Item Id */
  menuItemId: string;
}

export type LinkMenuItemMediaData = MediaLinkResponse;

export type LinkMenuItemMediaError = HTTPValidationError;

export type GetCodeStandardsData = StandardsResponse;

export interface ValidateCodeStandardParams {
  /** Standard Id */
  standard_id: string;
}

/** Response Validate Code Standard */
export type ValidateCodeStandardData = Record<string, any>;

export type ValidateCodeStandardError = HTTPValidationError;

export interface GetSignatureDishesParams {
  /**
   * Role Level
   * @default "viewer"
   */
  role_level?: string;
}

export type GetSignatureDishesData = any;

export type GetSignatureDishesError = HTTPValidationError;

export type GetSupabaseConfigData = SupabaseConfigResponse;

export type BulkDeleteItemsSafeData = BulkOperationResponse;

export type BulkDeleteItemsSafeError = HTTPValidationError;

export type CheckAndFixStoragePermissionsData = StoragePermissionsResponse;

export type AddMenuAiRlsData = RLSPolicyResponse;

export type UpdateCategoriesPrintFieldsData = AppApisMenuPrintSettingsSchemaUpdateResponse;

export type CheckCategoriesPrintFieldsData = AppApisMenuPrintSettingsSchemaUpdateResponse;

export type ResetMenuStructureData = ResetMenuStructureResponse;

export type FixSchemaColumnMismatchData = AppApisMenuSchemaFixSchemaFixResponse;

export type CleanDuplicateCategoriesData = AppApisMenuSchemaFixSchemaFixResponse;

export type CheckSchemaStatusData = AppApisMenuSchemaFixSchemaFixResponse;

export type ExecuteSqlEndpointData = SQLQueryResponse;

export type ExecuteSqlEndpointError = HTTPValidationError;

export type AddOrderTimingFieldsData = any;

export type CheckOrderTimingFieldsData = any;

export type AddLinkingColumnsData = AppApisPosTablesMigrationMigrationResponse;

export type CleanupTableTestItemsData = CleanupResponse;

export type CleanupTableTestItemsError = HTTPValidationError;

export interface ResetTableCompletelyParams {
  /** Table Number */
  tableNumber: number;
}

export type ResetTableCompletelyData = CleanupResponse;

export type ResetTableCompletelyError = HTTPValidationError;

export interface AnalyzeTableItemsParams {
  /** Table Number */
  tableNumber: number;
}

export type AnalyzeTableItemsData = any;

export type AnalyzeTableItemsError = HTTPValidationError;

export type GetOrderSampleData = OrderSampleResponse;

export type GetOrderSampleError = HTTPValidationError;

export type GetAllOrderSamplesData = AllOrderSamplesResponse;

export type GetBusinessDataEndpointData = BusinessDataResponse;

export type SyncSetMealsToMenuData = SetMealSyncResponse;

export interface AutoSyncOnSetMealChangeParams {
  /** Set Meal Id */
  set_meal_id: string;
}

export type AutoSyncOnSetMealChangeData = SetMealSyncResponse;

export type AutoSyncOnSetMealChangeError = HTTPValidationError;

export type MenuMediaCoreVerifyRelationshipsData = MenuMediaRelationshipResponse;

export type MenuMediaCoreUpdateTrackingData = MenuMediaRelationshipResponse;

/** Request */
export type MenuMediaCoreLinkToItemPayload = Record<string, any>;

export interface MenuMediaCoreLinkToItemParams {
  /** Menu Item Id */
  menuItemId: string;
}

export type MenuMediaCoreLinkToItemData = any;

export type MenuMediaCoreLinkToItemError = HTTPValidationError;

export type MenuMediaCoreCleanupOrphanedData = MenuMediaRelationshipResponse;

export type MediaIntegrationVerifyRelationshipsData = MediaUsageResponse;

export type MediaIntegrationUpdateTrackingData = MediaUsageResponse;

/** Request */
export type LinkMediaToMenuIntegrationPayload = Record<string, any>;

export interface LinkMediaToMenuIntegrationParams {
  /** Menu Item Id */
  menuItemId: string;
}

export type LinkMediaToMenuIntegrationData = any;

export type LinkMediaToMenuIntegrationError = HTTPValidationError;

export type MediaIntegrationCleanupOrphanedData = MediaUsageResponse;

export interface GenerateTemplatePreviewParams {
  /** Template Id */
  templateId: string;
}

export type GenerateTemplatePreviewData = PreviewResponse;

export type GenerateTemplatePreviewError = HTTPValidationError;

export interface GetTemplatePreviewParams {
  /** Template Id */
  templateId: string;
  /** Variant */
  variant: string;
}

/** Response Get Template Preview */
export type GetTemplatePreviewData = Record<string, any>;

export type GetTemplatePreviewError = HTTPValidationError;

export interface DeleteTemplatePreviewParams {
  /** Template Id */
  templateId: string;
}

/** Response Delete Template Preview */
export type DeleteTemplatePreviewData = Record<string, any>;

export type DeleteTemplatePreviewError = HTTPValidationError;

export type AbbreviateTextData = AbbreviationResponse;

export type AbbreviateTextError = HTTPValidationError;

export interface SuggestKitchenNamesParams {
  /** Menu Item Name */
  menu_item_name: string;
  /** Protein Name */
  protein_name?: string | null;
  /**
   * Thermal Width
   * @default 25
   */
  thermal_width?: number;
}

export type SuggestKitchenNamesData = KitchenNameSuggestion;

export type SuggestKitchenNamesError = HTTPValidationError;

/** Response Get Abbreviation Dictionary */
export type GetAbbreviationDictionaryData = Record<string, any>;

/** Updates */
export type UpdateAbbreviationDictionaryPayload = Record<string, string>;

/** Response Update Abbreviation Dictionary */
export type UpdateAbbreviationDictionaryData = Record<string, any>;

export type UpdateAbbreviationDictionaryError = HTTPValidationError;

/** Response Batch Analyze Menu Items */
export type BatchAnalyzeMenuItemsData = Record<string, any>;

export interface GetPaymentNotificationsMainParams {
  /**
   * Limit
   * @min 1
   * @max 50
   * @default 10
   */
  limit?: number;
}

export type GetPaymentNotificationsMainData = NotificationsResponse;

export type GetPaymentNotificationsMainError = HTTPValidationError;

/** Order Ids */
export type MarkNotificationsProcessedMainPayload = string[];

export type MarkNotificationsProcessedMainData = any;

export type MarkNotificationsProcessedMainError = HTTPValidationError;

export interface GetCustomerPreferencesParams {
  /** Phone Number */
  phoneNumber: string;
}

export type GetCustomerPreferencesData = any;

export type GetCustomerPreferencesError = HTTPValidationError;

export interface UpdateCustomerPreferencesParams {
  /** Phone Number */
  phoneNumber: string;
}

export type UpdateCustomerPreferencesData = any;

export type UpdateCustomerPreferencesError = HTTPValidationError;

export interface ListRecentEventsParams {
  /**
   * Limit
   * Maximum number of events to return
   * @default 20
   */
  limit?: number;
  /**
   * Event Type
   * Filter events by type
   */
  event_type?: string | null;
}

export type ListRecentEventsData = EventListResponse;

export type ListRecentEventsError = HTTPValidationError;

export type EmitEventEndpointData = any;

export type EmitEventEndpointError = HTTPValidationError;

export type CheckDatabaseSchemaData = DatabaseResponse;

export type CheckDatabaseConnectionData = DatabaseConnectionTest;

export type FixDatabaseForeignKeysData = DatabaseResponse;

export type AnalyzeDatabaseTablesData = DatabaseAuditResponse;

export type CleanupSafeTablesData = DatabaseResponse;

export type SetupUserRolesRlsData = UserRoleSetupResponse;

export type CheckUserRolesTableExistsData = DatabaseResponse;

export type SetupDatabaseProceduresData = DatabaseProcedureResponse;

export type VerifyDatabaseProceduresData = DatabaseProcedureResponse;

export type PopulateSampleMenuDataEndpointData = MenuSystemResponse;

export type PopulateSampleMenuDataV2Data = MenuSystemResponse;

/** Response Test Comprehensive Menu Sql Function */
export type TestComprehensiveMenuSqlFunctionData = Record<string, any>;

/** Response Check Menu System Health */
export type CheckMenuSystemHealthData = Record<string, any>;

export type CheckOrderItemsSchemaData = AppApisOrderItemsSchemaFixSchemaFixResponse;

export type FixOrderItemsSchemaData = AppApisOrderItemsSchemaFixSchemaFixResponse;

export type RetryItemMigrationData = AppApisOrderItemsSchemaFixSchemaFixResponse;

export type TestPrintUnifiedData = AppApisUnifiedTestPrintTestPrintResponse;

export type TestPrintUnifiedError = HTTPValidationError;

export type TestPrintSimpleDataData = any;

export type GetPerformanceReportData = PerformanceReport;

/** Response Get Raw Performance Metrics */
export type GetRawPerformanceMetricsData = Record<string, any>;

/** Response Clear Performance Metrics */
export type ClearPerformanceMetricsData = Record<string, any>;

export type GenerateReceiptData = ReceiptResponse;

export type GenerateReceiptError = HTTPValidationError;

export type EmailReceiptData = ReceiptResponse;

export type EmailReceiptError = HTTPValidationError;

export interface GetReceiptParams {
  /** Receipt Id */
  receiptId: string;
}

export type GetReceiptData = any;

export type GetReceiptError = HTTPValidationError;

export type ReceiptGeneratorHealthCheckData = any;

export type AddGenderFieldData = AppApisAgentGenderMigrationBaseResponse;

export type UpdateExistingAgentsGenderData = AppApisAgentGenderMigrationBaseResponse;

export type CartRemoveData = CartRemoveResponse;

export type CartRemoveError = HTTPValidationError;

export interface GetCustomerAddressesParams {
  /** Customer Id */
  customerId: string;
}

export type GetCustomerAddressesData = AddressListResponse;

export type GetCustomerAddressesError = HTTPValidationError;

export type CreateCustomerAddressData = AddressResponse;

export type CreateCustomerAddressError = HTTPValidationError;

export interface DeleteCustomerAddressParams {
  /** Address Id */
  addressId: string;
}

/** Response Delete Customer Address */
export type DeleteCustomerAddressData = Record<string, any>;

export type DeleteCustomerAddressError = HTTPValidationError;

export type GetGalleryMenuItemsData = GalleryMenuItemsResponse;

export type TestPrintData = AppApisThermalTestTestPrintResponse;

export type TestPrintError = HTTPValidationError;

export type GetTestStatusData = any;

export type GetTestInfoData = any;

export type DownloadCottageIconData = any;

export type GetIconInfoData = any;

export type CreateElectronRepositoryData = CreateRepoResponse;

export type CreateElectronRepositoryError = HTTPValidationError;

export interface CreateRepositoryFileParams {
  /** Repo Name */
  repo_name: string;
}

export type CreateRepositoryFileData = AppApisGithubElectronSetupCreateFileResponse;

export type CreateRepositoryFileError = HTTPValidationError;

export type GetGithubUserData = any;

export type ProcessPrintQueueJobsData = ProcessQueueResponse;

export type ProcessPrintQueueJobsError = HTTPValidationError;

export type GetPrintQueueJobStatsData = QueueStatsResponse;

export type CreatePrintQueueJobData = AppApisPrintQueuePrintJobResponse;

export type CreatePrintQueueJobError = HTTPValidationError;

export interface GetPrintQueueJobsParams {
  /** Status */
  status?: string | null;
  /**
   * Limit
   * @default 50
   */
  limit?: number;
}

/** Response Get Print Queue Jobs */
export type GetPrintQueueJobsData = AppApisPrintQueuePrintJobResponse[];

export type GetPrintQueueJobsError = HTTPValidationError;

export interface GetPrintQueueJobParams {
  /** Job Id */
  jobId: string;
}

export type GetPrintQueueJobData = AppApisPrintQueuePrintJobResponse;

export type GetPrintQueueJobError = HTTPValidationError;

export interface DeletePrintQueueJobParams {
  /** Job Id */
  jobId: string;
}

/** Response Delete Print Queue Job */
export type DeletePrintQueueJobData = Record<string, any>;

export type DeletePrintQueueJobError = HTTPValidationError;

export interface UpdatePrintQueueJobStatusParams {
  /** Status */
  status: string;
  /** Error Message */
  error_message?: string | null;
  /** Job Id */
  jobId: string;
}

export type UpdatePrintQueueJobStatusData = AppApisPrintQueuePrintJobResponse;

export type UpdatePrintQueueJobStatusError = HTTPValidationError;

export interface ProcessFailedPrintJobsParams {
  /**
   * Max Retries
   * @default 3
   */
  max_retries?: number;
  /**
   * Max Jobs
   * @default 10
   */
  max_jobs?: number;
}

/** Response Process Failed Print Jobs */
export type ProcessFailedPrintJobsData = Record<string, any>;

export type ProcessFailedPrintJobsError = HTTPValidationError;

export interface AutoProcessPrintQueueParams {
  /**
   * Max Jobs
   * @default 10
   */
  max_jobs?: number;
  /**
   * Include Failed
   * @default true
   */
  include_failed?: boolean;
}

/** Response Auto Process Print Queue */
export type AutoProcessPrintQueueData = Record<string, any>;

export type AutoProcessPrintQueueError = HTTPValidationError;

/** Response Get Queue Status */
export type GetQueueStatusData = Record<string, any>;

export type DebugMenuCustomizationsData = CustomizationDebugResponse;

export type FixMenuCustomizationsSchemaData = any;

export type FixMenuCustomizationsErrorData = FixCustomizationsResponse;

export type TestMenuCustomizationsQueryData = any;

export type ExecuteSqlSafeData = SQLExecuteResponse;

export type ExecuteSqlSafeError = HTTPValidationError;

export type CheckMenuCustomizationsTableData = any;

export type CreateMenuCustomizationsTableData = any;

export type SplitTabData = SplitTabResponse;

export type SplitTabError = HTTPValidationError;

export type MergeTabsData = MergeTabsResponse;

export type MergeTabsError = HTTPValidationError;

export type MoveItemsBetweenTabsData = MoveItemsResponse;

export type MoveItemsBetweenTabsError = HTTPValidationError;

export type SetupCustomerTabsSchemaData = AppApisCustomerTabsSetupSchemaResponse;

export type CheckCustomerTabsSchemaData = AppApisCustomerTabsSetupSchemaResponse;

export type CreateCustomerTabData = CustomerTabResponse;

export type CreateCustomerTabError = HTTPValidationError;

export interface ListCustomerTabsForTableParams {
  /** Table Number */
  tableNumber: number;
}

export type ListCustomerTabsForTableData = CustomerTabsListResponse;

export type ListCustomerTabsForTableError = HTTPValidationError;

export interface GetCustomerTabParams {
  /** Tab Id */
  tabId: string;
}

export type GetCustomerTabData = CustomerTabResponse;

export type GetCustomerTabError = HTTPValidationError;

export interface UpdateCustomerTabParams {
  /** Tab Id */
  tabId: string;
}

export type UpdateCustomerTabData = CustomerTabResponse;

export type UpdateCustomerTabError = HTTPValidationError;

export interface CloseCustomerTabParams {
  /** Tab Id */
  tabId: string;
}

export type CloseCustomerTabData = CustomerTabResponse;

export type CloseCustomerTabError = HTTPValidationError;

/** Items */
export type AddItemsToCustomerTabPayload = AppApisCustomerTabsOrderItem[];

export interface AddItemsToCustomerTabParams {
  /** Tab Id */
  tabId: string;
}

export type AddItemsToCustomerTabData = CustomerTabResponse;

export type AddItemsToCustomerTabError = HTTPValidationError;

export interface RenameCustomerTabParams {
  /** New Name */
  new_name: string;
  /** Tab Id */
  tabId: string;
}

export type RenameCustomerTabData = CustomerTabResponse;

export type RenameCustomerTabError = HTTPValidationError;

export interface GetTableSessionStatusParams {
  /** Table Number */
  tableNumber: number;
}

/** Response Get Table Session Status */
export type GetTableSessionStatusData = Record<string, any>;

export type GetTableSessionStatusError = HTTPValidationError;

export interface ProcessFinalBillForTableParams {
  /** Table Number */
  tableNumber: number;
}

/** Response Process Final Bill For Table */
export type ProcessFinalBillForTableData = Record<string, any>;

export type ProcessFinalBillForTableError = HTTPValidationError;

/** Response Migrate Fix Table Statuses */
export type MigrateFixTableStatusesData = Record<string, any>;

export interface GetOfflineSyncStatusParams {
  /**
   * Last Sync
   * Last sync timestamp (ISO format)
   */
  last_sync?: string | null;
}

export type GetOfflineSyncStatusData = AppApisOfflineSyncSyncStatusResponse;

export type GetOfflineSyncStatusError = HTTPValidationError;

export interface GetMenuDeltaSyncParams {
  /**
   * Since
   * Last sync timestamp (ISO format)
   */
  since: string;
  /**
   * Limit
   * Maximum items to return
   * @min 1
   * @max 1000
   * @default 500
   */
  limit?: number;
}

export type GetMenuDeltaSyncData = DeltaSyncResponse;

export type GetMenuDeltaSyncError = HTTPValidationError;

/** Response Invalidate Offline Cache */
export type InvalidateOfflineCacheData = Record<string, any>;

export type ValidatePromoCodeData = PromoCodeResponse;

export type ValidatePromoCodeError = HTTPValidationError;

export type ApplyPromoCodeData = any;

export type ApplyPromoCodeError = HTTPValidationError;

export type CreatePromoCodeData = PromoCodeInfo;

export type CreatePromoCodeError = HTTPValidationError;

/** Response List Promo Codes */
export type ListPromoCodesData = Record<string, any>;

export interface DeletePromoCodeParams {
  /** Code */
  code: string;
}

export type DeletePromoCodeData = any;

export type DeletePromoCodeError = HTTPValidationError;

export type InitializeDefaultPromosData = any;

export type CalculateOrderFeesData = FeeCalculationResponse;

export type CalculateOrderFeesError = HTTPValidationError;

export type UpdateServiceChargeConfigData = any;

export type UpdateServiceChargeConfigError = HTTPValidationError;

/** Response Get Service Charge Config Endpoint */
export type GetServiceChargeConfigEndpointData = Record<string, any>;

/** Zones */
export type UpdateDeliveryZonesPayload = DeliveryZone[];

export type UpdateDeliveryZonesData = any;

export type UpdateDeliveryZonesError = HTTPValidationError;

/** Response Get Delivery Zones Endpoint */
export type GetDeliveryZonesEndpointData = Record<string, any>;

export type InitializeFeeConfigsData = any;

export type CreatePrintJobData = AppApisPrintJobsPrintJobResponse;

export type CreatePrintJobError = HTTPValidationError;

export interface GetPrintJobsParams {
  /** Status */
  status?: string | null;
  /** Template Type */
  template_type?: string | null;
  /** Order Id */
  order_id?: string | null;
  /**
   * Limit
   * @default 50
   */
  limit?: number;
}

export type GetPrintJobsData = AppApisPrintJobsPrintJobResponse;

export type GetPrintJobsError = HTTPValidationError;

export interface GetPrintJobParams {
  /** Job Id */
  jobId: string;
}

export type GetPrintJobData = AppApisPrintJobsPrintJobResponse;

export type GetPrintJobError = HTTPValidationError;

export interface DeletePrintJobParams {
  /** Job Id */
  jobId: string;
}

export type DeletePrintJobData = AppApisPrintJobsPrintJobResponse;

export type DeletePrintJobError = HTTPValidationError;

export interface UpdatePrintJobStatusParams {
  /** Job Id */
  jobId: string;
}

export type UpdatePrintJobStatusData = AppApisPrintJobsPrintJobResponse;

export type UpdatePrintJobStatusError = HTTPValidationError;

export type ProcessPrintQueueData = AppApisPrintJobsPrintJobResponse;

/** Response Get Print Job Stats */
export type GetPrintJobStatsData = Record<string, any>;

export type CheckMenuAiFieldsExistData = AIFieldsStatusResponse;

export type UpdateMenuItemsWithAiFieldsData = AIFieldsStatusResponse;

export type GenerateAiContentSuggestionData = any;

export type GenerateAiContentSuggestionError = HTTPValidationError;

export type CheckMenuAiFieldsExist2Data = AIFieldsStatusResponse;

export type UpdateMenuItemsWithAiFields2Data = AIFieldsStatusResponse;

export type GenerateAiContentSuggestion2Data = AIContentSuggestionResponse;

export type GenerateAiContentSuggestion2Error = HTTPValidationError;

export type GenerateStructuredResponseData = StructuredChatResponse;

export type GenerateStructuredResponseError = HTTPValidationError;

/** Response Validate Structured Prompts */
export type ValidateStructuredPromptsData = Record<string, any>;

/** Response Setup Chat Analytics Schema */
export type SetupChatAnalyticsSchemaData = Record<string, any>;

/** Response Check Chat Analytics Schema */
export type CheckChatAnalyticsSchemaData = Record<string, any>;

/** Session Data */
export type LogSessionStartPayload = Record<string, any>;

/** Response Log Session Start */
export type LogSessionStartData = Record<string, any>;

export type LogSessionStartError = HTTPValidationError;

/** Message Data */
export type LogMessagePayload = Record<string, any>;

/** Response Log Message */
export type LogMessageData = Record<string, any>;

export type LogMessageError = HTTPValidationError;

/** Session Data */
export type LogSessionEndPayload = Record<string, any>;

/** Response Log Session End */
export type LogSessionEndData = Record<string, any>;

export type LogSessionEndError = HTTPValidationError;

/** Escalation Data */
export type LogEscalationPayload = Record<string, any>;

/** Response Log Escalation */
export type LogEscalationData = Record<string, any>;

export type LogEscalationError = HTTPValidationError;

export interface GetSessionMetricsParams {
  /**
   * Days
   * @default 7
   */
  days?: number;
}

/** Response Get Session Metrics */
export type GetSessionMetricsData = Record<string, any>;

export type GetSessionMetricsError = HTTPValidationError;

export interface GetConversationAnalyticsParams {
  /** Model Filter */
  model_filter?: string | null;
  /**
   * Compare Models
   * @default false
   */
  compare_models?: boolean;
}

export type GetConversationAnalyticsData = any;

export type GetConversationAnalyticsError = HTTPValidationError;

export type GetRealTimeStatsData = any;

/** Response Check Analytics Health */
export type CheckAnalyticsHealthData = Record<string, any>;

export type SetupMenuDatabaseData = MenuSetupResponse;

export type GetMenuDataSummaryData = any;

export type InvestigateMenuSchemaData = any;

export interface CheckTableExistsParams {
  /** Table Name */
  tableName: string;
}

export type CheckTableExistsData = any;

export type CheckTableExistsError = HTTPValidationError;

export type GetRealMenuDataEnhancedData = RealMenuDataEnhanced;

export type FixParentIdColumnData = any;

export type GetCategorySectionMappingsData = CategorySectionResponse;

export interface GetItemSectionOrderParams {
  /** Menu Item Id */
  menu_item_id: string;
}

export type GetItemSectionOrderData = any;

export type GetItemSectionOrderError = HTTPValidationError;

/** Order Items */
export type SortOrderItemsBySectionsPayload = Record<string, any>[];

export type SortOrderItemsBySectionsData = any;

export type SortOrderItemsBySectionsError = HTTPValidationError;

export type GenerateItemCodeData = ItemCodeResponse;

export type GenerateItemCodeError = HTTPValidationError;

export type GenerateVariantCodeData = VariantCodeResponse;

export type GenerateVariantCodeError = HTTPValidationError;

export interface ValidateCodeUniqueParams {
  /** Code */
  code: string;
}

export type ValidateCodeUniqueData = CodeValidationResponse;

export type ValidateCodeUniqueError = HTTPValidationError;

export type GenerateAllCodesData = BatchCodeGenerationResponse;

export type GenerateAllCodesError = HTTPValidationError;

export type ResetCodeSystemData = ResetCodeSystemResponse;

export type PopulateCategoryPrefixesData = CategoryPrefixResponse;

export interface AutoLinkUnusedMediaParams {
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
  /**
   * Min Confidence
   * @default 0.6
   */
  min_confidence?: number;
}

export type AutoLinkUnusedMediaData = AutoLinkResponse;

export type AutoLinkUnusedMediaError = HTTPValidationError;

export interface CheckCategoryDeleteParams {
  /** Category Id */
  categoryId: string;
}

export type CheckCategoryDeleteData = CategoryDeleteCheckResponse;

export type CheckCategoryDeleteError = HTTPValidationError;

export type SafeDeleteCategoryData = CategoryDeleteResponse;

export type SafeDeleteCategoryError = HTTPValidationError;

export interface GetAssetUsageParams {
  /** Asset Id */
  assetId: string;
}

export type GetAssetUsageData = AssetUsageResponse;

export type GetAssetUsageError = HTTPValidationError;

export type ReplaceAssetInMenuItemsData = ReplaceAssetResponse;

export type ReplaceAssetInMenuItemsError = HTTPValidationError;

export interface RemoveAssetReferencesParams {
  /** Menu Item Ids */
  menu_item_ids?: string | null;
  /** Asset Id */
  assetId: string;
}

export type RemoveAssetReferencesData = ReplaceAssetResponse;

export type RemoveAssetReferencesError = HTTPValidationError;

export type CreateSetMealData = SetMealCreateResponse;

export type CreateSetMealError = HTTPValidationError;

export interface ListSetMealsParams {
  /**
   * Active Only
   * @default false
   */
  active_only?: boolean;
}

/** Response List Set Meals */
export type ListSetMealsData = SetMealListResponse[];

export type ListSetMealsError = HTTPValidationError;

export interface GetSetMealParams {
  /** Set Meal Id */
  setMealId: string;
}

export type GetSetMealData = SetMealResponse;

export type GetSetMealError = HTTPValidationError;

export interface DeleteSetMealParams {
  /** Set Meal Id */
  setMealId: string;
}

export type DeleteSetMealData = SetMealDeleteResponse;

export type DeleteSetMealError = HTTPValidationError;

export interface UpdateSetMealParams {
  /** Set Meal Id */
  setMealId: string;
}

export type UpdateSetMealData = SetMealCreateResponse;

export type UpdateSetMealError = HTTPValidationError;

export interface GetEnhancedMediaLibraryParams {
  /**
   * Search
   * Search in menu item names, filenames, and descriptions
   */
  search?: string | null;
  /**
   * Asset Type
   * Filter by asset type (image, video)
   */
  asset_type?: string | null;
  /**
   * Tag
   * Filter by tag
   */
  tag?: string | null;
  /**
   * Usage
   * Filter by usage
   */
  usage?: string | null;
  /**
   * Aspect Ratio
   * Filter by aspect ratio
   */
  aspect_ratio?: string | null;
  /**
   * Linked Only
   * Show only assets linked to menu items
   */
  linked_only?: boolean | null;
  /**
   * Unlinked Only
   * Show only unlinked assets
   */
  unlinked_only?: boolean | null;
  /**
   * Limit
   * Number of results to return
   * @default 100
   */
  limit?: number;
  /**
   * Offset
   * Number of results to skip
   * @default 0
   */
  offset?: number;
}

export type GetEnhancedMediaLibraryData = EnhancedMediaLibraryResponse;

export type GetEnhancedMediaLibraryError = HTTPValidationError;

export type UpdateMenuItemsSchemaData = AppApisSchemaSetupSchemaResponse;

export type CheckMenuImagesSchemaV2Data = CheckSchemaStatusResponse;

export type SetupMenuImagesSchemaV2Data = AppApisSchemaSetupSchemaResponse;

export type SchemaMigrateMenuImagesV2Data = AppApisSchemaMigrationResponse;

export type GetPosBundleData = POSBundleResponse;

export interface GetItemDetailsParams {
  /** Item Id */
  itemId: string;
}

/** Response Get Item Details */
export type GetItemDetailsData = Record<string, any>;

export type GetItemDetailsError = HTTPValidationError;

export interface GetCategoryItemsParams {
  /** Category Id */
  categoryId: string;
}

/** Response Get Category Items */
export type GetCategoryItemsData = Record<string, any>;

export type GetCategoryItemsError = HTTPValidationError;

export type CheckMenuStructureSchemaStatusData = AppApisMenuStructureSchemaResponse;

export type SetupMenuStructureAlterTableFunctionData = AppApisMenuStructureSchemaResponse;

export type SaveCategoryData = AppApisMenuStructureSchemaResponse;

export type SaveCategoryError = HTTPValidationError;

export type AnalyzeSectionChangeImpactData = SectionChangeImpactResponse;

export type AnalyzeSectionChangeImpactError = HTTPValidationError;

export type MoveCategorySectionData = MoveCategorySectionResponse;

export type MoveCategorySectionError = HTTPValidationError;

export type DiagnoseMenuItemsData = DiagnosticsResponse;

export type GenerateAiRecommendationsData = AIRecommendationsResponse;

export type GenerateAiRecommendationsError = HTTPValidationError;

export type PrintKitchenThermalData = AppApisUnifiedPrintingSystemPrintResponse;

export type PrintKitchenThermalError = HTTPValidationError;

export type PrintReceiptThermalData = AppApisUnifiedPrintingSystemPrintResponse;

export type PrintReceiptThermalError = HTTPValidationError;

export type PrintEpsonData = AppApisUnifiedPrintingSystemPrintResponse;

export type PrintEpsonError = HTTPValidationError;

export type DiscoverEpsonPrintersData = DiscoveryResponse;

/** Response List Print Templates */
export type ListPrintTemplatesData = Record<string, any>;

/** Response Create Print Template */
export type CreatePrintTemplateData = Record<string, any>;

export type CreatePrintTemplateError = HTTPValidationError;

/** Variables */
export type PrintWithTemplatePayload = Record<string, any>;

export interface PrintWithTemplateParams {
  /** Template Id */
  templateId: string;
}

export type PrintWithTemplateData = AppApisUnifiedPrintingSystemPrintResponse;

export type PrintWithTemplateError = HTTPValidationError;

export type GetPrintingSystemStatusData = PrinterStatusResponse;

export interface GetRecentPrintJobsParams {
  /**
   * Limit
   * @default 20
   */
  limit?: number;
}

/** Response Get Recent Print Jobs */
export type GetRecentPrintJobsData = Record<string, any>;

export type GetRecentPrintJobsError = HTTPValidationError;

/** Response Test All Printers */
export type TestAllPrintersData = Record<string, any>;

/** Response Get Menu Print Settings */
export type GetMenuPrintSettingsData = Record<string, any>;

/** Settings */
export type SaveMenuPrintSettingsPayload = Record<string, any>;

/** Response Save Menu Print Settings */
export type SaveMenuPrintSettingsData = Record<string, any>;

export type SaveMenuPrintSettingsError = HTTPValidationError;

export type AddVariantNameColumnData = AppApisVariantNameMigrationMigrationResponse;

export type CheckVariantNameStatusData = AppApisVariantNameMigrationMigrationResponse;

export type RegenerateAllVariantNamesData = AppApisVariantNameMigrationMigrationResponse;

export type GetRealMenuDataData = RealMenuData;

export type PreviewMigrationData = AppApisMigrateVariantNamesDryRunResult;

export type ExecuteMigrationData = AppApisMigrateVariantNamesMigrationResult;

/** Response Verify Migration */
export type VerifyMigrationData = Record<string, any>;

export type MigrateVariantNamesToTitleCaseData = AppApisMigrateVariantNamesMigrationResult;

/** Response Verify Variant Names */
export type VerifyVariantNamesData = Record<string, any>;

export type ListProteinTypesData = ProteinTypesListResponse;

export type CreateProteinTypeData = ProteinTypeResponse;

export type CreateProteinTypeError = HTTPValidationError;

export interface GetProteinTypeParams {
  /** Protein Id */
  proteinId: string;
}

export type GetProteinTypeData = ProteinTypeResponse;

export type GetProteinTypeError = HTTPValidationError;

export interface UpdateProteinTypeParams {
  /** Protein Id */
  proteinId: string;
}

export type UpdateProteinTypeData = ProteinTypeResponse;

export type UpdateProteinTypeError = HTTPValidationError;

export interface DeleteProteinTypeParams {
  /** Protein Id */
  proteinId: string;
}

export type DeleteProteinTypeData = AppApisMenuProteinTypesDeleteResponse;

export type DeleteProteinTypeError = HTTPValidationError;

export type GetCustomerContextSummaryData = CustomerContextSummary;

export type GetCustomerContextSummaryError = HTTPValidationError;

export type CustomerContextHealthCheckData = any;

export type AddCustomerReferenceFieldData = SchemaSetupResponse;

export type GenerateReferenceNumbersForExistingCustomersData = SchemaSetupResponse;

export interface GetCustomerReferenceParams {
  /** Customer Id */
  customerId: string;
}

export type GetCustomerReferenceData = CustomerReferenceResponse;

export type GetCustomerReferenceError = HTTPValidationError;

export type ValidateReferenceSystemData = SchemaSetupResponse;

export type InitClientsAndCoreTablesData = StepResponse;

export type EnableRlsAndPoliciesData = StepResponse;

export type BackfillLegacyData = StepResponse;

export type LockLegacyAndViewsData = StepResponse;

export type AuditReportData = AppApisIdentityMigrationAuditReport;

export type RollbackData = StepResponse;

export type FullRunData = FullRunResponse;

export type FullRunError = HTTPValidationError;

export type AdminCountsData = any;

export type ListRlsPoliciesData = any;

export type FinalizeCutoverData = StepResponse;

export type FinalizeCutoverError = HTTPValidationError;

export type RefreshSchemaCacheData = SchemaRefreshResponse;

export type MigrateProfilesToCustomersData = AppApisCutoverMigrationMigrationResponse;

export type GetPasswordStatusData = any;

export type GetCurrentPasswordData = any;

export type VerifyPasswordData = PasswordVerificationResponse;

export type VerifyPasswordError = HTTPValidationError;

export type UpdatePasswordData = PasswordUpdateResponse;

export type UpdatePasswordError = HTTPValidationError;

export type SetupTrustedDeviceTablesData = any;

export type VerifyPasswordWithDeviceData = VerifyPasswordWithDeviceResponse;

export type VerifyPasswordWithDeviceError = HTTPValidationError;

export type CheckDeviceTrustData = any;

export type CheckDeviceTrustError = HTTPValidationError;

/** Response List Trusted Devices */
export type ListTrustedDevicesData = TrustedDevice[];

export type RevokeDeviceData = any;

export type RevokeDeviceError = HTTPValidationError;

export type GetAdminLockStatusData = LockStatusResponse;

export type GetAdminLockStatusError = HTTPValidationError;

export interface GetLockStatusParams {
  /** Device Fingerprint */
  device_fingerprint?: string | null;
}

export type GetLockStatusData = LockStatusResponse;

export type GetLockStatusError = HTTPValidationError;

export type SupabasePosLoginData = POSLoginResponse;

export type SupabasePosLoginError = HTTPValidationError;

export type CheckPosAccessData = CheckPOSAccessResponse;

export type CheckPosAccessError = HTTPValidationError;

export type TrustDeviceForUserData = TrustDeviceResponse;

export type TrustDeviceForUserError = HTTPValidationError;

export type CheckUserTrustedDeviceData = CheckDeviceTrustResponse;

export type CheckUserTrustedDeviceError = HTTPValidationError;

export type RevokeUserDeviceData = RevokeDeviceResponse;

export type RevokeUserDeviceError = HTTPValidationError;

export type SetupPosAuthTablesData = AppApisPosAuthMigrationSetupResponse;

export type CheckPosAuthSetupData = any;

export type GetCategoryDiagnosticsData = AppApisCategoryDiagnosticsDiagnosticResponse;

export interface TestCategoryFilterParams {
  /** Category Id */
  category_id?: string | null;
}

export type TestCategoryFilterData = FilterDiagnosticResponse;

export type TestCategoryFilterError = HTTPValidationError;

export type SendOrderConfirmationEmailData = NotificationResponse;

export type SendOrderConfirmationEmailError = HTTPValidationError;

export type SendRealtimeNotificationData = NotificationResponse;

export type SendRealtimeNotificationError = HTTPValidationError;

export interface GetRealtimeNotificationsParams {
  /** User Id */
  user_id?: string | null;
  /** Role Target */
  role_target?: string | null;
  /**
   * Unread Only
   * @default false
   */
  unread_only?: boolean;
  /**
   * Limit
   * @default 50
   */
  limit?: number;
}

/** Response Get Realtime Notifications */
export type GetRealtimeNotificationsData = RealTimeNotification[];

export type GetRealtimeNotificationsError = HTTPValidationError;

/** Response Mark Realtime Notifications */
export type MarkRealtimeNotificationsData = Record<string, any>;

export type MarkRealtimeNotificationsError = HTTPValidationError;

export interface GetRealtimeNotificationStatsParams {
  /** User Id */
  user_id?: string | null;
  /** Role Target */
  role_target?: string | null;
}

export type GetRealtimeNotificationStatsData = NotificationStatsResponse;

export type GetRealtimeNotificationStatsError = HTTPValidationError;

export type CreateSmsPaymentLinkData = SMSPaymentLinkResponse;

export type CreateSmsPaymentLinkError = HTTPValidationError;

export type CheckPaymentLinkStatusData = PaymentLinkStatusResponse;

export type CheckPaymentLinkStatusError = HTTPValidationError;

export interface MarkPaymentAsPaidParams {
  /** Payment Link Id */
  payment_link_id: string;
  /** Payment Intent Id */
  payment_intent_id: string;
  /** Amount Paid */
  amount_paid: number;
}

export type MarkPaymentAsPaidData = any;

export type MarkPaymentAsPaidError = HTTPValidationError;

export type ListPendingPaymentsData = any;

export type GenerateReceiptHtmlData = AppApisSystemPrinterPrintResponse;

export type GenerateReceiptHtmlError = HTTPValidationError;

export type PrintTestReceiptData = AppApisSystemPrinterPrintResponse;

export type InitializeSchemaMigrationsData = AppApisSupabaseSetupSetupResult;

export type CreateExecuteSqlRpcData = AppApisSupabaseSetupSetupResult;

export type VerifyExecuteSqlRpcData = AppApisSupabaseSetupSetupResult;

export type CheckSchemaMigrationsData = TableCheckResult;

export type FullSetupData = AppApisSupabaseSetupSetupResult;

export type SupabaseManagerHealthCheckData = TestResult;

export type TestTier1CrudData = TestResult;

export type TestTier2DdlData = TestResult;

export type TestTier3AdvancedData = TestResult;

export type RunFullTestSuiteData = TestSuiteResult;

export type TestSafetyValidationData = TestResult;

export interface GetMigrationHistoryEndpointParams {
  /**
   * Limit
   * @default 20
   */
  limit?: number;
}

export type GetMigrationHistoryEndpointData = TestResult;

export type GetMigrationHistoryEndpointError = HTTPValidationError;

export type TrackCartEventData = CartEventResponse;

export type TrackCartEventError = HTTPValidationError;

export interface GetCartMetricsParams {
  /**
   * Days
   * @default 7
   */
  days?: number;
}

export type GetCartMetricsData = CartMetricsResponse;

export type GetCartMetricsError = HTTPValidationError;

export type CreateRepositoryData = RepositoryInfoResponse;

export type CreateRepositoryError = HTTPValidationError;

export type GetRepositoryInfoData = RepositoryInfoResponse;

export type CreateFileData = AppApisGithubKdsManagerCreateFileResponse;

export type CreateFileError = HTTPValidationError;

export interface GetFileShaParams {
  /** Path */
  path: string;
  /**
   * Branch
   * @default "main"
   */
  branch?: string;
}

/** Response Get File Sha */
export type GetFileShaData = Record<string, string>;

export type GetFileShaError = HTTPValidationError;

export type CreateReleaseData = ReleaseResponse;

export type CreateReleaseError = HTTPValidationError;

export type UploadReleaseAssetData = AssetResponse;

export type UploadReleaseAssetError = HTTPValidationError;

export type GetLatestReleaseData = LatestReleaseInfo;

export interface ListReleasesParams {
  /**
   * Page
   * @default 1
   */
  page?: number;
  /**
   * Per Page
   * @default 10
   */
  per_page?: number;
  /**
   * Include Drafts
   * @default false
   */
  include_drafts?: boolean;
  /**
   * Include Prereleases
   * @default true
   */
  include_prereleases?: boolean;
}

/** Response List Releases */
export type ListReleasesData = ReleaseResponse[];

export type ListReleasesError = HTTPValidationError;

export interface DeleteReleaseParams {
  /** Release Id */
  release_id: number;
}

/** Response Delete Release */
export type DeleteReleaseData = Record<string, string>;

export type DeleteReleaseError = HTTPValidationError;

/** Response Check Health */
export type CheckHealthResult = Record<string, any>;

export type SetupKdsSchemaData = any;

export type CheckKdsSchemaData = SchemaStatusResponse;

export type SetKdsPinData = PINResponse;

export type SetKdsPinError = HTTPValidationError;

export type VerifyKdsPinData = PINResponse;

export type VerifyKdsPinError = HTTPValidationError;

export interface LookupPostcodeSchemaParams {
  /** Postcode */
  postcode: string;
}

/** Response Lookup Postcode Schema */
export type LookupPostcodeSchemaData = Record<string, any>;

export type LookupPostcodeSchemaError = HTTPValidationError;

export interface CalculateDeliveryParams {
  /** Customer Postcode */
  customer_postcode: string;
}

/** Response Calculate Delivery */
export type CalculateDeliveryData = Record<string, any>;

export type CalculateDeliveryError = HTTPValidationError;

export type SetupMenuCategoriesParentRelationshipData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupMenuItemCodesData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupVariantsFoodDetailsData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupSetMealsSchemaData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupSpecialInstructionsSchemaData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupSimplePaymentTrackingData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupDeliverySchemaData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupKitchenDisplaySchemaData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupRestaurantSchemaData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupAllSchemasBatchData = AppApisUnifiedSchemaManagementSchemaResponse;

export type SetupAllSchemasBatchError = HTTPValidationError;

/** Response Check All Schemas Status */
export type CheckAllSchemasStatusData = Record<string, any>;

/** Response Get Schema Health */
export type GetSchemaHealthData = Record<string, any>;

export type GetPublicRestaurantInfoData = PublicRestaurantInfo;

/** Response Get Public Restaurant Text */
export type GetPublicRestaurantTextData = string;

/** Response Get Voice Agent Data */
export type GetVoiceAgentDataData = Record<string, any>;

export type GetRestaurantDetailsForVoiceAgentData = any;

export type GetVoiceAgentStatusData = VoiceAgentStatusResponse;

export type RecordMenuChangeData = RealTimeSyncResponse;

export type RecordMenuChangeError = HTTPValidationError;

export interface SyncMenuChangesNowParams {
  /**
   * Force Update
   * @default false
   */
  force_update?: boolean;
}

export type SyncMenuChangesNowData = RealTimeSyncResponse;

export type SyncMenuChangesNowError = HTTPValidationError;

export type GetSyncStatusEndpointData = SyncStatus;

export type GetAutoSyncConfigEndpointData = AutoSyncConfig;

export type UpdateAutoSyncConfigData = AutoSyncConfig;

export type UpdateAutoSyncConfigError = HTTPValidationError;

export type GetPendingChangesData = any;

export type ClearAllPendingChangesData = any;

/** Response Real Time Sync Health Check */
export type RealTimeSyncHealthCheckData = Record<string, any>;

export type GetRealTimeSyncStatusData = SyncStatus;

export type GetAgentProfilesEndpointData = AgentProfilesResponse;

/** Response Agent Profiles Health */
export type AgentProfilesHealthData = Record<string, any>;

export type GetAllAgentsData = AppApisVoiceAgentCoreBaseResponse;

export type CreateAgentData = AppApisVoiceAgentCoreBaseResponse;

export type CreateAgentError = HTTPValidationError;

export interface GetAgentByIdParams {
  /** Agent Id */
  agentId: string;
}

export type GetAgentByIdData = AppApisVoiceAgentCoreBaseResponse;

export type GetAgentByIdError = HTTPValidationError;

export interface UpdateAgentParams {
  /** Agent Id */
  agentId: string;
}

export type UpdateAgentData = AppApisVoiceAgentCoreBaseResponse;

export type UpdateAgentError = HTTPValidationError;

export type SelectAgentData = AppApisVoiceAgentCoreBaseResponse;

export type SelectAgentError = HTTPValidationError;

export type GetMasterSwitchStatusData = AppApisVoiceAgentCoreBaseResponse;

export type SetMasterSwitchData = AppApisVoiceAgentCoreBaseResponse;

export type SetMasterSwitchError = HTTPValidationError;

export type VoiceAgentCoreHealthData = AppApisVoiceAgentCoreBaseResponse;

export type GetRestaurantProfileForVoiceAgentData = any;

export type GetRestaurantProfileForVoiceAgentTextData = any;

export type GetRestaurantProfileForVoiceAgentHtmlData = any;

export type CheckLatestReleaseData = LatestReleaseResponse;

export type CreateV8EposSdkReleaseData = GitHubReleaseResponse;

/** Response Get Printer Status */
export type GetPrinterStatusData = Record<string, any>;

export interface ShowMenuItemParams {
  /** Menu Item Id */
  menu_item_id?: string | null;
  /** Reason */
  reason?: string | null;
  /** Call Id */
  call_id?: string | null;
  /** Session Id */
  session_id?: string | null;
}

export type ShowMenuItemData = ShowMenuItemResponse;

export type ShowMenuItemError = HTTPValidationError;

export type ShowMenuItemHealthData = any;

export type GetMenuTextForRagData = string;

export type GetRestaurantInfoTextForRagData = string;

export type TestAiSettingsSyncData = TestResponse;

export type TestAiSettingsSyncError = HTTPValidationError;

export type GetAiSettingsStatusData = TestResponse;

export type ToggleAiAssistantData = TestResponse;

export type UpdateOrderTrackingStatusData = OrderTrackingResponse;

export type UpdateOrderTrackingStatusError = HTTPValidationError;

export interface GetOrderTrackingDetailsParams {
  /** Order Id */
  orderId: string;
}

export type GetOrderTrackingDetailsData = OrderTrackingDetails;

export type GetOrderTrackingDetailsError = HTTPValidationError;

/** Response Bulk Update Order Tracking */
export type BulkUpdateOrderTrackingData = Record<string, any>;

export type BulkUpdateOrderTrackingError = HTTPValidationError;

/** Response Get Status Options */
export type GetStatusOptionsData = Record<string, any>;

export interface GetOrdersByStatusParams {
  /**
   * Limit
   * @default 50
   */
  limit?: number;
  status: OrderStatus;
}

/** Response Get Orders By Status */
export type GetOrdersByStatusData = OrderTrackingDetails[];

export type GetOrdersByStatusError = HTTPValidationError;

export type SetupOrderTrackingSchemaData = DatabaseSetupResponse;

/** Response Check Order Tracking Schema */
export type CheckOrderTrackingSchemaData = Record<string, any>;

export type ListAllTablesData = TableListResponse;

export type GenerateAuditReportData = AuditResponse;

export type SetupCorpusSchemaData = any;

export type PublishCorpusData = CorpusResponse;

export type PublishCorpusError = HTTPValidationError;

export interface GetActiveCorpusParams {
  /** Corpus Type */
  corpusType: "menu" | "restaurant_info" | "policies" | "faq";
}

export type GetActiveCorpusData = ActiveCorpusResponse;

export type GetActiveCorpusError = HTTPValidationError;

export interface GetCorpusVersionsParams {
  /** Corpus Type */
  corpusType: "menu" | "restaurant_info" | "policies" | "faq";
}

export type GetCorpusVersionsData = CorpusVersionsResponse;

export type GetCorpusVersionsError = HTTPValidationError;

export interface ActivateCorpusVersionParams {
  /** Corpus Id */
  corpusId: string;
}

export type ActivateCorpusVersionData = CorpusResponse;

export type ActivateCorpusVersionError = HTTPValidationError;

export type CheckCorpusHealthData = CorpusHealthResponse;

export type GetDeliveryConfigData = DeliveryConfigResponse;

export type GetRestaurantConfigData = RestaurantConfigResponse;

export type GenerateOrderNumberData = GenerateOrderNumberResponse;

export type GenerateOrderNumberError = HTTPValidationError;

/** Response Get Sequence Status */
export type GetSequenceStatusData = Record<string, any>;

/** Response Sync Counters With Database */
export type SyncCountersWithDatabaseData = Record<string, any>;

export type SetupTableOrdersSchemaData = AppApisTableOrdersSetupSchemaResponse;

export type CheckTableOrdersSchemaData = AppApisTableOrdersSetupSchemaResponse;

export type CreateTableOrderData = TableOrderResponse;

export type CreateTableOrderError = HTTPValidationError;

export type ListTableOrdersData = TableOrdersListResponse;

export interface GetTableOrderParams {
  /** Table Number */
  tableNumber: number;
}

export type GetTableOrderData = TableOrderResponse;

export type GetTableOrderError = HTTPValidationError;

export interface UpdateTableOrderParams {
  /** Table Number */
  tableNumber: number;
}

export type UpdateTableOrderData = TableOrderResponse;

export type UpdateTableOrderError = HTTPValidationError;

export interface CompleteTableOrderParams {
  /** Table Number */
  tableNumber: number;
}

export type CompleteTableOrderData = TableOrderResponse;

export type CompleteTableOrderError = HTTPValidationError;

/** Items */
export type AddItemsToTablePayload = AppApisTableOrdersOrderItem[];

export interface AddItemsToTableParams {
  /** Table Number */
  tableNumber: number;
}

export type AddItemsToTableData = TableOrderResponse;

export type AddItemsToTableError = HTTPValidationError;

export type MigrateTablesNowData = AppApisPosTablesMigrationResponse;

export type DirectInitializeTablesData = TableSchemaSetupResponse;

export type DropOldTablesData = DropTablesResponse;

export type CheckPosTablesSchemaData = TableSchemaResponse;

export type SetupPosTablesSchemaData = TableSchemaSetupResponse;

export type GetTablesConfigData = TablesConfigResponse;

export type SaveTablesConfigData = TablesConfigResponse;

export type SaveTablesConfigError = HTTPValidationError;

export type CreatePosTableData = CreateTableResponse;

export type CreatePosTableError = HTTPValidationError;

export interface UpdatePosTableParams {
  /**
   * Table Number
   * @exclusiveMin 0
   */
  tableNumber: number;
}

export type UpdatePosTableData = PosTableResponse;

export type UpdatePosTableError = HTTPValidationError;

export interface DeletePosTableParams {
  /**
   * Table Number
   * @exclusiveMin 0
   */
  tableNumber: number;
}

export type DeletePosTableData = DeleteTableResponse;

export type DeletePosTableError = HTTPValidationError;

export interface UpdatePosTableStatusParams {
  /** Status */
  status: "available" | "occupied" | "reserved" | "unavailable";
  /**
   * Table Number
   * @exclusiveMin 0
   */
  tableNumber: number;
}

export type UpdatePosTableStatusData = PosTableResponse;

export type UpdatePosTableStatusError = HTTPValidationError;

export type GetTablesData = TablesResponse;

/** Response Run Table Diagnostics */
export type RunTableDiagnosticsData = Record<string, any>;

export interface GetOptimizedImageParams {
  /**
   * Url
   * Original image URL to optimize
   */
  url: string;
  /**
   * W
   * Target width in pixels
   * @min 50
   * @max 2000
   * @default 400
   */
  w?: number;
  /**
   * H
   * Target height in pixels
   * @min 50
   * @max 2000
   * @default 400
   */
  h?: number;
  /**
   * Format
   * Output format (webp, jpeg, png)
   * @default "webp"
   */
  format?: string;
  /**
   * Quality
   * Image quality (1-100)
   * @min 1
   * @max 100
   * @default 85
   */
  quality?: number;
}

export type GetOptimizedImageData = any;

export type GetOptimizedImageError = HTTPValidationError;

export interface ClearImageCacheParams {
  /**
   * Pattern
   * Cache key pattern to clear
   * @default "opt_img_"
   */
  pattern?: string;
}

export type ClearImageCacheData = any;

export type ClearImageCacheError = HTTPValidationError;

export type CreateOptimizedFunctionData = OptimizationResponse;

export type DropOptimizedFunctionData = OptimizationResponse;

export interface InvalidateMenuCacheParams {
  /**
   * Reason
   * @default "Manual invalidation"
   */
  reason?: string | null;
}

export type InvalidateMenuCacheData = OptimizationResponse;

export type InvalidateMenuCacheError = HTTPValidationError;

/** Response Get Menu Cache Stats */
export type GetMenuCacheStatsData = Record<string, any>;

export interface GetOptimizedMenuParams {
  /**
   * Skip Cache
   * @default false
   */
  skip_cache?: boolean;
}

export type GetOptimizedMenuData = MenuResponse;

export type GetOptimizedMenuError = HTTPValidationError;

export type TestOptimizedFunctionData = MenuResponse;

export type GetSpecificationData = ServiceSpecification;

/** Response Get Full Specification */
export type GetFullSpecificationData = Record<string, any>;

export type GetPowershellInstallScriptData = InstallationScriptResponse;

export type GetPowershellUninstallScriptData = InstallationScriptResponse;

export type CheckServiceHealthData = ServiceHealthResponse;

export type GetServiceSpecificationData = ServiceSpecResponse;

export interface GetSourceFileParams {
  /** Filename */
  filename: string;
}

export type GetSourceFileData = SourceFileResponse;

export type GetSourceFileError = HTTPValidationError;

export type GetInstallationBundleData = InstallationBundleResponse;

/** Response Get Health Check Template */
export type GetHealthCheckTemplateData = Record<string, any>;

/** Response Get Print Request Templates */
export type GetPrintRequestTemplatesData = Record<string, any>;

export type GetPackageInfoData = PackageInfo;

export type DownloadPrinterServicePackageData = any;

export type SyncInstallerFilesData = InstallerSyncResponse;

/** Response Get Installer Files Status */
export type GetInstallerFilesStatusData = Record<string, any>;

export interface ListWorkflowRunsParams {
  /**
   * Owner
   * @default "Bodzaman"
   */
  owner?: string;
  /**
   * Repo
   * @default "cottage-pos-desktop"
   */
  repo?: string;
  /**
   * Workflow File
   * @default "build-combined-installer.yml"
   */
  workflow_file?: string;
  /**
   * Per Page
   * @default 10
   */
  per_page?: number;
}

export type ListWorkflowRunsData = WorkflowRunsResponse;

export type ListWorkflowRunsError = HTTPValidationError;

export interface GetWorkflowRunJobsParams {
  /** Run Id */
  run_id: number;
  /**
   * Owner
   * @default "Bodzaman"
   */
  owner?: string;
  /**
   * Repo
   * @default "cottage-pos-desktop"
   */
  repo?: string;
}

/** Response Get Workflow Run Jobs */
export type GetWorkflowRunJobsData = Job[];

export type GetWorkflowRunJobsError = HTTPValidationError;

export interface GetJobLogsParams {
  /** Job Id */
  job_id: number;
  /**
   * Owner
   * @default "Bodzaman"
   */
  owner?: string;
  /**
   * Repo
   * @default "cottage-pos-desktop"
   */
  repo?: string;
}

export type GetJobLogsData = JobLogsResponse;

export type GetJobLogsError = HTTPValidationError;

export interface GetLatestFailedRunLogsParams {
  /**
   * Owner
   * @default "Bodzaman"
   */
  owner?: string;
  /**
   * Repo
   * @default "cottage-pos-desktop"
   */
  repo?: string;
  /**
   * Workflow File
   * @default "build-combined-installer.yml"
   */
  workflow_file?: string;
}

/** Response Get Latest Failed Run Logs */
export type GetLatestFailedRunLogsData = Record<string, any>;

export type GetLatestFailedRunLogsError = HTTPValidationError;

export type GetLatestPosReleaseData = ReleaseInfo;

export type GetCustomerCountData = CustomerCountResponse;

export interface GetEmailVerificationStatusParams {
  /** User Id */
  userId: string;
}

export type GetEmailVerificationStatusData = EmailVerificationStatusResponse;

export type GetEmailVerificationStatusError = HTTPValidationError;

export type SendVerificationEmailData = SendVerificationEmailResponse;

export type SendVerificationEmailError = HTTPValidationError;

export interface GetOrderHistoryParams {
  /**
   * Limit
   * @default 100
   */
  limit?: number;
  /** Customer Id */
  customerId: string;
}

export type GetOrderHistoryData = OrderHistoryListResponse;

export type GetOrderHistoryError = HTTPValidationError;

export type SetupFavoriteListsSchemaData = AppApisFavoriteListsSetupSetupResponse;

/** Response Check Favorite Lists Schema */
export type CheckFavoriteListsSchemaData = Record<string, any>;

export interface GetUserFavoritesParams {
  /** User Id */
  user_id: string;
}

export type GetUserFavoritesData = FavoritesResponse;

export type GetUserFavoritesError = HTTPValidationError;

export type AddFavoriteData = FavoriteActionResponse;

export type AddFavoriteError = HTTPValidationError;

export type RemoveFavoriteData = FavoriteActionResponse;

export type RemoveFavoriteError = HTTPValidationError;

export interface CheckFavoriteStatusParams {
  /** User Id */
  user_id: string;
  /** Menu Item Id */
  menu_item_id: string;
  /** Variant Id */
  variant_id?: string | null;
}

export type CheckFavoriteStatusData = FavoriteStatusResponse;

export type CheckFavoriteStatusError = HTTPValidationError;

export interface ClearAllFavoritesParams {
  /** User Id */
  user_id: string;
}

export type ClearAllFavoritesData = FavoriteActionResponse;

export type ClearAllFavoritesError = HTTPValidationError;

export type CreateFavoriteListData = CreateListResponse;

export type CreateFavoriteListError = HTTPValidationError;

/** Response Rename Favorite List */
export type RenameFavoriteListData = Record<string, any>;

export type RenameFavoriteListError = HTTPValidationError;

/** Response Delete Favorite List */
export type DeleteFavoriteListData = Record<string, any>;

export type DeleteFavoriteListError = HTTPValidationError;

/** Response Add Favorite To List */
export type AddFavoriteToListData = Record<string, any>;

export type AddFavoriteToListError = HTTPValidationError;

/** Response Remove Favorite From List */
export type RemoveFavoriteFromListData = Record<string, any>;

export type RemoveFavoriteFromListError = HTTPValidationError;

export interface GetCustomerListsParams {
  /** Customer Id */
  customerId: string;
}

export type GetCustomerListsData = GetListsResponse;

export type GetCustomerListsError = HTTPValidationError;

export type ShareFavoriteListData = ShareListResponse;

export type ShareFavoriteListError = HTTPValidationError;

export interface GetSharedFavoriteListParams {
  /** Token */
  token: string;
}

export type GetSharedFavoriteListData = SharedListResponse;

export type GetSharedFavoriteListError = HTTPValidationError;

/** Response Favorite Lists Health */
export type FavoriteListsHealthData = Record<string, any>;

/** Response Fix Customer Favorites Schema */
export type FixCustomerFavoritesSchemaData = Record<string, any>;

export type DiagnoseCustomersFkData = any;

export type FixCustomersFkData = any;

export type FixCustomersRlsPoliciesData = RLSFixResponse;

export type AutoConfirmEmailData = AutoConfirmEmailResponse;

export type AutoConfirmEmailError = HTTPValidationError;

export interface GetPersonalizationSettingsParams {
  /** Customer Id */
  customer_id: string;
}

export type GetPersonalizationSettingsData = PersonalizationSettingsResponse;

export type GetPersonalizationSettingsError = HTTPValidationError;

export type UpdatePersonalizationSettingsData = UpdatePersonalizationResponse;

export type UpdatePersonalizationSettingsError = HTTPValidationError;

export type FixForeignKeyData = FixResult;

export type CheckProfilesConstraintsData = FixResponse;

export type DropLoyaltyTokenConstraintData = FixResponse;

export type MakeLoyaltyTokenNullableData = FixResponse;

export type DiagnoseSignupErrorData = AppApisAuthSignupDiagnosticDiagnosticResponse;

export type CheckAuthTriggersData = AppApisAuthSignupDiagnosticDiagnosticResponse;

export type SetupOnboardingDatabaseData = any;

export type InitializeOnboardingData = any;

export type InitializeOnboardingError = HTTPValidationError;

export interface GetOnboardingStatusParams {
  /** Customer Id */
  customerId: string;
}

export type GetOnboardingStatusData = OnboardingStatusResponse;

export type GetOnboardingStatusError = HTTPValidationError;

export type MarkTourCompleteData = any;

export type MarkTourCompleteError = HTTPValidationError;

export type MarkWizardCompleteData = any;

export type MarkWizardCompleteError = HTTPValidationError;

export interface UpdateEmailStepParams {
  /** Customer Id */
  customer_id: string;
  /** Step */
  step: number;
}

export type UpdateEmailStepData = any;

export type UpdateEmailStepError = HTTPValidationError;

/** Response Setup Chatbot Prompts Table */
export type SetupChatbotPromptsTableData = Record<string, any>;

/** Response Check Chatbot Prompts Schema */
export type CheckChatbotPromptsSchemaData = Record<string, any>;

/** Response Init Simple Chatbot Table */
export type InitSimpleChatbotTableData = Record<string, any>;

/** Response Check Chatbot Table */
export type CheckChatbotTableData = Record<string, any>;

export type InitializeUnifiedAgentConfigData = InitializeResponse;

export type GetUnifiedAgentConfigData = UnifiedAgentConfigResponse;

export type GetChatConfigData = ChatConfigResponse;

export type UpdateUnifiedAgentConfigData = UnifiedAgentConfigResponse;

export type UpdateUnifiedAgentConfigError = HTTPValidationError;

export type UnifiedAgentConfigStatusData = StatusResponse;

export type PublishWizardConfigData = UnifiedAgentConfigResponse;

export type PublishWizardConfigError = HTTPValidationError;

export type LookupMenuItemByCodeData = MenuItemCodeResponse;

export type LookupMenuItemByCodeError = HTTPValidationError;

export type NaturalLanguageSearchData = NaturalLanguageSearchResponse;

export type NaturalLanguageSearchError = HTTPValidationError;

export type GenerateMenuItemCodeData = CodeGenerationResponse;

export type GenerateMenuItemCodeError = HTTPValidationError;

export type CheckVoiceMenuMatchingHealthData = any;

export interface GetFullMenuContextParams {
  /**
   * Include Inactive
   * @default false
   */
  include_inactive?: boolean;
  /** Category Filter */
  category_filter?: string | null;
  /**
   * Compact Mode
   * @default false
   */
  compact_mode?: boolean;
}

export type GetFullMenuContextData = AIMenuContextResponse;

export type GetFullMenuContextError = HTTPValidationError;

export type ValidateMenuItemData = MenuValidationResult;

export type ValidateMenuItemError = HTTPValidationError;

/** Response Get Context Summary */
export type GetContextSummaryData = Record<string, any>;

/** Response Check Tables Status */
export type CheckTablesStatusData = Record<string, any>;

export type SetupMenuTables2Data = MenuTablesResponse;

/** Response Test Sql Function Menu Tables */
export type TestSqlFunctionMenuTablesData = Record<string, any>;

export type ExecuteSimpleMigrationData = SimpleMigrationResponse;

export type VerifySimpleMigrationData = SimpleMigrationResponse;

export type GetCustomizationsData = CustomizationsResponse;

export type GetVoiceAgentCustomizationsData = VoiceAgentCustomizationsResponse;

export type CreateCustomizationData = CustomizationResponse;

export type CreateCustomizationError = HTTPValidationError;

export interface UpdateCustomizationParams {
  /** Customization Id */
  customizationId: string;
}

export type UpdateCustomizationData = CustomizationResponse;

export type UpdateCustomizationError = HTTPValidationError;

export interface DeleteCustomizationParams {
  /** Customization Id */
  customizationId: string;
}

export type DeleteCustomizationData = CustomizationResponse;

export type DeleteCustomizationError = HTTPValidationError;

export type SetupCartAnalyticsTableData = AppApisSetupCartAnalyticsTableSetupResponse;

export type CheckCartAnalyticsTableData = AppApisSetupCartAnalyticsTableSetupResponse;

export type GetMenuDataStatusData = MenuDataDiagnostics;

export type CreateSectionParentRecordsData = SectionCreationResult;

export interface GetEnrichedFavoritesParams {
  /** Customer Id */
  customer_id: string;
}

export type GetEnrichedFavoritesData = EnrichedFavoritesResponse;

export type GetEnrichedFavoritesError = HTTPValidationError;

export type GetMenuForVoiceAgentData = any;

export type GetMenuForVoiceAgentTextData = any;

export type GetMenuForVoiceAgentHtmlData = any;

export type AnalyzeCategoryMigrationData = MigrationAnalysisResult;

export type ExecuteCategoryMigrationData = MigrationExecutionResult;

export type VerifyCategoryMigrationData = MigrationVerificationResult;

export interface RollbackCategoryMigrationParams {
  /** Snapshot Json */
  snapshot_json: string;
}

export type RollbackCategoryMigrationData = MigrationRollbackResult;

export type RollbackCategoryMigrationError = HTTPValidationError;

export type ForceRefreshMenuData = ForceRefreshResponse;

export type PopulateMissingVariantsData = AppApisDatabaseMigrationMigrationResult;

export type CheckMissingVariantsData = any;

export type FixDuplicateVariantNamesData = any;

export type CreatePosOrderData = POSOrderResponse;

export type CreatePosOrderError = HTTPValidationError;

export type ProcessTemplateVariablesData = TemplateVariablesResponse;

export type ProcessTemplateVariablesError = HTTPValidationError;

export type GetAvailableVariablesEndpointData = VariableListResponse;

export type GetAvailableVariablesEndpointError = HTTPValidationError;

export type GetSampleOrderDataEndpointData = SampleDataResponse;

export type GetSampleOrderDataEndpointError = HTTPValidationError;

export type ProcessTemplateWithSampleData = TemplateVariablesResponse;

export type ProcessTemplateWithSampleError = HTTPValidationError;

export type StoreOrderData = OrderStoreResponse;

export type StoreOrderError = HTTPValidationError;

export interface GetOrdersParams {
  /**
   * Page
   * Page number
   * @default 1
   */
  page?: number;
  /**
   * Page Size
   * Items per page
   * @default 20
   */
  page_size?: number;
  /** Start Date */
  start_date?: string | null;
  /** End Date */
  end_date?: string | null;
  /** Order Type */
  order_type?: string | null;
  /** Order Source */
  order_source?: string | null;
  /** Payment Method */
  payment_method?: string | null;
  /** Status */
  status?: string | null;
  /** Table Number */
  table_number?: number | null;
  /** Search */
  search?: string | null;
}

export type GetOrdersData = OrderListResponse;

export type GetOrdersError = HTTPValidationError;

export interface GetReconciliationSummaryParams {
  /** Start Date */
  start_date: string;
  /** End Date */
  end_date: string;
  /** Order Type */
  order_type?: string | null;
}

export type GetReconciliationSummaryData = ReconciliationSummary;

export type GetReconciliationSummaryError = HTTPValidationError;

export interface GetOrderByIdParams {
  /** Order Id */
  orderId: string;
}

export type GetOrderByIdData = any;

export type GetOrderByIdError = HTTPValidationError;

export interface ExportOrdersParams {
  /** Start Date */
  start_date?: string | null;
  /** End Date */
  end_date?: string | null;
  /** Order Type */
  order_type?: string | null;
  /** Payment Method */
  payment_method?: string | null;
  /** Status */
  status?: string | null;
}

export type ExportOrdersData = any;

export type ExportOrdersError = HTTPValidationError;

export type ProcessCashPaymentData = CashPaymentResponse;

export type ProcessCashPaymentError = HTTPValidationError;

export interface GetOrderItemsParams {
  /** Order Id */
  orderId: string;
}

export type GetOrderItemsData = OrderItemsResponse;

export type GetOrderItemsError = HTTPValidationError;

export type GetCustomerProfilePostData = CustomerProfileResponse;

export type GetCustomerProfilePostError = HTTPValidationError;

export interface GetCustomerProfileParams {
  /** Email */
  email?: string | null;
  /** Phone */
  phone?: string | null;
  /** Customer Id */
  customer_id?: string | null;
  /** Customer Reference */
  customer_reference?: string | null;
  /** Customer Reference Number */
  customer_reference_number?: string | null;
  /**
   * Comprehensive
   * @default true
   */
  comprehensive?: boolean | null;
}

export type GetCustomerProfileData = CustomerProfileResponse;

export type GetCustomerProfileError = HTTPValidationError;

export interface GetUserOrdersParams {
  /** Userid */
  userId?: string | null;
  /** User Id */
  user_id?: string | null;
  /** Email */
  email?: string | null;
  /**
   * Limit
   * @default 50
   */
  limit?: number;
}

export type GetUserOrdersData = UserOrdersResponse;

export type GetUserOrdersError = HTTPValidationError;

export type LookupCustomerData = CustomerProfileResponse;

export type LookupCustomerError = HTTPValidationError;

/** Response Customer Profile Health */
export type CustomerProfileHealthData = Record<string, any>;

export type CreateReceiptTemplateData = TemplateResponse;

export type CreateReceiptTemplateError = HTTPValidationError;

export interface ListReceiptTemplatesParams {
  /** User Id */
  user_id: string;
}

export type ListReceiptTemplatesData = TemplateListResponse;

export type ListReceiptTemplatesError = HTTPValidationError;

export interface GetReceiptTemplateParams {
  /** User Id */
  user_id: string;
  /** Template Id */
  templateId: string;
}

export type GetReceiptTemplateData = TemplateGetResponse;

export type GetReceiptTemplateError = HTTPValidationError;

export interface UpdateReceiptTemplateParams {
  /** Template Id */
  templateId: string;
}

export type UpdateReceiptTemplateData = TemplateResponse;

export type UpdateReceiptTemplateError = HTTPValidationError;

export interface DeleteReceiptTemplateParams {
  /** Template Id */
  templateId: string;
}

export type DeleteReceiptTemplateData = AppApisReceiptTemplatesDeleteResponse;

export type DeleteReceiptTemplateError = HTTPValidationError;

export type GetTemplateAssignmentsData = TemplateAssignmentsResponse;

export type SetTemplateAssignmentData = SetTemplateAssignmentResponse;

export type SetTemplateAssignmentError = HTTPValidationError;

export interface GetTemplateAssignmentParams {
  /** Order Mode */
  orderMode: string;
}

export type GetTemplateAssignmentData = TemplateAssignment;

export type GetTemplateAssignmentError = HTTPValidationError;

export interface ResetTemplateAssignmentParams {
  /** Order Mode */
  orderMode: string;
}

export type ResetTemplateAssignmentData = SetTemplateAssignmentResponse;

export type ResetTemplateAssignmentError = HTTPValidationError;

export type InitializeDefaultAssignmentsData = TemplateAssignmentsResponse;

export interface AddHierarchicalColumnsParams {
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
}

export type AddHierarchicalColumnsData = AppApisMediaHierarchicalMigrationMigrationResult;

export type AddHierarchicalColumnsError = HTTPValidationError;

export interface BackfillMenuImagesParams {
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
}

export type BackfillMenuImagesData = BackfillResult;

export type BackfillMenuImagesError = HTTPValidationError;

export interface BackfillAiAvatarsParams {
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
}

export type BackfillAiAvatarsData = BackfillResult;

export type BackfillAiAvatarsError = HTTPValidationError;

export interface RunFullMigrationParams {
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
}

export type RunFullMigrationData = MigrationReport;

export type RunFullMigrationError = HTTPValidationError;

/** Response Verify Schema */
export type VerifySchemaData = Record<string, any>;

export interface AddOptimizationColumnsParams {
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
}

export type AddOptimizationColumnsData = AppApisMediaAssetsOptimizerSchemaSchemaUpdateResponse;

export type AddOptimizationColumnsError = HTTPValidationError;

export type CheckOptimizationColumnsData = AppApisMediaAssetsOptimizerSchemaSchemaUpdateResponse;

export type SetupTriggerData = SetupTriggerResponse;

export type BackfillCustomersData = AppApisAuthSyncBackfillResponse;

export type CheckStatusData = AppApisAuthSyncSyncStatusResponse;

export type AuthSyncHealthCheckData = any;

/** Response Check Printer Health */
export type CheckPrinterHealthData = Record<string, any>;

export type GetPrinterCapabilitiesData = CapabilitiesResponse;

export type PrintRichTemplateData = AppApisThermalPrinterPrintResponse;

export type PrintRichTemplateError = HTTPValidationError;

export type PrintKitchenTicketData = AppApisThermalPrinterPrintResponse;

export type PrintKitchenTicketError = HTTPValidationError;

export type PrintCustomerReceiptData = AppApisThermalPrinterPrintResponse;

export type PrintCustomerReceiptError = HTTPValidationError;

export type PrintKitchenAndCustomerData = DualPrintResponse;

export type PrintKitchenAndCustomerError = HTTPValidationError;

export type ThermalTestPrintData = AppApisThermalPrinterPrintResponse;

export type ViewMenuItemsWithVariantsData = VariantsViewResponse;

export interface TestBatchVariantsDryRunParams {
  /**
   * Limit
   * @default 10
   */
  limit?: number | null;
}

export type TestBatchVariantsDryRunData = AppApisTestBatchVariantsDryRunResult;

export type TestBatchVariantsDryRunError = HTTPValidationError;

export interface RunBatchGenerationParams {
  /** Limit */
  limit?: number | null;
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
}

export type RunBatchGenerationData = any;

export type RunBatchGenerationError = HTTPValidationError;

export type CreateVariantNameTriggerData = TriggerFixResponse;

export type SetupVariantNameTriggerData = AppApisVariantNameTriggerSetupSetupResponse;

export type BackfillExistingVariantsData = AppApisVariantNameTriggerSetupBackfillResponse;

export type VerifyTriggerSetupData = any;

export type SetupVariantNamePatternSchemaData = AppApisVariantNamePatternSchemaSchemaResponse;

export type CheckVariantNamePatternSchemaData = AppApisVariantNamePatternSchemaSchemaResponse;

export type GetMenuCorpusData = MenuCorpusResponse;

export type GetMenuCorpusError = HTTPValidationError;

export interface SyncMenuCorpusParams {
  /**
   * Force
   * Force refresh of menu data
   * @default false
   */
  force?: boolean;
}

export type SyncMenuCorpusData = MenuCorpusResponse;

export type SyncMenuCorpusError = HTTPValidationError;

/** Response Get Menu Corpus Debug */
export type GetMenuCorpusDebugData = Record<string, any>;

/** Response Get Menu Corpus Health */
export type GetMenuCorpusHealthData = Record<string, any>;

export type GetMenuCorpusHealthError = HTTPValidationError;

export type SetupPublishSchemaData = any;

export type PublishMenuData = PublishMenuResponse;

export type GetMenuStatusData = MenuStatusResponse;

export type SetupProfileImagesInfrastructureData = ProfileImageResponse;

export type UploadProfileImageData = ProfileImageResponse;

export type UploadProfileImageError = HTTPValidationError;

export interface SyncGoogleProfileImageParams {
  /** User Id */
  user_id: string;
  /** Google Image Url */
  google_image_url?: string | null;
}

export type SyncGoogleProfileImageData = ProfileImageResponse;

export type SyncGoogleProfileImageError = HTTPValidationError;

export interface DeleteProfileImageParams {
  /** User Id */
  user_id: string;
}

export type DeleteProfileImageData = ProfileImageResponse;

export type DeleteProfileImageError = HTTPValidationError;

export interface GetProfileImageParams {
  /** User Id */
  userId: string;
}

export type GetProfileImageData = ProfileImageResponse;

export type GetProfileImageError = HTTPValidationError;

export type UploadPrimaryAgentAvatarData = AvatarUploadResponse;

export type UploadPrimaryAgentAvatarError = HTTPValidationError;

export type ValidateMediaAssetsData = ValidateAssetsResponse;

export type ValidateMediaAssetsError = HTTPValidationError;

export interface CheckMediaAssetUsageParams {
  /** Asset Id */
  asset_id: string;
}

/** Response Check Media Asset Usage */
export type CheckMediaAssetUsageData = Record<string, any>;

export type CheckMediaAssetUsageError = HTTPValidationError;

export type UploadMenuItemImageData = ImageUploadResponse;

export type UploadMenuItemImageError = HTTPValidationError;

export type MenuImageUploadHealthData = any;

export type UploadMenuImageData = FileUploadResponse;

export type UploadMenuImageError = HTTPValidationError;

export type UploadAvatarData = FileUploadResponse;

export type UploadAvatarError = HTTPValidationError;

export type UploadGeneralFileData = FileUploadResponse;

export type UploadGeneralFileError = HTTPValidationError;

export interface GetMediaLibraryParams {
  /** Category */
  category?: string | null;
  /** Subcategory */
  subcategory?: string | null;
  /** Tags */
  tags?: string | null;
  /**
   * Page
   * @default 1
   */
  page?: number;
  /**
   * Page Size
   * @default 20
   */
  page_size?: number;
}

export type GetMediaLibraryData = MediaLibraryResponse;

export type GetMediaLibraryError = HTTPValidationError;

export interface GetRecentMediaAssetsParams {
  /**
   * Limit
   * @default 10
   */
  limit?: number;
}

/** Response Get Recent Media Assets */
export type GetRecentMediaAssetsData = Record<string, any>;

export type GetRecentMediaAssetsError = HTTPValidationError;

export interface GetMediaAssetParams {
  /** Asset Id */
  assetId: string;
}

/** Response Get Media Asset */
export type GetMediaAssetData = Record<string, any>;

export type GetMediaAssetError = HTTPValidationError;

/** Updates */
export type UpdateMediaAssetPayload = Record<string, any>;

export interface UpdateMediaAssetParams {
  /** Asset Id */
  assetId: string;
}

/** Response Update Media Asset */
export type UpdateMediaAssetData = Record<string, any>;

export type UpdateMediaAssetError = HTTPValidationError;

export interface DeleteMediaAssetParams {
  /** Asset Id */
  assetId: string;
}

/** Response Delete Media Asset */
export type DeleteMediaAssetData = Record<string, any>;

export type DeleteMediaAssetError = HTTPValidationError;

/** Response Link Media To Menu Item */
export type LinkMediaToMenuItemData = Record<string, any>;

export type LinkMediaToMenuItemError = HTTPValidationError;

export interface UnlinkMediaParams {
  /** Link Id */
  linkId: string;
}

/** Response Unlink Media */
export type UnlinkMediaData = Record<string, any>;

export type UnlinkMediaError = HTTPValidationError;

/** Response Bulk Update Media Tags */
export type BulkUpdateMediaTagsData = Record<string, any>;

export type BulkUpdateMediaTagsError = HTTPValidationError;

/** Response Get Storage Status */
export type GetStorageStatusData = Record<string, any>;

/** Response Cleanup Orphaned Media */
export type CleanupOrphanedMediaData = Record<string, any>;

/** Response Get Media Usage Summary */
export type GetMediaUsageSummaryData = Record<string, any>;

/** Response Setup Unified Media Schema */
export type SetupUnifiedMediaSchemaData = Record<string, any>;

export type ValidateAvatarLimitData = AvatarLimitResponse;

export type GetHierarchicalMediaData = HierarchicalMediaResponse;

export type GetHierarchicalStatsData = any;

export type ImportAvatarsFromStorageData = any;

export type InitPosSettingsData = SavePOSSettingsResponse;

export type GetPosSettingsData = GetPOSSettingsResponse;

export type SavePosSettingsData = SavePOSSettingsResponse;

export type SavePosSettingsError = HTTPValidationError;

/** Response Pos Settings Diagnostics */
export type PosSettingsDiagnosticsData = Record<string, any>;

export type SetupVariantFoodDetailsSchemaData = AppApisVariantFoodDetailsSchemaSchemaResponse;

export type CheckVariantFoodDetailsSchemaData = AppApisVariantFoodDetailsSchemaSchemaResponse;

export type GetMenuItemsData = any;

export type CreateMenuItemData = any;

export type CreateMenuItemError = HTTPValidationError;

export interface UpdateMenuItemParams {
  /** Item Id */
  itemId: string;
}

export type UpdateMenuItemData = any;

export type UpdateMenuItemError = HTTPValidationError;

export interface DeleteMenuItemParams {
  /** Item Id */
  itemId: string;
}

export type DeleteMenuItemData = any;

export type DeleteMenuItemError = HTTPValidationError;

export type BulkDeleteItemsData = BulkOperationResponse;

export type BulkDeleteItemsError = HTTPValidationError;

export type BulkToggleActiveData = BulkOperationResponse;

export type BulkToggleActiveError = HTTPValidationError;

export type DeleteSingleItemData = DeleteItemResponse;

export type DeleteSingleItemError = HTTPValidationError;

export type GetCategoriesData = any;

export type GetProteinTypesData = any;

export type AddIsAvailableColumnData = AppApisFixMenuIsAvailableSchemaFixResponse;

export type CheckIsAvailableColumnData = any;

export type GetNextDisplayOrderData = OrderingResponse;

export type GetNextDisplayOrderError = HTTPValidationError;

export type GetNextItemDisplayOrderData = OrderingResponse;

export type GetNextItemDisplayOrderError = HTTPValidationError;

export type ReorderSiblingsData = OrderingResponse;

export type ReorderSiblingsError = HTTPValidationError;

export type GetMenuWithOrderingData = OrderingResponse;

export type UpdateVariantPricingData = PricingResponse;

export type UpdateVariantPricingError = HTTPValidationError;

export type BatchUpdatePricingData = PricingResponse;

export type BatchUpdatePricingError = HTTPValidationError;

export type ApplyCategoryTemplateData = TemplateApplicationResponse;

export type ApplyCategoryTemplateError = HTTPValidationError;

/** Response Get Template Status */
export type GetTemplateStatusData = Record<string, any>;

export type CreateCartTableData = CartSetupResponse;

/** Response Get Cart Table Status */
export type GetCartTableStatusData = Record<string, any>;

export type AddItemToCartData = AddItemResponse;

export type AddItemToCartError = HTTPValidationError;

export type RemoveItemFromCartData = RemoveItemResponse;

export type RemoveItemFromCartError = HTTPValidationError;

export type UpdateItemQuantityData = UpdateQuantityResponse;

export type UpdateItemQuantityError = HTTPValidationError;

export type UpdateItemCustomizationsData = UpdateCustomizationsResponse;

export type UpdateItemCustomizationsError = HTTPValidationError;

export type GetCartSummaryData = GetSummaryResponse;

export type GetCartSummaryError = HTTPValidationError;

export type ClearCartData = ClearCartResponse;

export type ClearCartError = HTTPValidationError;

export interface GetCartParams {
  /** User Id */
  user_id?: string | null;
  /** Session Id */
  session_id?: string | null;
}

export type GetCartData = GetCartResponse;

export type GetCartError = HTTPValidationError;

export type UploadOptimizedMenuImageData = OptimizedMediaResponse;

export type UploadOptimizedMenuImageError = HTTPValidationError;

export type MenuMediaOptimizerHealthCheckData = any;

export interface BatchGenerateVariantsParams {
  /** Limit */
  limit?: number | null;
  /**
   * Dry Run
   * @default false
   */
  dry_run?: boolean;
  /** Asset Type */
  asset_type?: string | null;
}

export type BatchGenerateVariantsData = BatchGenerationResponse;

export type BatchGenerateVariantsError = HTTPValidationError;

export type AddTerminalPaymentColumnsData = AppApisDatabaseSetupSetupResult;

/** Response Verify Terminal Payment Schema */
export type VerifyTerminalPaymentSchemaData = Record<string, any>;

export type AddCartAiColumnsData = AppApisDatabaseSetupSetupResult;

/** Response Verify Cart Ai Schema */
export type VerifyCartAiSchemaData = Record<string, any>;

/** Response Drop Cart Unique Constraint */
export type DropCartUniqueConstraintData = Record<string, any>;

export interface TestCustomizationsEndToEndParams {
  /** Test Session Id */
  test_session_id?: string | null;
}

/** Response Test Customizations End To End */
export type TestCustomizationsEndToEndData = Record<string, any>;

export type TestCustomizationsEndToEndError = HTTPValidationError;

export interface TestCustomizationsWithRealItemParams {
  /** Menu Item Id */
  menu_item_id: string;
  /** Test Session Id */
  test_session_id?: string | null;
}

/** Response Test Customizations With Real Item */
export type TestCustomizationsWithRealItemData = Record<string, any>;

export type TestCustomizationsWithRealItemError = HTTPValidationError;

/** Response Test Customizations Schema Fix */
export type TestCustomizationsSchemaFixData = Record<string, any>;

export type GetChatCartContextData = CartContextResponse;

export type GetChatCartContextError = HTTPValidationError;

export interface GetCartSummaryTextParams {
  /** User Id */
  user_id?: string | null;
}

/** Response Get Cart Summary Text */
export type GetCartSummaryTextData = Record<string, string>;

export type GetCartSummaryTextError = HTTPValidationError;

export type ChatCartContextHealthData = any;

export interface GenerateSystemPromptParams {
  /**
   * Channel
   * Channel to generate prompt for
   * @default "chat"
   */
  channel?: "chat" | "voice";
}

export type GenerateSystemPromptData = GenerateSystemPromptResponse;

export type GenerateSystemPromptError = HTTPValidationError;

export type PreviewPromptData = PreviewPromptResponse;

export type PreviewPromptError = HTTPValidationError;

export type PromptGeneratorHealthData = AppApisPromptGeneratorHealthCheckResponse;

export type CreateMenuVariantsRpcData = CreateRPCResponse;

export type DropMenuVariantsRpcData = DropRPCResponse;

export interface TestMenuVariantsRpcParams {
  /** Category */
  category?: string | null;
  /** Dietary Filter */
  dietary_filter?: string | null;
  /** Search Query */
  search_query?: string | null;
  /**
   * Order Mode
   * @default "collection"
   */
  order_mode?: string;
}

/** Response Test Menu Variants Rpc */
export type TestMenuVariantsRpcData = Record<string, any>;

export type TestMenuVariantsRpcError = HTTPValidationError;

export type CreateMenuUnifiedViewData = CreateViewResponse;

export type DropMenuUnifiedViewData = DropViewResponse;

/** Response Test Menu Unified View */
export type TestMenuUnifiedViewData = Record<string, any>;

export type GetRestaurantSettingsData = GetSettingsResponse;

export type SaveRestaurantSettingsData = SaveSettingsResponse;

export type SaveRestaurantSettingsError = HTTPValidationError;

export interface GetCustomizationsForItemParams {
  /** Menu Item Id */
  menuItemId: string;
}

export type GetCustomizationsForItemData = ItemCustomizationsResponse;

export type GetCustomizationsForItemError = HTTPValidationError;

export type ValidateCustomizationData = ValidateCustomizationResponse;

export type ValidateCustomizationError = HTTPValidationError;

/** Response Ai Customizations Health Check */
export type AiCustomizationsHealthCheckData = Record<string, any>;

export type CreateBaseCacheData = CreateCacheResponse;

export type CreateBaseCacheError = HTTPValidationError;

export type ListCachesData = ListCachesResponse;

export type ExtendCacheData = ExtendCacheResponse;

export type ExtendCacheError = HTTPValidationError;

export interface DeleteCacheParams {
  /** Cache Name */
  cacheName: string;
}

export type DeleteCacheData = DeleteCacheResponse;

export type DeleteCacheError = HTTPValidationError;

export type GeminiCacheHealthCheckData = any;

export interface GetOnlineOrdersParams {
  /**
   * Page
   * Page number
   * @default 1
   */
  page?: number;
  /**
   * Page Size
   * Items per page
   * @default 20
   */
  page_size?: number;
  /** Start Date */
  start_date?: string | null;
  /** End Date */
  end_date?: string | null;
  /** Status */
  status?: string | null;
  /** Search */
  search?: string | null;
}

export type GetOnlineOrdersData = OnlineOrderResponse;

export type GetOnlineOrdersError = HTTPValidationError;

export type CreateOnlineOrderData = CreateOnlineOrderResponse;

export type CreateOnlineOrderError = HTTPValidationError;

export type CreatePaymentIntentData = CreatePaymentIntentResponse;

export type CreatePaymentIntentError = HTTPValidationError;

export type GetStripePublishableKeyData = StripeConfigResponse;

export type StripeWebhookData = WebhookEventResponse;

export type ConfirmPaymentData = ConfirmPaymentResponse;

export type ConfirmPaymentError = HTTPValidationError;

export type StreamChatData = any;

export type StreamChatError = HTTPValidationError;

export type CheckStreamingHealthData = any;

/** Response List Available Models */
export type ListAvailableModelsData = ModelInfo[];

export type GetCartSuggestionsData = RecommendationsResponse;

export type GetCartSuggestionsError = HTTPValidationError;

/** Response Get Cache Stats */
export type GetCacheStatsData = Record<string, any>;

/** Response Clear Cache */
export type ClearCacheData = Record<string, any>;

/** Response Ai Recommendations Health */
export type AiRecommendationsHealthData = Record<string, any>;

export type GeocodeData = GeocodingResponse;

export type GeocodeError = HTTPValidationError;

export type GenerateStaticMapData = StaticMapResponse;

export type GenerateStaticMapError = HTTPValidationError;

export type GetStaticMapsConfigData = any;

export type ValidateDeliveryPostcodeData = BusinessRulesValidationResponse;

export type ValidateDeliveryPostcodeError = HTTPValidationError;

export type ValidateOpeningHoursData = BusinessRulesValidationResponse;

export type ValidateOpeningHoursError = HTTPValidationError;

/** Response Get Current Business Rules */
export type GetCurrentBusinessRulesData = Record<string, any>;

export type ValidateOrderData = ComprehensiveValidationResponse;

export type ValidateOrderError = HTTPValidationError;

export interface GetMapImageProxyParams {
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /**
   * Width
   * @default 120
   */
  width?: number;
  /**
   * Height
   * @default 80
   */
  height?: number;
  /**
   * Zoom
   * @default 15
   */
  zoom?: number;
  /**
   * Marker Color
   * @default "0x8B1538"
   */
  marker_color?: string;
}

export type GetMapImageProxyData = any;

export type GetMapImageProxyError = HTTPValidationError;

export type CalculateDeliveryRouteData = DeliveryResponse;

export type CalculateDeliveryRouteError = HTTPValidationError;

export type CalculateEnhancedDeliveryRouteData = EnhancedDeliveryResponse;

export type CalculateEnhancedDeliveryRouteError = HTTPValidationError;

/** Response Get Maps Config */
export type GetMapsConfigData = Record<string, any>;

export type CheckAllServicesData = AppApisHealthMonitoringHealthCheckResponse;

export type GetHealthStatusData = AppApisHealthMonitoringHealthCheckResponse;

export interface CheckSpecificServiceParams {
  /**
   * Service
   * Service to check
   */
  service: "supabase" | "stripe" | "google_ai" | "google_maps";
}

export type CheckSpecificServiceData = HealthStatusResponse;

export type CheckSpecificServiceError = HTTPValidationError;

export interface GetHealthHistoryParams {
  /**
   * Limit
   * @default 50
   */
  limit?: number;
}

export type GetHealthHistoryData = HealthHistoryResponse;

export type GetHealthHistoryError = HTTPValidationError;

/** Response Clear Health Cache */
export type ClearHealthCacheData = Record<string, string>;

export type RunCustomizationTestData = CustomizationTestResponse;

export type RunCustomizationTestError = HTTPValidationError;

export type TestCustomizationsHealthCheckData = any;

export interface TestModeAnyParams {
  /**
   * Query
   * @default "what main courses do you have?"
   */
  query?: string;
  /**
   * Mode
   * @default "ANY"
   */
  mode?: string;
}

export type TestModeAnyData = any;

export type TestModeAnyError = HTTPValidationError;

export type TestModeAnyHealthCheckData = any;

export interface TestModeAnyMultiturnParams {
  /**
   * Query
   * @default "what main courses do you have?"
   */
  query?: string;
  /**
   * Mode
   * @default "ANY"
   */
  mode?: string;
}

export type TestModeAnyMultiturnData = any;

export type TestModeAnyMultiturnError = HTTPValidationError;

export type TestVoiceExecutorData = any;

export type TestVoiceExecutorError = HTTPValidationError;

export type TestAllCartOperationsData = any;

export type TestAllCartOperationsError = HTTPValidationError;

export type TestAllVoiceFunctionsData = any;

export type TestAllVoiceFunctionsError = HTTPValidationError;

export type ListSupportedFunctionsData = any;

export type HealthCheckData = any;

export type InitializeGoogleLiveVoiceSettingsData = AppApisGoogleLiveVoiceConfigBaseResponse;

export type GetGoogleLiveVoiceSettingsData = AppApisGoogleLiveVoiceConfigBaseResponse;

export type UpdateGoogleLiveVoiceSettingsData = AppApisGoogleLiveVoiceConfigBaseResponse;

export type UpdateGoogleLiveVoiceSettingsError = HTTPValidationError;

export type GoogleLiveVoiceStatusData = AppApisGoogleLiveVoiceConfigBaseResponse;

export type TestGoogleLiveVoiceCallData = AppApisGoogleLiveVoiceConfigBaseResponse;

export type PublishVoiceSettingsData = AppApisGoogleLiveVoiceConfigBaseResponse;

export type CreateChatbotPromptData = ChatbotPromptResponse;

export type CreateChatbotPromptError = HTTPValidationError;

export interface ListChatbotPromptsParams {
  /**
   * Published Only
   * @default false
   */
  published_only?: boolean;
  /**
   * Active Only
   * @default false
   */
  active_only?: boolean;
}

/** Response List Chatbot Prompts */
export type ListChatbotPromptsData = ChatbotPromptResponse[];

export type ListChatbotPromptsError = HTTPValidationError;

/** Response Get Active Prompt */
export type GetActivePromptData = ChatbotPromptResponse | null;

export interface GetChatbotPromptParams {
  /** Prompt Id */
  promptId: string;
}

export type GetChatbotPromptData = ChatbotPromptResponse;

export type GetChatbotPromptError = HTTPValidationError;

export interface UpdateChatbotPromptParams {
  /** Prompt Id */
  promptId: string;
}

export type UpdateChatbotPromptData = ChatbotPromptResponse;

export type UpdateChatbotPromptError = HTTPValidationError;

/** Response Set Active Prompt */
export type SetActivePromptData = Record<string, any>;

export type SetActivePromptError = HTTPValidationError;

export interface DeleteChatbotPromptParams {
  /** Prompt Id */
  promptId: string;
}

/** Response Delete Chatbot Prompt */
export type DeleteChatbotPromptData = Record<string, any>;

export type DeleteChatbotPromptError = HTTPValidationError;

export interface PublishPromptParams {
  /** Prompt Id */
  promptId: string;
}

export type PublishPromptData = ChatbotPromptResponse;

export type PublishPromptError = HTTPValidationError;

export interface UnpublishPromptParams {
  /** Prompt Id */
  promptId: string;
}

export type UnpublishPromptData = ChatbotPromptResponse;

export type UnpublishPromptError = HTTPValidationError;

/** Response Get Available Models */
export type GetAvailableModelsData = Record<string, string[]>;

/** Response Chatbot Prompts Health */
export type ChatbotPromptsHealthData = Record<string, any>;

export type GetMenuContextData = MenuContextResponse;

export type SearchMenuData = SearchMenuResponse;

export type SearchMenuError = HTTPValidationError;

export type CreateGeminiVoiceSessionData = GeminiVoiceSessionResponse;

export type CreateGeminiVoiceSessionError = HTTPValidationError;

export type VoiceSessionHealthData = any;

export type ChatStreamData = any;

export type ChatStreamError = HTTPValidationError;

export type CheckStructuredStreamingHealthData = any;

export type InitializeAiVoiceSettingsData = any;

export type GetAiVoiceSettingsData = AIVoiceSettingsResponse;

export type UpdateAiVoiceSettingsData = AIVoiceSettingsResponse;

export type UpdateAiVoiceSettingsError = HTTPValidationError;

/** Response Get Master Toggle */
export type GetMasterToggleData = Record<string, any>;

export interface ToggleAiVoiceAssistantParams {
  /** Enabled */
  enabled: boolean;
}

export type ToggleAiVoiceAssistantData = AIVoiceSettingsResponse;

export type ToggleAiVoiceAssistantError = HTTPValidationError;

export type GetLiveCallsData = LiveCallsResponse;

/** Response Test Ai Voice Connection */
export type TestAiVoiceConnectionData = Record<string, any>;

/** Response Sync Printer Workflow Files */
export type SyncPrinterWorkflowFilesData = Record<string, any>;

export type CreatePrinterReleaseData = PrinterReleaseResponse;

export type CreatePrinterReleaseError = HTTPValidationError;

export type GetLatestPrinterReleaseData = LatestPrinterReleaseResponse;

/** Response Get Latest Combined Installer */
export type GetLatestCombinedInstallerData = Record<string, any>;

export interface DeletePrinterReleaseParams {
  /** Version */
  version: string;
}

/** Response Delete Printer Release */
export type DeletePrinterReleaseData = Record<string, any>;

export type DeletePrinterReleaseError = HTTPValidationError;

export type UpdatePosDesktopData = UpdatePOSDesktopResponse;

export type UpdatePosDesktopError = HTTPValidationError;

/** Response Get Pos Desktop Version */
export type GetPosDesktopVersionData = Record<string, any>;

export type SyncPosFilesData = SyncPOSFilesResponse;

export type SyncPosFilesError = HTTPValidationError;

/** Response Preflight Check */
export type PreflightCheckData = Record<string, any>;

export type SyncPrinterServiceData = SyncPrinterServiceResponse;

export type SyncPrinterServiceError = HTTPValidationError;

export interface PushPrinterServiceToGithubEndpointParams {
  /**
   * Commit Message
   * @default "feat: Merge printer service into main repo structure
   *
   * - Add printer-service/ directory with all code
   * - Include NSSM configuration and installer scripts
   * - Add GitHub workflow for automated builds
   * - Prepare for unified installer build (MYA-1301)"
   */
  commit_message?: string;
}

/** Response Push Printer Service To Github Endpoint */
export type PushPrinterServiceToGithubEndpointData = Record<string, any>;

export type PushPrinterServiceToGithubEndpointError = HTTPValidationError;

export type SyncElectronBuilderConfigData = SyncElectronBuilderConfigResponse;

export type AnalyzePosDependenciesData = AnalyzeDependenciesResponse;

export type UpdateFileMappingData = UpdateFileMappingResponse;

export type UpdateFileMappingError = HTTPValidationError;
