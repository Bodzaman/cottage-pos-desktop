# 🎯 ELECTRON POS DESKTOP v1.8.42 - PHASE 1: COMPLETE SUPABASE INTEGRATION

## 📊 PROJECT CONTEXT

**Repository:** ~/Projects/cottage-pos-desktop  
**Current Version:** v1.8.41 (broken - images don't display, prices missing)  
**Target Version:** v1.8.42 (fully functional basic POS)  
**Architecture:** Electron Desktop App → Direct Supabase Queries (anon_key)  

**CRITICAL UNDERSTANDING:**
- Riff backend is NOT accessible from Electron (requires Riff platform session)
- Must use DIRECT Supabase queries for all operations
- Backend integration will come in Phase 2 (when Riff downloads work)
- Focus: Get core POS features working with direct database access

---

## 🔍 ROOT CAUSE ANALYSIS (from v1.8.41 failure)

### Issues Identified:

1. **Media Assets Query Failure (400 Error)**
   - Location: `renderer/utils/realtimeMenuStore.ts` line ~458-461
   - Problem: Querying wrong column names
   - Database has: `url`, `file_url`
   - Code tried: `square_webp_url`, `square_jpeg_url`, `original_url`

2. **Variants Not Loading (count: 0)**
   - Location: `renderer/utils/realtimeMenuStore.ts` line ~416-419
   - Problem: Query syntax or JOIN issues
   - Expected: 14+ variants per Riff backend behavior

3. **Prices Showing as "not set"**
   - Location: Multiple components (POSMenuItemCard, CompactMenuCard, etc.)
   - Problem: Price field mapping incorrect
   - Database has: `base_price` in menu_items, `price` in item_variants

4. **Image Enrichment Logic Incomplete**
   - Partially implemented in v1.8.41
   - Needs verification and testing

---

## 🎯 PHASE 1 OBJECTIVES

### Primary Goals:
✅ Fix media_assets query with correct column names  
✅ Fix item_variants loading with correct JOINs  
✅ Fix price display across all components  
✅ Verify image enrichment works end-to-end  
✅ Test core POS workflow (menu → order → print)  
✅ Document what works vs what needs Phase 2  

### Success Criteria:
- ✅ No 400 errors in F12 console
- ✅ Menu items display WITH images
- ✅ Prices show correctly for all items and variants
- ✅ Variants display properly (14+ variants visible)
- ✅ Orders can be created and saved
- ✅ Printing works (kitchen tickets, receipts)
- ✅ Windows build installs and runs

---

## 📋 TASK BREAKDOWN

### TASK 1: DATABASE SCHEMA VERIFICATION ⚡ PRIORITY 1

**Goal:** Verify actual database column names before writing any code

**Actions:**
1. Read `renderer/utils/realtimeMenuStore.ts` lines 440-480 (media_assets query)
2. Read `renderer/utils/realtimeMenuStore.ts` lines 416-419 (variants query)
3. Create a test script to query actual database schema:

```javascript
// Test file: /tmp/verify-schema.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifySchema() {
  // Test 1: Check media_assets columns
  console.log('=== MEDIA_ASSETS TABLE ===');
  const { data: assets, error: assetsError } = await supabase
    .from('media_assets')
    .select('*')
    .limit(1);
  
  if (assets && assets.length > 0) {
    console.log('Available columns:', Object.keys(assets[0]));
  }
  
  // Test 2: Check item_variants columns and JOIN
  console.log('\n=== ITEM_VARIANTS TABLE ===');
  const { data: variants, error: variantsError } = await supabase
    .from('item_variants')
    .select('*, menu_protein_types:protein_type_id(id, name)')
    .limit(1);
  
  if (variants && variants.length > 0) {
    console.log('Available columns:', Object.keys(variants[0]));
  }
  
  // Test 3: Check menu_items pricing fields
  console.log('\n=== MENU_ITEMS PRICING ===');
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('id, name, base_price, price')
    .limit(1);
  
  console.log('Items data:', items);
}

verifySchema();
```

**Expected Output:**
```
=== MEDIA_ASSETS TABLE ===
Available columns: ['id', 'url', 'file_url', 'created_at', ...]

=== ITEM_VARIANTS TABLE ===
Available columns: ['id', 'menu_item_id', 'variant_name', 'price', ...]

=== MENU_ITEMS PRICING ===
Items data: [{ id: '...', name: '...', base_price: 5.99, price: null }]
```

**Deliverable:** Console output confirming exact column names

---

### TASK 2: FIX MEDIA_ASSETS QUERY ⚡ PRIORITY 1

**File:** `renderer/utils/realtimeMenuStore.ts`

**Current Code (BROKEN):**
```typescript
// Line ~458-461 (approximate)
const { data: mediaAssets, error: mediaError } = await supabase
  .from('media_assets')
  .select('id, square_webp_url, square_jpeg_url, original_url')
  .in('id', Array.from(allAssetIds));
```

**Fix:** Use correct column names from Task 1 verification

```typescript
// FIXED VERSION (use actual columns from Task 1)
const { data: mediaAssets, error: mediaError } = await supabase
  .from('media_assets')
  .select('id, url, file_url')  // ← Use ACTUAL column names
  .in('id', Array.from(allAssetIds));

// Update URL resolution logic
const assetUrlMap = new Map<string, string>();
if (mediaAssets) {
  mediaAssets.forEach(asset => {
    // Priority: url first, then file_url as fallback
    const resolvedUrl = asset.url || asset.file_url;
    if (resolvedUrl) {
      assetUrlMap.set(asset.id, resolvedUrl);
    }
  });
}
```

**Validation:**
- Add console.log before query: `console.log('🖼️ [Image Enrichment] Fetching', allAssetIds.size, 'media assets...');`
- Add console.log after query: `console.log('🖼️ [Image Enrichment] Resolved', assetUrlMap.size, 'image URLs');`
- Check F12 console shows: `"Resolved X image URLs"` where X > 0

---

### TASK 3: FIX ITEM_VARIANTS QUERY ⚡ PRIORITY 1

**File:** `renderer/utils/realtimeMenuStore.ts`

**Current Code (NEEDS VERIFICATION):**
```typescript
// Line ~416-419 (approximate)
const { data: variantsData, error: variantsError } = await supabase
  .from('item_variants')
  .select(`
    *,
    menu_protein_types:protein_type_id(id, name)
  `)
  .order('menu_item_id');
```

**Actions:**
1. Verify JOIN syntax works with Task 1 test
2. Check if table is `item_variants` or `menu_item_variants`
3. Verify foreign key column name (`protein_type_id` or different)
4. Add error handling and logging:

```typescript
const { data: variantsData, error: variantsError } = await supabase
  .from('item_variants')  // Or 'menu_item_variants' - verify from Task 1
  .select(`
    *,
    menu_protein_types:protein_type_id(id, name)
  `)
  .order('menu_item_id');

if (variantsError) {
  console.error('❌ [Variants] Query failed:', variantsError);
  // Continue without variants rather than failing completely
} else {
  console.log('✅ [Variants] Loaded', variantsData?.length || 0, 'variants');
}
```

**Validation:**
- F12 console should show: `"✅ [Variants] Loaded 14 variants"` (or similar count > 0)
- No 400 errors in Network tab

---

### TASK 4: FIX PRICE DISPLAY MAPPING ⚡ PRIORITY 2

**Files to Update:**
- `renderer/utils/menuTypes.ts` (type definitions)
- `renderer/components/POSMenuItemCard.tsx`
- `renderer/components/CompactMenuItemCard.tsx`
- `renderer/components/PremiumMenuCard.tsx`
- `renderer/components/InlineMenuCard.tsx`

**Issue:** Database has `base_price` but components look for `price`

**Fix in realtimeMenuStore.ts:**
```typescript
// When enriching menu items, map base_price to price
const enrichedItems = menuItemsData.map(item => ({
  ...item,
  image_url: assetUrlMap.get(item.image_asset_id),
  price: item.base_price ?? item.price ?? 0,  // ← Map base_price to price
}));
```

**Fix in Components:**
Ensure all components handle price properly:

```typescript
// POSMenuItemCard.tsx example
const displayPrice = item.price ?? item.base_price ?? 0;
```

**Validation:**
- Menu items should show prices like "£5.10", "£6.50", etc.
- NO items should show "Price not set"

---

### TASK 5: VERIFY IMAGE ENRICHMENT END-TO-END ⚡ PRIORITY 2

**File:** `renderer/utils/realtimeMenuStore.ts`

**Current Implementation (v1.8.41):**
```typescript
// Around line 440-500
async function fallbackRefreshData() {
  // 1. Fetch menu items
  const { data: menuItemsData } = await supabase
    .from('menu_items')
    .select('*');
  
  // 2. Collect image_asset_ids
  const allAssetIds = new Set<string>();
  menuItemsData?.forEach(item => {
    if (item.image_asset_id) {
      allAssetIds.add(item.image_asset_id);
    }
  });
  
  // 3. Fetch media_assets (FIX THIS - see Task 2)
  const { data: mediaAssets } = await supabase
    .from('media_assets')
    .select('id, url, file_url')  // ← Use correct columns
    .in('id', Array.from(allAssetIds));
  
  // 4. Create lookup map
  const assetUrlMap = new Map<string, string>();
  mediaAssets?.forEach(asset => {
    assetUrlMap.set(asset.id, asset.url || asset.file_url);
  });
  
  // 5. Enrich items with image URLs
  const enrichedItems = menuItemsData?.map(item => ({
    ...item,
    image_url: assetUrlMap.get(item.image_asset_id),
    price: item.base_price ?? item.price ?? 0,
  }));
  
  console.log('✅ [Image Enrichment] Menu items:', enrichedItems?.length, 'total,', 
    enrichedItems?.filter(i => i.image_url).length, 'with images');
}
```

**Validation:**
1. F12 console shows: `"✅ [Image Enrichment] Menu items: 7 total, 7 with images"` (or similar)
2. Menu cards in UI show actual images (not broken image icons)
3. Network tab shows image URLs being fetched (look for `.webp` or `.jpg` requests)

---

### TASK 6: TEST CORE POS WORKFLOW ⚡ PRIORITY 3

**Test Checklist:**

#### 6.1 Menu Loading
- [ ] Open POS Desktop app
- [ ] Menu items display with images
- [ ] Prices show correctly
- [ ] Variants visible (TIKKA shows CHICKEN/LAMB/KING PRAWN options)
- [ ] Categories work (STARTERS, MAIN COURSE, etc.)

#### 6.2 Order Creation (COLLECTION Mode)
- [ ] Click "COLLECTION" order type
- [ ] Add item to order (e.g., TIKKA - CHICKEN £5.10)
- [ ] Item appears in Order Summary panel
- [ ] Quantity can be incremented/decremented
- [ ] Total calculates correctly

#### 6.3 Customer Details (COLLECTION Mode)
- [ ] Click "Add Customer Details"
- [ ] Fill in: Name, Phone, Email
- [ ] Save customer details
- [ ] Customer badge shows in Order Summary

#### 6.4 Order Completion Flow
- [ ] Click "Process Order" or "Complete Order"
- [ ] Payment flow opens (skip Stripe for Phase 1 testing)
- [ ] Order saves to database
- [ ] Order Summary clears

#### 6.5 DINE-IN Mode (Basic)
- [ ] Click "DINE-IN" order type
- [ ] Select a table (e.g., Table 5)
- [ ] Add items to order
- [ ] Items save to database
- [ ] Table shows as "OCCUPIED"

---

### TASK 7: WINDOWS BUILD & DEPLOYMENT ⚡ PRIORITY 4

**Goal:** Create Windows installer via GitHub Actions

**Steps:**

1. **Update package.json version**
```bash
# In ~/Projects/cottage-pos-desktop
# Update version to 1.8.42
```

2. **Commit all changes**
```bash
git add .
git commit -m "v1.8.42 - Phase 1: Complete Supabase integration

- Fixed media_assets query (correct column names: url, file_url)
- Fixed item_variants loading with proper JOINs
- Fixed price display (map base_price to price)
- Verified image enrichment works end-to-end
- Tested core POS workflow (menu, order, customer)
- All basic POS features working with direct Supabase"
```

3. **Push to GitHub**
```bash
git push origin main
```

4. **Create and push tag**
```bash
git tag v1.8.42
git push origin v1.8.42
```

5. **Wait for GitHub Actions** (~8-10 minutes)
   - Monitor: https://github.com/Bodzaman/cottage-pos-desktop/actions
   - Wait for green checkmark ✅

6. **Create GitHub Release**
   - Go to: https://github.com/Bodzaman/cottage-pos-desktop/releases/new
   - Tag: v1.8.42
   - Title: `v1.8.42 - Phase 1: Core POS Working`
   - Description: (see below)

---

### GitHub Release Description Template:

```markdown
## 🎉 v1.8.42 - Phase 1: Core POS Features Working

**Architecture:** Direct Supabase integration (anon_key)

### ✅ Fixed Issues

1. **Media Assets Query**
   - Fixed 400 error caused by wrong column names
   - Now using correct columns: `url`, `file_url`
   - Images display properly in menu cards

2. **Item Variants Loading**
   - Fixed variant query with correct JOINs
   - All variants now display (14+ variants working)
   - Variant selection works correctly

3. **Price Display**
   - Fixed price mapping (`base_price` → `price`)
   - All items show correct prices
   - No "Price not set" errors

4. **Image Enrichment**
   - End-to-end verification complete
   - Menu items display with actual images
   - Image URLs resolve correctly from media_assets table

### ✅ Working Features

- ✅ Menu loading with images and prices
- ✅ Order creation (COLLECTION, WAITING, DELIVERY modes)
- ✅ Customer data management
- ✅ Order summary and totals
- ✅ Basic DINE-IN mode (table selection, order saving)
- ✅ Printing (kitchen tickets, receipts)

### ⏳ Phase 2 Features (Pending Riff Backend)

These features require backend API and will be added in Phase 2:
- ⏳ AI menu recommendations
- ⏳ Advanced customer intelligence
- ⏳ Complex business rules validation
- ⏳ Analytics and reporting

### 📥 Installation

1. Download `Cottage-Tandoori-POS-Setup-1.8.42.exe`
2. Run installer
3. Launch app
4. Login with POS credentials
5. Start taking orders!

### 🧪 Testing Checklist

- [x] Menu items display with images
- [x] Prices show correctly
- [x] Variants work
- [x] Orders can be created
- [x] Customer details save
- [x] Basic workflow complete

### 🐛 Known Issues

None! All core features working. Phase 2 will add advanced features.

---

**Next:** Phase 2 will integrate FastAPI backend when Riff downloads are fixed.
```

---

## 🎯 VALIDATION CHECKLIST

Before marking v1.8.42 as complete, verify:

### Code Quality
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] No ESLint errors
- [ ] All console.logs are prefixed with emoji identifiers (🖼️, ✅, ❌)

### Functionality
- [ ] Images display in menu cards
- [ ] Prices show correctly (no "not set")
- [ ] Variants load (14+ count visible)
- [ ] Orders can be created
- [ ] Customer details save
- [ ] F12 console shows success logs, no errors

### Performance
- [ ] App loads within 3 seconds
- [ ] No 400/500 errors in Network tab
- [ ] Image enrichment completes quickly (<1 second)

### Deployment
- [ ] Windows installer created via GitHub Actions
- [ ] Installer runs on Windows 10/11
- [ ] App launches without crashes
- [ ] All features work in production build

---

## 📝 DOCUMENTATION REQUIREMENTS

Create/Update these files:

### 1. CHANGELOG.md
```markdown
## v1.8.42 - Phase 1: Core POS Working (2026-01-11)

### Fixed
- Media assets query using correct column names (url, file_url)
- Item variants loading with proper database JOINs
- Price display mapping (base_price → price)
- Image enrichment end-to-end verification

### Working
- Menu loading with images and prices
- Order creation (all modes)
- Customer management
- Basic printing

### Phase 2 (Pending)
- AI recommendations
- Advanced features
- Backend API integration
```

### 2. PHASE1_STATUS.md (New File)
```markdown
# Phase 1 Status: COMPLETE ✅

## What Works
- ✅ Direct Supabase queries with correct column names
- ✅ Menu loading with images
- ✅ Price display
- ✅ Variants loading
- ✅ Order creation
- ✅ Customer management
- ✅ Basic printing

## What Needs Phase 2
- ⏳ Backend API integration
- ⏳ AI features
- ⏳ Advanced analytics

## Architecture
```
Electron App → Supabase (anon_key) → Database
```

## Next Steps
1. Wait for Riff download fix
2. Download full codebase
3. Deploy FastAPI backend to Vercel
4. Point Electron to backend
5. Enable advanced features
```

---

## 🚨 CRITICAL REMINDERS

1. **Use ACTUAL Database Column Names**
   - Don't assume column names
   - Verify with Task 1 schema check
   - Test queries before implementing

2. **Add Logging at Every Step**
   - Use emoji prefixes (🖼️, ✅, ❌)
   - Log successes AND failures
   - Help with debugging

3. **Error Handling**
   - Never let query errors crash the app
   - Graceful fallbacks
   - User-friendly error messages

4. **Test Before Committing**
   - Run app locally
   - Check F12 console
   - Verify all features work

5. **Windows Build via GitHub Actions**
   - Don't try to build on Mac (code signing issues)
   - Use GitHub Actions for Windows
   - Test downloaded installer

---

## 🎯 SUCCESS METRICS

### Technical Success
- ✅ Zero 400 errors in F12 console
- ✅ All menu items show images
- ✅ All prices display correctly
- ✅ Variants count > 0
- ✅ Orders save to database

### User Experience Success
- ✅ App feels responsive
- ✅ UI updates immediately
- ✅ No broken images
- ✅ Clear error messages (if any)

### Deployment Success
- ✅ Windows installer builds successfully
- ✅ Installer runs on Windows 10/11
- ✅ App launches without crashes
- ✅ All features work in production

---

## 📞 WHEN TO ASK FOR HELP

Ask user for clarification if:
1. Database schema doesn't match expectations
2. Queries return unexpected results
3. TypeScript types conflict with database
4. Feature behavior unclear
5. Need credentials or environment variables

---

## 🎬 EXECUTION ORDER

1. ✅ Task 1: Verify database schema (REQUIRED FIRST)
2. ✅ Task 2: Fix media_assets query
3. ✅ Task 3: Fix item_variants query
4. ✅ Task 4: Fix price display
5. ✅ Task 5: Verify image enrichment
6. ✅ Task 6: Test core workflow
7. ✅ Task 7: Build and deploy

**DO NOT SKIP TASK 1** - Schema verification prevents wasted work!

---

## 🎯 FINAL DELIVERABLE

At completion, user should have:
1. ✅ Fully working POS desktop app (Windows)
2. ✅ All core features functional
3. ✅ Clean, documented codebase
4. ✅ GitHub release with installer
5. ✅ Clear documentation on what works vs Phase 2
6. ✅ Confidence to use app in production

---

**START WITH TASK 1 - VERIFY DATABASE SCHEMA FIRST!**