# IMAGE DISPLAY ANALYSIS

*Last Updated: 2026-11-01*

## 🔍 Investigation Findings

1. **Dual Asset ID Pattern**: Both `menu_items` and `menu_item_variants` have an `image_asset_id` column.
   - Items with variants (e.g., TIKKA) often have `menu_items.image_asset_id = NULL` but populated `image_asset_id` on their individual variants.
   - Items without variants (e.g., TANDOORI CHICKEN) have `menu_items.image_asset_id` populated.

2. **Media Assets Table**: Images are not stored as URLs but as links to the `media_assets` table.
   - Required Logic: `media_assets` must be queried using the `image_asset_id`.
   - Priority: `square_webp_url` → `square_jpeg_url` → `url`.

3. **Current Code Logic**:
   - `realtimeMenuStore.ts` contains an enrichment function `fallbackRefreshData()` that attempts to resolve these IDs.
   - **Bug**: It collects IDs from both items and variants but doesn't always apply them correctly to the UI-facing `image_url` property for variants.
   - **Bug**: The `apiClient.get_menu_with_ordering()` call (preferred over fallback) may not be returning correctly enriched URLs for the Electron app's specific needs.

## 🛠️ Required Fixes

1. **Unified Enrichment**: The enrichment logic should be extracted and applied consistently across all data loading methods (`refreshData`, `fallbackRefreshData`, and `fetchSupplementaryData`).
2. **Variant-Level Resolution**: Ensure that when an item has variants, each variant's `image_url` is resolved from its own `image_asset_id`.
3. **Fallback to Item Image**: If a variant has no image, it should fallback to the parent item's image.
4. **Component Update**: Update `POSMenuItemCard.tsx` and others to prioritize `variant.image_url` when a variant is selected.
