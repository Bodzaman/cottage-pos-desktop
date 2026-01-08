import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../utils/cartStore';
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';

interface CartBadgeProps {
  onClick: () => void;
  className?: string;
}

const animationVariants = {
  initial: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 2, 1.8, 2, 1],
    rotate: [0, -15, 15, -10, 10, 0],
    transition: {
      duration: 1,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

/**
 * Cart badge for chat modal header
 * Shows item count + total price with pulse animation when items added
 * Format: 🛒 2 | £19.50
 * Click opens cart drawer
 */
export function CartBadge({ onClick, className }: CartBadgeProps) {
  const totalItems = useCartStore((state) => state.totalItems);
  const totalAmount = useCartStore((state) => state.totalAmount);
  const [justUpdated, setJustUpdated] = React.useState(false);
  const prevItemCount = React.useRef(totalItems);

  // Detect when items are added (not removed)
  React.useEffect(() => {
    console.log('🛒 CartBadge: totalItems changed', {
      previous: prevItemCount.current,
      current: totalItems,
      difference: totalItems - prevItemCount.current
    });
    
    if (totalItems > prevItemCount.current) {
      console.log('✅ CartBadge: Item ADDED - triggering animation', {
        previousCount: prevItemCount.current,
        newCount: totalItems,
        addedItems: totalItems - prevItemCount.current
      });
      setJustUpdated(true);
      setTimeout(() => {
        console.log('⏱️ CartBadge: Animation timeout complete - resetting justUpdated to false');
        setJustUpdated(false);
      }, 1000);
    } else if (totalItems < prevItemCount.current) {
      console.log('❌ CartBadge: Item REMOVED - no animation', {
        previousCount: prevItemCount.current,
        newCount: totalItems
      });
    }
    
    prevItemCount.current = totalItems;
  }, [totalItems]);

  // Log render state
  console.log('🎨 CartBadge render:', {
    totalItems,
    totalAmount,
    justUpdated,
    isVisible: totalItems > 0
  });

  if (totalItems === 0) return null;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
        "hover:bg-orange-500/10 hover:scale-105 active:scale-95",
        justUpdated && "bg-orange-500/20",
        className
      )}
      style={{
        color: PremiumTheme.colors.text.accent,
        border: `1px solid ${justUpdated ? PremiumTheme.colors.text.accent : PremiumTheme.colors.border.medium}`
      }}
      // ✅ Phase A: Enhanced animation - 2x scale + 360° spin
      variants={animationVariants}
      initial="initial"
      animate={justUpdated ? "animate" : "initial"}
      whileTap={{ scale: 0.95 }}
      title="View cart"
    >
      {/* Cart Icon */}
      <motion.div
        animate={justUpdated ? {
          rotate: [0, -15, 15, -10, 0], // Enhanced wiggle
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <ShoppingCart className="w-5 h-5" />
      </motion.div>

      {/* Count | Price Format */}
      <motion.div
        className="flex items-center gap-2 font-semibold text-sm"
        animate={justUpdated ? { 
          scale: [1, 1.15, 1],
          color: [PremiumTheme.colors.text.accent, '#FFB74D', PremiumTheme.colors.text.accent] // Flash saffron
        } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* Item count */}
        <span>{totalItems}</span>
        
        {/* Separator */}
        <span className="opacity-50">|</span>
        
        {/* Total price */}
        <span>£{totalAmount.toFixed(2)}</span>
      </motion.div>

      {/* Pulse Ring Animation - Enhanced */}
      <AnimatePresence>
        {justUpdated && (
          <>
            {/* Primary pulse ring */}
            <motion.span
              className="absolute inset-0 rounded-lg border-2"
              style={{ borderColor: PremiumTheme.colors.text.accent }}
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            {/* Secondary pulse ring (delayed) */}
            <motion.span
              className="absolute inset-0 rounded-lg border-2"
              style={{ borderColor: '#FFB74D' }} // Saffron accent
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            />
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
