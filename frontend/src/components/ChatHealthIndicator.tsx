import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ChatHealthIndicatorProps {
  status: 'operational' | 'degraded' | 'down' | 'connected' | 'disconnected' | 'available' | 'limited' | 'unavailable';
  label: string;
  colors: any;
}

export function ChatHealthIndicator({ status, label, colors }: ChatHealthIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'operational':
      case 'connected':
      case 'available':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          text: status === 'operational' ? 'Operational' : status === 'connected' ? 'Connected' : 'Available'
        };
      case 'degraded':
      case 'limited':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          text: status === 'degraded' ? 'Degraded' : 'Limited'
        };
      case 'down':
      case 'disconnected':
      case 'unavailable':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          text: status === 'down' ? 'Down' : status === 'disconnected' ? 'Disconnected' : 'Unavailable'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500',
          text: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 ${config.bgColor} rounded-full animate-pulse`}></div>
      <div>
        <div style={{ color: colors.text.primary }} className="font-medium">
          {label}
        </div>
        <div style={{ color: colors.text.secondary }} className="text-sm">
          {config.text}
        </div>
      </div>
    </div>
  );
}

export default ChatHealthIndicator;
