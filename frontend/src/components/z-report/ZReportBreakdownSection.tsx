import React from 'react';
import { UtensilsCrossed, ShoppingBag, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useZReportStore } from '../../utils/zReportStore';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface BreakdownRowProps {
  label: string;
  count?: number;
  total: number;
  isSubtotal?: boolean;
}

function BreakdownRow({ label, count, total, isSubtotal }: BreakdownRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${
        isSubtotal
          ? 'border-t-2 border-white/20 mt-1 pt-2.5 font-semibold bg-white/[0.02] -mx-3 px-3 rounded'
          : ''
      }`}
    >
      <span className={`text-sm ${isSubtotal ? 'text-white font-medium' : 'text-[#BBC3E1]'}`}>
        {label}
      </span>
      <div className="flex items-center gap-4">
        {count !== undefined && (
          <span className={`text-sm w-12 text-right tabular-nums ${isSubtotal ? 'text-white' : 'text-[#8B92B3]'}`}>{count}</span>
        )}
        <span className={`text-sm w-24 text-right tabular-nums ${isSubtotal ? 'text-white font-medium' : 'text-[#BBC3E1]'}`}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

interface BreakdownCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

function BreakdownCard({ title, icon, iconColor, children, isLoading }: BreakdownCardProps) {
  return (
    <Card className="bg-[#1A1A1A] border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
          <span style={{ color: iconColor }}>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-full bg-white/10" />
            <Skeleton className="h-5 w-full bg-white/10" />
            <Skeleton className="h-5 w-3/4 bg-white/10" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function ZReportBreakdownSection() {
  const { reportData, isLoading } = useZReportStore();

  const channel = reportData?.channel_breakdown;

  // Dine-in
  const dineIn = channel?.dine_in || { count: 0, total: 0, tables: 0, guests: 0 };

  // POS Takeaway
  const posWaiting = channel?.pos_waiting || { count: 0, total: 0 };
  const posCollection = channel?.pos_collection || { count: 0, total: 0 };
  const posDelivery = channel?.pos_delivery || { count: 0, total: 0 };
  const posTakeawayTotal = posWaiting.total + posCollection.total + posDelivery.total;
  const posTakeawayCount = posWaiting.count + posCollection.count + posDelivery.count;

  // Online
  const onlineCollection = channel?.online_collection || { count: 0, total: 0 };
  const onlineDelivery = channel?.online_delivery || { count: 0, total: 0 };
  const onlineTotal = onlineCollection.total + onlineDelivery.total;
  const onlineCount = onlineCollection.count + onlineDelivery.count;

  return (
    <div className="space-y-4">
      {/* Dine-In Section */}
      <BreakdownCard
        title="DINE-IN"
        icon={<UtensilsCrossed className="h-4 w-4" />}
        iconColor="#5B3CC4"
        isLoading={isLoading}
      >
        <div className="space-y-0">
          <div className="flex items-center justify-between text-xs text-[#8B92B3] pb-1 border-b border-white/5">
            <span>Metric</span>
            <div className="flex items-center gap-4">
              <span className="w-12 text-right">Count</span>
              <span className="w-24 text-right">Total</span>
            </div>
          </div>
          <BreakdownRow label="Tables Served" count={dineIn.tables} total={0} />
          <BreakdownRow label="Guests Served" count={dineIn.guests} total={0} />
          <BreakdownRow label="Dine-In Total" count={dineIn.count} total={dineIn.total} isSubtotal />
        </div>
      </BreakdownCard>

      {/* POS Takeaway Section */}
      <BreakdownCard
        title="POS TAKEAWAY"
        icon={<ShoppingBag className="h-4 w-4" />}
        iconColor="#0EBAB1"
        isLoading={isLoading}
      >
        <div className="space-y-0">
          <div className="flex items-center justify-between text-xs text-[#8B92B3] pb-1 border-b border-white/5">
            <span>Type</span>
            <div className="flex items-center gap-4">
              <span className="w-12 text-right">Qty</span>
              <span className="w-24 text-right">Total</span>
            </div>
          </div>
          <BreakdownRow label="Waiting" count={posWaiting.count} total={posWaiting.total} />
          <BreakdownRow label="Collection" count={posCollection.count} total={posCollection.total} />
          <BreakdownRow label="Delivery" count={posDelivery.count} total={posDelivery.total} />
          <BreakdownRow label="Subtotal" count={posTakeawayCount} total={posTakeawayTotal} isSubtotal />
        </div>
      </BreakdownCard>

      {/* Online Orders Section */}
      <BreakdownCard
        title="ONLINE ORDERS"
        icon={<Globe className="h-4 w-4" />}
        iconColor="#4285F4"
        isLoading={isLoading}
      >
        <div className="space-y-0">
          <div className="flex items-center justify-between text-xs text-[#8B92B3] pb-1 border-b border-white/5">
            <span>Type</span>
            <div className="flex items-center gap-4">
              <span className="w-12 text-right">Qty</span>
              <span className="w-24 text-right">Total</span>
            </div>
          </div>
          <BreakdownRow label="Collection" count={onlineCollection.count} total={onlineCollection.total} />
          <BreakdownRow label="Delivery" count={onlineDelivery.count} total={onlineDelivery.total} />
          <BreakdownRow label="Subtotal" count={onlineCount} total={onlineTotal} isSubtotal />
        </div>
      </BreakdownCard>

      {/* Grand Total Card */}
      <Card className="bg-[#252525] border-[#5B3CC4]/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">GRAND TOTAL</span>
            <span className="text-2xl font-bold text-white">
              {isLoading ? (
                <Skeleton className="h-8 w-32 bg-white/10" />
              ) : (
                formatCurrency(reportData?.gross_sales ?? 0)
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
