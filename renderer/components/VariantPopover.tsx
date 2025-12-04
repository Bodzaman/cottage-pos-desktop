import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Settings } from 'lucide-react';
import { colors } from 'utils/designSystem';

interface Variant {
  id: string;
  name: string | null;
  price: number;
  price_dine_in?: number;
  price_delivery?: number;
  image_url?: string;
  display_order?: number;
  protein_type_id?: string;
}

interface MenuItem {
  id: string;
  name: string;
  image_url?: string;
}

interface VariantPopoverProps {
  item: MenuItem;
  variants: Variant[];
  orderType: 'DINE-IN' | 'DELIVERY' | 'COLLECTION' | 'WAITING';
  onAddVariant: (variant: Variant, quantity: number) => void;
  onCustomizeVariant: (variant: Variant) => void;
  fallbackImage?: string;
}

export function VariantPopover({
  item,
  variants,
  orderType,
  onAddVariant,
  onCustomizeVariant,
  fallbackImage = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'
}: VariantPopoverProps) {
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Sort variants by display_order
  const sortedVariants = [...variants].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );

  const getVariantPrice = (variant: Variant): number => {
    if (orderType === 'DINE-IN' && variant.price_dine_in) return variant.price_dine_in;
    if (orderType === 'DELIVERY' && variant.price_delivery) return variant.price_delivery;
    return variant.price;
  };

  const getVariantImage = (variant: Variant): string => {
    return variant.image_url || item.image_url || fallbackImage;
  };

  const getQuantity = (variantId: string): number => {
    return quantities[variantId] || 1;
  };

  const updateQuantity = (variantId: string, delta: number) => {
    const current = getQuantity(variantId);
    const newQty = Math.max(1, current + delta);
    setQuantities(prev => ({ ...prev, [variantId]: newQty }));
  };

  const handleAdd = (variant: Variant) => {
    const qty = getQuantity(variant.id);
    onAddVariant(variant, qty);
    // Reset quantity and close popover
    setQuantities(prev => ({ ...prev, [variant.id]: 1 }));
    setOpen(false);
  };

  const handleCustomize = (variant: Variant) => {
    onCustomizeVariant(variant);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="w-full"
          style={{
            background: `linear-gradient(135deg, ${colors.brand.purple} 0%, ${colors.brand.purpleDark} 100%)`,
            color: 'white',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            padding: '0.75rem',
            transition: 'all 0.2s ease'
          }}
        >
          Choose Variant
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[450px] p-0"
        style={{
          backgroundColor: '#1a1a1a',
          border: `1px solid ${colors.brand.purpleLight}`,
          borderRadius: '12px',
          boxShadow: `0 8px 32px ${colors.brand.purple}40`
        }}
      >
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold text-lg text-white">Choose Your Option</h3>
          <p className="text-sm text-gray-400 mt-1">{item.name}</p>
        </div>
        
        <ScrollArea className="max-h-[400px]">
          <div className="p-3 space-y-2">
            {sortedVariants.map((variant) => {
              const variantPrice = getVariantPrice(variant);
              const variantImage = getVariantImage(variant);
              const quantity = getQuantity(variant.id);

              return (
                <div
                  key={variant.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all"
                  style={{
                    border: '1px solid #2a2a2a'
                  }}
                >
                  {/* Thumbnail */}
                  <div 
                    className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                    style={{
                      backgroundImage: `url(${variantImage})`,
                      border: `2px solid ${colors.brand.purple}30`
                    }}
                  />

                  {/* Variant Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">
                      {variant.name || item.name}
                    </h4>
                    <p className="text-lg font-bold" style={{ color: colors.brand.purpleLight }}>
                      £{variantPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-2 py-1">
                    <button
                      onClick={() => updateQuantity(variant.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded text-white hover:bg-gray-700 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-semibold text-white text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(variant.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded text-white hover:bg-gray-700 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCustomize(variant)}
                      className="px-3 py-1.5"
                      style={{
                        borderColor: colors.brand.purple,
                        color: colors.brand.purpleLight,
                        backgroundColor: 'transparent'
                      }}
                    >
                      <Settings size={14} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAdd(variant)}
                      className="px-4 py-1.5"
                      style={{
                        background: `linear-gradient(135deg, ${colors.brand.purple} 0%, ${colors.brand.purpleDark} 100%)`,
                        color: 'white',
                        border: 'none',
                        fontWeight: 600
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
