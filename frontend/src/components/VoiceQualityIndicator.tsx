import React from 'react';

export type VoiceQuality = 'excellent' | 'good' | 'fair' | 'poor';

interface VoiceQualityIndicatorProps {
  quality: VoiceQuality;
  className?: string;
}

const QUALITY_CONFIG: Record<VoiceQuality, { bars: number; color: string; label: string }> = {
  excellent: { bars: 4, color: 'bg-green-500', label: 'Excellent' },
  good:      { bars: 3, color: 'bg-green-400', label: 'Good' },
  fair:      { bars: 2, color: 'bg-yellow-500', label: 'Fair' },
  poor:      { bars: 1, color: 'bg-red-500', label: 'Poor' },
};

const TEXT_COLOR: Record<VoiceQuality, string> = {
  excellent: 'text-green-500',
  good:      'text-green-400',
  fair:      'text-yellow-500',
  poor:      'text-red-500',
};

export function VoiceQualityIndicator({ quality, className = '' }: VoiceQualityIndicatorProps) {
  const config = QUALITY_CONFIG[quality];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm transition-all duration-300 ${
              bar <= config.bars ? config.color : 'bg-gray-600'
            }`}
            style={{ height: `${bar * 4}px` }}
          />
        ))}
      </div>
      <span className={`text-xs ${TEXT_COLOR[quality]}`}>{config.label}</span>
    </div>
  );
}
