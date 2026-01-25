import React from 'react';
import { Mail, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export type LookupMethod = 'postcode' | 'address';

interface LookupMethodToggleProps {
  currentMethod: LookupMethod;
  onMethodChange: (method: LookupMethod) => void;
  className?: string;
}

const methods: { key: LookupMethod; label: string; sublabel: string; icon: React.ElementType }[] = [
  { key: 'postcode', label: 'Postcode Lookup', sublabel: 'Recommended', icon: Mail },
  { key: 'address', label: 'Address Search', sublabel: 'Type full address', icon: Search },
];

export function LookupMethodToggle({ currentMethod, onMethodChange, className = '' }: LookupMethodToggleProps) {
  return (
    <div
      className={`relative flex w-full rounded-lg p-1 gap-1 ${className}`}
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {methods.map(({ key, label, sublabel, icon: Icon }) => {
        const isActive = currentMethod === key;
        return (
          <button
            key={key}
            onClick={() => onMethodChange(key)}
            className="relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2.5 px-2 rounded-md z-10 transition-colors duration-150"
            style={{
              color: isActive ? 'white' : 'rgba(255, 255, 255, 0.55)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="lookup-method-indicator"
                className="absolute inset-0 rounded-md"
                style={{
                  background: 'linear-gradient(135deg, #5B21B6 30%, #7C3AED 100%)',
                  boxShadow: '0 2px 8px rgba(124, 93, 250, 0.35)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">{label}</span>
            </div>
            <span
              className="relative z-10 text-[10px]"
              style={{
                color: isActive ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
              }}
            >
              ({sublabel})
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default LookupMethodToggle;
