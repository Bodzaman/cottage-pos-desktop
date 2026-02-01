import React, { useEffect, useState } from 'react';
import { Check, X, Clock, Zap, UserCheck, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useZReportStore } from '../../utils/zReportStore';
import { supabase } from '../../utils/supabase';

interface AcceptanceMetrics {
  totalOrders: number;
  autoAccepted: number;
  manuallyAccepted: number;
  acceptedWithChanges: number;
  rejected: number;
  timedOut: number;
  acceptanceRate: number;
  avgAcceptanceTimeSeconds: number | null;
  rejectionReasons: Record<string, number>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  iconBgColor: string;
  iconColor: string;
  isLoading?: boolean;
}

function MetricCard({ icon, label, value, subValue, iconBgColor, iconColor, isLoading }: MetricCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
      <div
        className="p-2 rounded-lg shrink-0"
        style={{ backgroundColor: iconBgColor }}
      >
        <div style={{ color: iconColor }}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#BBC3E1] mb-0.5">{label}</p>
        {isLoading ? (
          <Skeleton className="h-6 w-16 bg-white/10" />
        ) : (
          <>
            <p className="text-lg font-bold text-white">{value}</p>
            {subValue && (
              <p className="text-xs text-[#8B92B3] mt-0.5">{subValue}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function OrderAcceptanceMetrics() {
  const { dateRange, isLoading: reportLoading } = useZReportStore();
  const [metrics, setMetrics] = useState<AcceptanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAcceptanceMetrics() {
      if (!dateRange.from) return;

      setIsLoading(true);
      setError(null);

      try {
        // Format date range for query
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to || dateRange.from);
        toDate.setHours(23, 59, 59, 999);

        // Query the order_acceptance_log table
        const { data: logs, error: queryError } = await supabase
          .from('order_acceptance_log')
          .select('action, reason, created_at, order_id')
          .gte('created_at', fromDate.toISOString())
          .lte('created_at', toDate.toISOString());

        if (queryError) {
          console.error('Error fetching acceptance logs:', queryError);
          setError('Failed to load acceptance metrics');
          setMetrics(null);
          return;
        }

        if (!logs || logs.length === 0) {
          setMetrics({
            totalOrders: 0,
            autoAccepted: 0,
            manuallyAccepted: 0,
            acceptedWithChanges: 0,
            rejected: 0,
            timedOut: 0,
            acceptanceRate: 0,
            avgAcceptanceTimeSeconds: null,
            rejectionReasons: {},
          });
          return;
        }

        // Get unique orders to count each order only once
        const uniqueOrderActions = new Map<string, typeof logs[0]>();
        logs.forEach(log => {
          // Keep the latest action for each order
          if (!uniqueOrderActions.has(log.order_id) ||
              new Date(log.created_at) > new Date(uniqueOrderActions.get(log.order_id)!.created_at)) {
            uniqueOrderActions.set(log.order_id, log);
          }
        });

        // Calculate metrics based on unique orders
        const uniqueLogs = Array.from(uniqueOrderActions.values());

        const autoAccepted = uniqueLogs.filter(l => l.action === 'AUTO_ACCEPTED').length;
        const manuallyAccepted = uniqueLogs.filter(l => l.action === 'MANUALLY_ACCEPTED').length;
        const acceptedWithChanges = uniqueLogs.filter(l => l.action === 'ACCEPTED_WITH_CHANGES').length;
        const rejected = uniqueLogs.filter(l => l.action === 'REJECTED').length;
        const timedOut = uniqueLogs.filter(l => l.action === 'TIMED_OUT').length;

        const totalOrders = uniqueLogs.length;
        const totalAccepted = autoAccepted + manuallyAccepted + acceptedWithChanges;
        const acceptanceRate = totalOrders > 0 ? (totalAccepted / totalOrders) * 100 : 0;

        // Calculate average acceptance time for manual acceptances
        // This would require comparing with order creation time
        // For now we'll get this from orders table
        let avgAcceptanceTimeSeconds: number | null = null;

        if (manuallyAccepted + acceptedWithChanges > 0) {
          const manuallyAcceptedOrderIds = uniqueLogs
            .filter(l => l.action === 'MANUALLY_ACCEPTED' || l.action === 'ACCEPTED_WITH_CHANGES')
            .map(l => l.order_id);

          const { data: orders } = await supabase
            .from('orders')
            .select('created_at, accepted_at')
            .in('id', manuallyAcceptedOrderIds)
            .not('accepted_at', 'is', null);

          if (orders && orders.length > 0) {
            const totalSeconds = orders.reduce((sum, order) => {
              const created = new Date(order.created_at).getTime();
              const accepted = new Date(order.accepted_at).getTime();
              return sum + (accepted - created) / 1000;
            }, 0);
            avgAcceptanceTimeSeconds = totalSeconds / orders.length;
          }
        }

        // Count rejection reasons
        const rejectionReasons: Record<string, number> = {};
        uniqueLogs
          .filter(l => l.action === 'REJECTED' || l.action === 'TIMED_OUT')
          .forEach(log => {
            const reason = log.reason || (log.action === 'TIMED_OUT' ? 'timeout' : 'unspecified');
            rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
          });

        setMetrics({
          totalOrders,
          autoAccepted,
          manuallyAccepted,
          acceptedWithChanges,
          rejected,
          timedOut,
          acceptanceRate,
          avgAcceptanceTimeSeconds,
          rejectionReasons,
        });
      } catch (err) {
        console.error('Error fetching acceptance metrics:', err);
        setError('Failed to load acceptance metrics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAcceptanceMetrics();
  }, [dateRange.from, dateRange.to]);

  const loading = isLoading || reportLoading;

  // Don't show if no data
  if (!loading && (!metrics || metrics.totalOrders === 0)) {
    return null;
  }

  const totalAccepted = (metrics?.autoAccepted || 0) + (metrics?.manuallyAccepted || 0) + (metrics?.acceptedWithChanges || 0);
  const totalRejected = (metrics?.rejected || 0) + (metrics?.timedOut || 0);

  return (
    <Card className="bg-[#1A1A1A] border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-white flex items-center gap-2">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
            <Check className="h-4 w-4" style={{ color: '#22C55E' }} />
          </div>
          Order Acceptance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <div className="space-y-4">
            {/* Main metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={<Check className="h-4 w-4" />}
                label="Acceptance Rate"
                value={loading ? '—' : `${Math.round(metrics?.acceptanceRate || 0)}%`}
                subValue={loading ? undefined : `${totalAccepted} of ${metrics?.totalOrders} orders`}
                iconBgColor="rgba(34, 197, 94, 0.2)"
                iconColor="#22C55E"
                isLoading={loading}
              />

              <MetricCard
                icon={<Timer className="h-4 w-4" />}
                label="Avg Accept Time"
                value={loading ? '—' : (metrics?.avgAcceptanceTimeSeconds ? formatDuration(metrics.avgAcceptanceTimeSeconds) : 'N/A')}
                subValue={loading ? undefined : 'Manual orders only'}
                iconBgColor="rgba(59, 130, 246, 0.2)"
                iconColor="#3B82F6"
                isLoading={loading}
              />
            </div>

            {/* Acceptance breakdown */}
            <div className="space-y-2">
              <p className="text-xs text-[#8B92B3] uppercase tracking-wide">Breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  icon={<Zap className="h-4 w-4" />}
                  label="Auto-Accepted"
                  value={loading ? '—' : metrics?.autoAccepted || 0}
                  iconBgColor="rgba(234, 179, 8, 0.2)"
                  iconColor="#EAB308"
                  isLoading={loading}
                />
                <MetricCard
                  icon={<UserCheck className="h-4 w-4" />}
                  label="Manual Accept"
                  value={loading ? '—' : metrics?.manuallyAccepted || 0}
                  iconBgColor="rgba(14, 186, 177, 0.2)"
                  iconColor="#0EBAB1"
                  isLoading={loading}
                />
                <MetricCard
                  icon={<Clock className="h-4 w-4" />}
                  label="With Changes"
                  value={loading ? '—' : metrics?.acceptedWithChanges || 0}
                  iconBgColor="rgba(168, 85, 247, 0.2)"
                  iconColor="#A855F7"
                  isLoading={loading}
                />
                <MetricCard
                  icon={<X className="h-4 w-4" />}
                  label="Rejected/Timed Out"
                  value={loading ? '—' : totalRejected}
                  subValue={loading ? undefined : (metrics?.timedOut ? `${metrics.timedOut} timed out` : undefined)}
                  iconBgColor="rgba(239, 68, 68, 0.2)"
                  iconColor="#EF4444"
                  isLoading={loading}
                />
              </div>
            </div>

            {/* Rejection reasons if any */}
            {!loading && metrics && totalRejected > 0 && Object.keys(metrics.rejectionReasons).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#8B92B3] uppercase tracking-wide">Rejection Reasons</p>
                <div className="space-y-1.5">
                  {Object.entries(metrics.rejectionReasons).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between px-3 py-2 rounded bg-white/5">
                      <span className="text-sm text-[#BBC3E1] capitalize">
                        {reason.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-medium text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderAcceptanceMetrics;
