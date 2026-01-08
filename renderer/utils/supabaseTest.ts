// Test file to verify the Proxy pattern is working correctly
import { supabase } from './supabaseClient';

export const testSupabaseProxy = async () => {
  try {
    console.log('🧪 Testing Supabase proxy access...');
    
    // Test 1: Check if supabase object exists
    console.log('1. Supabase object exists:', !!supabase);
    
    // Test 2: Check if auth property is accessible
    console.log('2. Auth property exists:', !!supabase.auth);
    
    // Test 3: Check if we can call a method without crashing
    try {
      const { data: session } = await supabase.auth.getSession();
      console.log('3. getSession() call successful:', !!session);
    } catch (authError) {
      console.error('3. getSession() failed:', authError);
    }
    
    // Test 4: Check if from() method is accessible
    console.log('4. from() method exists:', typeof supabase.from === 'function');
    
    console.log('✅ Supabase proxy tests completed');
    return true;
    
  } catch (error) {
    console.error('❌ Supabase proxy test failed:', error);
    return false;
  }
};

// Run test immediately when imported
if (typeof window !== 'undefined') {
  // Only run in browser
  setTimeout(() => {
    testSupabaseProxy();
  }, 100);
}
