import React from 'react';
import { Clock, Package, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export type TakeawaySubMode = 'WAITING' | 'COLLECTION' | 'DELIVERY';

interface TakeawayModeToggleProps {
  currentMode: TakeawaySubMode;
  onModeChange: (mode: TakeawaySubMode) => void;
}

const modes: { key: TakeawaySubMode; label: string; icon: React.ElementType }[] = [
  { key: 'WAITING', label: 'Waiting', icon: Clock },
  { key: 'COLLECTION', label: 'Collection', icon: Package },
  { key: 'DELIVERY', label: 'Delivery', icon: Truck },
];

export function TakeawayModeToggle({ currentMode, onModeChange }: TakeawayModeToggleProps) {
  return (
    <div
      className="relative flex w-full rounded-lg p-1 gap-1"
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {modes.map(({ key, label, icon: Icon }) => {
        const isActive = currentMode === key;
        return (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className="relative flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-md z-10 transition-colors duration-150"
            style={{
              color: isActive ? 'white' : 'rgba(255, 255, 255, 0.55)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="takeaway-mode-indicator"
                className="absolute inset-0 rounded-md"
                style={{
                  background: 'linear-gradient(135deg, #5B21B6 30%, #7C3AED 100%)',
                  boxShadow: '0 2px 8px rgba(124, 93, 250, 0.35)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="relative z-10 w-3 h-3 flex-shrink-0" />
            <span className="relative z-10 text-[11px] font-semibold truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
