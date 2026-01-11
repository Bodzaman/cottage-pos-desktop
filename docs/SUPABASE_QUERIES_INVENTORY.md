# SUPABASE QUERIES INVENTORY

*Last Updated: 2026-11-01*

## 🔍 Overview of Query Patterns

The codebase uses three main patterns for querying Supabase:
1. **Zustand Store (`realtimeMenuStore.ts`)**: Direct queries for initial load and real-time subscriptions for updates.
2. **React Query (`menuQueries.ts`)**: Modern data fetching with caching and automatic revalidation.
3. **Custom Hooks (`useMenuData.ts`, `useDineInOrder.ts`, etc.)**: Component-specific queries using raw Supabase client.

---

## 🍽️ Menu Queries

| File Location | Purpose | Table Accessed | Selection |
|---------------|---------|----------------|-----------|
| `realtimeMenuStore.ts` | Fallback data refresh | `menu_categories` | `*` |
| `realtimeMenuStore.ts` | Fallback data refresh | `menu_items` | `*` (Fails: `.eq('is_active', true)`) |
| `realtimeMenuStore.ts` | Image resolution | `media_assets` | `id, url, square_webp_url, square_jpeg_url` |
| `menuQueries.ts` | Fetch variants | `menu_item_variants`| `*, protein_type:menu_protein_types(name)` |
| `useMenuData.ts` | Load online menu | `menu_items` | `*` (Broken: `.eq('active', true)`) |
| `posSupabaseHelpers.ts`| Pos specific fetching | `menu_items` | `id, name, base_price, category_id, ...` |

## 📦 Order & Table Queries

| File Location | Purpose | Table Accessed | Selection |
|---------------|---------|----------------|-----------|
| `useRestaurantTables.ts`| Fetch POS tables | `pos_tables` | `*` |
| `useDineInOrder.ts` | Fetch active order | `orders` | `*` |
| `POSDesktop.tsx` | Create order | `orders` | `.insert(orderData)` |
| `useCustomerTabs.ts` | Manage tabs | `customer_tabs` | `*` (Needs verification) |

---

## ⚠️ Identified Query Risks

1. **Broken `eq()` filters**: Multiple files attempt to filter by `active` on the `menu_items` table, but the database only has `is_active`.
2. **Missing Joins**: Some queries select `*` but miss essential related data (like images or protein types), leading to "empty" UI states.
3. **Redundant Fetching**: The same data is fetched via `apiClient`, `supabase.from()`, and sometimes specific hooks within the same session.
