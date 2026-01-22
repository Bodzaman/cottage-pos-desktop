import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from 'utils/cartStore';
import { CartContent } from './CartContent';
import { PremiumTheme } from 'utils/premiumTheme';

export function CartDrawer() {
  const isChatCartOpen = useCartStore((state) => state.isChatCartOpen);
  const closeChatCart = useCartStore((state) => state.closeChatCart);
  const totalItems = useCartStore((state) => state.totalItems);

  return (
    <AnimatePresence>
      {isChatCartOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full md:w-[35%] h-full flex flex-col border-l"
          style={{
            backgroundColor: PremiumTheme.colors.background.dark,
            borderLeft: `1px solid ${PremiumTheme.colors.border.medium}`
          }}
          data-testid="cart-drawer-instance"
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderBottom: `1px solid ${PremiumTheme.colors.border.medium}` }}
          >
            <h2 className="text-2xl font-bold" style={{ color: PremiumTheme.colors.text.primary }}>
              Your Order
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeChatCart}
              className="h-8 w-8"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            <CartContent />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
