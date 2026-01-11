/**
 * Schema Verification Script for v1.8.42
 * 
 * This script verifies the actual database column names before deployment.
 * Uses the same Supabase credentials as the Electron app.
 */

const { createClient } = require('@supabase/supabase-js');

// Credentials from supabaseClient.ts
const SUPABASE_URL = 'https://mxrkttvgwwdhgnecqhfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14cmt0dHZnd3dkaGduZWNxaGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTI0NjcsImV4cCI6MjA2MDQ2ODQ2N30.G-Hj0Tf5HpkhzfrZpbxsNcr4-XGA20w5-MRLmix9au4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySchema() {
  console.log('🔍 v1.8.42 Schema Verification\n');
  console.log('='.repeat(50));

  // Test 1: Check media_assets columns
  console.log('\n📷 TEST 1: media_assets table columns');
  console.log('-'.repeat(40));
  const { data: assets, error: assetsError } = await supabase
    .from('media_assets')
    .select('*')
    .limit(1);
  
  if (assetsError) {
    console.log('❌ Error:', assetsError.message);
  } else if (assets && assets.length > 0) {
    const columns = Object.keys(assets[0]);
    console.log('✅ Available columns:', columns.join(', '));
    console.log('📌 Key columns for images:');
    console.log('   - url:', columns.includes('url') ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - file_url:', columns.includes('file_url') ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - square_webp_url:', columns.includes('square_webp_url') ? '✅ EXISTS' : '❌ MISSING');
  } else {
    console.log('⚠️ No data in media_assets table');
  }

  // Test 2: Check item_variants columns and JOIN
  console.log('\n🥩 TEST 2: item_variants table columns');
  console.log('-'.repeat(40));
  const { data: variants, error: variantsError } = await supabase
    .from('item_variants')
    .select(`
      *,
      menu_protein_types:protein_type_id(id, name)
    `)
    .limit(1);
  
  if (variantsError) {
    console.log('❌ Error:', variantsError.message);
  } else if (variants && variants.length > 0) {
    const columns = Object.keys(variants[0]);
    console.log('✅ Available columns:', columns.join(', '));
    console.log('📌 Key columns for variants:');
    console.log('   - price:', columns.includes('price') ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - variant_name:', columns.includes('variant_name') ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - menu_item_id:', columns.includes('menu_item_id') ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - protein_type_id:', columns.includes('protein_type_id') ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - image_asset_id:', columns.includes('image_asset_id') ? '✅ EXISTS' : '❌ MISSING');
    if (variants[0].menu_protein_types) {
      console.log('✅ JOIN to menu_protein_types: WORKING');
    }
  } else {
    console.log('⚠️ No data in item_variants table');
  }

  // Test 3: Check menu_items pricing fields
  console.log('\n💰 TEST 3: menu_items pricing columns');
  console.log('-'.repeat(40));
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('id, name, base_price, price, image_asset_id')
    .limit(3);
  
  if (itemsError) {
    console.log('❌ Error:', itemsError.message);
  } else if (items && items.length > 0) {
    console.log('✅ Sample menu items:');
    items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name}`);
      console.log(`      - base_price: ${item.base_price ?? 'NULL'}`);
      console.log(`      - price: ${item.price ?? 'NULL'}`);
      console.log(`      - image_asset_id: ${item.image_asset_id ?? 'NULL'}`);
    });
  } else {
    console.log('⚠️ No data in menu_items table');
  }

  // Test 4: Count totals
  console.log('\n📊 TEST 4: Record counts');
  console.log('-'.repeat(40));
  
  const { count: itemCount } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  const { count: variantCount } = await supabase
    .from('item_variants')
    .select('*', { count: 'exact', head: true });
  
  const { count: assetCount } = await supabase
    .from('media_assets')
    .select('*', { count: 'exact', head: true });

  console.log(`   - Active menu_items: ${itemCount ?? 'error'}`);
  console.log(`   - item_variants: ${variantCount ?? 'error'}`);
  console.log(`   - media_assets: ${assetCount ?? 'error'}`);

  // Test 5: Image enrichment test (using correct columns)
  console.log('\n🖼️ TEST 5: Image enrichment simulation (v1.8.42 fix)');
  console.log('-'.repeat(40));
  
  const { data: itemsWithAssets } = await supabase
    .from('menu_items')
    .select('id, name, image_asset_id')
    .not('image_asset_id', 'is', null)
    .limit(3);

  if (itemsWithAssets && itemsWithAssets.length > 0) {
    const assetIds = itemsWithAssets.map(i => i.image_asset_id);
    // ✅ FIX: Use correct columns (square_webp_url, square_jpeg_url, url)
    const { data: resolvedAssets, error: assetError } = await supabase
      .from('media_assets')
      .select('id, url, square_webp_url, square_jpeg_url')
      .in('id', assetIds);

    if (assetError) {
      console.log('❌ Error fetching assets:', assetError.message);
    } else {
      console.log('✅ Image enrichment test (v1.8.42 fix):');
      itemsWithAssets.forEach(item => {
        const asset = resolvedAssets?.find(a => a.id === item.image_asset_id);
        // Priority: square_webp_url > square_jpeg_url > url
        const imageUrl = asset?.square_webp_url || asset?.square_jpeg_url || asset?.url || 'NO URL';
        const urlPreview = imageUrl === 'NO URL' ? 'NO URL' : imageUrl.substring(0, 60) + '...';
        console.log(`   - ${item.name}: ${urlPreview}`);
      });
    }
  } else {
    console.log('⚠️ No menu items with image_asset_id found');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Schema verification complete!\n');
}

verifySchema().catch(console.error);
