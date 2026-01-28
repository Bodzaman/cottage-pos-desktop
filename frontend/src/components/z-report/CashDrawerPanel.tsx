import React from 'react';
import { Banknote, Plus, Trash2, AlertTriangle, CheckCircle, Lock, ClipboardCheck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useZReportStore, useCashDrawerCalculations } from '../../utils/zReportStore';
import { supabase } from '../../utils/supabaseClient';
import { DenominationCounter } from './DenominationCounter';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface CashRowProps {
  label: string;
  value: number;
  prefix?: '+' | '-';
  isTotal?: boolean;
  isHighlighted?: boolean;
}

function CashRow({ label, value, prefix, isTotal, isHighlighted }: CashRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        isTotal ? 'border-t border-white/10 mt-2 pt-3' : ''
      } ${isHighlighted ? 'bg-[#5B3CC4]/10 -mx-3 px-3 rounded' : ''}`}
    >
      <span className={`text-sm ${isTotal ? 'font-semibold text-white' : 'text-[#BBC3E1]'}`}>
        {prefix && <span className="mr-1">{prefix}</span>}
        {label}
      </span>
      <span className={`text-sm tabular-nums ${isTotal ? 'font-semibold text-white' : 'text-[#BBC3E1]'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function AddPaidOutDialog() {
  const { recordPaidOut } = useZReportStore();
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleSubmit = async () => {
    if (!description.trim() || !amount) return;

    setIsSubmitting(true);
    const success = await recordPaidOut(description.trim(), parseFloat(amount));
    setIsSubmitting(false);

    if (success) {
      setDescription('');
      setAmount('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 bg-[#252525] border border-white/10 text-[#BBC3E1] hover:bg-[#303030]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Paid-Out
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Record Paid-Out</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="e.g., Supplier payment, Cleaning supplies"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#252525] border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Amount (&pound;)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#252525] border-white/10 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="text-[#BBC3E1]">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || !amount || isSubmitting}
            className="bg-[#5B3CC4] hover:bg-[#4A2FB3]"
          >
            {isSubmitting ? 'Saving...' : 'Save Paid-Out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StaffMember {
  id: string;
  full_name: string;
  active: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CashDrawerPanelProps {
  mode?: 'staff' | 'admin';
  staffName?: string; // auto-filled in staff mode from usePOSAuth
}

export function CashDrawerPanel({ mode = 'admin', staffName }: CashDrawerPanelProps) {
  const {
    reportData,
    isLoading,
    cashCounted,
    setCashCounted,
    notes,
    setNotes,
    finalizeReport,
    printReport,
    deleteDrawerOperation,
    saveStaffCashCount,
    setDenominationBreakdown,
  } = useZReportStore();

  const {
    openingFloat,
    cashSales,
    cashRefunds,
    totalPaidOuts,
    paidIns,
    expectedCash,
    variance,
  } = useCashDrawerCalculations();

  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [closedBy, setClosedBy] = React.useState('');
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [staffList, setStaffList] = React.useState<StaffMember[]>([]);

  const isFinalized = reportData?.is_finalized ?? false;
  const operations = reportData?.cash_drawer?.operations ?? [];
  const isStaffMode = mode === 'staff';

  // Fetch staff list on mount (admin mode only)
  React.useEffect(() => {
    if (isStaffMode) return;
    const loadStaff = async () => {
      try {
        const { data, error } = await supabase.rpc('pos_staff_list');
        if (!error && data) {
          setStaffList(data.filter((s: StaffMember) => s.active));
        }
      } catch (err) {
        console.error('Failed to load staff list:', err);
      }
    };
    loadStaff();
  }, [isStaffMode]);

  const handleCashCountedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setCashCounted(null);
    } else {
      setCashCounted(parseFloat(value));
    }
  };

  // Denomination counter callback — auto-fills cash input
  const handleDenominationChange = React.useCallback((totalPounds: number, breakdown: Record<string, number>) => {
    setCashCounted(totalPounds > 0 ? totalPounds : null);
    setDenominationBreakdown(Object.keys(breakdown).length > 0 ? breakdown : null);
  }, [setCashCounted, setDenominationBreakdown]);

  // Staff mode: save cash count
  const handleSaveStaffCount = async () => {
    const name = staffName || 'Staff';
    setIsSaving(true);
    await saveStaffCashCount(name);
    setIsSaving(false);
  };

  // Admin mode: finalize
  const canFinalize = cashCounted !== null && closedBy.trim() !== '';

  const handleFinalizeAndPrint = async () => {
    setShowConfirmDialog(false);
    if (cashCounted === null) return;
    setIsFinalizing(true);
    const success = await finalizeReport(closedBy || undefined);
    if (success) {
      await printReport();
    }
    setIsFinalizing(false);
  };

  const getVarianceStatus = () => {
    if (variance === null) return null;
    if (Math.abs(variance) < 0.01) return 'exact';
    if (variance > 0) return 'over';
    return 'under';
  };

  const varianceStatus = getVarianceStatus();

  return (
    <Card className="bg-[#1A1A1A] border-white/10 overflow-hidden">
      {/* Teal accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#0EBAB1] to-[#0EBAB1]/30" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
          <Banknote className="h-4 w-4 text-[#0EBAB1]" />
          {isStaffMode ? 'CASH COUNT' : 'CASH DRAWER'}
          {isFinalized && (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0EBAB1]/20 border border-[#0EBAB1]/30">
              <Lock className="h-3 w-3 text-[#0EBAB1]" />
              <span className="text-xs font-medium text-[#0EBAB1]">Finalized</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-full bg-white/10" />
            <Skeleton className="h-5 w-full bg-white/10" />
            <Skeleton className="h-5 w-full bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* === CASH SUMMARY SECTION (admin only) === */}
            {!isStaffMode && (
              <div className="rounded-lg bg-white/[0.02] p-3 -mx-1 space-y-0">
                <CashRow label="Opening Float" value={openingFloat} />
                <CashRow label="Cash Sales" value={cashSales} prefix="+" />
                <CashRow label="Cash Refunds" value={cashRefunds} prefix="-" />
                <CashRow label="Paid Outs" value={totalPaidOuts} prefix="-" />
                {paidIns > 0 && <CashRow label="Paid Ins" value={paidIns} prefix="+" />}
                <CashRow label="Expected Cash" value={expectedCash} isTotal isHighlighted />
              </div>
            )}

            {/* Math helper formula (admin mode only) */}
            {!isStaffMode && (
              <div className="mt-1 px-3 py-2 rounded bg-white/[0.03] border border-white/5">
                <p className="text-xs text-[#8B92B3] font-mono">
                  Expected = Float + Cash Sales &minus; Refunds &minus; Paid Outs
                </p>
                <p className="text-xs text-[#8B92B3] font-mono mt-1">
                  {formatCurrency(openingFloat)} + {formatCurrency(cashSales)} &minus; {formatCurrency(cashRefunds)} &minus; {formatCurrency(totalPaidOuts)} = {formatCurrency(expectedCash)}
                </p>
              </div>
            )}

            {/* Paid-out operations list (admin only) */}
            {!isStaffMode && operations.filter((op) => op.operation_type === 'PAID_OUT').length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-[#8B92B3] mb-2">Paid-Out Details:</p>
                <div className="max-h-40 overflow-y-auto">
                {operations
                  .filter((op) => op.operation_type === 'PAID_OUT')
                  .map((op) => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between py-1 text-xs text-[#BBC3E1]"
                    >
                      <span className="truncate flex-1 mr-2">{op.reason || 'Paid out'}</span>
                      <span className="mr-2 tabular-nums">{formatCurrency(op.amount)}</span>
                      {!isFinalized && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-[#8B92B3] hover:text-red-400"
                          onClick={() => deleteDrawerOperation(op.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isStaffMode && !isFinalized && <AddPaidOutDialog />}

            {/* ============================================================ */}
            {/* ADMIN MODE: Staff Entry Info Block */}
            {/* ============================================================ */}
            {!isStaffMode && reportData?.staff_cash_counted != null && (
              <div className="mt-4 p-3 rounded-lg bg-[#5B3CC4]/10 border border-[#5B3CC4]/20">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="h-4 w-4 text-[#7C5DFA]" />
                  <span className="text-sm font-medium text-[#7C5DFA]">Staff Entry</span>
                </div>
                <div className="space-y-1 text-xs text-[#BBC3E1]">
                  <div className="flex justify-between">
                    <span>Counted by:</span>
                    <span className="text-white">{reportData.staff_closed_by || 'Unknown'}</span>
                  </div>
                  {reportData.staff_counted_at && (
                    <div className="flex justify-between">
                      <span>At:</span>
                      <span className="text-white">
                        {new Date(reportData.staff_counted_at).toLocaleString('en-GB', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Staff counted:</span>
                    <span className="text-white tabular-nums">
                      {formatCurrency(reportData.staff_cash_counted)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Staff variance:</span>
                    <span className={`tabular-nums ${
                      Math.abs(reportData.staff_cash_counted - expectedCash) < 0.01
                        ? 'text-[#0EBAB1]'
                        : reportData.staff_cash_counted - expectedCash > 0
                        ? 'text-[#4285F4]'
                        : 'text-[#7C5DFA]'
                    }`}>
                      {reportData.staff_cash_counted - expectedCash >= 0 ? '+' : ''}
                      {formatCurrency(reportData.staff_cash_counted - expectedCash)}
                    </span>
                  </div>
                </div>
                {/* Show staff denomination breakdown read-only */}
                {reportData.denomination_breakdown && Object.keys(reportData.denomination_breakdown).length > 0 && (
                  <div className="mt-2">
                    <DenominationCounter
                      onTotalChange={() => {}}
                      initialBreakdown={reportData.denomination_breakdown}
                      readOnly
                    />
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* CASH INPUT SECTION */}
            {/* ============================================================ */}
            <div className={`${isStaffMode ? '' : 'mt-4'} space-y-3`}>
              {/* Section label (admin only) */}
              {!isStaffMode && (
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] uppercase tracking-widest text-[#8B92B3] font-medium">
                    Count Cash
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              )}

              {/* Cash counted input */}
              <div className="space-y-2">
                <Label className="text-[#BBC3E1]">
                  {isStaffMode ? 'Cash in Hand' : 'Cash Counted at Close'}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B92B3] text-base">
                    &pound;
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={cashCounted ?? ''}
                    onChange={handleCashCountedChange}
                    disabled={isFinalized}
                    className="pl-8 h-12 text-lg font-semibold bg-[#252525] border-white/10 text-white tabular-nums"
                  />
                </div>
              </div>

              {/* Variance display (admin only) */}
              {!isStaffMode && variance !== null && (
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    varianceStatus === 'exact'
                      ? 'bg-[#0EBAB1]/10'
                      : varianceStatus === 'over'
                      ? 'bg-[#4285F4]/10'
                      : 'bg-[#7C5DFA]/10'
                  }`}
                >
                  <span className="text-sm text-[#BBC3E1] flex items-center gap-2">
                    {varianceStatus === 'exact' ? (
                      <CheckCircle className="h-4 w-4 text-[#0EBAB1]" />
                    ) : (
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          varianceStatus === 'over' ? 'text-[#4285F4]' : 'text-[#7C5DFA]'
                        }`}
                      />
                    )}
                    Variance
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      varianceStatus === 'exact'
                        ? 'text-[#0EBAB1]'
                        : varianceStatus === 'over'
                        ? 'text-[#4285F4]'
                        : 'text-[#7C5DFA]'
                    }`}
                  >
                    {variance >= 0 ? '+' : ''}
                    {formatCurrency(variance)}
                  </span>
                </div>
              )}

              {/* Denomination counter — optional helper for staff, collapsed by default */}
              {isStaffMode && !isFinalized && (
                <DenominationCounter
                  onTotalChange={handleDenominationChange}
                  initialBreakdown={reportData?.denomination_breakdown || undefined}
                />
              )}

              {/* ============================================================ */}
              {/* STAFF MODE: simple save */}
              {/* ============================================================ */}
              {isStaffMode && !isFinalized && (
                <>
                  {staffName && (
                    <div className="flex items-center gap-2 text-sm text-[#BBC3E1]">
                      <User className="h-4 w-4 text-[#8B92B3]" />
                      <span>Closed by: <span className="text-white font-medium">{staffName}</span></span>
                    </div>
                  )}
                  <Button
                    onClick={handleSaveStaffCount}
                    disabled={cashCounted === null || isSaving}
                    className="w-full h-12 text-base font-semibold bg-[#0EBAB1] hover:bg-[#0A9A92] text-white mt-2 disabled:opacity-50 shadow-lg shadow-[#0EBAB1]/20"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  {cashCounted === null && (
                    <p className="text-xs text-[#8B92B3] text-center">
                      Enter cash amount to save
                    </p>
                  )}
                  {/* Saved-state indicator */}
                  {reportData?.staff_cash_counted != null && reportData?.staff_counted_at && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0EBAB1]/10 border border-[#0EBAB1]/20">
                      <CheckCircle className="h-4 w-4 text-[#0EBAB1] shrink-0" />
                      <div className="text-xs text-[#BBC3E1]">
                        <span className="text-[#0EBAB1] font-medium">Saved</span>
                        {' '}&mdash;{' '}
                        {formatCurrency(reportData.staff_cash_counted)} at{' '}
                        {new Date(reportData.staff_counted_at).toLocaleString('en-GB', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ============================================================ */}
              {/* ADMIN MODE: notes, staff dropdown, finalize */}
              {/* ============================================================ */}
              {!isStaffMode && (
                <>
                  {/* Section label */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] uppercase tracking-widest text-[#8B92B3] font-medium">
                      Close Day
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-[#BBC3E1]">Notes</Label>
                    <Textarea
                      placeholder="Optional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isFinalized}
                      className="bg-[#252525] border-white/10 text-white min-h-[60px] resize-none"
                    />
                  </div>

                  {/* Closed by - staff dropdown */}
                  {!isFinalized && (
                    <div className="space-y-2">
                      <Label className="text-[#BBC3E1]">
                        Closed By <span className="text-[#7C5DFA]">*</span>
                      </Label>
                      {staffList.length > 0 ? (
                        <Select value={closedBy} onValueChange={setClosedBy}>
                          <SelectTrigger className="bg-[#252525] border-white/10 text-white">
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-white/10">
                            {staffList.map((staff) => (
                              <SelectItem
                                key={staff.id}
                                value={staff.full_name}
                                className="text-white hover:bg-white/10 focus:bg-white/10"
                              >
                                {staff.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Staff name"
                          value={closedBy}
                          onChange={(e) => setClosedBy(e.target.value)}
                          className="bg-[#252525] border-white/10 text-white"
                        />
                      )}
                    </div>
                  )}

                  {/* Finalize button */}
                  {!isFinalized && (
                    <Button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={!canFinalize || isFinalizing}
                      className="w-full bg-[#0EBAB1] hover:bg-[#0A9A92] text-white mt-2 disabled:opacity-50"
                    >
                      {isFinalizing ? 'Finalizing...' : 'Finalize Z-Report'}
                    </Button>
                  )}

                  {!isFinalized && !canFinalize && (
                    <p className="text-xs text-[#8B92B3] text-center">
                      Enter cash counted and select staff to finalize
                    </p>
                  )}

                  {isFinalized && reportData?.finalized_at && (
                    <div className="text-xs text-[#8B92B3] text-center mt-2">
                      Finalized at{' '}
                      {new Date(reportData.finalized_at).toLocaleString('en-GB', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Finalize confirmation dialog (admin mode only) */}
      {!isStaffMode && (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="bg-[#1A1A1A] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Finalize Z-Report?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#BBC3E1]">
                This will lock the report and automatically print a thermal receipt.
                Once finalized, you cannot edit the cash drawer details.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8B92B3]">Expected Cash:</span>
                <span className="text-white tabular-nums">{formatCurrency(expectedCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B92B3]">Counted Cash:</span>
                <span className="text-white tabular-nums">{formatCurrency(cashCounted ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B92B3]">Variance:</span>
                <span
                  className={`tabular-nums ${
                    variance !== null && Math.abs(variance) < 0.01
                      ? 'text-[#0EBAB1]'
                      : variance !== null && variance > 0
                      ? 'text-[#4285F4]'
                      : 'text-[#7C5DFA]'
                  }`}
                >
                  {variance !== null ? `${variance >= 0 ? '+' : ''}${formatCurrency(variance)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B92B3]">Closed By:</span>
                <span className="text-white">{closedBy}</span>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-[#BBC3E1] hover:bg-white/5 hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleFinalizeAndPrint}
                className="bg-[#0EBAB1] hover:bg-[#0A9A92] text-white"
              >
                Finalize & Print
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
