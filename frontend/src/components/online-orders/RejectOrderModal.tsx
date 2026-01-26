/**
 * RejectOrderModal Component
 * Modal dialog for rejecting an order with a required reason
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, X } from 'lucide-react';

interface RejectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderNumber?: string;
  isLoading?: boolean;
}

const REJECTION_REASONS = [
  { value: 'out_of_stock', label: 'Item(s) out of stock' },
  { value: 'kitchen_closed', label: 'Kitchen is closed' },
  { value: 'too_busy', label: 'Too busy to accept' },
  { value: 'delivery_area', label: 'Outside delivery area' },
  { value: 'customer_request', label: 'Customer requested cancellation' },
  { value: 'other', label: 'Other reason' },
];

export function RejectOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  isLoading = false,
}: RejectOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedReason === 'other' ? customReason : selectedReason;
    if (reason) {
      onConfirm(reason);
      // Reset state
      setSelectedReason('');
      setCustomReason('');
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  const isValid = selectedReason && (selectedReason !== 'other' || customReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Reject Order {orderNumber ? `#${orderNumber}` : ''}
          </DialogTitle>
          <DialogDescription>
            Please select a reason for rejecting this order. The customer will be
            notified and refunded automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {REJECTION_REASONS.map((reason) => (
              <div key={reason.value} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.value} id={reason.value} />
                <Label htmlFor={reason.value} className="cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Please specify:</Label>
              <Textarea
                id="custom-reason"
                placeholder="Enter the reason for rejection..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              'Rejecting...'
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Reject Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RejectOrderModal;
