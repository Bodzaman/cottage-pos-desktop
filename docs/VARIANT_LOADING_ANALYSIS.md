# VARIANT LOADING ANALYSIS

*Last Updated: 2026-11-01*

## 🔍 Investigation Findings

1. **Table Confusion**:
   - `item_variants` is a database VIEW.
   - `menu_item_variants` is the BASE TABLE.
   - **Current Code**: `realtimeMenuStore.ts` queries the `item_variants` view, while `menuQueries.ts` queries the `menu_item_variants` base table. This inconsistency can lead to different data being loaded depending on the hook used.

2. **Active Filtering**:
   - Both tables have `active` and `is_active` boolean columns.
   - **Bug**: The code consistently filters by `is_active = true`. However, some rows have `active = false` but `is_active = true` (legacy data issue), causing inactive variants to appear in the POS UI.

3. **Protein Type Joins**:
   - Variants depend on `menu_protein_types` for their base names (Chicken, Lamb, etc.).
   - **Requirement**: All variant queries must include a JOIN with `menu_protein_types` and enrichment of the `protein_type_name` field.

## 🛠️ Required Fixes

1. **Switch to Base Table**: Standardize all variant queries to use the `menu_item_variants` base table to ensure consistent read/write behavior.
2. **Double-Active Filter**: Use `.eq('is_active', true).eq('active', true)` (or a single authoritative field) to filter visibility.
3. **Enriched Names**: Ensure the `protein_type_name` is always populated using the JOIN from `menu_protein_types`.
4. **Variant Mapping**: Map `id` and `menu_item_id` correctly in the store to ensure they pair with the parent `MenuItem`.
