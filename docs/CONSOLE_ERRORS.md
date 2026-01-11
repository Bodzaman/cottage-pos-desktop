# CONSOLE ERROR CATALOG

*Last Updated: 2026-11-01*

## 🔴 1. HTTP 400 - "active" column does not exist
- **Location**: `useMenuData.ts` (various lines)
- **Call**: `supabase.from('menu_items').select('*').eq('active', true)`
- **Reason**: The database column is named `is_active`.
- **Impact**: Menu items fail to load completely in parts of the app using this hook.

## 🔴 2. HTTP 400 - "table_name" item_variants not found (or view issue)
- **Location**: `BatchPriceUpdate.tsx` / `realtimeMenuStore.ts`
- **Call**: `supabase.from('item_variants')`
- **Reason**: While `item_variants` is a view, some PostgREST configurations require explicit base table access for certain operations.
- **Impact**: Fails to update prices or load variants consistently.

## 🟡 3. Warning - "Price not set" / £0.00 fallback
- **Location**: `POSMenuItemCard.tsx`, `CompactMenuItemCard.tsx`
- **Reason**: `item.price` is undefined because DB uses `base_price` and mapping is missing.
- **Impact**: User cannot see correct prices for items without variants.

## 🟡 4. Console Logs - "Image enrichment failed"
- **Location**: `realtimeMenuStore.ts` (in development mode)
- **Reason**: `media_assets` query returned empty or partial results for specific `image_asset_id`s.
- **Impact**: Fallback images or broken image icons displayed.

## 🟡 5. Prop Type Warnings
- **Location**: Various components
- **Reason**: Sending NULL values from DB into props expecting numbers/strings.
- **Impact**: Minor performance issues and clutter in console.
