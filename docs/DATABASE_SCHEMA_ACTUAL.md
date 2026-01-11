# ACTUAL DATABASE SCHEMA (Supabase PostgreSQL)

*Last Updated: 2026-11-01*

## 📁 Tables & Views Summary

| Table/View Name | Type | Description |
|-----------------|------|-------------|
| `menu_items` | BASE TABLE | Core menu items |
| `item_variants` | VIEW | View of variants (often used for reads) |
| `menu_item_variants` | BASE TABLE | Underlying table for variants |
| `media_assets` | BASE TABLE | Images and media storage metadata |
| `menu_categories` | BASE TABLE | Category hierarchy |
| `orders` | BASE TABLE | Order storage |
| `pos_tables` | BASE TABLE | DINE-IN table management |

---

## 🍽️ Table: `menu_items`

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `name` | character varying | NO | |
| `description` | text | YES | |
| `base_price` | numeric | NO | |
| `category_id` | uuid | NO | |
| `spice_level` | integer | YES | 0 |
| `is_vegetarian` | boolean | YES | false |
| `is_vegan` | boolean | YES | false |
| `prep_time_minutes` | integer | YES | |
| `allergens` | jsonb | YES | '[]'::jsonb |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `display_print_order` | integer | YES | 0 |
| `item_code` | character varying | YES | |
| `updated_at` | timestamp with time zone | YES | now() |
| `image_asset_id` | uuid | YES | |
| `published_at` | timestamp with time zone | YES | |
| `has_variants` | boolean | YES | false |
| `price_dine_in` | numeric | YES | |
| `price_takeaway` | numeric | YES | |
| `price_delivery` | numeric | YES | |
| `allergen_warnings` | text | YES | |
| `specialty_notes` | text | YES | |
| `chefs_special` | boolean | YES | false |
| `image_widescreen_asset_id` | uuid | YES | |
| `preferred_aspect_ratio` | text | YES | |
| `is_available` | boolean | YES | true |
| `is_gluten_free` | boolean | YES | false |

---

## 🥗 Table: `menu_item_variants`

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| `id` | uuid | NO | uuid_generate_v4() |
| `menu_item_id` | uuid | NO | |
| `variant_name` | character varying | YES | |
| `price` | numeric | NO | 0 |
| `description` | text | YES | |
| `is_default` | boolean | YES | false |
| `display_order` | integer | YES | 0 |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `protein_type_id` | uuid | NO | |
| `image_asset_id` | uuid | YES | |
| `media_type` | character varying | YES | |
| `media_url` | text | YES | |
| `name` | character varying | YES | |
| `image_url` | text | YES | |
| `price_dine_in` | numeric | YES | |
| `price_delivery` | numeric | YES | |
| `variant_code` | character varying | YES | |
| `active` | boolean | YES | true |
| `spice_level` | integer | YES | |
| `allergens` | jsonb | YES | |
| `allergen_notes` | text | YES | |
| `allergen_warnings` | text | YES | |
| `specialty_notes` | text | YES | |
| `chefs_special` | boolean | YES | false |
| `featured` | boolean | YES | false |
| `is_vegetarian` | boolean | YES | false |
| `is_vegan` | boolean | YES | false |
| `is_gluten_free` | boolean | YES | false |
| `is_halal` | boolean | YES | false |
| `is_dairy_free` | boolean | YES | false |
| `is_nut_free` | boolean | YES | false |
| `name_pattern` | character varying | YES | 'suffix'::character varying |

---

## 🖼️ Table: `media_assets`

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `file_name` | text | NO | |
| `type` | text | NO | |
| `url` | text | NO | |
| `tags` | ARRAY | YES | '{}'::text[] |
| `description` | text | YES | |
| `usage` | text | YES | |
| `upload_date` | timestamp with time zone | YES | now() |
| `file_size` | bigint | YES | |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `friendly_name` | text | YES | |
| `width` | integer | YES | |
| `height` | integer | YES | |
| `aspect_ratio` | text | YES | |
| `category` | text | YES | |
| `asset_id` | uuid | NO | |
| `bucket_path` | text | YES | |
| `filename` | text | YES | |
| `original_filename` | text | YES | |
| `file_type` | text | YES | |
| `linked_items` | jsonb | YES | '[]'::jsonb |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `subcategory` | text | YES | |
| `asset_category` | text | YES | 'general'::text |
| `menu_section_id` | uuid | YES | |
| `menu_category_id` | uuid | YES | |
| `usage_context` | jsonb | YES | '{}'::jsonb |
| `bucket_name` | text | YES | |
| `square_webp_url` | text | YES | |
| `widescreen_webp_url` | text | YES | |
| `thumbnail_webp_url` | text | YES | |
| `square_jpeg_url` | text | YES | |
| `widescreen_jpeg_url` | text | YES | |
| `thumbnail_jpeg_url` | text | YES | |

---

## 📁 Table: `menu_categories`

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `name` | character varying | NO | |
| `description` | text | YES | |
| `sort_order` | integer | YES | 0 |
| `category_prefix` | character varying | YES | |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `print_order` | integer | YES | 0 |
| `display_print_order` | integer | YES | 0 |
| `parent_category_id` | text | YES | |
| `is_protein_type` | boolean | YES | false |
| `code_prefix` | character varying | YES | |
| `updated_at` | timestamp with time zone | YES | now() |
| `print_to_kitchen` | boolean | YES | true |

---

## 📝 Table: `orders`

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `order_number` | text | NO | |
| `customer_name` | text | NO | 'Unknown Customer'::text |
| `customer_email` | text | YES | |
| `customer_phone` | text | YES | |
| `order_type` | text | NO | 'DINE_IN'::text |
| `order_source` | text | NO | 'POS'::text |
| `status` | text | NO | 'pending'::text |
| `subtotal` | numeric | NO | 0 |
| `tax_amount` | numeric | YES | 0 |
| `delivery_fee` | numeric | YES | 0 |
| `discount_amount` | numeric | YES | 0 |
| `total_amount` | numeric | NO | |
| `payment_method` | text | YES | |
| `payment_status` | text | YES | 'completed'::text |
| `table_number` | text | YES | |
| `guest_count` | integer | YES | |
| `special_instructions` | text | YES | |
| `notes` | text | YES | |
| `metadata` | jsonb | YES | |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `delivery_address` | jsonb | YES | |
| `items` | jsonb | YES | '[]'::jsonb |
| `promo_code` | text | YES | |
| `pickup_time` | timestamp with time zone | YES | |
| `requested_time` | timestamp with time zone | YES | |
| `staff_id` | uuid | YES | |
| `completed_at` | timestamp with time zone | YES | |
| `service_charge` | numeric | YES | 0.00 |
| `tip_amount` | numeric | YES | 0.00 |
| `status_updated_at` | timestamp with time zone | YES | now() |
| `customer_id` | uuid | YES | |
| `table_id` | uuid | YES | |
| `server_id` | uuid | YES | |
| `server_name` | text | YES | |

---

## 🪑 Table: `pos_tables`

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| `table_number` | integer | NO | |
| `capacity` | integer | NO | |
| `status` | character varying | NO | 'available'::character varying |
| `last_updated` | timestamp with time zone | YES | now() |
| `is_linked_table` | boolean | YES | false |
| `id` | uuid | NO | gen_random_uuid() |
| `current_order_id` | uuid | YES | |
