import React from 'react';

/**
 * PremiumBackground - Fixed burgundy gradient background with warm glow effects
 * Creates an immersive, premium atmosphere befitting an upscale Indian restaurant
 * Uses the brand color #8B1538 throughout
 */
export function PremiumBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base dark gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0f 30%, #0f0a0a 70%, #0a0a0a 100%)'
        }}
      />

      {/* Burgundy radial gradient overlay from top */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 21, 56, 0.15) 0%, transparent 50%)'
        }}
      />

      {/* Warm burgundy glow effects */}
      <div
        className="absolute top-[5%] right-[10%] w-96 h-96 rounded-full blur-[150px]"
        style={{ background: 'rgba(139, 21, 56, 0.2)' }}
      />
      <div
        className="absolute top-[40%] left-[5%] w-64 h-64 rounded-full blur-[120px]"
        style={{ background: 'rgba(139, 21, 56, 0.15)' }}
      />
      <div
        className="absolute bottom-[15%] right-[20%] w-80 h-80 rounded-full blur-[140px]"
        style={{ background: 'rgba(139, 21, 56, 0.18)' }}
      />
      <div
        className="absolute bottom-[30%] left-[30%] w-56 h-56 rounded-full blur-[100px]"
        style={{ background: 'rgba(107, 15, 42, 0.12)' }}
      />

      {/* Subtle vignette effect for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)'
        }}
      />
    </div>
  );
}

export default PremiumBackground;
