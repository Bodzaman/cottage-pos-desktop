import React from 'react';
import { Printer, RefreshCw, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePresetSelector } from './DatePresetSelector';
import { useZReportStore } from '../../utils/zReportStore';
import { exportZReportCSV } from '../../utils/exportUtils';

interface ZReportHeaderProps {
  onSettingsClick?: () => void;
}

export function ZReportHeader({ onSettingsClick }: ZReportHeaderProps) {
  const { refreshReport, printReport, isLoading, reportData, dateRange, config } = useZReportStore();
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    await printReport();
    setIsPrinting(false);
  };

  const handleExport = async () => {
    if (!reportData) return;
    setIsExporting(true);
    try {
      await exportZReportCSV(reportData);
    } catch (error) {
      console.error('[ZReport] Export failed:', error);
    }
    setIsExporting(false);
  };

  const handleRefresh = () => {
    refreshReport();
  };

  const isFinalized = reportData?.is_finalized ?? false;

  // Dynamic subtitle based on selected date range
  const isSingleDay = dateRange.preset === 'today' || dateRange.preset === 'yesterday';
  const subtitle = isSingleDay ? 'Z-Report' : 'Period Summary';

  // Business day context for single-day presets
  const getBusinessDayContext = () => {
    if (!isSingleDay) return null;
    const cutoff = config?.business_day_cutoff || '05:00:00';
    const parts = cutoff.split(':');
    const startH = parseInt(parts[0], 10);
    const startM = parseInt(parts[1], 10);
    const endH = startM === 0 ? (startH === 0 ? 23 : startH - 1) : startH;
    const endM = startM === 0 ? 59 : startM - 1;
    const fmt = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return `Business day ${fmt(startH, startM)} → ${fmt(endH, endM)}`;
  };

  const businessDayContext = getBusinessDayContext();

  return (
    <div className="sticky top-0 z-10 bg-[#0F0F0F]/95 backdrop-blur-sm border-b border-white/10 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white">Reconciliations</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-[#BBC3E1]">{subtitle}</p>
            {businessDayContext && (
              <span className="text-xs text-[#8B92B3]">({businessDayContext})</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DatePresetSelector />

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-[#1A1A1A] border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isPrinting || !reportData}
            className="bg-[#1A1A1A] border-white/10 text-white hover:bg-white/10"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'Printing...' : isFinalized ? 'Reprint' : 'Print Preview'}
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || !reportData}
            className="bg-[#1A1A1A] border-white/10 text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>

          {onSettingsClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="text-[#BBC3E1] hover:text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
