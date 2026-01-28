import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  Printer,
  RefreshCw,
  Calendar,
  Loader2,
  CalendarDays,
  ClipboardList,
} from 'lucide-react';
import { useZReportStore } from '../utils/zReportStore';
import { ZReportKPICards } from './z-report/ZReportKPICards';
import { ZReportBreakdownSection } from './z-report/ZReportBreakdownSection';
import { CashDrawerPanel } from './z-report/CashDrawerPanel';
import { DatePreset } from '../types/zReport';

interface EndOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName?: string; // from usePOSAuth
}

// Limited date presets for End of Day
const EOD_PRESETS: { preset: DatePreset; label: string }[] = [
  { preset: 'today', label: 'Today' },
  { preset: 'yesterday', label: 'Yesterday' },
  { preset: 'this_week', label: 'This Week' },
];

export function EndOfDayModal({ isOpen, onClose, staffName }: EndOfDayModalProps) {
  const {
    fetchConfig,
    fetchCurrentBusinessDate,
    fetchReport,
    setDatePreset,
    dateRange,
    reportData,
    isLoading,
    error,
    printReport,
    reset,
  } = useZReportStore();

  const [isPrinting, setIsPrinting] = React.useState(false);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      fetchConfig().catch(console.error);
      fetchCurrentBusinessDate()
        .then(() => fetchReport())
        .catch(console.error);
    }
  }, [isOpen, fetchConfig, fetchCurrentBusinessDate, fetchReport]);

  // Reset on close
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
  };

  const handleRefresh = () => {
    fetchReport().catch(console.error);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    await printReport();
    setIsPrinting(false);
  };

  const currentPreset = dateRange.preset;
  const totalOrders = reportData?.total_orders ?? 0;
  const hasData = totalOrders > 0;

  // Format date for subtitle
  const getDateLabel = () => {
    if (!dateRange.from) return '';
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    if (currentPreset === 'today' || currentPreset === 'yesterday') {
      return dateRange.from.toLocaleDateString('en-GB', opts);
    }
    if (dateRange.from && dateRange.to) {
      const fromStr = dateRange.from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const toStr = dateRange.to.toLocaleDateString('en-GB', opts);
      return `${fromStr} - ${toStr}`;
    }
    return dateRange.from.toLocaleDateString('en-GB', opts);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="p-0 border-0 !overflow-hidden"
        hideCloseButton
        style={{
          maxWidth: '95vw',
          width: '95vw',
          height: 'min(88vh, 820px)',
          maxHeight: '88vh',
          backgroundColor: '#111111',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* ============================================================ */}
          {/* FIXED HEADER */}
          {/* ============================================================ */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-[#111111]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">End of Day Report</h2>
                  <p className="text-sm text-[#8B92B3] mt-0.5 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {getDateLabel()}
                  </p>
                </div>

                {/* Date preset buttons */}
                <div className="flex items-center gap-1 ml-4 bg-[#1A1A1A] rounded-lg p-1">
                  {EOD_PRESETS.map(({ preset, label }) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetChange(preset)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        currentPreset === preset
                          ? 'bg-[#5B3CC4] text-white'
                          : 'text-[#8B92B3] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="border-white/10 text-[#BBC3E1] hover:bg-white/5 hover:text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={isPrinting || !hasData}
                  className="border-white/10 text-[#BBC3E1] hover:bg-white/5 hover:text-white"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  {isPrinting ? 'Printing...' : 'Print'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="hover:bg-white/10 text-[#8B92B3] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SCROLLABLE BODY */}
          {/* ============================================================ */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full">
              {isLoading && !reportData ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-[#5B3CC4]" />
                  <span className="ml-3 text-[#8B92B3]">Loading report...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Calendar className="w-12 h-12 text-[#8B92B3] mb-4" />
                  <p className="text-[#BBC3E1] mb-2">Could not load report</p>
                  <p className="text-sm text-[#8B92B3]">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-4 border-white/10 text-[#BBC3E1]"
                  >
                    Try Again
                  </Button>
                </div>
              ) : !hasData ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status card */}
                    <div className="lg:col-span-1">
                      <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                        <ClipboardList className="w-10 h-10 text-[#8B92B3] mb-3" />
                        <p className="text-base font-medium text-[#BBC3E1] mb-1">No orders for this period</p>
                        <p className="text-sm text-[#8B92B3] mb-4">
                          There are no completed orders to report.
                        </p>
                        {currentPreset === 'today' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePresetChange('yesterday')}
                            className="border-white/10 text-[#BBC3E1] hover:bg-white/5 hover:text-white"
                          >
                            View Yesterday
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Cash drawer — still accessible for counting */}
                    <div className="lg:col-span-2">
                      <CashDrawerPanel mode="staff" staffName={staffName} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* KPI Cards */}
                  <ZReportKPICards />

                  {/* Main grid: Breakdowns + Cash Count */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                      <ZReportBreakdownSection />
                    </div>
                    <div className="lg:col-span-2">
                      <CashDrawerPanel mode="staff" staffName={staffName} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
