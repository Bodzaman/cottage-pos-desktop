import React from 'react';
import { useCartStore } from '../utils/cartStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, PackageIcon, Sparkles } from 'lucide-react';
import { PremiumTheme } from '../utils/premiumTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CartContent } from './CartContent';
import type { MenuItem } from 'utils/menuTypes';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDeliveryZone?: any;
  customerLocation?: any;
  onCheckout?: () => void;
  onEditItem?: (itemId: string, itemData: any) => void;
  menuItems?: MenuItem[];
  onSignIn?: () => void;
  isAuthenticated?: boolean; // NEW: Authentication state
}

// Helper function to format currency
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

// ✅ FIX #1: Helper to get variant display name from cart item
const getVariantDisplayName = (item: any): string | null => {
  // Use variant_name directly from cart table (already enriched)
  if (item.variant_name) {
    return item.variant_name;
  }
  
  // Fallback to variant object if variant_name not present
  if (item.variant?.name) {
    return item.variant.name;
  }
  
  return null;
};

export function CartSidebar({
  isOpen,
  onClose,
  selectedDeliveryZone,
  onCheckout,
  onEditItem,
  menuItems,
  onSignIn,
  isAuthenticated = false // NEW: Default to false
}: CartSidebarProps) {
  // 🔍 DEBUG: Log component render and props
  console.log('[CartSidebar] RENDER:', { isOpen });
  
  const { items, totalItems, currentOrderMode, setOrderMode, updatePricesForMode, clearPriceChangeFlags, clearCart } = useCartStore();
  const navigate = useNavigate();

  // Confirmation dialogs state
  const [showClearAllDialog, setShowClearAllDialog] = React.useState(false);
  const [showModeConfirmDialog, setShowModeConfirmDialog] = React.useState(false);
  const [pendingMode, setPendingMode] = React.useState<'delivery' | 'collection' | null>(null);
  const [dontAskAgain, setDontAskAgain] = React.useState(false);
  const [showModeHint, setShowModeHint] = React.useState(false);

  // Show hint on first open if mode was remembered
  React.useEffect(() => {
    if (isOpen && items.length === 0) {
      const hasSeenHint = sessionStorage.getItem('hasSeenModeHint');
      if (!hasSeenHint && currentOrderMode) {
        setShowModeHint(true);
        sessionStorage.setItem('hasSeenModeHint', 'true');
        // Auto-hide hint after 3 seconds
        setTimeout(() => setShowModeHint(false), 3000);
      }
    }
  }, [isOpen, items.length]);

  const handleCheckout = () => {
    onClose();
    if (onCheckout) {
      onCheckout();
    } else {
      navigate('/online-orders?checkout=true');
    }
  };

  // NEW: Function to perform the actual mode switch
  const performModeSwitch = (mode: 'delivery' | 'collection') => {
    setOrderMode(mode);
    updatePricesForMode(mode);
    toast.success(`Switched to ${mode === 'delivery' ? 'Delivery' : 'Collection'}`);
  };

  // NEW: Handle mode toggle with optional confirmation
  const handleModeToggle = (newMode: 'delivery' | 'collection') => {
    // Don't do anything if already in that mode
    if (newMode === currentOrderMode) return;
    
    // Check if user has disabled confirmation
    const skipConfirmation = localStorage.getItem('skipOrderModeConfirmation') === 'true';
    
    if (skipConfirmation || items.length === 0) {
      // Switch immediately if no items or user disabled confirmation
      performModeSwitch(newMode);
    } else {
      // Show confirmation dialog
      setPendingMode(newMode);
      setShowModeConfirmDialog(true);
    }
  };

  const confirmClearAll = () => {
    clearCart();
    setShowClearAllDialog(false);
    toast.success('Cart cleared successfully');
  };

  const confirmModeSwitch = () => {
    if (dontAskAgain) {
      localStorage.setItem('skipOrderModeConfirmation', 'true');
    }
    if (pendingMode) {
      performModeSwitch(pendingMode);
    }
    setShowModeConfirmDialog(false);
    setPendingMode(null);
    setDontAskAgain(false);
  };

  const cancelModeSwitch = () => {
    setShowModeConfirmDialog(false);
    setPendingMode(null);
    setDontAskAgain(false);
  };

  return (
    <>
    <Sheet 
      open={isOpen} 
      onOpenChange={(open) => { if (!open) onClose(); }}
      data-testid="cart-sidebar-instance"
    >
      <SheetContent 
        className="w-[400px] sm:w-[500px] border-0 flex flex-col h-full p-0"
        style={{
          zIndex: 60,
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          borderLeft: `1px solid ${PremiumTheme.colors.border.light}`,
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle 
                className="text-2xl font-bold mb-1" 
                style={{ color: PremiumTheme.colors.text.primary }}
              >
                Your Order
              </SheetTitle>
              <SheetDescription style={{ color: PremiumTheme.colors.text.muted }}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </SheetDescription>
            </div>
            
            {/* Order Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModeToggle('collection')}
                className={`h-9 px-3 transition-all ${
                  currentOrderMode === 'collection' ? 'ring-2' : 'opacity-60'
                }`}
                style={{
                  backgroundColor: currentOrderMode === 'collection' 
                    ? PremiumTheme.colors.burgundy[500] + '30'
                    : 'transparent',
                  color: currentOrderMode === 'collection'
                    ? PremiumTheme.colors.burgundy[400]
                    : PremiumTheme.colors.text.muted,
                  ringColor: currentOrderMode === 'collection' ? PremiumTheme.colors.burgundy[500] : 'transparent'
                }}
              >
                <PackageIcon className="h-4 w-4 mr-1.5" />
                Collection
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModeToggle('delivery')}
                className={`h-9 px-3 transition-all ${
                  currentOrderMode === 'delivery' ? 'ring-2' : 'opacity-60'
                }`}
                style={{
                  backgroundColor: currentOrderMode === 'delivery' 
                    ? PremiumTheme.colors.silver[500] + '30'
                    : 'transparent',
                  color: currentOrderMode === 'delivery'
                    ? PremiumTheme.colors.silver[400]
                    : PremiumTheme.colors.text.muted,
                  ringColor: currentOrderMode === 'delivery' ? PremiumTheme.colors.silver[500] : 'transparent'
                }}
              >
                <Truck className="h-4 w-4 mr-1.5" />
                Delivery
              </Button>
            </div>
          </div>
          
          {/* Mode hint */}
          {showModeHint && (
            <Badge 
              variant="secondary" 
              className="mt-3 text-xs flex items-center gap-1 w-fit animate-pulse"
              style={{
                backgroundColor: PremiumTheme.colors.gold[500] + '30',
                color: PremiumTheme.colors.gold[400],
                border: `1px solid ${PremiumTheme.colors.gold[500]}60`
              }}
            >
              <Sparkles className="h-3 w-3" />
              Prices updated for {currentOrderMode}
            </Badge>
          )}
        </SheetHeader>

        {/* Use CartContent component */}
        <CartContent
          onCheckout={handleCheckout}
          onContinueShopping={onClose}
          showContinueShopping={true}
          onEditItem={onEditItem}
          menuItems={menuItems}
          selectedDeliveryZone={selectedDeliveryZone}
          onSignIn={onSignIn}
          isAuthenticated={isAuthenticated}
        />
      </SheetContent>
    </Sheet>
    
    {/* Clear All Confirmation Dialog */}
    <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
      <AlertDialogContent
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          border: `1px solid ${PremiumTheme.colors.border.medium}`
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: PremiumTheme.colors.text.primary }}>
            Clear Cart?
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: PremiumTheme.colors.text.muted }}>
            Are you sure you want to remove all {totalItems} item{totalItems !== 1 ? 's' : ''} from your cart? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            style={{
              border: `1px solid ${PremiumTheme.colors.border.medium}`,
              backgroundColor: PremiumTheme.colors.dark[800],
              color: PremiumTheme.colors.text.secondary
            }}
            onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[700]}
            onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[800]}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmClearAll}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Clear Cart
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Mode Switch Confirmation Dialog */}
    <AlertDialog open={showModeConfirmDialog} onOpenChange={setShowModeConfirmDialog}>
      <AlertDialogContent
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          border: `1px solid ${PremiumTheme.colors.border.light}`,
          color: PremiumTheme.colors.text.primary
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: PremiumTheme.colors.text.primary }}>
            Switch to {pendingMode === 'delivery' ? 'Delivery' : 'Collection'}?
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: PremiumTheme.colors.text.muted }}>
            {pendingMode === 'delivery' ? (
              <>
                Switching to <strong>Delivery</strong> may apply delivery charges and adjust some item prices.
                Your cart items will remain, but the total may change.
              </>
            ) : (
              <>
                Switching to <strong>Collection</strong> will remove delivery charges and may adjust some item prices.
                Your cart items will remain, but the total may change.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Don't ask again checkbox */}
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="dontAskAgain"
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(checked === true)}
          />
          <label
            htmlFor="dontAskAgain"
            className="text-sm cursor-pointer"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            Don't ask me again
          </label>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={cancelModeSwitch}
            style={{
              border: `1px solid ${PremiumTheme.colors.border.medium}`,
              backgroundColor: PremiumTheme.colors.dark[800],
              color: PremiumTheme.colors.text.secondary
            }}
            onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[700]}
            onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[800]}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmModeSwitch}
            style={{
              background: `linear-gradient(135deg, ${PremiumTheme.colors.silver[500]} 0%, ${PremiumTheme.colors.silver[600]} 100%)`,
              color: PremiumTheme.colors.dark[900]
            }}
          >
            Switch Mode
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export default CartSidebar;
