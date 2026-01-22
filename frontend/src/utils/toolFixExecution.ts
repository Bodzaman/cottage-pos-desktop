import brain from 'brain';

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
    
    // Call the fix_all_broken_tools endpoint
    const response = await (brain as any).fix_all_broken_tools();
    const result = await response.json();
    
    
    return {
      success: result.success || false,
      message: result.message || 'Unknown result',
      results: result
    };
    
  } catch (error) {
    
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
    
    const response = await (brain as any).validate_tool_fixes();
    const result = await response.json();
    
    
    return {
      success: result.success || false,
      message: result.message || 'Validation completed',
      toolsStatus: result
    };
    
  } catch (error) {
    
    return {
      success: false,
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
