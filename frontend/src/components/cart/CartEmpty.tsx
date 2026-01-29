/**
 * CartEmpty - Animated empty cart state
 *
 * Features:
 * - Animated shopping bag icon
 * - Encouraging message
 * - Browse menu CTA
 * - Subtle particle effect
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumTheme } from 'utils/premiumTheme';
import { useNavigate } from 'react-router-dom';

export function CartEmpty() {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  // Floating animation for icon
  const floatVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const handleBrowseMenu = () => {
    navigate('/online-orders');
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      {/* Animated icon */}
      <motion.div
        variants={itemVariants}
        className="relative mb-6"
      >
        <motion.div
          variants={floatVariants}
          animate="animate"
          className="w-24 h-24 rounded-2xl flex items-center justify-center relative"
          style={{
            background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]}20 0%, ${PremiumTheme.colors.burgundy[600]}10 100%)`,
            border: `1px solid ${PremiumTheme.colors.burgundy[500]}30`,
          }}
        >
          <ShoppingBag
            className="w-12 h-12"
            style={{ color: PremiumTheme.colors.burgundy[400] }}
          />

          {/* Decorative sparkles */}
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ backgroundColor: PremiumTheme.colors.gold[400] }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-2 -left-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: PremiumTheme.colors.silver[400] }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-xl font-bold mb-2"
        style={{ color: PremiumTheme.colors.text.primary }}
      >
        Your cart is empty
      </motion.h3>

      {/* Subtitle */}
      <motion.p
        variants={itemVariants}
        className="text-sm mb-6 max-w-[250px]"
        style={{ color: PremiumTheme.colors.text.muted }}
      >
        Looks like you haven't added any delicious items yet. Browse our menu to get started!
      </motion.p>

      {/* CTA Button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={handleBrowseMenu}
          className="gap-2"
          style={{
            background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]} 0%, ${PremiumTheme.colors.burgundy[600]} 100%)`,
            color: 'white',
            border: 'none',
          }}
        >
          <Utensils className="w-4 h-4" />
          Browse Menu
        </Button>
      </motion.div>

      {/* Subtle tagline */}
      <motion.p
        variants={itemVariants}
        className="text-xs mt-6"
        style={{ color: PremiumTheme.colors.text.muted + '80' }}
      >
        Authentic Indian cuisine awaits
      </motion.p>
    </motion.div>
  );
}

export default CartEmpty;
