/**
 * DeliveryStep - Delivery address form with saved addresses
 *
 * Features:
 * - Saved address selector for returning customers
 * - Google Places autocomplete
 * - Postcode validation with delivery zone check
 * - Delivery notes input
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Home,
  Building,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  Plus,
  Navigation,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCheckout } from '../CheckoutProvider';
import { cn } from 'utils/cn';

interface DeliveryStepProps {
  className?: string;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

export function DeliveryStep({ className }: DeliveryStepProps) {
  const {
    deliveryAddress,
    updateDeliveryAddress,
    deliveryValidation,
    savedAddresses,
    isAuthenticated,
    minOrderAmount,
    subtotal,
  } = useCheckout();

  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Determine if we should show the saved address selector
  const hasSavedAddresses = isAuthenticated && savedAddresses && savedAddresses.length > 0;

  // Format address for display
  const formatAddress = (addr: any) => {
    if (!addr) return '';
    const parts = [addr.street, addr.city, addr.postcode].filter(Boolean);
    return parts.join(', ');
  };

  // Select a saved address
  const handleSelectSavedAddress = (addr: any) => {
    updateDeliveryAddress({
      street: addr.address_line1 || addr.street,
      city: addr.city || 'London',
      postcode: addr.postal_code || addr.postcode,
      notes: addr.delivery_instructions || '',
    });
    setShowAddressSelector(false);
    setIsAddingNew(false);
  };

  // Calculate minimum order status
  const orderBelowMinimum = subtotal < minOrderAmount;

  return (
    <motion.div
      className={cn(
        'rounded-2xl p-5 md:p-6 backdrop-blur-xl border',
        className
      )}
      style={{
        background: 'rgba(23, 25, 29, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B1538]/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#8B1538]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#EAECEF]">Delivery Address</h2>
            <p className="text-sm text-[#B7BDC6]">Where should we deliver?</p>
          </div>
        </div>

        {/* Validation status */}
        {deliveryValidation.status === 'validating' && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#8B1538] animate-spin" />
            <span className="text-xs text-[#B7BDC6]">Checking area...</span>
          </div>
        )}
        {deliveryValidation.status === 'valid' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">We deliver here</span>
          </motion.div>
        )}
      </div>

      {/* Saved addresses selector */}
      {hasSavedAddresses && !isAddingNew && (
        <motion.div custom={0} variants={fieldVariants} className="mb-4">
          <div className="relative">
            <button
              onClick={() => setShowAddressSelector(!showAddressSelector)}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl',
                'bg-white/5 border border-white/10 hover:border-white/20',
                'transition-colors duration-200'
              )}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-[#B7BDC6]" />
                <span className="text-sm text-[#EAECEF]">
                  {deliveryAddress.street
                    ? formatAddress(deliveryAddress)
                    : 'Select a saved address'}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-[#B7BDC6] transition-transform duration-200',
                  showAddressSelector && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {showAddressSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-2 rounded-xl bg-[#17191D] border border-white/10 shadow-xl overflow-hidden"
                >
                  {savedAddresses.map((addr: any, index: number) => (
                    <button
                      key={addr.id || index}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 text-left',
                        'hover:bg-white/5 transition-colors duration-200',
                        index !== savedAddresses.length - 1 && 'border-b border-white/5'
                      )}
                    >
                      {addr.type === 'work' ? (
                        <Building className="w-4 h-4 text-[#B7BDC6]" />
                      ) : (
                        <Home className="w-4 h-4 text-[#B7BDC6]" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-[#EAECEF]">
                          {addr.address_line1 || addr.street}
                        </p>
                        <p className="text-xs text-[#B7BDC6]">
                          {addr.postal_code || addr.postcode}
                        </p>
                      </div>
                      {addr.is_default && (
                        <span className="text-xs text-[#8B1538]">Default</span>
                      )}
                    </button>
                  ))}

                  {/* Add new address option */}
                  <button
                    onClick={() => {
                      setIsAddingNew(true);
                      setShowAddressSelector(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors duration-200 border-t border-white/10"
                  >
                    <Plus className="w-4 h-4 text-[#8B1538]" />
                    <span className="text-sm text-[#8B1538]">Add new address</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Address form */}
      {(!hasSavedAddresses || isAddingNew) && (
        <div className="space-y-4">
          {/* Street address */}
          <motion.div custom={1} variants={fieldVariants}>
            <Label className="text-sm text-[#B7BDC6] mb-1.5 block">Street Address</Label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B7BDC6]" />
              <Input
                ref={addressInputRef}
                type="text"
                value={deliveryAddress.street || ''}
                onChange={(e) => updateDeliveryAddress({ street: e.target.value })}
                placeholder="123 High Street"
                className={cn(
                  'pl-10 bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
                  'focus:border-[#8B1538] focus:ring-[#8B1538]/20',
                  deliveryAddress.street && 'border-emerald-500/30'
                )}
              />
            </div>
          </motion.div>

          {/* City and Postcode row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div custom={2} variants={fieldVariants}>
              <Label className="text-sm text-[#B7BDC6] mb-1.5 block">City</Label>
              <Input
                type="text"
                value={deliveryAddress.city || ''}
                onChange={(e) => updateDeliveryAddress({ city: e.target.value })}
                placeholder="London"
                className={cn(
                  'bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
                  'focus:border-[#8B1538] focus:ring-[#8B1538]/20'
                )}
              />
            </motion.div>

            <motion.div custom={3} variants={fieldVariants}>
              <Label className="text-sm text-[#B7BDC6] mb-1.5 block">Postcode</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={deliveryAddress.postcode || ''}
                  onChange={(e) =>
                    updateDeliveryAddress({ postcode: e.target.value.toUpperCase() })
                  }
                  placeholder="SW1A 1AA"
                  className={cn(
                    'bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
                    'focus:border-[#8B1538] focus:ring-[#8B1538]/20',
                    deliveryValidation.status === 'valid' && 'border-emerald-500/30',
                    deliveryValidation.status === 'invalid' && 'border-red-500/50'
                  )}
                />
                {deliveryValidation.status === 'validating' && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B1538] animate-spin" />
                )}
                {deliveryValidation.status === 'valid' && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                )}
                {deliveryValidation.status === 'invalid' && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                )}
              </div>
            </motion.div>
          </div>

          {/* Validation message */}
          <AnimatePresence>
            {deliveryValidation.status === 'invalid' && deliveryValidation.errors && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    {deliveryValidation.errors.map((error, i) => (
                      <p key={i} className="text-sm text-red-400">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {deliveryValidation.status === 'valid' && deliveryValidation.distance && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm text-emerald-400">
                    {deliveryValidation.distance.toFixed(1)} miles away • Delivery available
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delivery notes */}
          <motion.div custom={4} variants={fieldVariants}>
            <Label className="text-sm text-[#B7BDC6] mb-1.5 block">
              Delivery Instructions (Optional)
            </Label>
            <Textarea
              value={deliveryAddress.notes || ''}
              onChange={(e) => updateDeliveryAddress({ notes: e.target.value })}
              placeholder="E.g., Ring doorbell, leave at door, call on arrival..."
              rows={2}
              className={cn(
                'bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
                'focus:border-[#8B1538] focus:ring-[#8B1538]/20 resize-none'
              )}
            />
          </motion.div>

          {/* Back to saved addresses */}
          {hasSavedAddresses && isAddingNew && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingNew(false)}
              className="text-[#B7BDC6] hover:text-[#EAECEF]"
            >
              ← Back to saved addresses
            </Button>
          )}
        </div>
      )}

      {/* Minimum order warning */}
      {orderBelowMinimum && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-400">
                Minimum order of £{minOrderAmount.toFixed(2)} required for delivery
              </p>
              <p className="text-xs text-amber-300/70 mt-1">
                Add £{(minOrderAmount - subtotal).toFixed(2)} more to your order
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default DeliveryStep;
