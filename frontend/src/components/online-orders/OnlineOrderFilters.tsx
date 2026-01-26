/**
 * OnlineOrderFilters Component
 * Left panel for the Online Orders view in ResponsivePOSShell
 * Contains: Sound toggle, refresh, connection status, stats
 */

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Bell,
  ShoppingBag,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOnlineOrdersRealtimeStore } from 'utils/stores/onlineOrdersRealtimeStore';

export function OnlineOrderFilters() {
  const {
    connectionStatus,
    soundEnabled,
    setSoundEnabled,
    fetchOrders,
    newOrders,
    preparingOrders,
    readyOrders,
    urgentOrders,
  } = useOnlineOrdersRealtimeStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success('Orders refreshed');
  }, [fetchOrders]);

  const newCount = newOrders().length;
  const preparingCount = preparingOrders().length;
  const readyCount = readyOrders().length;
  const urgentCount = urgentOrders().length;

  return (
    <div className="flex flex-col h-full bg-[#121212] rounded-lg overflow-hidden border border-white/5">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <h2 className="text-lg font-semibold text-white">Online Orders</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage incoming orders
        </p>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Connection</span>
          <div className="flex items-center gap-1.5">
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">Live</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span className="text-sm text-yellow-500">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-white/5 space-y-3">
        {/* Sound Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-purple-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
            <Label htmlFor="sound-toggle" className="text-sm text-gray-300 cursor-pointer">
              Sound Alerts
            </Label>
          </div>
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full bg-white/5 border-white/10 hover:bg-white/10"
        >
          <RefreshCw
            className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh Orders'}
        </Button>
      </div>

      {/* Stats */}
      <div className="flex-1 px-4 py-4 space-y-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Order Stats
        </h3>

        {/* Urgent Alert */}
        {urgentCount > 0 && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-400">
                {urgentCount} urgent order{urgentCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-red-400/70 mt-1">
              Needs immediate attention
            </p>
          </div>
        )}

        {/* Status Counts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">New</span>
            </div>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-0">
              {newCount}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Preparing</span>
            </div>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-0">
              {preparingCount}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">Ready</span>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0">
              {readyCount}
            </Badge>
          </div>
        </div>

        {/* Total Active */}
        <div className="pt-3 mt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Active</span>
            <span className="text-lg font-bold text-white">
              {newCount + preparingCount + readyCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnlineOrderFilters;
