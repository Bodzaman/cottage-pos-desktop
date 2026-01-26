import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QSAITheme } from '../utils/QSAIDesign';

/**
 * AddCustomerTabDialog - Dialog for creating new customer tabs
 * Auto-suggests names like "Customer 1", "Customer 2", etc.
 * Validates against duplicate names
 */
export interface AddCustomerTabDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTab: (tabName: string) => void;
  existingTabNames: string[];
}

export function AddCustomerTabDialog({
  isOpen,
  onClose,
  onCreateTab,
  existingTabNames,
}: AddCustomerTabDialogProps) {
  const [tabName, setTabName] = useState('');
  const [error, setError] = useState('');

  // Generate suggested name (Customer 1, Customer 2, etc.)
  const getSuggestedName = () => {
    let counter = 1;
    while (existingTabNames.includes(`Customer ${counter}`)) {
      counter++;
    }
    return `Customer ${counter}`;
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      const suggested = getSuggestedName();
      setTabName(suggested);
      setError('');
    }
  }, [isOpen]);

  const validateAndCreate = () => {
    const trimmedName = tabName.trim();

    // Validation
    if (!trimmedName) {
      setError('Tab name cannot be empty');
      return;
    }

    if (existingTabNames.includes(trimmedName)) {
      setError(`Tab "${trimmedName}" already exists for this table`);
      return;
    }

    // Create tab
    onCreateTab(trimmedName);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{
          background: QSAITheme.background.panel,
          border: `1px solid ${QSAITheme.border.accent}`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Add Customer Tab
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Customer Name</label>
            <input
              type="text"
              value={tabName}
              onChange={(e) => {
                setTabName(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Customer 1, John, Sarah"
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-white text-base"
              style={{
                background: QSAITheme.background.secondary,
                border: `1px solid ${error ? '#EF4444' : QSAITheme.border.light}`,
                outline: 'none',
              }}
            />

            {/* Error message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm"
                style={{ color: '#EF4444' }}
              >
                {error}
              </motion.p>
            )}
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-white/50">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[getSuggestedName(), 'John', 'Sarah', 'Mike', 'Emma'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setTabName(suggestion);
                    setError('');
                  }}
                  disabled={existingTabNames.includes(suggestion)}
                  className="px-3 py-1.5 rounded-md text-sm transition-all"
                  style={{
                    background: existingTabNames.includes(suggestion)
                      ? QSAITheme.background.secondary
                      : `rgba(91, 33, 182, 0.15)`,
                    border: `1px solid ${
                      existingTabNames.includes(suggestion)
                        ? QSAITheme.border.light
                        : 'rgba(91, 33, 182, 0.3)'
                    }`,
                    color: existingTabNames.includes(suggestion)
                      ? 'rgba(255, 255, 255, 0.3)'
                      : QSAITheme.purple.light,
                    cursor: existingTabNames.includes(suggestion) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-white/70"
            style={{
              borderColor: QSAITheme.border.light,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={validateAndCreate}
            className="flex items-center gap-2"
            style={{
              background: QSAITheme.purple.primary,
              color: 'white',
            }}
          >
            <Plus className="h-4 w-4" />
            Create Tab
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
