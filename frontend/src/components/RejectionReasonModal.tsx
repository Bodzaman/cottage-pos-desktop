import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';

// Predefined rejection reasons matching backend
const REJECTION_REASONS = [
  { id: 'kitchen_busy', label: 'Kitchen at capacity', refundFull: true, requiresNote: false },
  { id: 'item_unavailable', label: 'Item(s) unavailable', refundFull: true, requiresNote: false },
  { id: 'closing_soon', label: 'Closing soon - cannot fulfill', refundFull: true, requiresNote: false },
  { id: 'delivery_area', label: 'Outside delivery area', refundFull: true, requiresNote: false },
  { id: 'suspected_fraud', label: 'Suspected fraudulent order', refundFull: false, requiresNote: false },
  { id: 'other', label: 'Other (specify)', refundFull: true, requiresNote: true },
];

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonId: string, note?: string) => Promise<void>;
  orderNumber?: string;
  orderTotal?: number;
}

export function RejectionReasonModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  orderTotal,
}: RejectionReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReasonData = REJECTION_REASONS.find(r => r.id === selectedReason);
  const requiresNote = selectedReasonData?.requiresNote ?? false;
  const isValid = selectedReason && (!requiresNote || note.trim().length > 0);

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(selectedReason, note.trim() || undefined);
      // Reset state
      setSelectedReason('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedReason('');
    setNote('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          backgroundColor: globalColors.background.secondary,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: globalColors.text.primary }}>
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Reject Order {orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning message */}
          <div
            className="p-3 rounded-md text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: globalColors.text.secondary,
            }}
          >
            <p>
              This will reject the order and initiate a refund of{' '}
              <strong style={{ color: globalColors.text.primary }}>
                £{orderTotal?.toFixed(2) ?? '0.00'}
              </strong>{' '}
              to the customer.
            </p>
          </div>

          {/* Rejection reasons */}
          <div>
            <Label className="text-sm font-medium mb-2 block" style={{ color: globalColors.text.primary }}>
              Select a reason for rejection
            </Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              <div className="space-y-2">
                {REJECTION_REASONS.map((reason) => (
                  <div
                    key={reason.id}
                    className="flex items-center space-x-2 p-2 rounded-md transition-colors hover:bg-white/5"
                    style={{
                      backgroundColor: selectedReason === reason.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    }}
                  >
                    <RadioGroupItem value={reason.id} id={reason.id} />
                    <Label
                      htmlFor={reason.id}
                      className="flex-1 cursor-pointer text-sm"
                      style={{ color: globalColors.text.primary }}
                    >
                      {reason.label}
                      {!reason.refundFull && (
                        <span className="ml-2 text-xs text-red-400">(No refund)</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Note field (required for "Other") */}
          {requiresNote && (
            <div>
              <Label
                htmlFor="rejection-note"
                className="text-sm font-medium mb-2 block"
                style={{ color: globalColors.text.primary }}
              >
                Please provide details <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="rejection-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="min-h-[80px]"
                style={{
                  backgroundColor: globalColors.background.tertiary,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: globalColors.text.primary,
                }}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              className="p-2 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: globalColors.text.secondary,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject & Refund'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RejectionReasonModal;
