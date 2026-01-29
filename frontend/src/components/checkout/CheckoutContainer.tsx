/**
 * CheckoutContainer - Main checkout orchestrator component
 *
 * Renders the single-page accordion checkout with:
 * - Progress indicator
 * - Express checkout (Apple Pay / Google Pay)
 * - Step-based form sections
 * - Order summary sidebar
 * - Mobile bottom sheet on smaller screens
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from 'utils/cartStore';
import { PremiumTheme } from 'utils/premiumTheme';
import { cn } from 'utils/cn';
import { toast } from 'sonner';

// Checkout components
import { CheckoutProvider, useCheckout, CHECKOUT_STEPS } from './CheckoutProvider';
import { CheckoutProgress } from './ui/CheckoutProgress';
import { OrderSummary } from './ui/OrderSummary';
import { DeliveryToggle } from './ui/DeliveryToggle';
import { ContactStep } from './steps/ContactStep';
import { DeliveryStep } from './steps/DeliveryStep';
import { CollectionStep } from './steps/CollectionStep';
import { TimeSlotStep } from './steps/TimeSlotStep';
import { PaymentStep } from './steps/PaymentStep';
import { MobileStickyFooter } from './mobile/MobileStickyFooter';
import { TrustBadges } from './ui/TrustBadges';
import { RestaurantStatusBanner, CountdownTimer } from 'components/status';
import { useRestaurantStatusStore, useTimeUntilOpen } from 'utils/restaurantStatusStore';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
  exit: { opacity: 0 },
};

const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

interface CheckoutContainerProps {
  onNavigateToMenu?: () => void;
  className?: string;
}

/**
 * Enhanced view when restaurant is closed
 * Shows countdown timer, today's hours, and clear messaging
 */
function RestaurantClosedView({
  message,
  onBackToMenu,
  className,
}: {
  message?: string | null;
  onBackToMenu: () => void;
  className?: string;
}) {
  const { displayMessage, todaysHours, nextServiceName, unavailableReason } =
    useRestaurantStatusStore();
  const timeUntilOpen = useTimeUntilOpen();

  // Determine title based on reason
  const getTitle = () => {
    if (unavailableReason === 'outside_hours' || unavailableReason === 'closed_today') {
      const service = nextServiceName === 'lunch' ? 'Lunch' : nextServiceName === 'dinner' ? 'Dinner' : 'Restaurant';
      return timeUntilOpen ? `${service} Opens Soon` : 'Currently Closed';
    }
    if (unavailableReason === 'manual_pause') {
      return 'Orders Temporarily Paused';
    }
    return 'Restaurant Unavailable';
  };

  return (
    <div
      className={cn('flex-1 flex items-center justify-center relative overflow-hidden', className)}
      style={{ background: '#0B0C0E', minHeight: '100dvh' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10 max-w-md px-4"
      >
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-amber-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#EAECEF] font-serif mb-3">
          {getTitle()}
        </h2>

        {/* Message */}
        <p className="text-[#B7BDC6] mb-6">
          {message || displayMessage || 'Please check back when we reopen.'}
        </p>

        {/* Countdown Timer */}
        {timeUntilOpen && (
          <div className="mb-6">
            <CountdownTimer showLabel />
          </div>
        )}

        {/* Today's Hours */}
        {todaysHours && (
          <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-sm text-[#B7BDC6]">
              Today: <span className="text-[#EAECEF]">{todaysHours}</span>
            </span>
          </div>
        )}

        {/* Back button */}
        <Button
          onClick={onBackToMenu}
          className="bg-gradient-to-r from-[#8B1538] to-[#7A1230] hover:from-[#7A1230] hover:to-[#691025] text-white border-0 shadow-lg px-8"
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Continue Browsing
        </Button>
      </motion.div>
    </div>
  );
}

function CheckoutContent({ onNavigateToMenu, className }: CheckoutContainerProps) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { items, totalItems } = useCartStore();

  const {
    currentStep,
    completedSteps,
    orderMode,
    setOrderMode,
    deliveryFee,
    total,
    canProceed,
    nextStep,
    prevStep,
    goToStep,
    markStepComplete,
    validateCurrentStep,
    proceedToPayment,
    isRestaurantOpen,
    restaurantMessage,
  } = useCheckout();

  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle back navigation
  const handleBack = () => {
    if (onNavigateToMenu) {
      onNavigateToMenu();
    } else {
      navigate('/online-orders');
    }
  };

  // Handle step continue
  const handleContinue = () => {
    if (validateCurrentStep()) {
      markStepComplete(currentStep);
      if (currentStep === 'payment') {
        proceedToPayment();
      } else {
        nextStep();
      }
    } else {
      toast.error('Please complete all required fields');
    }
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div
        className={cn('flex-1 flex items-center justify-center relative overflow-hidden', className)}
        style={{ background: '#0B0C0E', minHeight: '100dvh' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative z-10"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#17191D]/60 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-[#B7BDC6]" />
          </div>
          <h2 className="text-2xl font-bold text-[#EAECEF] font-serif mb-4">Your cart is empty</h2>
          <p className="text-[#B7BDC6] mb-6">Add some delicious items to get started</p>
          <Button
            onClick={handleBack}
            className="bg-gradient-to-r from-[#8B1538] to-[#7A1230] hover:from-[#7A1230] hover:to-[#691025] text-white border-0 shadow-lg"
          >
            Browse Menu
          </Button>
        </motion.div>
      </div>
    );
  }

  // Restaurant closed warning - enhanced with countdown and status
  if (!isRestaurantOpen) {
    return (
      <RestaurantClosedView
        message={restaurantMessage}
        onBackToMenu={handleBack}
        className={className}
      />
    );
  }

  // Get current step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'contact':
        return <ContactStep />;
      case 'delivery':
        return orderMode === 'delivery' ? <DeliveryStep /> : <CollectionStep />;
      case 'time':
        return <TimeSlotStep />;
      case 'payment':
        return <PaymentStep />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn('flex-1 flex flex-col min-h-screen relative', className)}
      style={{ background: '#0B0C0E' }}
    >
      {/* Background watermark */}
      <div
        className="absolute inset-0 opacity-[0.02] bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('/static/cottage-logo-watermark.png')`,
          backgroundSize: '400px 400px',
        }}
      />

      {/* Header */}
      <header
        className="border-b backdrop-blur-xl px-4 md:px-6 py-4 flex-shrink-0 relative z-10"
        style={{
          background: 'rgba(23, 25, 29, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Menu</span>
              </Button>
              <Separator orientation="vertical" className="h-6 bg-white/20 hidden sm:block" />
              <h1 className="text-xl md:text-2xl font-bold text-[#EAECEF] font-serif">Checkout</h1>
            </div>

            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#8B1538]" />
              <span className="text-[#EAECEF] font-semibold">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress indicator - Desktop only */}
      <div className="hidden lg:block border-b border-white/10 py-4 relative z-10">
        <div className="container mx-auto px-6">
          <CheckoutProgress
            steps={CHECKOUT_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(stepId) => {
              const stepIndex = CHECKOUT_STEPS.findIndex((s) => s.id === stepId);
              const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === currentStep);
              // Only allow going back to completed steps
              if (stepIndex < currentIndex || completedSteps.has(stepId as any)) {
                goToStep(stepId as any);
              }
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 relative z-10 pb-32 lg:pb-8">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <motion.div
            variants={shouldReduceMotion ? {} : containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-8"
          >
            {/* Left column - Steps */}
            <div className="space-y-6">
              {/* Delivery toggle */}
              <motion.div variants={shouldReduceMotion ? {} : stepVariants}>
                <DeliveryToggle
                  value={orderMode}
                  onChange={setOrderMode}
                  deliveryFee={deliveryFee}
                />
              </motion.div>

              {/* Current step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={shouldReduceMotion ? {} : stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {renderCurrentStep()}
                </motion.div>
              </AnimatePresence>

              {/* Desktop navigation buttons */}
              <motion.div
                variants={shouldReduceMotion ? {} : stepVariants}
                className="hidden lg:flex items-center justify-between pt-4"
              >
                <Button
                  onClick={prevStep}
                  variant="outline"
                  disabled={currentStep === 'contact'}
                  className="border-white/20 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
                >
                  Back
                </Button>

                <Button
                  onClick={handleContinue}
                  disabled={!canProceed}
                  className="bg-gradient-to-r from-[#8B1538] to-[#7A1230] hover:from-[#7A1230] hover:to-[#691025] text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed px-8"
                >
                  {currentStep === 'payment' ? `Pay £${total.toFixed(2)}` : 'Continue'}
                </Button>
              </motion.div>

              {/* Trust badges - Desktop */}
              <motion.div variants={shouldReduceMotion ? {} : stepVariants} className="hidden lg:block pt-4">
                <TrustBadges />
              </motion.div>
            </div>

            {/* Right column - Order summary (Desktop only) */}
            <div className="hidden lg:block">
              <div className="sticky top-8">
                <OrderSummary />
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Mobile sticky footer */}
      <MobileStickyFooter
        itemCount={totalItems}
        total={total}
        ctaLabel={currentStep === 'payment' ? `Pay £${total.toFixed(2)}` : 'Continue'}
        onCTAClick={handleContinue}
        disabled={!canProceed}
        currentStep={currentStep}
        totalSteps={CHECKOUT_STEPS.length}
      />
    </div>
  );
}

// Main export wraps content with provider
export function CheckoutContainer(props: CheckoutContainerProps) {
  return (
    <CheckoutProvider>
      <CheckoutContent {...props} />
    </CheckoutProvider>
  );
}

export default CheckoutContainer;
