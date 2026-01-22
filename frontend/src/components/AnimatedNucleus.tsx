import React from 'react';

/**
 * AnimatedNucleus - Pure CSS animated atomic nucleus
 * Represents AI intelligence with orbital rings and electrons
 */

interface Props {
  size?: number; // Size in pixels, default 64
}

export function AnimatedNucleus({ size = 64 }: Props) {
  const scale = size / 64; // Base size is 64px

  return (
    <div
      className="animated-nucleus-container"
      style={{
        width: size,
        height: size,
        position: 'relative',
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Central Nucleus - Glowing sphere */}
      <div
        className="nucleus"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 16 * scale,
          height: 16 * scale,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #7C5DFA 100%)',
          boxShadow: `
            0 0 ${8 * scale}px rgba(124, 93, 250, 0.8),
            0 0 ${16 * scale}px rgba(124, 93, 250, 0.4),
            inset 0 0 ${4 * scale}px rgba(255, 255, 255, 0.5)
          `,
          animation: 'nucleusPulse 3s ease-in-out infinite',
          willChange: 'transform, box-shadow',
          zIndex: 10,
        }}
      />

      {/* Orbital Ring 1 - Fastest, 60deg tilt */}
      <div
        className="orbit-ring"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size * 0.85,
          height: size * 0.85,
          transform: 'translate(-50%, -50%) rotateX(60deg)',
          border: `${1 * scale}px solid rgba(124, 93, 250, 0.3)`,
          borderRadius: '50%',
          animation: 'orbitRotate1 8s linear infinite',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* Electron 1 - starts at 0° */}
        <div
          className="electron"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 4 * scale,
            height: 4 * scale,
            transform: 'translate(-50%, -50%) rotate(0deg)',
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: `
              0 0 ${4 * scale}px rgba(124, 93, 250, 0.8),
              0 0 ${8 * scale}px rgba(124, 93, 250, 0.4)
            `,
            animationDelay: '0s',
          }}
        />
      </div>

      {/* Orbital Ring 2 - Medium speed, 75deg tilt */}
      <div
        className="orbit-ring"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size * 0.7,
          height: size * 0.7,
          transform: 'translate(-50%, -50%) rotateX(75deg) rotateZ(120deg)',
          border: `${1 * scale}px solid rgba(124, 93, 250, 0.25)`,
          borderRadius: '50%',
          animation: 'orbitRotate2 12s linear infinite',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          animationDelay: '-4s',
        }}
      >
        {/* Electron 2 - offset by 120° and delayed by 1/3 */}
        <div
          className="electron"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 4 * scale,
            height: 4 * scale,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: `
              0 0 ${4 * scale}px rgba(124, 93, 250, 0.8),
              0 0 ${8 * scale}px rgba(124, 93, 250, 0.4)
            `,
          }}
        />
      </div>

      {/* Orbital Ring 3 - Slowest, 85deg tilt */}
      <div
        className="orbit-ring"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size * 0.55,
          height: size * 0.55,
          transform: 'translate(-50%, -50%) rotateX(85deg) rotateZ(240deg)',
          border: `${1 * scale}px solid rgba(124, 93, 250, 0.2)`,
          borderRadius: '50%',
          animation: 'orbitRotate3 16s linear infinite',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          animationDelay: '-10.67s',
        }}
      >
        {/* Electron 3 - offset by 240° and delayed by 2/3 */}
        <div
          className="electron"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 4 * scale,
            height: 4 * scale,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: `
              0 0 ${4 * scale}px rgba(124, 93, 250, 0.8),
              0 0 ${8 * scale}px rgba(124, 93, 250, 0.4)
            `,
          }}
        />
      </div>

      {/* CSS Keyframe Animations */}
      <style>{`
        @keyframes nucleusPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.95);
            box-shadow: 
              0 0 ${8 * scale}px rgba(124, 93, 250, 0.6),
              0 0 ${16 * scale}px rgba(124, 93, 250, 0.3),
              inset 0 0 ${4 * scale}px rgba(255, 255, 255, 0.5);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
            box-shadow: 
              0 0 ${12 * scale}px rgba(124, 93, 250, 0.9),
              0 0 ${24 * scale}px rgba(124, 93, 250, 0.5),
              inset 0 0 ${6 * scale}px rgba(255, 255, 255, 0.7);
          }
        }

        @keyframes orbitRotate1 {
          from {
            transform: translate(-50%, -50%) rotateX(60deg) rotateZ(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotateX(60deg) rotateZ(360deg);
          }
        }

        @keyframes orbitRotate2 {
          from {
            transform: translate(-50%, -50%) rotateX(75deg) rotateZ(120deg);
          }
          to {
            transform: translate(-50%, -50%) rotateX(75deg) rotateZ(480deg);
          }
        }

        @keyframes orbitRotate3 {
          from {
            transform: translate(-50%, -50%) rotateX(85deg) rotateZ(240deg);
          }
          to {
            transform: translate(-50%, -50%) rotateX(85deg) rotateZ(600deg);
          }
        }
      `}</style>
    </div>
  );
}
