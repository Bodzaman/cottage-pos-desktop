import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '../utils/ProtectedRoute';
import { useZReportStore, useZReportInit } from '../utils/zReportStore';
import {
  ZReportHeader,
  ZReportKPICards,
  ZReportBreakdownSection,
  CashDrawerPanel,
} from '../components/z-report';

export default function ZReport() {
  useZReportInit();

  const { error, reportData, isLoading, setDatePreset } = useZReportStore();
  const hasOrders = reportData && reportData.total_orders > 0;

  return (
    <ProtectedRoute requireAuth requireStaff>
      <div className="min-h-screen bg-[#0F0F0F]">
        {/* Sticky Header */}
        <ZReportHeader />

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-[#7C5DFA]/10 border border-[#7C5DFA]/30 rounded-lg">
            <p className="text-sm text-[#7C5DFA]">{error}</p>
          </div>
        )}

        {/* Empty state when no orders */}
        {!isLoading && !error && reportData && !hasOrders ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <Calendar className="h-12 w-12 text-[#8B92B3] mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No takings for this period</h3>
            <p className="text-sm text-[#8B92B3] text-center mb-4 max-w-md">
              There were no completed orders during this time period.
              Try selecting Yesterday or Last 7 days to view historical data.
            </p>
            <Button
              variant="outline"
              onClick={() => setDatePreset('yesterday')}
              className="bg-[#1A1A1A] border-white/10 text-white hover:bg-white/10"
            >
              View Yesterday
            </Button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="px-4 pt-4">
              <ZReportKPICards />
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 pb-8">
              {/* Left Column - Breakdowns (2/3 width on desktop) */}
              <div className="lg:col-span-2 space-y-4">
                <ZReportBreakdownSection />
              </div>

              {/* Right Column - Cash Drawer (1/3 width on desktop) */}
              <div className="lg:col-span-1">
                <CashDrawerPanel />
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
