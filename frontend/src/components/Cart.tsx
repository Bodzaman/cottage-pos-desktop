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
  
  // NEW: Shake animation when items are added
  useEffect(() => {
    // Only trigger animation if items increased (not on initial load or decrease)
    if (totalItems > prevTotalItemsRef.current && prevTotalItemsRef.current > 0) {
      // Shake the icon
      iconControls.start({
        rotate: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5, ease: 'easeInOut' }
      });
      
      // Scale pulse on badge
      badgeControls.start({
        scale: [1, 1.3, 1],
        transition: { duration: 0.4, ease: 'easeOut' }
      });
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
      navigate('/cart');
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
      >
        <motion.div animate={iconControls}>
          <ShoppingBag className="h-6 w-6" />
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
      >
        <div className="relative">
          <motion.div animate={iconControls}>
            <ShoppingBag className="h-6 w-6" />
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
        <Button variant="ghost" size="icon" className={className}>
          <div className="relative">
            <motion.div animate={iconControls}>
              <ShoppingBag className="h-6 w-6" />
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
              >
                {totalItems}
              </motion.span>
            )}
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-gradient-to-b from-gray-900 to-gray-950 border-tandoor-orange/40 text-tandoor-platinum overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-tandoor-platinum">Your Order</SheetTitle>
          <SheetDescription className="text-gray-400">
            Review your items before checkout
          </SheetDescription>
        </SheetHeader>
        
        <CartErrorBoundary>
          <div className="space-y-6">
            {totalItems === 0 ? (
              <div className="py-10 text-center">
                <div className="text-gray-400 mb-2">Your cart is empty</div>
                <p className="text-sm text-gray-500">
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
              
                <div className="border-t border-gray-800 pt-4 space-y-3">
                  <div className="flex justify-between text-tandoor-platinum">
                    <span>Subtotal</span>
                    <span>£{totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {/* Checkout Button */}
                  <Button 
                    className="w-full bg-tandoor-orange hover:bg-tandoor-orange/90 text-white" 
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
