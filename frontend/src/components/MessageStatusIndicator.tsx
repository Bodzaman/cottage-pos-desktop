import React from 'react';
import { Clock, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '../utils/i18n';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'error';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  className?: string;
}

const STATUS_CONFIG: Record<MessageStatus, { icon: React.ElementType; color: string; labelKey: string }> = {
  sending: { icon: Clock, color: 'text-muted-foreground/50', labelKey: 'status.sending' },
  sent: { icon: Check, color: 'text-muted-foreground/60', labelKey: 'status.sent' },
  delivered: { icon: CheckCheck, color: 'text-green-500/70', labelKey: 'status.delivered' },
  error: { icon: AlertCircle, color: 'text-red-400', labelKey: 'status.failed' },
};

export function MessageStatusIndicator({ status, className }: MessageStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const label = t(config.labelKey);

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      title={label}
      aria-label={label}
    >
      <Icon className={cn('w-3 h-3', config.color)} />
    </div>
  );
}
