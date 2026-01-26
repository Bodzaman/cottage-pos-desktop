import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Edit, Trash2, Check, ShoppingBag, Navigation, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MiniMapPreview from 'components/MiniMapPreview';
import { PremiumCard } from 'components/PremiumCard';
import { PortalButton } from 'components/PortalButton';
import { PremiumTheme } from 'utils/CustomerDesignSystem';
import { cn } from 'utils/cn';
import type { CustomerAddress } from 'types';

// Restaurant location for distance calculation
const RESTAURANT_COORDS = {
  lat: 51.5074, // Example - London
  lng: -0.1278
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface Props {
  addresses: CustomerAddress[] | null;
  setDefaultAddress: (id: string) => Promise<{ error: any }>;
  setEditingAddress: (address: any) => void;
  setAddressModalOpen: (open: boolean) => void;
  handleDeleteAddress: (addressId: string) => Promise<void>;
}

export default function AddressesSection({
  addresses,
  setDefaultAddress,
  setEditingAddress,
  setAddressModalOpen,
  handleDeleteAddress,
}: Props) {
  const navigate = useNavigate();

  // State for enlarged map modal
  const [enlargedMapAddress, setEnlargedMapAddress] = useState<any>(null);

  // Sort addresses with default first
  const sortedAddresses = useMemo(() => {
    if (!addresses) return [];
    return [...addresses].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });
  }, [addresses]);

  return (
    <div>
      {sortedAddresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedAddresses.map((address, index) => {
            const addressWithCoords = address as any;
            const hasCoords = addressWithCoords.latitude && addressWithCoords.longitude;
            const distance = hasCoords
              ? calculateDistance(
                  RESTAURANT_COORDS.lat,
                  RESTAURANT_COORDS.lng,
                  addressWithCoords.latitude,
                  addressWithCoords.longitude
                )
              : null;

            return (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PremiumCard
                  subsurface
                  hover
                  className={cn(
                    'overflow-hidden h-full',
                    address.isDefault && 'border-l-4 border-l-[#8B1538] shadow-[0_0_20px_rgba(139,21,56,0.15)]'
                  )}
                >
                  <div className="flex gap-4 p-4">
                    {/* Compact Map Preview */}
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer group"
                      onClick={() => hasCoords && setEnlargedMapAddress(addressWithCoords)}
                    >
                      <MiniMapPreview
                        latitude={addressWithCoords.latitude}
                        longitude={addressWithCoords.longitude}
                        address_line1={address.addressLine1}
                        city={address.city ?? ''}
                        postal_code={address.postcode}
                        width={96}
                        height={96}
                        zoom={15}
                        className="w-full h-full"
                      />

                      {/* Distance Badge */}
                      {distance !== null && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="px-1.5 py-0.5 rounded text-[10px] backdrop-blur-sm bg-black/60 text-white font-medium flex items-center justify-center gap-1">
                            <Navigation className="h-2.5 w-2.5" />
                            {distance.toFixed(1)} mi
                          </div>
                        </div>
                      )}

                      {/* Hover overlay */}
                      {hasCoords && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>

                    {/* Address Details */}
                    <div className="flex-1 min-w-0">
                      {/* Header: Label + Default Badge */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-white capitalize text-sm truncate">
                          {address.label || 'Saved'}
                        </h3>
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-[#8B1538]/20 text-[#8B1538] rounded-full shrink-0">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Default
                          </span>
                        )}
                      </div>

                      {/* Address Text */}
                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                        {`, ${address.city}, ${address.postcode}`}
                      </p>

                      {/* Delivery Zone Badge */}
                      {hasCoords && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          <Check className="h-2.5 w-2.5" />
                          Delivery available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02]">
                    {/* Icon Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAddress(address);
                          setAddressModalOpen(true);
                        }}
                        className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                        aria-label="Edit address"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id!)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                        aria-label="Delete address"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const { error } = await setDefaultAddress(address.id!);
                            if (error) {
                              toast.error('Failed to set default address');
                            } else {
                              toast.success('Default address updated!');
                            }
                          }}
                          className="text-gray-400 hover:text-[#8B1538] hover:bg-[#8B1538]/10 h-8 px-2 text-xs"
                          aria-label="Set as default address"
                        >
                          <Star className="h-3.5 w-3.5 mr-1" />
                          Set Default
                        </Button>
                      )}
                    </div>

                    {/* Primary CTA */}
                    <PortalButton
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        if (!address.isDefault) {
                          await setDefaultAddress(address.id!);
                        }
                        navigate('/online-orders');
                        toast.success('Ready to order!');
                      }}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Deliver Here
                    </PortalButton>
                  </div>
                </PremiumCard>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <PremiumCard subsurface className="py-12 px-6">
          <div className="text-center max-w-sm mx-auto">
            <div className="p-4 rounded-xl bg-[#8B1538]/15 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MapPin className="h-7 w-7 text-[#8B1538]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No addresses saved</h3>
            <p className="text-sm text-gray-400 mb-5">
              Add your delivery addresses for faster checkout next time.
            </p>
            <PortalButton
              variant="primary"
              onClick={() => {
                setEditingAddress(null);
                setAddressModalOpen(true);
              }}
            >
              <MapPin className="h-4 w-4" />
              Add Your First Address
            </PortalButton>
          </div>
        </PremiumCard>
      )}

      {/* Enlarged Map Modal */}
      <AnimatePresence>
        {enlargedMapAddress && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setEnlargedMapAddress(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-8 lg:inset-16 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'rgba(26, 26, 26, 0.95)',
                border: `1px solid ${PremiumTheme.colors.border.light}`
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: PremiumTheme.colors.border.light }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: `${PremiumTheme.colors.burgundy[500]}20` }}
                  >
                    <MapPin className="h-5 w-5 text-[#8B1538]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#EAECEF]">
                      {enlargedMapAddress.addressLine1}
                    </h3>
                    <p className="text-sm text-[#8B92A0]">
                      {enlargedMapAddress.city}, {enlargedMapAddress.postcode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Distance Info */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#8B1538]">
                      {calculateDistance(
                        RESTAURANT_COORDS.lat,
                        RESTAURANT_COORDS.lng,
                        enlargedMapAddress.latitude,
                        enlargedMapAddress.longitude
                      ).toFixed(1)} miles
                    </p>
                    <p className="text-xs text-[#8B92A0]">from restaurant</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEnlargedMapAddress(null)}
                    className="text-[#8B92A0] hover:text-[#EAECEF] hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Map Container */}
              <div className="w-full h-[calc(100%-80px)]">
                <MiniMapPreview
                  latitude={enlargedMapAddress.latitude}
                  longitude={enlargedMapAddress.longitude}
                  address_line1={enlargedMapAddress.addressLine1}
                  city={enlargedMapAddress.city ?? ''}
                  postal_code={enlargedMapAddress.postcode}
                  width={800}
                  height={600}
                  zoom={16}
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
