
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Users, CheckCircle2, ChevronRight, Info, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { styles, effects } from '../utils/QSAIDesign';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  tableCapacity: number;
  onConfirm: (guestCount: number, action: 'normal' | 'link' | 'continue_anyway') => void;
  className?: string;
}

export function GuestCountModal({ 
  isOpen, 
  onClose, 
  tableNumber, 
  tableCapacity, 
  onConfirm,
  className = ''
}: Props) {
  const [guestCount, setGuestCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setGuestCount(1);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Check if guest count exceeds table capacity
  const exceedsCapacity = guestCount > tableCapacity;

  // Handle guest count changes
  const handleGuestCountChange = (value: string) => {
    const count = parseInt(value) || 0;
    setGuestCount(count);
  };

  // Handle increment/decrement
  const incrementGuests = () => {
    const newCount = guestCount + 1;
    setGuestCount(newCount);
  };

  const decrementGuests = () => {
    if (guestCount > 1) {
      const newCount = guestCount - 1;
      setGuestCount(newCount);
    }
  };

  // Handle different actions
  const handleAction = async (action: 'normal' | 'link' | 'continue_anyway') => {
    if (guestCount < 1) {
      toast.error('Guest count must be at least 1');
      return;
    }

    setIsLoading(true);
    
    try {
      onConfirm(guestCount, action);
    } catch (error) {
      toast.error('Failed to process table selection');
      console.error('Table selection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-md backdrop-blur-xl border-0"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(124, 93, 250, 0.2)',
          borderRadius: '16px'
        }}
      >
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="p-2 rounded-xl"
              style={{
                background: 'rgba(124, 93, 250, 0.15)',
                border: '1px solid rgba(124, 93, 250, 0.3)'
              }}
            >
              <Users className="h-5 w-5" style={{ color: '#7c5dfa' }} />
            </div>
            <div>
              <DialogTitle 
                className="text-xl font-semibold tracking-wide"
                style={{
                  ...styles.gradientText('medium'),
                  textShadow: effects.textShadow('medium')
                }}
              >
                Table {tableNumber} - Guest Count
              </DialogTitle>
              <DialogDescription className="text-sm opacity-70">
                How many guests will be dining at this table?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Table Capacity Info */}
          <Card 
            className="p-4 border-0"
            style={{
              background: 'rgba(124, 93, 250, 0.1)',
              border: '1px solid rgba(124, 93, 250, 0.2)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Table {tableNumber} capacity: {tableCapacity} seats | Guests: {guestCount}</span>
              </div>
            </div>
          </Card>

          {/* Guest Count Input */}
          <div className="space-y-3">
            <Label htmlFor="guest-count" className="text-sm font-medium text-gray-300">
              Number of Guests
            </Label>
            
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={decrementGuests}
                disabled={guestCount <= 1}
                className="h-10 w-10 p-0 border-gray-600 hover:bg-gray-700"
              >
                -
              </Button>
              
              <Input
                id="guest-count"
                type="number"
                min="1"
                max="20"
                value={guestCount}
                onChange={(e) => handleGuestCountChange(e.target.value)}
                className="text-center text-lg font-semibold bg-gray-800/50 border-gray-600 focus:border-purple-400"
                style={{ width: '80px' }}
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={incrementGuests}
                className="h-10 w-10 p-0 border-gray-600 hover:bg-gray-700"
              >
                +
              </Button>
            </div>
          </div>

          {/* Enhanced Choice Section for Exceeds Capacity */}
          {exceedsCapacity && (
            <Card 
              className="p-4 border-0"
              style={{
                background: 'rgba(124, 93, 250, 0.1)',
                border: '1px solid rgba(124, 93, 250, 0.3)'
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">For larger parties, you can link additional tables</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-200">
                  <Link2 className="h-4 w-4" />
                  <span>Link nearby tables for comfort</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Enhanced Action Buttons - Three Equal Options */}
        <div className="pt-4 border-t border-gray-700">
          {exceedsCapacity ? (
            // Three choice buttons when capacity exceeded
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => handleAction('link')}
                  disabled={isLoading}
                  className="w-full h-12"
                  style={{
                    background: 'linear-gradient(135deg, #7c5dfa 0%, #6366f1 100%)',
                    border: 'none'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    <span>🔗 Link Tables</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleAction('continue_anyway')}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 border-gray-600 hover:bg-gray-700"
                >
                  <span>Continue Anyway</span>
                </Button>
                
                <Button
                  onClick={onClose}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 border-gray-600 hover:bg-gray-700"
                >
                  <span>Cancel</span>
                </Button>
              </div>
            </div>
          ) : (
            // Normal two-button layout when within capacity
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              
              <Button
                onClick={() => handleAction('normal')}
                disabled={isLoading || guestCount < 1}
                className="flex-1"
                style={{
                  background: 'linear-gradient(135deg, #7c5dfa 0%, #6366f1 100%)',
                  border: 'none'
                }}
              >
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>
                    {isLoading ? 'Processing...' : 'Confirm'}
                  </span>
                  {!isLoading && <ChevronRight className="h-4 w-4" />}
                </div>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
