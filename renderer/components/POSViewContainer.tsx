import React, { useState, useEffect } from 'react';
import { colors as designColors } from '../utils/designSystem';
import { AnimatePresence, motion } from 'framer-motion';

// This will be a union type of all possible views
export type POSViewType = 
  | 'pos'
  | 'kitchen'
  | 'online-orders'
  | 'ai-orders'
  | 'reservations'
  | 'website'
  | 'reconciliation'
  | 'admin';

export interface POSViewProps {
  onBack?: () => void;
}

interface Props {
  activeView: POSViewType;
  onViewChange: (view: POSViewType) => void;
  children: React.ReactNode;
  views?: Record<POSViewType, React.ReactNode>;
}

/**
 * Container component for managing different views within the POS system.
 * Handles smooth transitions between views and maintains consistent layout.
 */
export const POSViewContainer: React.FC<Props> = ({ 
  activeView,
  onViewChange,
  children,
  views
}) => {
  // Track previous view for transition direction
  const [previousView, setPreviousView] = useState<POSViewType>(activeView);
  
  // Determine transition direction based on view order
  const viewOrder: POSViewType[] = ['pos', 'kitchen', 'online-orders', 'reservations', 'website', 'reconciliation', 'admin'];
  
  const getTransitionDirection = () => {
    const prevIndex = viewOrder.indexOf(previousView);
    const currIndex = viewOrder.indexOf(activeView);
    return currIndex > prevIndex ? 'forward' : 'backward';
  };
  
  // Update previous view whenever active view changes
  useEffect(() => {
    if (activeView !== previousView) {
      setPreviousView(activeView);
    }
  }, [activeView]);
  
  // Standard view container with transition animations and proper height constraints
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeView}
        initial={{ opacity: 0, x: getTransitionDirection() === 'forward' ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: getTransitionDirection() === 'forward' ? -50 : 50 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-full w-full overflow-hidden"
        style={{
          maxHeight: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
