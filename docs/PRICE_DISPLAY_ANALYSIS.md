# PRICE DISPLAY ANALYSIS

*Last Updated: 2026-11-01*

## 🔍 Investigation Findings

1. **Table Specifics**:
   - `menu_items` uses `base_price` as the main price column.
   - `menu_item_variants` uses `price` as the main price column.
   - Both tables also have `price_dine_in` and `price_delivery` (often NULL, falling back to the main price).

2. **UI Mapping**:
   - The TypeScript `MenuItem` interface has both `base_price` and `price`.
   - Components like `POSMenuItemCard` often check `item.price`.
   - **Bug**: If `item.price` is not explicitly mapped from `base_price`, the UI shows "Price not set" or "£0.00".

3. **Multi-Mode Pricing**:
   - The POS app handles DINE-IN, COLLECTION, and DELIVERY.
   - **Requirement**: The app must correctly switch between `price`, `price_dine_in`, and `price_delivery` based on the selected order type.

## 🛠️ Required Fixes

1. **Standardized Pricing Utility**: Create or update a price resolver helper that handles fallback logic: `(dine_in_price || base_price)`.
2. **Store Mapping**: Ensure `realtimeMenuStore.ts` explicitly maps `base_price` to `price` during data enrichment.
3. **OrderItem Alignment**: When adding items to the cart, the price must be locked based on the CURRENT `order_type`.
4. **Update Type Definitions**: Ensure `OrderItem` and `MenuItem` types clearly identify which price field is being used.
