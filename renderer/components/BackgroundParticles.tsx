
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { QSAITheme } from '../utils/QSAIDesign';

interface ParticleProps {
  size: number;
  color: string;
  x: number;
  y: number;
  delay: number;
}

const Particle: React.FC<ParticleProps> = ({ size, color, x, y, delay }) => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: color,
        filter: `blur(${size * 1}px)`,
        boxShadow: `0 0 ${size * 0.8}px ${color}`,
        left: `${x}%`,
        top: `${y}%`,
        opacity: 0,
      }}
      animate={{
        opacity: [0, 0.1, 0],
        scale: [0.8, 1.2, 0.8],
        x: [`${x - 8}%`, `${x + 8}%`, `${x - 8}%`],
        y: [`${y - 8}%`, `${y + 8}%`, `${y - 8}%`],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        ease: 'easeInOut',
        delay: delay,
        repeat: Infinity,
        repeatType: 'loop'
      }}
    />
  );
};

export const BackgroundParticles: React.FC = () => {
  // Empty background particles component - removed all particle effects
  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    >
      {/* Clean background - no particles */}
    </div>
  );
};

export default BackgroundParticles;
