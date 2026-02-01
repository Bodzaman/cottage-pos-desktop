/**
 * useFormDraft Hook
 *
 * Provides auto-save draft functionality for forms.
 * Saves form data to localStorage at regular intervals and handles restore/discard.
 *
 * Features:
 * - Auto-save every 30 seconds when form is dirty
 * - Draft restore dialog on mount
 * - Manual discard with confirmation
 * - Clears draft on successful submit
 * - 24-hour expiry for stale drafts
 *
 * @example
 * ```tsx
 * const { lastAutosaveTime, showRestoreDialog, restoreDraft, discardDraft } = useFormDraft({
 *   key: 'menu-item-form',
 *   isDirty: form.formState.isDirty,
 *   getData: () => form.getValues(),
 *   setData: (data) => {
 *     Object.keys(data).forEach(key => form.setValue(key, data[key]));
 *   }
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const AUTOSAVE_INTERVAL_MS = 30000; // 30 seconds

export interface DraftPayload<T> {
  formData: T;
  timestamp: string;
  additionalData?: Record<string, any>;
}

export interface UseFormDraftOptions<T> {
  /** Unique key for localStorage (e.g., 'menu-item-form' or 'menu-item-form-{id}') */
  key: string;
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Function to get current form data */
  getData: () => T;
  /** Function to restore form data */
  setData: (data: T) => void;
  /** Optional: Additional data to include in draft (e.g., variants array) */
  getAdditionalData?: () => Record<string, any>;
  /** Optional: Function to restore additional data */
  setAdditionalData?: (data: Record<string, any>) => void;
  /** Optional: Disable auto-save (useful during submit) */
  disabled?: boolean;
  /** Optional: Custom interval in ms (default: 30000) */
  intervalMs?: number;
}

export interface UseFormDraftReturn {
  /** Last auto-save timestamp */
  lastAutosaveTime: Date | null;
  /** Whether the restore dialog should be shown */
  showRestoreDialog: boolean;
  /** The draft data to restore */
  draftData: DraftPayload<any> | null;
  /** Restore the draft */
  restoreDraft: () => void;
  /** Discard the draft */
  discardDraft: () => void;
  /** Close the restore dialog without action */
  closeRestoreDialog: () => void;
  /** Manually save a draft */
  saveDraft: () => void;
  /** Clear draft (call on successful submit) */
  clearDraft: () => void;
  /** Check if a draft exists */
  hasDraft: boolean;
}

export function useFormDraft<T>({
  key,
  isDirty,
  getData,
  setData,
  getAdditionalData,
  setAdditionalData,
  disabled = false,
  intervalMs = AUTOSAVE_INTERVAL_MS
}: UseFormDraftOptions<T>): UseFormDraftReturn {
  const [lastAutosaveTime, setLastAutosaveTime] = useState<Date | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [draftData, setDraftData] = useState<DraftPayload<T> | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Use ref to avoid stale closures in interval
  const getDataRef = useRef(getData);
  const getAdditionalDataRef = useRef(getAdditionalData);

  useEffect(() => {
    getDataRef.current = getData;
    getAdditionalDataRef.current = getAdditionalData;
  }, [getData, getAdditionalData]);

  const storageKey = `form-draft-${key}`;

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const storedDraft = localStorage.getItem(storageKey);
      if (storedDraft) {
        const draft = JSON.parse(storedDraft) as DraftPayload<T>;
        const draftAge = Date.now() - new Date(draft.timestamp).getTime();

        if (draftAge < DRAFT_EXPIRY_MS) {
          setDraftData(draft);
          setHasDraft(true);
          setShowRestoreDialog(true);
        } else {
          // Clear expired drafts
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.error('[useFormDraft] Failed to load draft:', e);
    }
  }, [storageKey]);

  // Auto-save at regular intervals
  useEffect(() => {
    if (disabled || !isDirty) return;

    const autosaveInterval = setInterval(() => {
      try {
        const formData = getDataRef.current();
        const additionalData = getAdditionalDataRef.current?.();

        const payload: DraftPayload<T> = {
          formData,
          timestamp: new Date().toISOString(),
          additionalData
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));
        setLastAutosaveTime(new Date());
        setHasDraft(true);
      } catch (e) {
        console.error('[useFormDraft] Failed to auto-save:', e);
      }
    }, intervalMs);

    return () => clearInterval(autosaveInterval);
  }, [disabled, isDirty, storageKey, intervalMs]);

  // Manual save
  const saveDraft = useCallback(() => {
    try {
      const formData = getDataRef.current();
      const additionalData = getAdditionalDataRef.current?.();

      const payload: DraftPayload<T> = {
        formData,
        timestamp: new Date().toISOString(),
        additionalData
      };

      localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastAutosaveTime(new Date());
      setHasDraft(true);
    } catch (e) {
      console.error('[useFormDraft] Failed to save draft:', e);
    }
  }, [storageKey]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    if (!draftData) return;

    try {
      setData(draftData.formData);

      if (draftData.additionalData && setAdditionalData) {
        setAdditionalData(draftData.additionalData);
      }

      setShowRestoreDialog(false);
    } catch (e) {
      console.error('[useFormDraft] Failed to restore draft:', e);
    }
  }, [draftData, setData, setAdditionalData]);

  // Discard draft
  const discardDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setShowRestoreDialog(false);
      setDraftData(null);
      setLastAutosaveTime(null);
      setHasDraft(false);
    } catch (e) {
      console.error('[useFormDraft] Failed to discard draft:', e);
    }
  }, [storageKey]);

  // Close dialog without action
  const closeRestoreDialog = useCallback(() => {
    setShowRestoreDialog(false);
  }, []);

  // Clear draft (call on successful submit)
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setDraftData(null);
      setLastAutosaveTime(null);
      setHasDraft(false);
    } catch (e) {
      console.error('[useFormDraft] Failed to clear draft:', e);
    }
  }, [storageKey]);

  return {
    lastAutosaveTime,
    showRestoreDialog,
    draftData,
    restoreDraft,
    discardDraft,
    closeRestoreDialog,
    saveDraft,
    clearDraft,
    hasDraft
  };
}

export default useFormDraft;
