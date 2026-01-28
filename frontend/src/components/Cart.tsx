import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CartItem } from './CartItem';
import { useCartStore } from '../utils/cartStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PremiumTheme } from '../utils/premiumTheme';
import { formatPrice } from '../utils/formatUtils';

type CartProps = {
  className?: string;
  insideMobileMenu?: boolean;
  onCartClick?: () => void;
};

// Error boundary for cart content
class CartErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Cart error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-red-400 mb-2">Something went wrong with the cart</p>
          <Button 
            variant="outline"
            onClick={() => {
              // Try to recover by clearing cart and resetting error state
              try {
                const { clearCart } = useCartStore.getState();
                clearCart();
                this.setState({ hasError: false });
              } catch (e) {
                console.error("Failed to recover cart:", e);
              }
            }}
            className="text-tandoor-offwhite"
          >
            Reset Cart
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function Cart({ className, insideMobileMenu = false, onCartClick }: CartProps) {
  const { items, isEmpty, totalItems, totalAmount } = useCartStore();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const prevTotalItemsRef = useRef(totalItems);
  const iconControls = useAnimation();
  const badgeControls = useAnimation();
  
  // Close the cart panel when navigating away
  useEffect(() => {
    setOpen(false);
  }, [location]);
  
  // ✅ FIXED: Shake animation when items are added (including first item)
  useEffect(() => {
    // Trigger animation if items increased (including from 0 to 1)
    if (totalItems > prevTotalItemsRef.current) {
      // Shake the icon
      iconControls.start({
        rotate: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5, ease: 'easeInOut' }
      });

      // Scale pulse on badge (only if we have items)
      if (totalItems > 0) {
        badgeControls.start({
          scale: [1, 1.3, 1],
          transition: { duration: 0.4, ease: 'easeOut' }
        });
      }
    }

    prevTotalItemsRef.current = totalItems;
  }, [totalItems, iconControls, badgeControls]);
  
  const handleCheckout = () => {
    setOpen(false);
    navigate('/online-orders?checkout=true');
  };

  // Handle cart click - use custom handler when provided
  const handleCartClick = () => {
    if (onCartClick) {
      // Use custom cart handler if provided (opens CartSidebar)
      onCartClick();
      return;
    }

    if (insideMobileMenu) {
      // ✅ FIXED: Navigate to online orders page instead of non-existent /cart route
      navigate('/online-orders');
      return;
    }

    // Default behavior - open the basic sheet
    setOpen(true);
  };

  // If inside mobile menu, just show the icon with count
  if (insideMobileMenu) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCartClick}
        className="relative text-tandoor-offwhite hover:text-tandoor-platinum hover:bg-transparent"
        aria-label={totalItems > 0 ? `Shopping cart with ${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : 'Shopping cart is empty'}
      >
        <motion.div animate={iconControls}>
          <ShoppingBag className="h-6 w-6" aria-hidden="true" />
        </motion.div>
        {totalItems > 0 && (
          <motion.span
            animate={badgeControls}
            className="absolute -top-2 -right-2 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
            style={{
              backgroundColor: PremiumTheme.colors.burgundy[500],
              color: PremiumTheme.colors.text.primary,
              boxShadow: `0 2px 8px ${PremiumTheme.colors.burgundy[500]}60`
            }}
            aria-hidden="true"
          >
            {totalItems}
          </motion.span>
        )}
      </Button>
    );
  }

  // If onCartClick is provided, just show the button without Sheet wrapper
  if (onCartClick) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={handleCartClick}
        aria-label={totalItems > 0 ? `Shopping cart with ${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : 'Shopping cart is empty'}
      >
        <div className="relative">
          <motion.div animate={iconControls}>
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          </motion.div>
          {totalItems > 0 && (
            <motion.span
              animate={badgeControls}
              className="absolute -top-2 -right-2 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              style={{
                backgroundColor: PremiumTheme.colors.burgundy[500],
                color: PremiumTheme.colors.text.primary,
                boxShadow: `0 2px 8px ${PremiumTheme.colors.burgundy[500]}60`
              }}
              aria-hidden="true"
            >
              {totalItems}
            </motion.span>
          )}
        </div>
      </Button>
    );
  }
  
  // Default Sheet behavior when no onCartClick provided
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label={totalItems > 0 ? `Shopping cart with ${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : 'Shopping cart is empty'}
        >
          <div className="relative">
            <motion.div animate={iconControls}>
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            </motion.div>
            {totalItems > 0 && (
              <motion.span
                animate={badgeControls}
                className="absolute -top-2 -right-2 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                style={{
                  backgroundColor: PremiumTheme.colors.burgundy[500],
                  color: PremiumTheme.colors.text.primary,
                  boxShadow: `0 2px 8px ${PremiumTheme.colors.burgundy[500]}60`
                }}
                aria-hidden="true"
              >
                {totalItems}
              </motion.span>
            )}
          </div>
        </Button>
      </SheetTrigger>
      {/* ✅ FIXED: Updated to use PremiumTheme for consistency */}
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto"
        style={{
          backgroundColor: PremiumTheme.colors.background.dark,
          borderLeft: `1px solid ${PremiumTheme.colors.border.medium}`,
          color: PremiumTheme.colors.text.primary
        }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle style={{ color: PremiumTheme.colors.text.primary }}>Your Order</SheetTitle>
          <SheetDescription style={{ color: PremiumTheme.colors.text.muted }}>
            Review your items before checkout
          </SheetDescription>
        </SheetHeader>

        <CartErrorBoundary>
          <div className="space-y-6">
            {totalItems === 0 ? (
              <div className="py-10 text-center">
                <div className="mb-2" style={{ color: PremiumTheme.colors.text.muted }}>Your cart is empty</div>
                <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                  Add some delicious items from our menu
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>

                <div
                  className="pt-4 space-y-3"
                  style={{ borderTop: `1px solid ${PremiumTheme.colors.border.light}` }}
                >
                  <div className="flex justify-between" style={{ color: PremiumTheme.colors.text.primary }}>
                    <span>Subtotal</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>

                  {/* Checkout Button - ✅ FIXED: Use burgundy theme */}
                  <Button
                    className="w-full text-white font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]}, ${PremiumTheme.colors.burgundy[600]})`,
                      boxShadow: `0 4px 12px ${PremiumTheme.colors.burgundy[500]}40`
                    }}
                    onClick={handleCheckout}
                  >
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </CartErrorBoundary>
      </SheetContent>
    </Sheet>
  );
};
