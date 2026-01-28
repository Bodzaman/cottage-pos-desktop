/**
 * PrinterStatusBadge
 *
 * Compact indicator showing real-time thermal printer status.
 * In Electron: uses IPC printer-status-update events (30s polling in main process).
 * In Web: falls back to the existing polling service.
 *
 * Shows green/amber/red dot with tooltip details.
 * Displays toast alerts when printer connects or disconnects.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { colors } from 'utils/designSystem';

export interface PrinterInfo {
  name: string;
  displayName: string;
  available: boolean;
  status: string;
  isDefault: boolean;
}

export interface PrinterStatus {
  printers: PrinterInfo[];
  defaultPrinter: string | null;
  hasThermalPrinter: boolean;
  timestamp?: number;
}

interface PrinterStatusBadgeProps {
  /** Compact mode shows only the dot, no icon */
  compact?: boolean;
  /** Click handler — e.g. open PrinterSettings */
  onClick?: () => void;
}

export function PrinterStatusBadge({ compact = false, onClick }: PrinterStatusBadgeProps) {
  const [status, setStatus] = useState<PrinterStatus | null>(null);
  const prevAvailableRef = useRef<boolean | null>(null);
  const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

  const handleStatusUpdate = useCallback((newStatus: PrinterStatus) => {
    setStatus(newStatus);

    // Toast on state change (skip first load)
    const nowAvailable = newStatus.hasThermalPrinter && newStatus.printers.some(p => p.available);
    if (prevAvailableRef.current !== null && prevAvailableRef.current !== nowAvailable) {
      if (nowAvailable) {
        toast.success('Printer connected', {
          description: newStatus.defaultPrinter || 'Thermal printer detected'
        });
      } else {
        toast.error('Printer disconnected', {
          description: 'Check USB connection and power'
        });
      }
    }
    prevAvailableRef.current = nowAvailable;
  }, []);

  // Electron: listen for push status updates + initial fetch
  useEffect(() => {
    if (!isElectron) return;

    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) return;

    // Register push listener
    if (electronAPI.onPrinterStatus) {
      electronAPI.onPrinterStatus(handleStatusUpdate);
    }

    // Initial fetch
    if (electronAPI.getPrinterStatus) {
      electronAPI.getPrinterStatus().then((result: any) => {
        if (result?.success) {
          handleStatusUpdate(result);
        }
      }).catch(() => {});
    }

    return () => {
      if (electronAPI.removePrinterStatusListener) {
        electronAPI.removePrinterStatusListener();
      }
    };
  }, [isElectron, handleStatusUpdate]);

  // Determine status
  const isConnected = status ? status.hasThermalPrinter && status.printers.some(p => p.available) : null;
  const printerCount = status?.printers.length ?? 0;
  const thermalName = status?.defaultPrinter ?? 'No printer';

  // Color logic
  const dotColor = isConnected === null
    ? '#6B7280'  // gray — loading
    : isConnected
      ? '#22C55E' // green
      : '#EF4444'; // red

  if (!isElectron) return null; // Only show in Electron

  const badge = (
    <div
      className={`flex items-center gap-1.5 group relative ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={`Printer: ${isConnected ? 'connected' : 'disconnected'}`}
    >
      {!compact && <Printer size={14} style={{ color: colors.text.muted }} />}
      <div
        className="rounded-full transition-colors duration-300"
        style={{
          width: compact ? 6 : 8,
          height: compact ? 6 : 8,
          backgroundColor: dotColor,
          boxShadow: isConnected ? `0 0 6px ${dotColor}` : undefined
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.92)', color: '#fff' }}
      >
        <div className="font-semibold mb-0.5">
          {isConnected ? 'Printer Connected' : 'Printer Offline'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)' }}>
          {thermalName}
        </div>
        {printerCount > 1 && (
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>
            {printerCount} printers detected
          </div>
        )}
      </div>
    </div>
  );

  return badge;
}

/**
 * Hook: usePrinterStatus
 *
 * Returns current printer status from Electron's main process.
 * Useful for components that need programmatic access to printer state.
 */
export function usePrinterStatus() {
  const [status, setStatus] = useState<PrinterStatus | null>(null);
  const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

  useEffect(() => {
    if (!isElectron) return;
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) return;

    if (electronAPI.onPrinterStatus) {
      electronAPI.onPrinterStatus(setStatus);
    }

    if (electronAPI.getPrinterStatus) {
      electronAPI.getPrinterStatus().then((result: any) => {
        if (result?.success) setStatus(result);
      }).catch(() => {});
    }

    return () => {
      if (electronAPI.removePrinterStatusListener) {
        electronAPI.removePrinterStatusListener();
      }
    };
  }, [isElectron]);

  return {
    status,
    isConnected: status ? status.hasThermalPrinter && status.printers.some(p => p.available) : null,
    defaultPrinter: status?.defaultPrinter ?? null,
    printers: status?.printers ?? []
  };
}
