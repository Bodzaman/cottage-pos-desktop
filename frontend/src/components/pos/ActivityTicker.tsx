/**
 * ActivityTicker.tsx
 *
 * Compact, animated ticker showing non-monetary order volume metrics:
 * - Orders today
 * - Items sold today
 * - Orders per hour (rolling 60-min window)
 *
 * No revenue, totals, or averages displayed.
 * Uses Framer Motion spring animation for smooth counting.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ---------------------------------------------------------------------------
// Animated counter component
// ---------------------------------------------------------------------------

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      className="tabular-nums"
    >
      {displayValue}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TickerData {
  orderCount: number;
  itemsSold: number;
  ordersPerHour: number;
}

export function ActivityTicker() {
  const [data, setData] = useState<TickerData>({
    orderCount: 0,
    itemsSold: 0,
    ordersPerHour: 0,
  });

  const recentOrderTimestamps = useRef<number[]>([]);

  // Calculate orders per hour from a rolling 60-minute window
  const calcOrdersPerHour = useCallback(() => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    recentOrderTimestamps.current = recentOrderTimestamps.current.filter(t => t > oneHourAgo);
    return recentOrderTimestamps.current.length;
  }, []);

  // Initial load: fetch today's order count + items sold
  useEffect(() => {
    const fetchTodayStats = async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, created_at, items')
          .gte('created_at', todayStart.toISOString())
          .not('status', 'eq', 'CANCELLED');

        if (error || !orders) return;

        let totalItems = 0;
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        orders.forEach((order: any) => {
          // Count items
          if (Array.isArray(order.items)) {
            totalItems += order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
          }
          // Track recent timestamps for orders/hour
          const ts = new Date(order.created_at).getTime();
          if (ts > oneHourAgo) {
            recentOrderTimestamps.current.push(ts);
          }
        });

        setData({
          orderCount: orders.length,
          itemsSold: totalItems,
          ordersPerHour: calcOrdersPerHour(),
        });
      } catch {
        // Silently fail — ticker is non-critical
      }
    };

    fetchTodayStats();
  }, [calcOrdersPerHour]);

  // Subscribe to realtime order inserts for live updates
  useEffect(() => {
    const channel = supabase
      .channel('activity-ticker-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          const order = payload.new;
          if (!order || order.status === 'CANCELLED') return;

          recentOrderTimestamps.current.push(Date.now());

          const itemCount = Array.isArray(order.items)
            ? order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
            : 0;

          setData(prev => ({
            orderCount: prev.orderCount + 1,
            itemsSold: prev.itemsSold + itemCount,
            ordersPerHour: calcOrdersPerHour(),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [calcOrdersPerHour]);

  // Refresh orders/hour every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({ ...prev, ordersPerHour: calcOrdersPerHour() }));
    }, 60000);
    return () => clearInterval(interval);
  }, [calcOrdersPerHour]);

  return (
    <div className="flex items-center gap-3">
      {/* Orders today */}
      <div className="flex items-center gap-1 group relative">
        <ShoppingBag size={12} className="text-purple-400" />
        <span className="text-xs font-bold text-white tabular-nums">
          <AnimatedNumber value={data.orderCount} />
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Orders today
        </div>
      </div>

      <span className="text-gray-600 text-xs">|</span>

      {/* Items sold */}
      <div className="flex items-center gap-1 group relative">
        <Package size={12} className="text-emerald-400" />
        <span className="text-xs font-bold text-white tabular-nums">
          <AnimatedNumber value={data.itemsSold} />
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Items sold today
        </div>
      </div>

      <span className="text-gray-600 text-xs">|</span>

      {/* Orders per hour */}
      <div className="flex items-center gap-1 group relative">
        <TrendingUp size={12} className="text-amber-400" />
        <span className="text-xs font-bold text-white tabular-nums">
          <AnimatedNumber value={data.ordersPerHour} />
          <span className="text-gray-400 font-normal">/hr</span>
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Orders in the last hour
        </div>
      </div>
    </div>
  );
}
