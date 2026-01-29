/**
 * CollectionStep - Collection information display
 *
 * Features:
 * - Restaurant address and map (from database)
 * - Opening hours (from database)
 * - Contact information
 * - Collection notes input
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, Clock, Phone, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCheckout } from '../CheckoutProvider';
import { useRestaurantSettings } from 'utils/useRestaurantSettings';
import { cn } from 'utils/cn';

interface CollectionStepProps {
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

export function CollectionStep({ className }: CollectionStepProps) {
  const { collectionNotes, setCollectionNotes } = useCheckout();
  const { settings, isLoading, getBusinessProfile, getOpeningHours } = useRestaurantSettings();

  // Get restaurant details from settings
  const businessProfile = getBusinessProfile();
  const openingHours = getOpeningHours();

  // Format opening hours for display
  const formattedHours = useMemo(() => {
    if (!openingHours || openingHours.length === 0) {
      return { weekdays: 'Hours not available', weekends: 'Hours not available' };
    }

    // Helper to format time from 24h to 12h
    const formatTime = (time: string) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Get weekday hours (Monday)
    const monday = openingHours.find(h => h.day.toLowerCase() === 'monday');
    const weekdayHours = monday && !monday.is_closed
      ? `${formatTime(monday.open)} - ${formatTime(monday.close)}`
      : 'Closed';

    // Get weekend hours (Saturday)
    const saturday = openingHours.find(h => h.day.toLowerCase() === 'saturday');
    const weekendHours = saturday && !saturday.is_closed
      ? `${formatTime(saturday.open)} - ${formatTime(saturday.close)}`
      : 'Closed';

    return { weekdays: weekdayHours, weekends: weekendHours };
  }, [openingHours]);

  // Build Google Maps URL
  const mapUrl = useMemo(() => {
    const address = encodeURIComponent(
      `${businessProfile.name}, ${businessProfile.address}, ${businessProfile.postcode}`
    );
    return `https://maps.google.com/?q=${address}`;
  }, [businessProfile]);

  const openMap = () => {
    window.open(mapUrl, '_blank');
  };

  // Loading state
  if (isLoading && !settings) {
    return (
      <div className={cn('rounded-2xl p-5 md:p-6 backdrop-blur-xl border flex items-center justify-center min-h-[200px]', className)}
        style={{ background: 'rgba(23, 25, 29, 0.8)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <Loader2 className="w-6 h-6 text-[#8B1538] animate-spin" />
      </div>
    );
  }

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#8B1538]/20 flex items-center justify-center">
          <Store className="w-5 h-5 text-[#8B1538]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#EAECEF]">Collection Details</h2>
          <p className="text-sm text-[#B7BDC6]">Pick up from our restaurant</p>
        </div>
      </div>

      {/* Restaurant info card */}
      <motion.div
        custom={0}
        variants={fieldVariants}
        className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            {/* Restaurant name */}
            <div>
              <h3 className="text-base font-semibold text-[#EAECEF]">
                {businessProfile.name}
              </h3>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#8B1538] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[#EAECEF]">{businessProfile.address}</p>
                <p className="text-sm text-[#B7BDC6]">
                  {businessProfile.postcode}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#8B1538] flex-shrink-0" />
              <a
                href={`tel:${businessProfile.phone}`}
                className="text-sm text-[#EAECEF] hover:text-[#8B1538] transition-colors"
              >
                {businessProfile.phone}
              </a>
            </div>
          </div>

          {/* Map button */}
          <Button
            variant="outline"
            size="sm"
            onClick={openMap}
            className="border-white/20 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Map
          </Button>
        </div>
      </motion.div>

      {/* Opening hours */}
      <motion.div
        custom={1}
        variants={fieldVariants}
        className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#8B1538]" />
          <h4 className="text-sm font-medium text-[#EAECEF]">Opening Hours</h4>
        </div>
        <div className="space-y-2 pl-6">
          <div className="flex justify-between text-sm">
            <span className="text-[#B7BDC6]">Mon - Fri</span>
            <span className="text-[#EAECEF]">{formattedHours.weekdays}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#B7BDC6]">Sat - Sun</span>
            <span className="text-[#EAECEF]">{formattedHours.weekends}</span>
          </div>
        </div>
      </motion.div>

      {/* Collection notes */}
      <motion.div custom={2} variants={fieldVariants}>
        <Label className="text-sm text-[#B7BDC6] mb-1.5 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Collection Notes (Optional)
        </Label>
        <Textarea
          value={collectionNotes}
          onChange={(e) => setCollectionNotes(e.target.value)}
          placeholder="E.g., I'll arrive in a silver car, please bring to the door..."
          rows={2}
          className={cn(
            'bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
            'focus:border-[#8B1538] focus:ring-[#8B1538]/20 resize-none'
          )}
        />
      </motion.div>

      {/* Collection info note */}
      <motion.div
        custom={3}
        variants={fieldVariants}
        className="mt-4 p-3 rounded-xl bg-[#8B1538]/10 border border-[#8B1538]/30"
      >
        <p className="text-sm text-[#EAECEF]">
          💡 <span className="font-medium">Tip:</span> Please arrive at the scheduled time.
          We'll have your order ready and waiting!
        </p>
      </motion.div>
    </motion.div>
  );
}

export default CollectionStep;
