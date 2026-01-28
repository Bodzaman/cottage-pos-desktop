/**
 * OdometerNumber.tsx
 *
 * Digit-rolling number display (odometer effect).
 * Each digit scrolls vertically when the value changes.
 * Used for cart item quantities.
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface OdometerNumberProps {
  value: number;
  className?: string;
}

export const OdometerNumber: React.FC<OdometerNumberProps> = ({ value, className = '' }) => {
  const reducedMotion = useReducedMotion();
  const digits = value.toString().split('');

  if (reducedMotion) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={`inline-flex overflow-hidden ${className}`} style={{ lineHeight: 1 }}>
      <AnimatePresence mode="popLayout">
        {digits.map((digit, i) => (
          <motion.span
            key={`${i}-${digit}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              mass: 0.8,
            }}
            className="inline-block tabular-nums"
          >
            {digit}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
};
