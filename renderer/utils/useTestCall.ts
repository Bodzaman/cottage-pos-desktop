import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { AgentTestCallResponse } from 'types';

interface TestCallOptions {
  showDetailedErrors?: boolean;
  onSuccess?: (result: AgentTestCallResponse) => void;
  onError?: (error: string) => void;
}

interface TestCallState {
  isLoading: boolean;
  error: string | null;
  lastResult: AgentTestCallResponse | null;
}

export function useTestCall(options: TestCallOptions = {}) {
  const [state, setState] = useState<TestCallState>({
    isLoading: false,
    error: null,
    lastResult: null
  });

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // International format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  };

  const testCall = async (agentId: string, phoneNumber: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate phone number format
      if (!validatePhoneNumber(phoneNumber)) {
        const errorMsg = options.showDetailedErrors 
          ? `Invalid phone number format: '${phoneNumber}'. Must use international format (+441234567890)`
          : 'Please enter a valid phone number in international format (e.g., +441234567890)';
        
        setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
        
        if (options.showDetailedErrors) {
          toast.error(errorMsg);
        } else {
          toast.error('Invalid phone number format');
        }
        
        options.onError?.(errorMsg);
        return;
      }

      // Make the test call request
      const response = await apiClient.initiate_test_call(
        { agentId },
        {
          agent_id: agentId,
          phone_number: phoneNumber
        }
      );

      const result: AgentTestCallResponse = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastResult: result,
        error: result.success ? null : result.message
      }));

      if (result.success) {
        const successMsg = options.showDetailedErrors
          ? `Test call initiated successfully! Call ID: ${result.call_id || 'N/A'}. Message: ${result.message}`
          : 'Test call started! Check your phone.';
        
        toast.success(successMsg);
        options.onSuccess?.(result);
      } else {
        const errorMsg = options.showDetailedErrors
          ? `Test call failed: ${result.message}`
          : result.message.includes('Ultravox Agent ID')
            ? 'Agent not properly configured. Please contact support.'
            : result.message.includes('not found')
            ? 'Agent not found. Please try again.'
            : 'Test call failed. Please try again.';
        
        toast.error(errorMsg);
        options.onError?.(result.message);
      }
    } catch (error) {
      const errorMsg = options.showDetailedErrors
        ? `Network error during test call: ${error instanceof Error ? error.message : 'Unknown error'}`
        : 'Connection error. Please check your internet and try again.';
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMsg 
      }));
      
      toast.error(errorMsg);
      options.onError?.(errorMsg);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    testCall,
    clearError,
    validatePhoneNumber
  };
}
