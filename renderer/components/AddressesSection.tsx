import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Edit, Trash2, Check, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MiniMapPreview from 'components/MiniMapPreview';
import type { CustomerAddress } from 'types';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[#EAECEF]">My Addresses</h2>
        <Button
          onClick={() => {
            setEditingAddress(null);
            setAddressModalOpen(true);
          }}
          className="bg-[#8B1538] hover:bg-[#7A1230] text-white shadow-[0_0_24px_#8B153855] border-0"
          aria-label="Add a new delivery address"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Address
        </Button>
      </div>

      {addresses && addresses.length > 0 ? (
        <div className="grid gap-4">
          {addresses.map((address) => {
            // Type assertion to include lat/lng that we know are saved
            const addressWithCoords = address as any;
            const hasCoords = addressWithCoords.latitude && addressWithCoords.longitude;
            
            return (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-[#8B1538]/30 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left: Map Preview */}
                  <div className="md:w-48 h-48 md:h-auto relative flex-shrink-0">
                    <MiniMapPreview
                      latitude={addressWithCoords.latitude}
                      longitude={addressWithCoords.longitude}
                      address_line1={address.address_line1}
                      city={address.city}
                      postal_code={address.postal_code}
                      width={192}
                      height={192}
                      zoom={15}
                      className="w-full h-full"
                    />
                    
                    {/* Delivery Zone Status Badge */}
                    {hasCoords && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-lg justify-center">
                          <Check className="h-3 w-3" />
                          <span>Within Delivery Zone</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Address Details & Actions */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#8B1538]/20">
                          <MapPin className="h-5 w-5 text-[#8B1538]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#EAECEF] capitalize">
                            {address.address_type} Address
                          </h3>
                          {address.is_default && (
                            <span className="inline-block px-2 py-1 text-xs bg-[#8B1538]/20 text-[#8B1538] rounded-full mt-1">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Edit & Delete Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAddress(address);
                            setAddressModalOpen(true);
                          }}
                          className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
                          aria-label="Edit address"
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id!)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          aria-label="Delete address"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Address Text */}
                    <div className="text-[#B7BDC6] space-y-1 mb-4">
                      <p>{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>{address.city}, {address.postal_code}</p>
                      {address.delivery_instructions && (
                        <p className="text-sm italic text-[#8B92A0] mt-2">
                          📝 {address.delivery_instructions}
                        </p>
                      )}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      {!address.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const { error } = await setDefaultAddress(address.id);
                            if (error) {
                              toast.error('Failed to set default address');
                            } else {
                              toast.success('Default address updated!');
                            }
                          }}
                          className="border-white/20 text-[#B7BDC6] hover:bg-white/10 hover:text-[#EAECEF]"
                          aria-label="Set as default address"
                        >
                          <Check className="h-4 w-4 mr-1" aria-hidden="true" />
                          Set as Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={async () => {
                          // Set as default and navigate to order
                          if (!address.is_default) {
                            await setDefaultAddress(address.id);
                          }
                          navigate('/online-orders');
                          toast.success('Ready to order! Address selected.');
                        }}
                        className="bg-[#8B1538] hover:bg-[#7A1530] text-white border-0"
                        aria-label="Order to this address"
                      >
                        <ShoppingBag className="h-4 w-4 mr-1" aria-hidden="true" />
                        Order to This Address
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="p-4 rounded-full bg-[#8B1538]/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-[#8B1538]" />
          </div>
          <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">No addresses saved</h3>
          <p className="text-[#B7BDC6] mb-6">Add your delivery addresses for faster checkout.</p>
          <Button
            onClick={() => {
              setEditingAddress(null);
              setAddressModalOpen(true);
            }}
            className="bg-[#8B1538] hover:bg-[#7A1530] text-white shadow-[0_0_24px_#8B153855] border-0"
            aria-label="Add your first address"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Your First Address
          </Button>
        </div>
      )}
    </div>
  );
}
