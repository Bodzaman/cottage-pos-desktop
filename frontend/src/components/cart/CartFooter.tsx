/**
 * CartFooter - Cart totals and checkout action
 *
 * Features:
 * - Subtotal, delivery fee, total display
 * - Price pulse animation on changes
 * - Free delivery progress bar
 * - Minimum order warning
 * - Checkout button with loading state
 * - Restaurant status check
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Truck, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCartStore } from 'utils/cartStore';
import { useRestaurantStatusStore, useTimeUntilOpen } from 'utils/restaurantStatusStore';
import { RestaurantStatusBadge } from 'components/status';
import { PremiumTheme } from 'utils/premiumTheme';
import brain from 'brain';

interface CartFooterProps {
  onCheckout?: () => void;
  onSignIn?: () => void;
  isAuthenticated?: boolean;
  selectedDeliveryZone?: any;
}

// Default delivery config
const DEFAULT_DELIVERY_CONFIG = {
  fee: 3.0,
  min_order: 25.0,
  free_over: 30.0,
};

export function CartFooter({
  onCheckout,
  onSignIn,
  isAuthenticated = false,
  selectedDeliveryZone,
}: CartFooterProps) {
  const { totalAmount, totalItems, currentOrderMode } = useCartStore();
  const { isAcceptingOrders } = useRestaurantStatusStore();
  const timeUntilOpen = useTimeUntilOpen();

  // Delivery config from database
  const [deliveryConfig, setDeliveryConfig] = useState(DEFAULT_DELIVERY_CONFIG);

  // Track previous total for animation
  const [previousTotal, setPreviousTotal] = useState(totalAmount);
  const [totalChanged, setTotalChanged] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Fetch delivery config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await brain.get_delivery_config();
        const data = await response.json();
        setDeliveryConfig({
          fee: data.fee || DEFAULT_DELIVERY_CONFIG.fee,
          min_order: data.min_order || DEFAULT_DELIVERY_CONFIG.min_order,
          free_over: data.free_over || DEFAULT_DELIVERY_CONFIG.free_over,
        });
      } catch (error) {
        console.error('Failed to fetch delivery config:', error);
      }
    };
    fetchConfig();
  }, []);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = totalAmount;
    const deliveryFee =
      currentOrderMode === 'delivery'
        ? selectedDeliveryZone?.delivery_charge ?? deliveryConfig.fee
        : 0;
    const isFreeDelivery = subtotal >= deliveryConfig.free_over;
    const actualDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
    const total = subtotal + actualDeliveryFee;
    const minOrderMet = subtotal >= deliveryConfig.min_order;
    const amountToMinOrder = deliveryConfig.min_order - subtotal;
    const amountToFreeDelivery = deliveryConfig.free_over - subtotal;
    const freeDeliveryProgress = Math.min(
      (subtotal / deliveryConfig.free_over) * 100,
      100
    );

    return {
      subtotal,
      deliveryFee: actualDeliveryFee,
      isFreeDelivery,
      total,
      minOrderMet,
      amountToMinOrder,
      amountToFreeDelivery,
      freeDeliveryProgress,
    };
  }, [totalAmount, currentOrderMode, selectedDeliveryZone, deliveryConfig]);

  // Trigger total animation on change
  useEffect(() => {
    if (previousTotal !== calculations.total && previousTotal !== 0) {
      setTotalChanged(true);
      const timer = setTimeout(() => setTotalChanged(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousTotal(calculations.total);
  }, [calculations.total, previousTotal]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!onCheckout) return;

    setIsCheckingOut(true);
    try {
      onCheckout();
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Determine if checkout is disabled
  const isCheckoutDisabled =
    totalItems === 0 ||
    !isAcceptingOrders ||
    (currentOrderMode === 'delivery' && !calculations.minOrderMet);

  // Get checkout button text
  const getCheckoutButtonText = () => {
    if (!isAcceptingOrders && timeUntilOpen) {
      return `Opens ${timeUntilOpen}`;
    }
    if (!isAcceptingOrders) {
      return 'Currently Closed';
    }
    if (currentOrderMode === 'delivery' && !calculations.minOrderMet) {
      return `Add ${formatPrice(calculations.amountToMinOrder)} more`;
    }
    return `Checkout ${formatPrice(calculations.total)}`;
  };

  return (
    <div
      className="flex-shrink-0 border-t px-5 py-4"
      style={{
        borderColor: PremiumTheme.colors.border.light,
        backgroundColor: PremiumTheme.colors.dark[850],
      }}
    >
      {/* Restaurant status when closed */}
      {!isAcceptingOrders && (
        <div className="mb-4">
          <RestaurantStatusBadge showHours />
        </div>
      )}

      {/* Minimum order warning for delivery */}
      {currentOrderMode === 'delivery' && !calculations.minOrderMet && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg mb-3"
          style={{
            backgroundColor: PremiumTheme.colors.status.warning + '20',
            border: `1px solid ${PremiumTheme.colors.status.warning}40`,
          }}
        >
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0"
            style={{ color: PremiumTheme.colors.status.warning }}
          />
          <p className="text-xs" style={{ color: PremiumTheme.colors.status.warning }}>
            Add {formatPrice(calculations.amountToMinOrder)} more for delivery
            (min {formatPrice(deliveryConfig.min_order)})
          </p>
        </div>
      )}

      {/* Free delivery progress */}
      {currentOrderMode === 'delivery' &&
        !calculations.isFreeDelivery &&
        calculations.minOrderMet && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p
                className="text-xs"
                style={{ color: PremiumTheme.colors.text.muted }}
              >
                <Truck className="w-3 h-3 inline mr-1" />
                {formatPrice(calculations.amountToFreeDelivery)} from free delivery
              </p>
              <p
                className="text-xs font-medium"
                style={{ color: PremiumTheme.colors.gold[400] }}
              >
                {formatPrice(deliveryConfig.free_over)}
              </p>
            </div>
            <Progress
              value={calculations.freeDeliveryProgress}
              className="h-1.5"
              style={{ backgroundColor: PremiumTheme.colors.dark[700] }}
            />
          </div>
        )}

      {/* Price breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span
            className="text-sm"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            Subtotal
          </span>
          <span
            className="text-sm"
            style={{ color: PremiumTheme.colors.text.primary }}
          >
            {formatPrice(calculations.subtotal)}
          </span>
        </div>

        {currentOrderMode === 'delivery' && (
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              Delivery
            </span>
            <span
              className="text-sm"
              style={{
                color: calculations.isFreeDelivery
                  ? PremiumTheme.colors.status.success
                  : PremiumTheme.colors.text.primary,
              }}
            >
              {calculations.isFreeDelivery
                ? 'FREE'
                : formatPrice(calculations.deliveryFee)}
            </span>
          </div>
        )}

        <div
          className="flex justify-between pt-2 border-t"
          style={{ borderColor: PremiumTheme.colors.border.light }}
        >
          <span
            className="text-base font-semibold"
            style={{ color: PremiumTheme.colors.text.primary }}
          >
            Total
          </span>
          <motion.span
            key={calculations.total}
            initial={totalChanged ? { scale: 1.1 } : false}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="text-lg font-bold"
            style={{
              color: PremiumTheme.colors.text.primary,
              textShadow: totalChanged
                ? `0 0 10px ${PremiumTheme.colors.gold[400]}50`
                : 'none',
            }}
          >
            {formatPrice(calculations.total)}
          </motion.span>
        </div>
      </div>

      {/* Checkout button */}
      <Button
        onClick={handleCheckout}
        disabled={isCheckoutDisabled || isCheckingOut}
        className="w-full h-12 text-base font-semibold gap-2"
        style={{
          background: isCheckoutDisabled
            ? PremiumTheme.colors.dark[700]
            : `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]} 0%, ${PremiumTheme.colors.burgundy[600]} 100%)`,
          color: isCheckoutDisabled
            ? PremiumTheme.colors.text.muted
            : 'white',
          border: 'none',
        }}
      >
        {isCheckingOut ? (
          <span className="animate-pulse">Processing...</span>
        ) : !isAcceptingOrders ? (
          <>
            <Lock className="w-4 h-4" />
            {getCheckoutButtonText()}
          </>
        ) : (
          <>
            {getCheckoutButtonText()}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      {/* Sign in prompt for guests */}
      {!isAuthenticated && onSignIn && (
        <Button
          variant="ghost"
          onClick={onSignIn}
          className="w-full mt-2 text-sm"
          style={{ color: PremiumTheme.colors.text.muted }}
        >
          Sign in for faster checkout
        </Button>
      )}
    </div>
  );
}

export default CartFooter;
