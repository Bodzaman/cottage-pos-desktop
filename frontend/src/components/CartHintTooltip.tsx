import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { PremiumTheme } from '../utils/premiumTheme';

interface Props {
  isVisible: boolean;
  onDismiss: () => void;
}

/**
 * First-time hint tooltip that appears near cart badge
 * Shows once when AI first adds an item to cart
 * Auto-dismisses after 3 seconds or on click
 */
export function CartHintTooltip({ isVisible, onDismiss }: Props) {
  // Auto-dismiss after 3 seconds
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="absolute top-full right-0 mt-2 z-50 pointer-events-auto"
          onClick={onDismiss}
        >
          <div
            className="relative px-4 py-2 rounded-lg shadow-lg border backdrop-blur-sm cursor-pointer"
            style={{
              backgroundColor: 'rgba(139, 21, 56, 0.95)', // burgundy with opacity
              borderColor: PremiumTheme.colors.silver[400],
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Arrow pointing up */}
            <div
              className="absolute -top-2 right-4 w-4 h-4 rotate-45"
              style={{
                backgroundColor: 'rgba(139, 21, 56, 0.95)',
                borderLeft: `1px solid ${PremiumTheme.colors.silver[400]}`,
                borderTop: `1px solid ${PremiumTheme.colors.silver[400]}`
              }}
            />
            
            {/* Content */}
            <div className="relative flex items-center gap-2">
              <ShoppingCart 
                className="w-4 h-4 flex-shrink-0" 
                style={{ color: PremiumTheme.colors.silver[200] }}
              />
              <p 
                className="text-sm font-medium whitespace-nowrap"
                style={{ color: PremiumTheme.colors.text.primary }}
              >
                View cart here when ready to checkout
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
