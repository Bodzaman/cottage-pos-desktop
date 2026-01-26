import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PremiumCard } from 'components/PremiumCard';
import { PortalButton } from 'components/PortalButton';

interface NoActiveOrderCTAProps {
  hasOrderHistory: boolean;
  firstName?: string;
}

export function NoActiveOrderCTA({ hasOrderHistory, firstName }: NoActiveOrderCTAProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PremiumCard subsurface className="overflow-hidden">
        <div className="p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Message */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#8B1538]/15 border border-[#8B1538]/20">
                {hasOrderHistory ? (
                  <Sparkles className="h-5 w-5 text-[#8B1538]" />
                ) : (
                  <UtensilsCrossed className="h-5 w-5 text-[#8B1538]" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {hasOrderHistory
                    ? 'Ready for your next order?'
                    : firstName
                      ? `Welcome, ${firstName}!`
                      : 'Welcome to Cottage Tandoori!'
                  }
                </h3>
                <p className="text-sm text-gray-400">
                  {hasOrderHistory
                    ? 'Your next craving is just a click away'
                    : 'Start your culinary journey with us'
                  }
                </p>
              </div>
            </div>

            {/* CTA */}
            <PortalButton
              variant="primary"
              onClick={() => navigate('/online-orders')}
              className="w-full sm:w-auto shrink-0"
            >
              <UtensilsCrossed className="h-4 w-4" />
              Browse Menu
            </PortalButton>
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

export default NoActiveOrderCTA;
