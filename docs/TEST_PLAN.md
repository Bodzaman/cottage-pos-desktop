# TEST PLAN - SCHEMA ALIGNMENT VALIDATION

*Last Updated: 2026-11-01*

## 🖼️ 1. Image Display Tests
- [ ] **Single Item**: Open POS, find "TANDOORI CHICKEN" (no variants). Verify image displays.
- [ ] **Multi-Variant Item**: Find "TIKKA". Verify image displays even if main item has none (should pull from first variant).
- [ ] **Variant Specifics**: Hover/select different variants of "SHASHLICK". Verify image updates if variant has unique image.
- [ ] **Fallback**: Verify items with no database images show placeholder instead of broken icon.

## 💰 2. Price Display Tests
- [ ] **Base Price**: Verify "£0.00" or "Price not set" is gone for single-price items.
- [ ] **Dine-In Mode**: Switch to DINE-IN. Verify prices update to `price_dine_in` (if set) or fallback to `base_price`.
- [ ] **Delivery Mode**: Switch to DELIVERY. Verify delivery charges and mode-specific pricing are applied.
- [ ] **Variant Pricing**: Verify "from £X.XX" format is correct in the grid.

## 🥗 3. Variant Loading Tests
- [ ] **Filtering**: Verify that variants marked `active=false` OR `is_active=false` in DB do NOT appear in UI.
- [ ] **Protein Names**: Verify all variants show their protein names (Chicken, Lamb, etc.) correctly from the JOIN.
- [ ] **Completeness**: Compare list of variants for "TIKKA" with Riff version. Should match 1:1.

## 📝 4. Order Management Tests
- [ ] **Creation**: Select a table, seat guests. Verify order is created in Supabase with correct `table_id` (UUID).
- [ ] **Add Items**: Add items to a DINE-IN table. Verify storage in `dine_in_order_items` table.
- [ ] **Financials**: Save an order. Verify `tax_amount` (not `vat_amount`) is populated in the database.
- [ ] **Persistence**: Refresh app. Verify DINE-IN table remains "OCCUPIED" and order items reload correctly.

## 🛠️ 5. Technical Validation
- [ ] **Console**: F12 console should have zero 400 errors related to "column not found".
- [ ] **Performance**: Menu navigation should be snappy with the new pre-computed lookup tables.
