/**
 * ContactStep - Contact information form
 *
 * Features:
 * - Auto-fill for returning customers
 * - Real-time validation
 * - "Logged in as" indicator
 * - Phone number formatting
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Check, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCheckout } from '../CheckoutProvider';
import { cn } from 'utils/cn';

interface ContactStepProps {
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

export function ContactStep({ className }: ContactStepProps) {
  const { customerData, updateCustomerData, isAuthenticated } = useCheckout();

  // Validation helpers
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone: string) =>
    /^[\d\s+()-]{10,}$/.test(phone);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    return cleaned;
  };

  // Check if form is pre-filled
  const isPrefilled =
    isAuthenticated &&
    customerData.firstName &&
    customerData.lastName &&
    customerData.email;

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
            <User className="w-5 h-5 text-[#8B1538]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#EAECEF]">Contact Details</h2>
            <p className="text-sm text-[#B7BDC6]">How can we reach you?</p>
          </div>
        </div>

        {isPrefilled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Auto-filled</span>
          </motion.div>
        )}
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div custom={0} variants={fieldVariants}>
            <Label className="text-sm text-[#B7BDC6] mb-1.5 block">First Name</Label>
            <div className="relative">
              <Input
                type="text"
                value={customerData.firstName || ''}
                onChange={(e) => updateCustomerData({ firstName: e.target.value })}
                placeholder="John"
                className={cn(
                  'bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
                  'focus:border-[#8B1538] focus:ring-[#8B1538]/20',
                  customerData.firstName && 'border-emerald-500/30'
                )}
              />
              {customerData.firstName && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              )}
            </div>
          </motion.div>

          <motion.div custom={1} variants={fieldVariants}>
            <Label className="text-sm text-[#B7BDC6] mb-1.5 block">Last Name</Label>
            <div className="relative">
              <Input
                type="text"
                value={customerData.lastName || ''}
                onChange={(e) => updateCustomerData({ lastName: e.target.value })}
                placeholder="Smith"
                className={cn(
                  'bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
                  'focus:border-[#8B1538] focus:ring-[#8B1538]/20',
                  customerData.lastName && 'border-emerald-500/30'
                )}
              />
              {customerData.lastName && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Email */}
        <motion.div custom={2} variants={fieldVariants}>
          <Label className="text-sm text-[#B7BDC6] mb-1.5 block">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B7BDC6]" />
            <Input
              type="email"
              value={customerData.email || ''}
              onChange={(e) => updateCustomerData({ email: e.target.value })}
              placeholder="john@example.com"
              className={cn(
                'pl-10 bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
                'focus:border-[#8B1538] focus:ring-[#8B1538]/20',
                customerData.email && isValidEmail(customerData.email) && 'border-emerald-500/30',
                customerData.email && !isValidEmail(customerData.email) && 'border-red-500/50'
              )}
            />
            {customerData.email && isValidEmail(customerData.email) && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            )}
          </div>
          {customerData.email && !isValidEmail(customerData.email) && (
            <p className="mt-1 text-xs text-red-400">Please enter a valid email address</p>
          )}
        </motion.div>

        {/* Phone */}
        <motion.div custom={3} variants={fieldVariants}>
          <Label className="text-sm text-[#B7BDC6] mb-1.5 block">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B7BDC6]" />
            <Input
              type="tel"
              value={customerData.phone || ''}
              onChange={(e) => updateCustomerData({ phone: formatPhoneNumber(e.target.value) })}
              placeholder="+44 7700 900000"
              className={cn(
                'pl-10 bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
                'focus:border-[#8B1538] focus:ring-[#8B1538]/20',
                customerData.phone && isValidPhone(customerData.phone) && 'border-emerald-500/30',
                customerData.phone && !isValidPhone(customerData.phone) && 'border-red-500/50'
              )}
            />
            {customerData.phone && isValidPhone(customerData.phone) && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            )}
          </div>
          {customerData.phone && !isValidPhone(customerData.phone) && (
            <p className="mt-1 text-xs text-red-400">Please enter a valid phone number</p>
          )}
          <p className="mt-1 text-xs text-[#B7BDC6]/70">
            We'll text you updates about your order
          </p>
        </motion.div>
      </div>

      {/* Logged in indicator */}
      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 pt-4 border-t border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#8B1538]/20 flex items-center justify-center">
                <User className="w-4 h-4 text-[#8B1538]" />
              </div>
              <div>
                <p className="text-sm text-[#EAECEF]">
                  Signed in as {customerData.firstName || customerData.email}
                </p>
                <p className="text-xs text-[#B7BDC6]">Your details are saved for faster checkout</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ContactStep;
