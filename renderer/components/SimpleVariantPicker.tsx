import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuItem, ItemVariant, ProteinType } from '../utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { PremiumTheme } from '../utils/premiumTheme';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface Props {
  item: MenuItem;
  itemVariants: ItemVariant[];
  isOpen: boolean;
  onClose: () => void;
  onSelectVariant: (variant: ItemVariant) => void;
  currentVariantId?: string | null;
  mode?: 'delivery' | 'collection';
}

export function SimpleVariantPicker({
  item,
  itemVariants,
  isOpen,
  onClose,
  onSelectVariant,
  currentVariantId = null,
  mode = 'collection'
}: Props) {
  const { proteinTypes } = useRealtimeMenuStore();

  // Filter variants for this item
  const variants = itemVariants.filter(
    v => v.menu_item_id === item.id && (v as any).is_active !== false
  );

  const getModeAwarePrice = (variant: ItemVariant): number => {
    if (mode === 'delivery') {
      return (variant.price_delivery ?? variant.price ?? 0) as number;
    }
    return (variant.price ?? 0) as number;
  };

  const getDisplayImage = (variant: ItemVariant) => {
    if (variant.image_url_override) {
      return variant.image_url_override;
    }
    if (item.image_url) {
      return item.image_url;
    }
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80';
  };

  const handleSelect = (variant: ItemVariant) => {
    console.log('✅ Variant selected:', variant.id, variant.name);
    onSelectVariant(variant);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl w-full"
        style={{
          backgroundColor: PremiumTheme.colors.dark[900],
          borderColor: PremiumTheme.colors.dark[700],
          boxShadow: PremiumTheme.shadows.glow.tandoori
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-bold"
            style={{ color: PremiumTheme.colors.text.primary }}
          >
            Choose Your Protein
          </DialogTitle>
          <DialogDescription style={{ color: PremiumTheme.colors.text.muted }}>
            Select the protein type for {item.name}
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-3 max-h-[60vh] overflow-y-auto p-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${PremiumTheme.colors.burgundy[500]} ${PremiumTheme.colors.dark[800]}`
          }}
        >
          {variants.map(variant => {
            const displayName = variant.variant_name || variant.name || item.name;
            const isSelected = currentVariantId === variant.id;
            const price = getModeAwarePrice(variant);
            const displayImage = getDisplayImage(variant);
            const description = variant.description_override || item.description || '';

            return (
              <motion.button
                key={variant.id}
                className={cn(
                  "w-full rounded-lg border-2 transition-all overflow-hidden text-left",
                  isSelected ? "border-opacity-100" : "border-opacity-30 hover:border-opacity-60"
                )}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[900]}40 0%, ${PremiumTheme.colors.dark[800]} 100%)`
                    : PremiumTheme.colors.dark[850],
                  borderColor: isSelected
                    ? PremiumTheme.colors.burgundy[500]
                    : PremiumTheme.colors.dark[600]
                }}
                onClick={() => handleSelect(variant)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex gap-4 p-4">
                  {/* Left: Image */}
                  <div
                    className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden"
                    style={{ backgroundColor: PremiumTheme.colors.dark[700] }}
                  >
                    <img
                      src={displayImage}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80';
                      }}
                    />
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Header: Name + Price */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h4
                          className="text-lg font-bold"
                          style={{ color: PremiumTheme.colors.text.primary }}
                        >
                          {displayName}
                        </h4>
                        {isSelected && (
                          <Check
                            className="h-5 w-5"
                            style={{ color: PremiumTheme.colors.burgundy[500] }}
                          />
                        )}
                      </div>
                      <span
                        className="text-xl font-bold ml-4"
                        style={{ color: PremiumTheme.colors.gold[400] }}
                      >
                        £{price.toFixed(2)}
                      </span>
                    </div>

                    {/* Description */}
                    {description && (
                      <p
                        className="text-sm line-clamp-2 mt-1"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="text-center text-sm pt-2" style={{ color: PremiumTheme.colors.text.muted }}>
          Tap a protein to select
        </div>
      </DialogContent>
    </Dialog>
  );
}
