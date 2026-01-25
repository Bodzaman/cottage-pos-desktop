import React from 'react';
import { MapPin, Check, Loader2, Search, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { globalColors } from 'utils/QSAIDesign';

interface AddressPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressListSelectorProps {
  addresses: AddressPrediction[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onConfirm: () => void;
  onManualEntry: () => void;
  isLoading: boolean;
  isConfirming?: boolean;
  postcodeInfo: {
    postcode: string;
    locality: string;
  };
}

export function AddressListSelector({
  addresses,
  selectedIndex,
  onSelect,
  onConfirm,
  onManualEntry,
  isLoading,
  isConfirming = false,
  postcodeInfo,
}: AddressListSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Finding addresses in {postcodeInfo.postcode}...</span>
        </div>
        {/* Skeleton loaders */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg p-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-lg p-4 text-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-500" />
          <p className="text-sm text-gray-400 mb-1">No addresses found for {postcodeInfo.postcode}</p>
          <p className="text-xs text-gray-500">
            The postcode is valid but we couldn&apos;t find specific addresses.
          </p>
        </div>
        <Button
          onClick={onManualEntry}
          variant="outline"
          className="w-full"
          style={{
            borderColor: globalColors.purple.primary,
            color: globalColors.purple.light,
          }}
        >
          <Home className="w-4 h-4 mr-2" />
          Enter address manually
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: globalColors.purple.light }} />
            Select Your Address
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            {postcodeInfo.postcode} &bull; {postcodeInfo.locality}
          </p>
        </div>
        <span className="text-xs text-gray-500">{addresses.length} found</span>
      </div>

      {/* Address List */}
      <div
        className="rounded-lg overflow-hidden max-h-[240px] overflow-y-auto"
        style={{
          backgroundColor: 'rgba(10, 10, 10, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <AnimatePresence>
          {addresses.map((address, index) => {
            const isSelected = selectedIndex === index;
            return (
              <motion.button
                key={address.place_id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(index)}
                className="w-full text-left p-3 transition-colors relative"
                style={{
                  backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  borderBottom: index < addresses.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Radio indicator */}
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                    style={{
                      border: isSelected
                        ? `2px solid ${globalColors.purple.primary}`
                        : '2px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: isSelected ? globalColors.purple.primary : 'transparent',
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Address text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.85)' }}
                    >
                      {address.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {address.structured_formatting.secondary_text}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Manual entry link */}
      <button
        onClick={onManualEntry}
        className="w-full text-center py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
      >
        <Home className="w-3 h-3 inline mr-1" />
        Can&apos;t find your address? Enter manually
      </button>

      {/* Confirm button */}
      <Button
        onClick={onConfirm}
        disabled={selectedIndex === null || isConfirming}
        className="w-full"
        style={{
          background:
            selectedIndex !== null
              ? `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`
              : 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          color: 'white',
          opacity: selectedIndex === null ? 0.5 : 1,
        }}
      >
        {isConfirming ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Validating address...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            Use This Address
          </>
        )}
      </Button>
    </div>
  );
}

export default AddressListSelector;
