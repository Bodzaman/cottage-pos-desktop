/**
 * ConfettiBurst.tsx
 *
 * Lightweight confetti animation for payment success moments.
 * 30 particles, 1.5s duration, purple/gold palette.
 * No external library — pure Framer Motion.
 * Respects prefers-reduced-motion.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ConfettiBurstProps {
  isActive: boolean;
  /** Center X position (px from left of viewport), defaults to 50% */
  x?: number;
  /** Center Y position (px from top of viewport), defaults to 40% */
  y?: number;
}

const PARTICLE_COUNT = 30;
const COLORS = [
  '#7C3AED', // purple
  '#A78BFA', // light purple
  '#F59E0B', // gold
  '#FBBF24', // light gold
  '#10B981', // green
  '#FFFFFF', // white
];

interface Particle {
  id: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
  rotation: number;
  delay: number;
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ isActive, x, y }) => {
  const reducedMotion = useReducedMotion();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 4,
      angle: (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5,
      distance: 60 + Math.random() * 120,
      rotation: Math.random() * 720 - 360,
      delay: Math.random() * 0.15,
    }));
  }, [isActive]); // Regenerate on each burst

  if (reducedMotion) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <div
          className="fixed pointer-events-none z-[200]"
          style={{
            left: x ?? '50%',
            top: y ?? '40%',
            transform: x === undefined ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)',
          }}
        >
          {particles.map((p) => {
            const endX = Math.cos(p.angle) * p.distance;
            const endY = Math.sin(p.angle) * p.distance - 20; // slight upward bias

            return (
              <motion.div
                key={p.id}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  x: endX,
                  y: endY + 40, // gravity pull
                  scale: 0,
                  opacity: 0,
                  rotate: p.rotation,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.2 + Math.random() * 0.4,
                  delay: p.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="absolute rounded-sm"
                style={{
                  width: p.size,
                  height: p.size * (0.6 + Math.random() * 0.8),
                  backgroundColor: p.color,
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
};
