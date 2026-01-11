# CODE-LEVEL ISSUES & ANTI-PATTERNS

*Last Updated: 2026-11-01*

## 🛠️ Item 1: Fragmented Source of Truth
- **Issue**: Menu data is loaded via `realtimeMenuStore`, `useMenuData`, and `menuQueries` (React Query) simultaneously.
- **Impact**: One part of the app might show an image while another doesn't because the enrichment logic only exists in one of the three.
- **Fix**: Standardize on `realtimeMenuStore` for state and `menuQueries` for initial fetching/caching.

## 🛠️ Item 2: Manual Mapping in Components
- **Issue**: Components like `POSMenuItemCard` contain logic to check for `base_price` or `price`.
- **Impact**: Logic duplication and risk of displaying different prices on different screens.
- **Fix**: All price mapping should happen at the Store/Helper level before reaching the component.

## 🛠️ Item 3: Hardcoded Column Names
- **Issue**: Several files have `.select('id, name, active...')` with `active` hardcoded.
- **Impact**: These break as soon as the database column is updated to `is_active`.
- **Fix**: Use a centralized `DB_COLUMNS` constant or ensure all queries are updated to the current schema.

## 🛠️ Item 4: Missing Error Boundaries for Media
- **Issue**: If a `media_asset` query fails, the item remains in a "loading" state or shows a broken icon.
- **Impact**: Poor UX during network hiccups.
- **Fix**: Implement a default fallback image URL at the store level.

## 🛠️ Item 5: View vs Table Inconsistency
- **Issue**: Querying `item_variants` (VIEW) can be slower or return cached data compared to `menu_item_variants` (TABLE).
- **Fix**: Standardize on the BASE TABLE for all queries that require fresh or writable data.
