import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from 'utils/cartStore';
import { CartContent } from './CartContent';
import { PremiumTheme } from 'utils/premiumTheme';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { toast } from 'sonner';
import { t } from '../utils/i18n';

interface CartDrawerProps {
  /** Optional menu items for recommendations */
  menuItems?: any[];
}

export function CartDrawer({ menuItems }: CartDrawerProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useSimpleAuth();
  const isChatCartOpen = useCartStore((state) => state.isChatCartOpen);
  const closeChatCart = useCartStore((state) => state.closeChatCart);
  const totalItems = useCartStore((state) => state.totalItems);
  const items = useCartStore((state) => state.items);
  const totalAmount = useCartStore((state) => state.totalAmount);

  // ✅ FIXED: Provide checkout handler
  const handleCheckout = () => {
    closeChatCart();
    navigate('/online-orders?checkout=true');
  };

  // ✅ FIXED: Provide continue shopping handler
  const handleContinueShopping = () => {
    closeChatCart();
  };

  // ✅ FIXED: Provide sign-in handler
  const handleSignIn = () => {
    closeChatCart();
    navigate('/login');
  };

  // Issue 16: Copy order summary to clipboard
  const handleCopyOrder = async () => {
    if (!items || items.length === 0) {
      toast.info(t('cart.empty'));
      return;
    }
    const summary = items
      .map((item: any) => `${item.quantity}x ${item.name} — £${(item.basePrice * item.quantity).toFixed(2)}`)
      .join('\n');
    const text = `Order Summary:\n${summary}\n\nTotal: £${totalAmount?.toFixed(2) || '0.00'}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('cart.copiedSuccess'));
    } catch {
      toast.error('Failed to copy');
    }
  };

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
              {t('cart.title')}
            </h2>
            <div className="flex items-center gap-1">
              {/* Issue 16: Copy order summary */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyOrder}
                className="h-8 w-8"
                style={{ color: PremiumTheme.colors.text.secondary }}
                title={t('cart.copyOrder')}
                aria-label={t('cart.copyOrder')}
              >
                <Copy className="h-4 w-4" />
              </Button>
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
          </div>

          {/* Cart Content - ✅ FIXED: Pass required props */}
          <div className="flex-1 overflow-y-auto">
            <CartContent
              onCheckout={handleCheckout}
              onContinueShopping={handleContinueShopping}
              showContinueShopping={false}
              menuItems={menuItems}
              isAuthenticated={isAuthenticated}
              onSignIn={handleSignIn}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
