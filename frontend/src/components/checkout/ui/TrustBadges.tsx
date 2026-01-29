/**
 * TrustBadges - Security and trust indicators
 *
 * Features:
 * - SSL/Secure checkout badge
 * - Payment method logos
 * - Money-back guarantee
 * - Animated on scroll into view
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, CreditCard, Truck } from 'lucide-react';
import { cn } from 'utils/cn';

interface TrustBadgesProps {
  className?: string;
}

const badges = [
  {
    icon: Lock,
    label: 'Secure Checkout',
    description: '256-bit SSL',
  },
  {
    icon: CreditCard,
    label: 'Safe Payments',
    description: 'Powered by Stripe',
  },
  {
    icon: Shield,
    label: 'Data Protection',
    description: 'GDPR Compliant',
  },
  {
    icon: Truck,
    label: 'Fast Delivery',
    description: '30-45 minutes',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function TrustBadges({ className }: TrustBadgesProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={cn(
        'grid grid-cols-2 md:grid-cols-4 gap-3',
        className
      )}
    >
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <motion.div
            key={badge.label}
            variants={badgeVariants}
            className={cn(
              'flex flex-col items-center text-center p-3 rounded-xl',
              'bg-white/5 border border-white/5',
              'hover:bg-white/10 hover:border-white/10 transition-colors duration-300'
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-[#8B1538]/10 flex items-center justify-center mb-2">
              <Icon className="w-5 h-5 text-[#8B1538]" />
            </div>
            <p className="text-xs font-medium text-[#EAECEF]">{badge.label}</p>
            <p className="text-[10px] text-[#B7BDC6]">{badge.description}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default TrustBadges;
