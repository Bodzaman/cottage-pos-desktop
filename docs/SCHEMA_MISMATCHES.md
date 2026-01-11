# SCHEMA MISMATCH REPORT

*Last Updated: 2026-11-01*

## 🍽️ `menu_items` Mismatches

| Database Column | TypeScript Field (`MenuItem`) | Issue |
|-----------------|-------------------------------|-------|
| `is_active` | `active` / `is_active` | DB has `is_active`, but `useMenuData.ts` queries for `active` (Does not exist). |
| `base_price` | `base_price` / `price` | DB uses `base_price`. Store maps it manually to `price`. |
| `image_asset_id`| `image_asset_id` | Match, but enrichment from `media_assets` is required for display. |
| `print_to_kitchen`| (Missing in item) | Exists in DB (usually inherited from category). |

## 🥗 `item_variants` (Base Table: `menu_item_variants`) Mismatches

| Database Column | TypeScript Field (`ItemVariant`) | Issue |
|-----------------|---------------------------------|-------|
| `is_active` | `is_active` | Match. |
| `active` | `active` | DB has both `is_active` and `active`. Code uses both. |
| `price` | `price` | DB has `price` (not `base_price` for variants). |
| `price_dine_in` | `price_dine_in` | Match. |
| `image_asset_id`| `image_asset_id` | Match, but enrichment required. |

## 📁 `menu_categories` Mismatches

| Database Column | TypeScript Field (`Category`) | Issue |
|-----------------|-------------------------------|-------|
| `is_active` | `active` | Code maps `is_active` to `active`. |
| `sort_order` | `display_order` | Code maps `sort_order` to `display_order`. |
| `parent_category_id`| `parent_category_id` | DB has `parent_category_id`. Code sometimes uses `parent_id`. |

## 📝 `orders` Mismatches

The `Order` interface in `menuTypes.ts` is extremely simplified compared to the `orders` table.

| Database Column | TypeScript Field (`Order`) | Status |
|-----------------|----------------------------|--------|
| `order_number` | (Missing) | CRITICAL: Required for tracking. |
| `total_amount` | `total` | Mapping needed. |
| `subtotal` | `subtotal` | Match. |
| `delivery_fee` | (Missing) | Required for delivery orders. |
| `tax_amount` | (Missing) | Required for accounting. |
| `payment_status`| (Missing) | Required for closing orders. |

## 🪑 `pos_tables` Mismatches

| Database Column | TypeScript Field (`Table`) | Status |
|-----------------|----------------------------|--------|
| `table_number` | `id` | CRITICAL: Code uses `table_number` as `id` in some places. |
| `id` | `id` | DB `id` is UUID. |
| `status` | `status` | Match (AVAILABLE/OCCUPIED). |

---

## 🔍 ROOT CAUSES FOUND

1. **Broken Queries**: `useMenuData.ts` queries `menu_items` using `.eq('active', true)`, which fails since the column is named `is_active`.
2. **Missing Metadata**: Many components expect `image_url` but the database only provides `image_asset_id`. Enrichment from `media_assets` is inconsistent.
3. **Inconsistent Naming**: `parent_id` vs `parent_category_id` and `sort_order` vs `display_order` causing mapping logic to fail or return `undefined`.
