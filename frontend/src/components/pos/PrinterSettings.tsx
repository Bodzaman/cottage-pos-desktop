/**
 * PrinterSettings
 *
 * Dialog for assigning physical printers to roles (Kitchen, Customer, Bar).
 * Each role can be mapped to a different printer for multi-printer routing.
 *
 * Roles:
 * - Kitchen: kitchen tickets (food prep)
 * - Customer: customer receipts, bills, dine-in checks
 * - Bar: bar tickets (drinks) — optional, falls back to kitchen
 *
 * Accessed from POS header or admin panel.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { colors } from 'utils/designSystem';
import { toast } from 'sonner';
import type { PrinterInfo } from './PrinterStatusBadge';

interface PrinterRole {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const ROLES: PrinterRole[] = [
  { key: 'kitchen', label: 'Kitchen', description: 'Kitchen tickets for food prep', icon: '🍳' },
  { key: 'customer', label: 'Customer', description: 'Customer receipts and bills', icon: '🧾' },
  { key: 'bar', label: 'Bar', description: 'Bar tickets for drinks (optional)', icon: '🍺' },
];

interface PrinterSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrinterSettings({ isOpen, onClose }: PrinterSettingsProps) {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [roles, setRoles] = useState<Record<string, string | null>>({
    kitchen: null,
    customer: null,
    bar: null
  });
  const [defaultPrinter, setDefaultPrinter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingRole, setTestingRole] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;

  const loadData = useCallback(async () => {
    if (!electronAPI) return;
    setLoading(true);
    try {
      const [statusResult, rolesResult] = await Promise.all([
        electronAPI.getPrinterStatus?.() || { success: false, printers: [] },
        electronAPI.getPrinterRoles?.() || { success: false, roles: {} }
      ]);

      if (statusResult.success) {
        setPrinters(statusResult.printers || []);
        setDefaultPrinter(statusResult.defaultPrinter || null);
      }
      if (rolesResult.success) {
        setRoles({
          kitchen: rolesResult.roles?.kitchen || null,
          customer: rolesResult.roles?.customer || null,
          bar: rolesResult.roles?.bar || null
        });
      }
    } catch (error) {
      console.error('[PrinterSettings] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }, [electronAPI]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setDirty(false);
    }
  }, [isOpen, loadData]);

  const handleRoleChange = (roleKey: string, printerName: string | null) => {
    setRoles(prev => ({ ...prev, [roleKey]: printerName }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!electronAPI?.savePrinterRoles) return;
    setSaving(true);
    try {
      const result = await electronAPI.savePrinterRoles(roles);
      if (result.success) {
        toast.success('Printer settings saved');
        setDirty(false);
      } else {
        toast.error('Failed to save', { description: result.error });
      }
    } catch (error) {
      toast.error('Failed to save printer settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async (roleKey: string) => {
    if (!electronAPI?.testPrintRole) return;
    setTestingRole(roleKey);
    try {
      const result = await electronAPI.testPrintRole(roleKey);
      if (result.success) {
        toast.success(`Test print sent`, { description: `${roleKey} -> ${result.printer}` });
      } else {
        toast.error('Test print failed', { description: result.error });
      }
    } catch (error) {
      toast.error('Test print failed');
    } finally {
      setTestingRole(null);
    }
  };

  const resolvedPrinter = (roleKey: string): string => {
    return roles[roleKey] || defaultPrinter || 'None';
  };

  if (!electronAPI) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-lg"
        style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
            <Printer size={20} />
            Printer Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8" style={{ color: colors.text.muted }}>
            <RefreshCw size={20} className="animate-spin mr-2" />
            Detecting printers...
          </div>
        ) : printers.length === 0 ? (
          <div className="text-center py-8" style={{ color: colors.text.muted }}>
            <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
            <p>No printers detected</p>
            <p className="text-xs mt-1">Connect a USB printer and restart the app</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Detected Printers */}
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: colors.text.muted }}>
                DETECTED PRINTERS ({printers.length})
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {printers.map(p => (
                  <span
                    key={p.name}
                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                    style={{
                      backgroundColor: colors.background.tertiary,
                      color: p.available ? colors.text.primary : colors.text.muted,
                      borderWidth: 1,
                      borderColor: p.name === defaultPrinter ? colors.brand.turquoise : colors.border.medium
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: p.available ? '#22C55E' : '#EF4444' }}
                    />
                    {p.displayName || p.name}
                    {p.name === defaultPrinter && (
                      <span className="text-[10px] opacity-60">(default)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Role Assignments */}
            <div className="space-y-3">
              <div className="text-xs font-medium" style={{ color: colors.text.muted }}>
                PRINTER ROLES
              </div>
              {ROLES.map(role => (
                <div
                  key={role.key}
                  className="rounded-lg p-3"
                  style={{ backgroundColor: colors.background.primary, borderWidth: 1, borderColor: colors.border.medium }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{role.icon}</span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
                          {role.label}
                        </div>
                        <div className="text-xs" style={{ color: colors.text.muted }}>
                          {role.description}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestPrint(role.key)}
                      disabled={testingRole !== null}
                      className="h-7 px-2 text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      {testingRole === role.key ? (
                        <RefreshCw size={12} className="animate-spin mr-1" />
                      ) : (
                        <Printer size={12} className="mr-1" />
                      )}
                      Test
                    </Button>
                  </div>

                  <select
                    value={roles[role.key] || ''}
                    onChange={(e) => handleRoleChange(role.key, e.target.value || null)}
                    className="w-full text-sm rounded px-2 py-1.5 outline-none"
                    style={{
                      backgroundColor: colors.background.tertiary,
                      color: colors.text.primary,
                      borderWidth: 1,
                      borderColor: colors.border.medium
                    }}
                  >
                    <option value="">Default ({defaultPrinter || 'auto-detect'})</option>
                    {printers.map(p => (
                      <option key={p.name} value={p.name} disabled={!p.available}>
                        {p.displayName || p.name} {!p.available ? '(offline)' : ''}
                      </option>
                    ))}
                  </select>

                  <div className="text-[10px] mt-1" style={{ color: colors.text.muted }}>
                    Will print to: {resolvedPrinter(role.key)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={loadData}
            disabled={loading}
            className="text-xs"
            style={{ color: colors.text.secondary }}
          >
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={onClose}
            style={{ borderColor: colors.border.medium, color: colors.text.secondary }}
          >
            {dirty ? 'Cancel' : 'Close'}
          </Button>
          {dirty && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1"
              style={{ backgroundColor: colors.brand.turquoise, color: '#fff' }}
            >
              {saving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
