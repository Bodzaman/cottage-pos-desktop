import React from 'react';
import { PoundSterling, ShoppingCart, CreditCard, Banknote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useZReportStore, useCashDrawerCalculations } from '../../utils/zReportStore';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  iconBgColor: string;
  iconColor: string;
  isLoading?: boolean;
}

function KPICard({ icon, label, value, subValue, iconBgColor, iconColor, isLoading }: KPICardProps) {
  return (
    <Card className="bg-[#1A1A1A] border-white/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="p-2.5 rounded-lg shrink-0"
            style={{ backgroundColor: iconBgColor }}
          >
            <div style={{ color: iconColor }}>{icon}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#BBC3E1] mb-1">{label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 bg-white/10" />
            ) : (
              <>
                <p className="text-xl font-bold text-white truncate">{value}</p>
                {subValue && (
                  <p className="text-xs text-[#8B92B3] mt-0.5">{subValue}</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ZReportKPICards() {
  const { reportData, isLoading } = useZReportStore();
  const { expectedCash } = useCashDrawerCalculations();

  const grossSales = reportData?.gross_sales ?? 0;
  const totalOrders = reportData?.total_orders ?? 0;
  const cashSales = reportData?.payment_breakdown?.cash?.sales ?? 0;
  const cardSales = reportData?.payment_breakdown?.card?.sales ?? 0;
  const onlineSales = reportData?.payment_breakdown?.online?.sales ?? 0;

  const hasOrders = totalOrders > 0;
  const totalPayments = cashSales + cardSales + onlineSales;
  const cashPercent = totalPayments > 0 ? Math.round((cashSales / totalPayments) * 100) : 0;
  const cardPercent = totalPayments > 0 ? Math.round(((cardSales + onlineSales) / totalPayments) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        icon={<PoundSterling className="h-5 w-5" />}
        label="Grand Total"
        value={hasOrders ? formatCurrency(grossSales) : '—'}
        iconBgColor="rgba(91, 60, 196, 0.2)"
        iconColor="#5B3CC4"
        isLoading={isLoading}
      />

      <KPICard
        icon={<ShoppingCart className="h-5 w-5" />}
        label="Total Orders"
        value={hasOrders ? totalOrders : '—'}
        iconBgColor="rgba(14, 186, 177, 0.2)"
        iconColor="#0EBAB1"
        isLoading={isLoading}
      />

      <KPICard
        icon={<Banknote className="h-5 w-5" />}
        label="Expected Cash"
        value={hasOrders ? formatCurrency(expectedCash) : '—'}
        iconBgColor="rgba(14, 186, 177, 0.2)"
        iconColor="#0EBAB1"
        isLoading={isLoading}
      />

      <KPICard
        icon={
          <div className="flex items-center gap-1">
            <Banknote className="h-4 w-4" />
            <CreditCard className="h-4 w-4" />
          </div>
        }
        label="Cash vs Card"
        value={hasOrders ? `${cashPercent}% / ${cardPercent}%` : '—'}
        subValue={hasOrders ? `Cash ${formatCurrency(cashSales)} | Card ${formatCurrency(cardSales + onlineSales)}` : 'No transactions'}
        iconBgColor="rgba(66, 133, 244, 0.2)"
        iconColor="#4285F4"
        isLoading={isLoading}
      />
    </div>
  );
}
