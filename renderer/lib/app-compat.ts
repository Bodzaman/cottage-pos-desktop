/**
 * Riff Framework Compatibility Layer
 *
 * This module provides stubs for Riff-specific imports that don't exist
 * in the standalone Electron build. It allows the codebase to be built
 * without errors while maintaining compatibility with the Riff platform.
 *
 * DESKTOP APP: These stubs return sensible defaults so the app can load.
 * Menu data comes from Supabase realtime subscriptions instead of backend API.
 */

// Mode enum (DEV/PROD)
export const Mode = {
  DEV: 'development',
  PROD: 'production'
};

// Current mode (hardcoded for desktop build)
export const mode = process.env.NODE_ENV === 'production' ? Mode.PROD : Mode.DEV;

// App base path (empty for desktop, as it runs locally)
export const APP_BASE_PATH = '';

/**
 * Helper to create a mock Response-like object
 */
const mockResponse = (data: any, ok = true) => ({
  ok,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: ok ? 200 : 500,
});

/**
 * API Client stub for Desktop App
 *
 * CRITICAL methods return sensible defaults.
 * NON-CRITICAL methods are no-ops or return empty data.
 * Menu/order data flows through Supabase realtime instead.
 */
export const apiClient = {
  // ============================================================================
  // CRITICAL: POS Settings - return sensible defaults
  // ============================================================================
  get_pos_settings: async () => mockResponse({
    settings: {
      service_charge: { enabled: false, percentage: 10.0 },
      delivery_charge: { enabled: true, amount: 3.50 },
      delivery: {
        radius_miles: 6.0,
        minimum_order_value: 15.0,
        allowed_postcodes: ["RH20", "BN5", "RH13", "BN6", "RH14"]
      },
      variant_carousel_enabled: true
    }
  }),

  save_pos_settings: async (data: any) => mockResponse({ success: true }),

  // ============================================================================
  // CRITICAL: Menu/POS Bundle - return empty (Supabase realtime handles this)
  // ============================================================================
  get_pos_bundle: async () => mockResponse({
    categories: [],
    menuItems: [],
    proteinTypes: [],
    customizations: [],
    itemVariants: [],
    setMeals: []
  }),

  get_menu_with_ordering: async () => mockResponse({
    categories: [],
    menuItems: [],
    proteinTypes: [],
    customizations: [],
    itemVariants: []
  }),

  get_menu_items: async () => mockResponse({ items: [] }),

  item_details: async (itemId: string) => mockResponse({ item: null }),

  // ============================================================================
  // CRITICAL: Tables - return empty array
  // ============================================================================
  get_tables: async () => mockResponse({ tables: [] }),

  create_table: async (data: any) => mockResponse({ success: true, table: data }),

  update_table: async (tableNumber: number, data: any) => mockResponse({ success: true }),

  update_pos_table: async (tableNumber: number, data: any) => mockResponse({ success: true }),

  delete_pos_table: async (params: any) => mockResponse({ success: true }),

  add_table: async (data: any) => mockResponse({ success: true, table: data }),

  clear_table: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CRITICAL: Orders - return success (orders go through Supabase)
  // ============================================================================
  store_order: async (order: any) => mockResponse({
    success: true,
    order_id: `ORD-${Date.now()}`,
    order
  }),

  get_orders: async (params: any) => mockResponse({ orders: [], total: 0 }),

  get_order_by_id: async (params: any) => mockResponse({ order: null }),

  create_order: async (data: any) => mockResponse({
    success: true,
    order_id: `ORD-${Date.now()}`
  }),

  update_order_status: async (params: any) => mockResponse({ success: true }),

  get_online_orders: async (params: any) => mockResponse({ orders: [], total: 0 }),

  // ============================================================================
  // CRITICAL: Payments - basic stubs
  // ============================================================================
  process_cash_payment: async (data: any) => mockResponse({ success: true }),

  create_payment_intent: async (data: any) => mockResponse({
    clientSecret: null,
    error: 'Payment processing not available in desktop mode'
  }),

  create_payment_intent2: async (data: any) => mockResponse({ success: true }),

  get_payment_config: async () => mockResponse({ configured: false }),

  get_stripe_publishable_key: async () => mockResponse({ key: null }),

  confirm_payment: async (data: any) => mockResponse({ success: true }),

  // ============================================================================
  // LOGGING & ANALYTICS - No-ops (silent)
  // ============================================================================
  log_frontend_render: (data: any) => { /* no-op */ },

  check_cart_analytics_table: async () => mockResponse({ exists: true }, true),

  setup_cart_analytics_table: async () => mockResponse({ success: true }),

  track_cart_event: async (data: any) => mockResponse({ success: true }),

  // ============================================================================
  // MAPS & DELIVERY - return null/empty (graceful degradation)
  // ============================================================================
  get_maps_config: async () => mockResponse({ apiKey: null }),

  geocode: async (params: any) => mockResponse({ results: [] }),

  calculate_delivery_route: async (params: any) => mockResponse({ route: null }),

  calculate_enhanced_delivery_route: async (params: any) => mockResponse({ route: null }),

  validate_delivery_postcode: async (params: any) => mockResponse({
    valid: true,
    message: 'Validation disabled in desktop mode'
  }),

  get_delivery_config: async () => mockResponse({
    delivery_radius: 6,
    minimum_order: 15
  }),

  get_delivery_settings: async () => mockResponse({ settings: {} }),

  // ============================================================================
  // RESTAURANT SETTINGS
  // ============================================================================
  get_restaurant_settings: async () => mockResponse({
    settings: {
      name: 'Cottage Tandoori',
      phone: '',
      address: '',
      opening_hours: {}
    }
  }),

  save_restaurant_settings: async (data: any) => mockResponse({ success: true }),

  // ============================================================================
  // PASSWORD/AUTH
  // ============================================================================
  verify_password: async (params: any) => mockResponse({ valid: true }),

  get_password_status: async () => mockResponse({ has_password: false }),

  update_password: async (params: any) => mockResponse({ success: true }),

  get_current_password: async () => mockResponse({ password: null }),

  // ============================================================================
  // SET MEALS
  // ============================================================================
  list_set_meals: async (params: any) => mockResponse({ set_meals: [] }),

  get_set_meal: async (params: any) => mockResponse({ set_meal: null }),

  create_set_meal: async (data: any) => mockResponse({ success: true }),

  update_set_meal: async (id: string, data: any) => mockResponse({ success: true }),

  delete_set_meal: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // MENU ITEM CRUD
  // ============================================================================
  create_menu_item: async (data: any) => mockResponse({ success: true, item: data }),

  update_menu_item: async (params: any, data?: any) => mockResponse({ success: true }),

  delete_menu_item: async (params: any) => mockResponse({ success: true }),

  bulk_toggle_active: async (params: any) => mockResponse({ success: true }),

  get_menu_status: async () => mockResponse({ status: 'ok' }),

  publish_menu: async () => mockResponse({ success: true }),

  // ============================================================================
  // CUSTOMIZATIONS
  // ============================================================================
  get_customizations: async (params?: any) => mockResponse({ customizations: [] }),

  create_customization: async (data: any) => mockResponse({ success: true }),

  update_customization: async (id: string, data: any) => mockResponse({ success: true }),

  delete_customization: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CATEGORIES
  // ============================================================================
  save_category: async (data: any) => mockResponse({ success: true }),

  get_menu_categories: async (params?: any) => mockResponse({ categories: [] }),

  check_category_delete: async (params: any) => mockResponse({ can_delete: true }),

  safe_delete_category: async (params: any) => mockResponse({ success: true }),

  analyze_section_change_impact: async (params: any) => mockResponse({ impact: [] }),

  move_category_section: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // DINE-IN / TABLE ORDERS
  // ============================================================================
  setup_restaurant_schema: async () => mockResponse({ success: true }),

  setup_customer_tabs_schema: async () => mockResponse({ success: true }),

  list_table_orders: async (params: any) => mockResponse({ table_orders: [] }),

  create_table_order: async (data: any) => mockResponse({
    success: true,
    order_id: `TBL-${Date.now()}`
  }),

  update_table_order: async (params: any, data?: any) => mockResponse({ success: true }),

  complete_table_order: async (params: any) => mockResponse({ success: true }),

  reset_table_to_available: async (params: any) => mockResponse({ success: true }),

  add_items_to_table: async (params: any, items: any) => mockResponse({ success: true }),

  link_tables: async (params: any) => mockResponse({ success: true }),

  unlink_table: async (params: any) => mockResponse({ success: true }),

  get_enriched_order_items: async (params: any) => mockResponse({ items: [] }),

  add_item_to_order: async (params: any) => mockResponse({ success: true }),

  remove_item_from_order: async (params: any) => mockResponse({ success: true }),

  update_item_quantity_dine_in: async (params: any) => mockResponse({ success: true }),

  update_item: async (params: any) => mockResponse({ success: true }),

  send_to_kitchen: async (params: any) => mockResponse({ success: true }),

  request_check: async (params: any) => mockResponse({ success: true }),

  update_guest_count: async (params: any) => mockResponse({ success: true }),

  mark_paid: async (params: any) => mockResponse({ success: true }),

  print_dine_in_bill: async (params: any) => mockResponse({ success: true }),

  print_customer_receipt: async (data: any, headers?: any) => mockResponse({ success: true }),

  update_order_notes: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CUSTOMER TABS
  // ============================================================================
  create_customer_tab: async (data: any) => mockResponse({ success: true, tab_id: `TAB-${Date.now()}` }),

  list_customer_tabs_for_table: async (params: any) => mockResponse({ tabs: [] }),

  add_items_to_customer_tab: async (params: any, items?: any) => mockResponse({ success: true }),

  update_customer_tab: async (params: any, updates?: any) => mockResponse({ success: true }),

  close_customer_tab: async (params: any) => mockResponse({ success: true }),

  split_customer_tab: async (params: any) => mockResponse({ success: true }),

  split_tab: async (params: any) => mockResponse({ success: true, tabs: [] }),

  merge_customer_tabs: async (params: any) => mockResponse({ success: true }),

  merge_tabs: async (params: any) => mockResponse({ success: true }),

  move_items_between_customer_tabs: async (params: any) => mockResponse({ success: true }),

  move_items_between_tabs: async (params: any) => mockResponse({ success: true }),

  delete_customer_tab: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // RECEIPT TEMPLATES
  // ============================================================================
  list_receipt_templates: async (params: any) => mockResponse({ templates: [] }),

  get_receipt_template: async (params: any) => mockResponse({ template: null }),

  create_receipt_template: async (data: any) => mockResponse({ success: true }),

  update_receipt_template: async (params: any, data?: any) => mockResponse({ success: true }),

  delete_receipt_template: async (params: any) => mockResponse({ success: true }),

  get_template_assignments: async () => mockResponse({ assignments: [] }),

  get_template_assignment: async (params: any) => mockResponse({ assignment: null }),

  set_template_assignment: async (params: any) => mockResponse({ success: true }),

  get_template_preview: async (params: any) => mockResponse({ preview: null }),

  preview_template: async (params: any) => mockResponse({ preview: null }),

  reset_default_templates: async () => mockResponse({ success: true }),

  generate_escpos_commands: async (data: any) => mockResponse({ commands: [] }),

  // ============================================================================
  // PRINTING
  // ============================================================================
  check_printer_health: async () => mockResponse({ healthy: false, message: 'Desktop mode' }),

  get_print_jobs: async (params: any) => mockResponse({ jobs: [] }),

  check_thermal_printer_status: async () => mockResponse({ connected: false }),

  print_kitchen_ticket: async (data: any) => mockResponse({ success: true }),

  print_receipt: async (data: any) => mockResponse({ success: true }),

  test_thermal_printers: async (data: any) => mockResponse({ success: true }),

  get_integration_guide: async () => mockResponse({ guide: '' }),

  get_thermal_test_status: async () => mockResponse({ status: 'not_configured' }),

  thermal_test_print: async (data: any) => mockResponse({ success: true }),

  get_service_status: async () => mockResponse({ status: 'offline' }),

  // ============================================================================
  // MEDIA / STORAGE
  // ============================================================================
  get_media_library: async (params?: any) => mockResponse({ assets: [] }),

  get_enhanced_media_library: async (params: any) => mockResponse({ assets: [] }),

  get_media_asset: async (params: any) => mockResponse({ asset: null }),

  update_media_asset: async (params: any, data?: any) => mockResponse({ success: true }),

  delete_media_asset: async (params: any) => mockResponse({ success: true }),

  get_recent_media_assets: async (params: any) => mockResponse({ assets: [] }),

  upload_avatar: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_general: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_general_file: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_menu_image: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_optimized_menu_image: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_avatar_image: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_profile_image: async (data: any) => mockResponse({ success: true, url: '' }),

  delete_avatar_image: async (params: any) => mockResponse({ success: true }),

  delete_profile_image: async (params: any) => mockResponse({ success: true }),

  sync_google_profile_image: async (params: any) => mockResponse({ success: true }),

  bulk_update_tags: async (params: any) => mockResponse({ success: true }),

  bulk_delete_assets: async (params: any) => mockResponse({ success: true }),

  get_hierarchical_media: async (params?: any) => mockResponse({ media: [] }),

  link_media_to_menu_item: async (params: any) => mockResponse({ success: true }),

  link_menu_item_media: async (params: any) => mockResponse({ success: true }),

  get_menu_media_status_v3: async () => mockResponse({ status: 'ok' }),

  get_menu_media_relationships_v3: async (params: any) => mockResponse({ relationships: [] }),

  fix_missing_media_references_v3: async () => mockResponse({ success: true }),

  cleanup_orphaned_media_v3: async (params: any) => mockResponse({ success: true }),

  cleanup_orphaned_media: async (params: any) => mockResponse({ success: true }),

  get_asset_usage: async (params: any) => mockResponse({ usage: [] }),

  replace_asset_in_menu_items: async (params: any) => mockResponse({ success: true }),

  remove_asset_references: async (params: any) => mockResponse({ success: true }),

  validate_media_assets: async (params: any) => mockResponse({ valid: true }),

  get_storage_status: async () => mockResponse({ status: 'ok' }),

  setup_unified_media_schema: async () => mockResponse({ success: true }),

  check_bucket_status: async () => mockResponse({ exists: true }),

  initialize_storage_buckets: async () => mockResponse({ success: true }),

  migrate_images: async (params: any) => mockResponse({ success: true }),

  get_migration_status: async () => mockResponse({ status: 'complete' }),

  check_migration_status2: async () => mockResponse({ migrated: true }),

  check_media_assets_schema_status: async () => mockResponse({ exists: true }),

  // ============================================================================
  // CUSTOMER DATA
  // ============================================================================
  lookup_customer: async (params: any) => mockResponse({ customer: null }),

  get_customer_profile: async (params: any) => mockResponse({ profile: null }),

  get_customer_preferences: async (params: any) => mockResponse({ preferences: {} }),

  update_customer_preferences: async (phone: string, prefs: any) => mockResponse({ success: true }),

  get_user_favorites: async (params: any) => mockResponse({ favorites: [] }),

  add_favorite: async (params: any) => mockResponse({ success: true }),

  remove_favorite: async (params: any) => mockResponse({ success: true }),

  clear_all_favorites: async (params: any) => mockResponse({ success: true }),

  check_favorite_status: async (params: any) => mockResponse({ is_favorite: false }),

  get_customer_lists: async (params: any) => mockResponse({ lists: [] }),

  create_favorite_list: async (params: any) => mockResponse({ success: true }),

  rename_favorite_list: async (params: any) => mockResponse({ success: true }),

  delete_favorite_list: async (params: any) => mockResponse({ success: true }),

  add_favorite_to_list: async (params: any) => mockResponse({ success: true }),

  remove_favorite_from_list: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CART
  // ============================================================================
  get_cart: async (params: any) => mockResponse({ items: [] }),

  add_item_to_cart: async (data: any) => mockResponse({ success: true }),

  remove_item_from_cart: async (params: any) => mockResponse({ success: true }),

  clear_cart: async (params: any) => mockResponse({ success: true }),

  get_cart_suggestions: async (params: any) => mockResponse({ suggestions: [] }),

  // ============================================================================
  // AI / VOICE / AGENTS (stubs - not critical for POS)
  // ============================================================================
  get_unified_agent_config: async () => mockResponse({ config: {} }),

  update_unified_agent_config: async (params: any) => mockResponse({ success: true }),

  get_active_voice_prompt: async () => mockResponse({ prompt: null }),

  publish_wizard_config: async (params: any) => mockResponse({ success: true }),

  generate_system_prompt: async (params: any) => mockResponse({ prompt: '' }),

  get_agent_profiles_endpoint: async () => mockResponse({ profiles: [] }),

  get_voice_types: async () => mockResponse({ types: [] }),

  check_voice_api_health2: async () => mockResponse({ healthy: false }),

  create_agent: async (data: any) => mockResponse({ success: true }),

  update_agent: async (params: any, data?: any) => mockResponse({ success: true }),

  delete_agent: async (params: any) => mockResponse({ success: true }),

  update_agent_avatar: async (params: any) => mockResponse({ success: true }),

  test_agent_call: async (params: any) => mockResponse({ success: true }),

  test_agent_voice: async (agentId: string) => mockResponse({ success: true }),

  get_agent_config: async () => mockResponse({ config: {} }),

  save_agent_config: async (data: any) => mockResponse({ success: true }),

  get_voice_agent_status: async () => mockResponse({ active: false }),

  update_manager_credential2: async (params: any) => mockResponse({ success: true }),

  toggle_ai_voice_assistant: async (params: any) => mockResponse({ success: true }),

  list_active_sessions: async () => mockResponse({ sessions: [] }),

  webrtc_health_check: async () => mockResponse({ healthy: false }),

  initiate_test_call: async (agentId: string, phone: string) => mockResponse({ success: true }),

  create_gemini_voice_session: async (params: any) => mockResponse({ session: null }),

  get_menu_context: async () => mockResponse({ context: {} }),

  search_menu: async (params: any) => mockResponse({ results: [] }),

  get_menu_items_with_variants: async (params: any) => mockResponse({ items: [] }),

  get_item_customizations: async (params: any) => mockResponse({ customizations: [] }),

  get_restaurant_info: async () => mockResponse({ info: {} }),

  check_delivery_zone: async (params: any) => mockResponse({ in_zone: true }),

  get_item_variants: async (params: any) => mockResponse({ variants: [] }),

  get_chat_config: async () => mockResponse({ config: {} }),

  item_lookup_tool: async (params: any) => mockResponse({ item: null }),

  get_cart_tool: async (params: any) => mockResponse({ cart: [] }),

  add_to_cart_tool: async (params: any) => mockResponse({ success: true }),

  webhook_handler: async (data: any) => mockResponse({ success: true }),

  // ============================================================================
  // DATABASE SCHEMA SETUP
  // ============================================================================
  setup_execute_sql_function_consolidated: async () => mockResponse({ success: true }),

  check_database_connection: async () => mockResponse({ connected: true }),

  setup_dining_tables_schema: async () => mockResponse({ success: true }),

  check_dining_tables_schema: async () => mockResponse({ exists: true }),

  setup_kds_schema: async () => mockResponse({ success: true }),

  check_kds_schema: async () => mockResponse({ exists: true }),

  set_kds_pin: async (params: any) => mockResponse({ success: true }),

  verify_kds_pin: async (params: any) => mockResponse({ valid: true }),

  // ============================================================================
  // PROTEINS
  // ============================================================================
  create_protein_type2: async (data: any) => mockResponse({ success: true }),

  update_protein_type2: async (params: any, data?: any) => mockResponse({ success: true }),

  delete_protein_type2: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CUSTOM SERVING SIZES
  // ============================================================================
  list_custom_serving_sizes: async (params: any) => mockResponse({ sizes: [] }),

  create_custom_serving_size: async (data: any) => mockResponse({ success: true }),

  update_custom_serving_size: async (id: string, data: any) => mockResponse({ success: true }),

  delete_custom_serving_size: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  get_realtime_notification_stats: async (params: any) => mockResponse({ stats: {} }),

  get_realtime_notifications: async (params: any) => mockResponse({ notifications: [] }),

  mark_realtime_notifications: async (params: any) => mockResponse({ success: true }),

  get_notification_history: async (params: any) => mockResponse({ history: [] }),

  test_template: async (params: any) => mockResponse({ success: true }),

  get_webhook_notifications: async (params: any) => mockResponse({ notifications: [] }),

  get_payment_notifications_v2: async (params: any) => mockResponse({ notifications: [] }),

  test_notification: async (params: any) => mockResponse({ success: true }),

  mark_webhook_notifications_processed: async (params: any) => mockResponse({ success: true }),

  mark_notifications_processed_v2: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CMS / CONTENT
  // ============================================================================
  get_all_draft_content: async (params: any) => mockResponse({ content: [] }),

  get_published_content: async (params: any) => mockResponse({ content: [] }),

  update_text_content: async (params: any) => mockResponse({ success: true }),

  delete_content: async (params: any) => mockResponse({ success: true }),

  update_display_order: async (params: any) => mockResponse({ success: true }),

  upload_single_image: async (params: any) => mockResponse({ success: true, url: '' }),

  bulk_upload_images: async (params: any) => mockResponse({ success: true }),

  get_draft_theme: async () => mockResponse({ theme: {} }),

  update_theme_setting: async (params: any) => mockResponse({ success: true }),

  reset_theme_to_default: async (params: any) => mockResponse({ success: true }),

  get_draft_layout: async () => mockResponse({ layout: {} }),

  update_layout_setting: async (params: any) => mockResponse({ success: true }),

  reset_layout: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // STRIPE / CHECKOUT
  // ============================================================================
  check_stripe_health: async () => mockResponse({ healthy: false }),

  switch_environment: async (params: any) => mockResponse({ success: true }),

  list_products: async (params: any) => mockResponse({ products: [] }),

  list_charges: async (params: any) => mockResponse({ charges: [] }),

  get_balance: async () => mockResponse({ balance: 0 }),

  create_product: async (data: any) => mockResponse({ success: true }),

  create_price: async (data: any) => mockResponse({ success: true }),

  create_customer: async (data: any) => mockResponse({ success: true }),

  create_coupon: async (data: any) => mockResponse({ success: true }),

  create_sample_payment: async (data: any) => mockResponse({ success: true }),

  create_sample_product: async () => mockResponse({ success: true }),

  createCheckoutPaymentIntent: async (data: any) => mockResponse({ clientSecret: null }),

  confirmCheckoutPayment: async (data: any) => mockResponse({ success: true }),

  getCustomerReference: async (userId: string) => mockResponse({ reference: null }),

  validateDeliveryPostcode: async (params: any) => mockResponse({ valid: true }),

  create_payment_session: async (data: any) => mockResponse({ session: null }),

  create_checkout_session: async (data: any) => mockResponse({ session: null }),

  validate_promo_code: async (params: any) => mockResponse({ valid: false }),

  // ============================================================================
  // REORDER / VALIDATION
  // ============================================================================
  validate_reorder: async (params: any) => mockResponse({ valid: true }),

  // ============================================================================
  // ORDER TRACKING
  // ============================================================================
  get_order_tracking_details: async (params: any) => mockResponse({ details: null }),

  update_order_tracking_status: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // MENU CORPUS / RAG / AI CONTEXT
  // ============================================================================
  get_menu_corpus: async (params: any) => mockResponse({ corpus: [] }),

  get_menu_corpus_redirect: async () => mockResponse({ corpus: [] }),

  get_menu_versions: async (params: any) => mockResponse({ versions: [] }),

  get_sync_schedule: async (params: any) => mockResponse({ schedule: {} }),

  update_sync_schedule: async (schedule: any, params?: any) => mockResponse({ success: true }),

  sync_menu_data_wrapper: async (params: any) => mockResponse({ success: true }),

  sync_menu_corpus: async (params: any) => mockResponse({ success: true }),

  sync_menu_corpus_redirect: async (params: any) => mockResponse({ success: true }),

  sync_restaurant_details_wrapper: async (params: any, options?: any) => mockResponse({ success: true }),

  get_restaurant_details_wrapper: async () => mockResponse({ details: {} }),

  list_corpora: async () => mockResponse({ corpora: [] }),

  delete_corpus: async (params: any) => mockResponse({ success: true }),

  refresh_ai_context: async () => mockResponse({ success: true }),

  get_ai_menu_context: async (params: any) => mockResponse({ context: {} }),

  validate_ai_menu_item: async (query: string, filter?: string) => mockResponse({ valid: true }),

  getContextSummary: async () => mockResponse({ summary: {} }),

  validateMenuItem: async (params: any) => mockResponse({ valid: true }),

  getFullMenuContext: async (params: any) => mockResponse({ context: {} }),

  test_sql_direct_helper: async () => mockResponse({ success: true }),

  populate_sample_menu_data_v2_helper: async () => mockResponse({ success: true }),

  run_comprehensive_test_helper: async () => mockResponse({ success: true }),

  // ============================================================================
  // MISC / OTHER
  // ============================================================================
  get_onboarding_progress: async () => mockResponse({ progress: {} }),

  update_onboarding_progress: async (params: any) => mockResponse({ success: true }),

  fix_all_broken_tools: async () => mockResponse({ success: true }),

  validate_tool_fixes: async () => mockResponse({ valid: true }),

  send_verification_email: async (params: any) => mockResponse({ success: true }),

  update_personalization_settings: async (params: any) => mockResponse({ success: true }),

  auto_confirm_email: async (params: any) => mockResponse({ success: true }),

  view_menu_items_with_variants: async () => mockResponse({ items: [] }),

  update_variant_pricing: async (params: any) => mockResponse({ success: true }),

  list_templates: async () => mockResponse({ templates: [] }),

  get_template: async (params: any) => mockResponse({ template: null }),

  create_template: async (data: any) => mockResponse({ success: true }),

  update_template: async (params: any, data?: any) => mockResponse({ success: true }),

  get_next_item_display_order: async (params: any) => mockResponse({ display_order: 0 }),

  get_storage_item: async (params: any) => mockResponse({ item: null }),

  bulk_delete_items_safe: async (params: any) => mockResponse({ success: true }),

  place_order: async (data: any) => mockResponse({ success: true, order_id: `ORD-${Date.now()}` }),

  place_order_example: async (data: any) => mockResponse({ success: true }),

  unified_menu_business_ordering_menu_with_ordering: async () => mockResponse({ menu: [] }),

  process_payment2: async (data: any) => mockResponse({ success: true }),

  get_current_business_rules: async () => mockResponse({ rules: {} }),

  check_analytics_health: async () => mockResponse({ healthy: true }),

  get_real_time_stats: async () => mockResponse({ stats: {} }),

  get_conversation_analytics: async () => mockResponse({ analytics: {} }),

  get_reconciliation_summary: async (params: any) => mockResponse({ summary: {} }),

  export_orders: async (params: any) => mockResponse({ data: [] }),

  upload_file: async (path: string, data: any) => mockResponse({ success: true, url: '' }),

  upload_multiple_files: async (files: any, path: string) => mockResponse({ success: true }),

  list_refunds: async (params: any) => mockResponse({ refunds: [] }),

  create_refund: async (data: any) => mockResponse({ success: true }),

  validate_opening_hours: async (params: any) => mockResponse({ valid: true }),

  // Helper to get base URL (not used in desktop mode)
  getBaseUrl: () => '',
};

// Database stub - Desktop uses Supabase directly
export const db = {
  storage: {
    // Implement as needed
  }
};

// Export everything that might be imported from 'app'
export default {
  Mode,
  mode,
  APP_BASE_PATH,
  apiClient,
  db
};
