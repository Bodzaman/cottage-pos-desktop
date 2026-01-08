import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from 'utils/menuTypes';
import { PremiumTheme } from 'utils/premiumTheme';

interface FloatingCategoryDropdownProps {
  categories: Category[];
  sectionName: string;
  position: { top: number; left: number };
  onCategoryClick: (categoryId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function FloatingCategoryDropdown({
  categories,
  sectionName,
  position,
  onCategoryClick,
  onMouseEnter,
  onMouseLeave
}: FloatingCategoryDropdownProps) {
  // Early return if no categories to display
  if (!categories || categories.length === 0) {
    return null;
  }

  // Ref and state to clamp within viewport
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [computedLeft, setComputedLeft] = useState(position.left);

  const dropdownWidth = 280; // matches maxWidth below; safe upper bound for clamping
  const horizontalPadding = 8; // small margin from edges

  // Recompute clamped left when position changes or on resize
  useEffect(() => {
    const clampLeft = () => {
      const vw = window.innerWidth;
      const maxLeft = Math.max(horizontalPadding, vw - dropdownWidth - horizontalPadding);
      const clamped = Math.min(Math.max(position.left, horizontalPadding), maxLeft);
      setComputedLeft(clamped);
    };

    clampLeft();
    window.addEventListener('resize', clampLeft);
    return () => window.removeEventListener('resize', clampLeft);
  }, [position.left]);

  // Stable, sorted categories by display_order then name
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const ao = (a.display_order ?? 9999);
      const bo = (b.display_order ?? 9999);
      if (ao !== bo) return ao - bo;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [categories]);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="fixed rounded-lg border overflow-hidden shadow-2xl"
        style={{
          top: `${position.top}px`,
          left: `${computedLeft}px`,
          zIndex: 50, // Above sticky tabs (z-40)
          minWidth: '200px',
          maxWidth: '280px',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Glassmorphism overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)'
          }}
        />

        {/* Header */}
        <div
          className="px-4 py-2 border-b relative z-10"
          style={{
            background: 'rgba(139, 21, 56, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{
              color: PremiumTheme.colors.burgundy[400],
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            {sectionName} Categories
          </p>
        </div>

        {/* Category List */}
        <div className="relative z-10 py-1">
          {sortedCategories.map((category) => (
            <button
              key={category.id}
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick(category.id);
              }}
              className="w-full px-4 py-2.5 text-left transition-all duration-150 flex items-center justify-between group"
              style={{
                background: 'transparent',
                color: PremiumTheme.colors.text.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 21, 56, 0.3)';
                e.currentTarget.style.paddingLeft = '20px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.paddingLeft = '16px';
              }}
            >
              <span className="text-sm font-medium">
                {category.name}
              </span>
              
              {/* Chevron icon */}
              <svg
                className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: PremiumTheme.colors.burgundy[400] }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Bottom accent line */}
        <div
          className="h-1"
          style={{
            background: 'linear-gradient(90deg, rgba(139, 21, 56, 0.5) 0%, rgba(139, 21, 56, 0) 100%)'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
