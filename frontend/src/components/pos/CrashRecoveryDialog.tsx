/**
 * CrashRecoveryDialog
 *
 * Shown on POS startup when an unclean shutdown is detected (crash, force-quit, power loss).
 * Offers to restore the last-known POS state (active order, cart items, table number) or
 * start fresh.
 *
 * Only rendered in Electron. State is persisted via electronAPI.saveCrashState() and
 * read back via electronAPI.getCrashState().
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { colors } from 'utils/designSystem';

export interface CrashState {
  /** Active table number */
  tableNumber?: number | null;
  /** Active order ID */
  orderId?: string | null;
  /** Cart items snapshot */
  cartItems?: any[];
  /** Order type (dine-in, takeaway, etc.) */
  orderType?: string;
  /** Timestamp of when the state was saved */
  timestamp?: number;
  /** App version that saved the state */
  version?: string;
}

interface CrashRecoveryDialogProps {
  /** Called when user chooses to restore the previous session */
  onRestore: (state: CrashState) => void;
  /** Called when user chooses to discard and start fresh */
  onDiscard: () => void;
}

export function CrashRecoveryDialog({ onRestore, onDiscard }: CrashRecoveryDialogProps) {
  const [open, setOpen] = useState(false);
  const [crashState, setCrashState] = useState<CrashState | null>(null);

  useEffect(() => {
    const checkCrashState = async () => {
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI?.getCrashState) return;

      try {
        const result = await electronAPI.getCrashState();
        if (result.hasCrashState && result.state) {
          setCrashState(result.state);
          setOpen(true);
        }
      } catch (error) {
        console.error('[CrashRecovery] Failed to check crash state:', error);
      }
    };

    checkCrashState();
  }, []);

  const handleRestore = async () => {
    if (crashState) {
      onRestore(crashState);
    }
    await clearState();
    setOpen(false);
  };

  const handleDiscard = async () => {
    onDiscard();
    await clearState();
    setOpen(false);
  };

  const clearState = async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      await electronAPI?.clearCrashState();
    } catch {
      // Non-critical
    }
  };

  const formatTime = (ts?: number) => {
    if (!ts) return 'Unknown';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' ' + d.toLocaleDateString();
  };

  if (!open || !crashState) return null;

  return (
    <Dialog open={open} onOpenChange={() => { /* prevent dismiss by clicking outside */ }}>
      <DialogContent
        className="sm:max-w-md"
        style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
            <AlertTriangle size={20} className="text-amber-500" />
            Session Recovery
          </DialogTitle>
          <DialogDescription style={{ color: colors.text.secondary }}>
            The POS was not shut down cleanly. A previous session was found.
          </DialogDescription>
        </DialogHeader>

        <div
          className="rounded-lg p-4 space-y-2 text-sm"
          style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
        >
          <p><strong style={{ color: colors.text.primary }}>Last saved:</strong> {formatTime(crashState.timestamp)}</p>
          {crashState.tableNumber && (
            <p><strong style={{ color: colors.text.primary }}>Table:</strong> {crashState.tableNumber}</p>
          )}
          {crashState.orderType && (
            <p><strong style={{ color: colors.text.primary }}>Order type:</strong> {crashState.orderType}</p>
          )}
          {crashState.cartItems && crashState.cartItems.length > 0 && (
            <p><strong style={{ color: colors.text.primary }}>Cart items:</strong> {crashState.cartItems.length} items</p>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleDiscard}
            className="flex items-center gap-2"
            style={{ borderColor: colors.border.medium, color: colors.text.secondary }}
          >
            <Trash2 size={16} />
            Start Fresh
          </Button>
          <Button
            onClick={handleRestore}
            className="flex items-center gap-2"
            style={{ backgroundColor: colors.brand.turquoise, color: '#fff' }}
          >
            <RotateCcw size={16} />
            Restore Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
