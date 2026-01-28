/**
 * ReprintDialog
 *
 * Lists the last 50 printed receipts (stored in Electron's file cache).
 * Click any receipt to reprint it via ESC/POS.
 *
 * Triggered by Ctrl+P or toolbar button.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Clock, RefreshCw } from 'lucide-react';
import { colors } from 'utils/designSystem';
import { printCustomerReceiptESCPOS, type CustomerReceiptData } from 'utils/electronPrintService';
import { toast } from 'sonner';

export interface ReceiptHistoryEntry {
  /** Unique receipt ID (order number or timestamp-based) */
  id: string;
  /** Order number displayed on receipt */
  orderNumber: string;
  /** Order type (DINE-IN, COLLECTION, DELIVERY, WAITING) */
  orderType: string;
  /** Total amount */
  total: number;
  /** Timestamp when receipt was originally printed */
  printedAt: string;
  /** Table number if applicable */
  tableNumber?: number | string;
  /** Customer name if applicable */
  customerName?: string;
  /** Number of items on receipt */
  itemCount: number;
  /** Full receipt data for reprinting */
  receiptData: CustomerReceiptData;
  /** When saved to history file */
  savedAt?: number;
}

interface ReprintDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReprintDialog({ isOpen, onClose }: ReprintDialogProps) {
  const [history, setHistory] = useState<ReceiptHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [reprinting, setReprinting] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.getReceiptHistory) return;

    setLoading(true);
    try {
      const result = await electronAPI.getReceiptHistory();
      if (result.success && result.history) {
        setHistory(result.history);
      }
    } catch (error) {
      console.error('[ReprintDialog] Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  const handleReprint = async (entry: ReceiptHistoryEntry) => {
    setReprinting(entry.id);
    try {
      const result = await printCustomerReceiptESCPOS(entry.receiptData);
      if (result.success) {
        toast.success(`Reprinted: ${entry.orderNumber}`, {
          description: `Sent to ${result.printer || 'thermal printer'}`
        });
      } else {
        toast.error('Reprint failed', {
          description: result.error || 'Check printer connection'
        });
      }
    } catch (error) {
      toast.error('Reprint failed', {
        description: 'Unexpected error — check printer connection'
      });
    } finally {
      setReprinting(null);
    }
  };

  const formatTime = (ts: string | number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? time : `${time} ${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
  };

  const orderTypeLabel = (type: string) => {
    switch (type) {
      case 'DINE-IN': return 'Dine-In';
      case 'COLLECTION': return 'Collection';
      case 'DELIVERY': return 'Delivery';
      case 'WAITING': return 'Waiting';
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-lg max-h-[80vh] flex flex-col"
        style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
            <Printer size={20} />
            Reprint Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12" style={{ color: colors.text.muted }}>
              <RefreshCw size={20} className="animate-spin mr-2" />
              Loading...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12" style={{ color: colors.text.muted }}>
              <Printer size={32} className="mx-auto mb-3 opacity-40" />
              <p>No recent receipts</p>
              <p className="text-xs mt-1">Receipts will appear here after printing</p>
            </div>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleReprint(entry)}
                disabled={reprinting !== null}
                className="w-full text-left rounded-lg p-3 flex items-center gap-3 transition-colors hover:brightness-110"
                style={{
                  backgroundColor: reprinting === entry.id ? colors.background.tertiary : colors.background.primary,
                  borderWidth: 1,
                  borderColor: colors.border.medium,
                  opacity: reprinting !== null && reprinting !== entry.id ? 0.5 : 1
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm" style={{ color: colors.text.primary }}>
                      #{entry.orderNumber}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
                    >
                      {orderTypeLabel(entry.orderType)}
                    </span>
                    {entry.tableNumber && (
                      <span className="text-xs" style={{ color: colors.text.muted }}>
                        T{entry.tableNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: colors.text.muted }}>
                      {entry.itemCount} item{entry.itemCount !== 1 ? 's' : ''}
                    </span>
                    {entry.customerName && (
                      <span className="text-xs truncate" style={{ color: colors.text.muted }}>
                        {entry.customerName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm" style={{ color: colors.text.primary }}>
                    {'\u00A3'}{entry.total.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: colors.text.muted }}>
                    <Clock size={10} />
                    {formatTime(entry.printedAt)}
                  </div>
                </div>

                {reprinting === entry.id && (
                  <RefreshCw size={16} className="animate-spin shrink-0" style={{ color: colors.brand.turquoise }} />
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t" style={{ borderColor: colors.border.medium }}>
          <Button
            variant="outline"
            onClick={onClose}
            style={{ borderColor: colors.border.medium, color: colors.text.secondary }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Save a receipt to the Electron history store.
 * Call this after a successful print operation.
 * Falls back silently in non-Electron environments.
 */
export async function saveReceiptToHistory(
  receiptData: CustomerReceiptData,
  meta: {
    orderNumber: string;
    orderType: string;
    total: number;
    tableNumber?: number | string;
    customerName?: string;
    itemCount: number;
  }
): Promise<void> {
  const electronAPI = (window as any).electronAPI;
  if (!electronAPI?.saveReceiptHistory) return;

  try {
    const entry: ReceiptHistoryEntry = {
      id: `${meta.orderNumber}_${Date.now()}`,
      orderNumber: meta.orderNumber,
      orderType: meta.orderType,
      total: meta.total,
      printedAt: new Date().toISOString(),
      tableNumber: meta.tableNumber,
      customerName: meta.customerName,
      itemCount: meta.itemCount,
      receiptData
    };
    await electronAPI.saveReceiptHistory(entry);
  } catch (error) {
    console.error('[ReprintDialog] Failed to save receipt to history:', error);
  }
}
