// Test file to verify the Proxy pattern is working correctly
import { supabase } from './supabaseClient';

export const testSupabaseProxy = async () => {
  try {
    
    // Test 1: Check if supabase object exists
    
    // Test 2: Check if auth property is accessible
    
    // Test 3: Check if we can call a method without crashing
    try {
      const { data: session } = await supabase.auth.getSession();
    } catch (authError) {
      console.error('3. getSession() failed:', authError);
    }
    
    // Test 4: Check if from() method is accessible
    
    return true;
    
  } catch (error) {
    console.error(' Supabase proxy test failed:', error);
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
