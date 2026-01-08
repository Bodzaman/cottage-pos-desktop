import { useState, useEffect, useCallback } from 'react';
import { apiClient } from 'app';
import type { TemplateAssignment } from 'types';

/**
 * Hook: useTemplateAssignments
 * 
 * RESPONSIBILITY:
 * Fetches and validates template assignments for all order modes.
 * Provides graceful fallback when assigned templates don't exist in storage.
 * 
 * VALIDATION LOGIC:
 * 1. Fetch template assignments from backend
 * 2. Verify each assigned template exists in storage
 * 3. Return validated template_id or null if template missing
 * 
 * USAGE:
 * const { getCustomerTemplateId, isLoading } = useTemplateAssignments();
 * const templateId = await getCustomerTemplateId('WAITING');
 * // templateId is null if template doesn't exist (graceful fallback)
 */

interface TemplateAssignments {
  [key: string]: TemplateAssignment;
}

interface UseTemplateAssignmentsReturn {
  /** Get validated customer template ID for an order mode */
  getCustomerTemplateId: (orderMode: string) => Promise<string | null>;
  /** Get validated kitchen template ID for an order mode */
  getKitchenTemplateId: (orderMode: string) => Promise<string | null>;
  /** Check if assignments are currently loading */
  isLoading: boolean;
  /** Any error that occurred during fetch */
  error: string | null;
  /** Refresh assignments from backend */
  refresh: () => Promise<void>;
}

/**
 * Validates if a template exists in storage by attempting to fetch it
 */
async function validateTemplateExists(templateId: string | null | undefined): Promise<boolean> {
  if (!templateId) return false;
  
  try {
    // Attempt to fetch the template from storage
    // Note: Using a dummy user_id since we're just checking existence
    const response = await apiClient.get_receipt_template({ 
      templateId, 
      user_id: 'system' 
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.success === true && data.template !== null;
  } catch (error) {
    // Template doesn't exist or fetch failed
    console.warn(`⚠️ Template validation failed for ${templateId}:`, error);
    return false;
  }
}

/**
 * Custom hook for managing template assignments with validation
 */
export function useTemplateAssignments(): UseTemplateAssignmentsReturn {
  const [assignments, setAssignments] = useState<TemplateAssignments | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch template assignments from backend
   */
  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get_template_assignments();
      const data = await response.json();
      
      if (data.success && data.assignments) {
        setAssignments(data.assignments);
        console.log('✅ Template assignments loaded:', Object.keys(data.assignments));
      } else {
        throw new Error(data.message || 'Failed to load template assignments');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to fetch template assignments:', errorMessage);
      setError(errorMessage);
      setAssignments(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load assignments on mount
   */
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  /**
   * Get validated customer template ID for an order mode
   * Returns null if template doesn't exist (graceful fallback)
   */
  const getCustomerTemplateId = useCallback(async (orderMode: string): Promise<string | null> => {
    if (!assignments) {
      console.warn('⚠️ Template assignments not loaded yet');
      return null;
    }

    const assignment = assignments[orderMode.toUpperCase()];
    if (!assignment) {
      console.warn(`⚠️ No template assignment found for order mode: ${orderMode}`);
      return null;
    }

    const templateId = assignment.customer_template_id;
    if (!templateId) {
      console.log(`ℹ️ No customer template assigned for ${orderMode}`);
      return null;
    }

    // Validate template exists in storage
    const exists = await validateTemplateExists(templateId);
    if (!exists) {
      console.warn(`⚠️ Template "${templateId}" assigned to ${orderMode} but not found in storage - using default formatting`);
      return null;
    }

    console.log(`✅ Using template "${templateId}" for ${orderMode} customer receipt`);
    return templateId;
  }, [assignments]);

  /**
   * Get validated kitchen template ID for an order mode
   * Returns null if template doesn't exist (graceful fallback)
   */
  const getKitchenTemplateId = useCallback(async (orderMode: string): Promise<string | null> => {
    if (!assignments) {
      console.warn('⚠️ Template assignments not loaded yet');
      return null;
    }

    const assignment = assignments[orderMode.toUpperCase()];
    if (!assignment) {
      console.warn(`⚠️ No template assignment found for order mode: ${orderMode}`);
      return null;
    }

    const templateId = assignment.kitchen_template_id;
    if (!templateId) {
      console.log(`ℹ️ No kitchen template assigned for ${orderMode}`);
      return null;
    }

    // Validate template exists in storage
    const exists = await validateTemplateExists(templateId);
    if (!exists) {
      console.warn(`⚠️ Template "${templateId}" assigned to ${orderMode} but not found in storage - using default formatting`);
      return null;
    }

    console.log(`✅ Using template "${templateId}" for ${orderMode} kitchen ticket`);
    return templateId;
  }, [assignments]);

  return {
    getCustomerTemplateId,
    getKitchenTemplateId,
    isLoading,
    error,
    refresh: fetchAssignments,
  };
}
