/**
 * RestaurantStatusModal - Blocking modal for unavailable restaurant
 *
 * Shows when:
 * - User tries to checkout when restaurant is closed
 * - Restaurant goes offline during a session
 * - POS heartbeat fails
 *
 * Features:
 * - Countdown timer to next opening
 * - Options: Keep browsing, Save cart, Schedule order (future)
 * - Animated entry/exit
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShoppingBag, ArrowRight, X, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useRestaurantStatusStore,
  useTimeUntilOpen,
} from 'utils/restaurantStatusStore';
import { CountdownTimer } from './CountdownTimer';
import { cn } from 'utils/cn';

interface RestaurantStatusModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when user closes the modal */
  onClose: () => void;
  /** Called when user wants to continue browsing */
  onContinueBrowsing?: () => void;
  /** Called when user wants to save cart for later */
  onSaveCart?: () => void;
  /** Title override */
  title?: string;
  /** Message override */
  message?: string;
  /** Hide the countdown timer */
  hideCountdown?: boolean;
}

export function RestaurantStatusModal({
  isOpen,
  onClose,
  onContinueBrowsing,
  onSaveCart,
  title,
  message,
  hideCountdown = false,
}: RestaurantStatusModalProps) {
  const {
    displayMessage,
    customMessage,
    nextServiceName,
    todaysHours,
    unavailableReason,
  } = useRestaurantStatusStore();

  const timeUntilOpen = useTimeUntilOpen();

  // Start polling when modal mounts
  useEffect(() => {
    if (isOpen) {
      const store = useRestaurantStatusStore.getState();
      if (!store._isPolling) {
        store.startPolling();
      }
    }
  }, [isOpen]);

  // Get appropriate title
  const getTitle = () => {
    if (title) return title;
    if (unavailableReason === 'outside_hours' || unavailableReason === 'closed_today') {
      const service = nextServiceName === 'lunch' ? 'Lunch' : nextServiceName === 'dinner' ? 'Dinner' : 'Restaurant';
      return timeUntilOpen ? `${service} Opens Soon` : 'Currently Closed';
    }
    if (unavailableReason === 'manual_pause') {
      return 'Orders Temporarily Paused';
    }
    return 'Restaurant Unavailable';
  };

  // Get appropriate message
  const getMessage = () => {
    if (message) return message;
    return displayMessage || customMessage || 'We\'re not accepting orders right now. Please check back soon.';
  };

  const handleContinueBrowsing = () => {
    onContinueBrowsing?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'w-full max-w-md mx-4 sm:mx-0',
              'rounded-2xl overflow-hidden',
              'border border-white/10'
            )}
            style={{ background: '#17191D' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5 text-[#B7BDC6]" />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-[#EAECEF] text-center mb-2">
                {getTitle()}
              </h2>

              {/* Message */}
              <p className="text-[#B7BDC6] text-center mb-6">
                {getMessage()}
              </p>

              {/* Countdown timer */}
              {!hideCountdown && timeUntilOpen && (
                <div className="flex justify-center mb-6">
                  <CountdownTimer showLabel />
                </div>
              )}

              {/* Today's hours */}
              {todaysHours && (
                <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-white/5">
                  <Utensils className="w-4 h-4 text-[#B7BDC6]" />
                  <span className="text-sm text-[#B7BDC6]">
                    Today's hours: <span className="text-[#EAECEF]">{todaysHours}</span>
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleContinueBrowsing}
                  className={cn(
                    'w-full h-12 text-base font-semibold',
                    'bg-gradient-to-r from-[#8B1538] to-[#7A1230]',
                    'hover:from-[#7A1230] hover:to-[#691025]',
                    'text-white border-0'
                  )}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Continue Browsing
                </Button>

                {onSaveCart && (
                  <Button
                    onClick={() => {
                      onSaveCart();
                      onClose();
                    }}
                    variant="outline"
                    className={cn(
                      'w-full h-12 text-base font-medium',
                      'bg-transparent border-white/20',
                      'text-[#EAECEF] hover:bg-white/10'
                    )}
                  >
                    Save Cart for Later
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RestaurantStatusModal;
