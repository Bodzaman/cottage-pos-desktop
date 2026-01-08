import { apiClient } from 'app';

/**
 * Execute the tool fix to apply working createVoiceCartSession pattern
 * to the 3 broken tools: removeFromCart, clearCart, getCartContents
 */
export async function executeToolFix(): Promise<{
  success: boolean;
  message: string;
  results?: any;
}> {
  try {
    console.log('🔧 Starting tool fix execution...');
    
    // Call the fix_all_broken_tools endpoint
    const response = await apiClient.fix_all_broken_tools();
    const result = await response.json();
    
    console.log('📊 Tool fix result:', result);
    
    return {
      success: result.success || false,
      message: result.message || 'Unknown result',
      results: result
    };
    
  } catch (error) {
    console.error('❌ Error executing tool fix:', error);
    
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate that all tools are now properly configured
 */
export async function validateToolFixes(): Promise<{
  success: boolean;
  message: string;
  toolsStatus?: any;
}> {
  try {
    console.log('🔍 Validating tool fixes...');
    
    const response = await apiClient.validate_tool_fixes();
    const result = await response.json();
    
    console.log('📋 Validation result:', result);
    
    return {
      success: result.success || false,
      message: result.message || 'Validation completed',
      toolsStatus: result
    };
    
  } catch (error) {
    console.error('❌ Error validating fixes:', error);
    
    return {
      success: false,
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
