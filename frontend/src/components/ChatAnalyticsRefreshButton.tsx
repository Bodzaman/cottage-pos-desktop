import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ChatAnalyticsRefreshButtonProps {
  onRefresh: () => void;
  loading?: boolean;
  lastUpdated?: Date;
  colors: any;
}

export function ChatAnalyticsRefreshButton({ 
  onRefresh, 
  loading = false, 
  lastUpdated,
  colors 
}: ChatAnalyticsRefreshButtonProps) {
  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-sm" style={{ color: colors.text.secondary }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
      )}
      <Button
        onClick={onRefresh}
        disabled={loading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        style={{
          borderColor: colors.border.medium,
          backgroundColor: colors.background.secondary,
          color: colors.text.primary
        }}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
}

export default ChatAnalyticsRefreshButton;
