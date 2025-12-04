import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { MenuItem, ItemVariant, OrderItem } from '../utils/menuTypes';
import { Minus, Plus, Sliders } from 'lucide-react';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';
import { StaffCustomizationModal } from './StaffCustomizationModal';

// POS Purple Theme Colors
const POS_COLORS = {
  primary: '#7C5DFA',
  primaryHover: '#6948FF',
  primaryLight: '#9178FF',
  background: '#1A1A1A',
  surface: '#171717',
  surfaceHover: '#212121',
  border: '#2A2A2A',
  borderActive: '#7C5DFA',
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E5',
    muted: '#B0B0B0'
  },
  gold: '#FFD700'
};

interface VariantQuantities {
  [variantId: string]: number;
}

interface StaffVariantSelectorProps {
  item: MenuItem;
  itemVariants: ItemVariant[];
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (orderItem: OrderItem) => void;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
}

export function StaffVariantSelector({
  item,
  itemVariants,
  isOpen,
  onClose,
  onAddToOrder,
  orderType
}: StaffVariantSelectorProps) {
  const { proteinTypes } = useRealtimeMenuStore();
  const [variantQuantities, setVariantQuantities] = useState<VariantQuantities>({});
  const [variants, setVariants] = useState<ItemVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);

  useEffect(() => {
    if (!item) return;

    // Filter variants for this menu item
    const filteredVariants = itemVariants?.filter(variant => variant.menu_item_id === item.id) || [];
    setVariants(filteredVariants);

    // Initialize variant quantities to 1
    const initialQuantities: VariantQuantities = {};
    filteredVariants.forEach(v => {
      initialQuantities[v.id] = 1;
    });
    setVariantQuantities(initialQuantities);

    console.log('🟣 StaffVariantSelector loaded:', {
      itemId: item.id,
      itemName: item.name,
      variantCount: filteredVariants.length,
      orderType
    });
  }, [item, itemVariants, orderType]);

  // Get price based on order type
  const getVariantPrice = (variant: ItemVariant): number => {
    switch (orderType) {
      case 'DELIVERY':
        return variant.price_delivery || variant.price || 0;
      case 'DINE-IN':
        return variant.price_dine_in || variant.price || 0;
      case 'COLLECTION':
      case 'WAITING':
      default:
        return variant.price || 0;
    }
  };

  const getDisplayImage = (variant?: ItemVariant) => {
    if (variant?.image_url_override) {
      return variant.image_url_override;
    }
    if (item?.image_url) {
      return item.image_url;
    }
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  };

  // Handle quantity change for specific variant
  const handleVariantQuantityChange = (variantId: string, delta: number) => {
    setVariantQuantities(prev => {
      const currentQty = prev[variantId] || 1;
      const newQty = Math.max(1, Math.min(20, currentQty + delta));
      return { ...prev, [variantId]: newQty };
    });
  };

  // Handle customize & add button click
  const handleCustomizeVariant = (variant: ItemVariant) => {
    setSelectedVariant(variant);
    setIsCustomizationModalOpen(true);
  };

  // Handle adding item from customization modal
  const handleAddToOrderFromModal = (
    item: MenuItem,
    quantity: number,
    variant?: ItemVariant | null,
    customizations?: Array<{id: string, name: string, price: number}>,
    notes?: string
  ) => {
    const price = variant 
      ? (orderType === 'DELIVERY' ? (variant.price_delivery ?? variant.price) : 
         orderType === 'DINE-IN' ? (variant.price_dine_in ?? variant.price) : variant.price)
      : (orderType === 'DELIVERY' ? (item.price_delivery || item.price_takeaway || item.price || 0) :
         orderType === 'DINE-IN' ? (item.price_dine_in || item.price_takeaway || item.price || 0) : 
         (item.price_takeaway || item.price || 0));
    
    const customizationsTotal = customizations?.reduce((sum, c) => sum + c.price, 0) || 0;
    const totalPrice = (price + customizationsTotal) * quantity;
    
    const orderItem: OrderItem = {
      menu_item_id: item.id,
      item_name: item.name,
      quantity: quantity,
      unit_price: price,
      total_price: totalPrice,
      variant_id: variant?.id || null,
      variant_name: variant?.name || null,
      notes: notes || '',
      customizations: customizations?.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price
      })) || []
    };
    
    onAddToOrder(orderItem);
    
    // Close customization modal first
    setIsCustomizationModalOpen(false);
    
    // Then close the variant selector modal after a short delay to ensure smooth transition
    setTimeout(() => {
      onClose();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-4xl w-full border-2"
          style={{
            backgroundColor: POS_COLORS.background,
            borderColor: POS_COLORS.borderActive,
            boxShadow: `0 0 30px ${POS_COLORS.primary}40`
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-2xl font-bold"
              style={{ color: POS_COLORS.text.primary }}
            >
              {item?.name}
            </DialogTitle>
            <DialogDescription style={{ color: POS_COLORS.text.muted }}>
              {item?.description || 'Select a protein option and customize your order.'}
            </DialogDescription>
          </DialogHeader>

          {/* Variant Selection Grid */}
          <div
            className="space-y-4 max-h-[60vh] overflow-y-auto p-2 rounded-lg"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: `${POS_COLORS.primary} ${POS_COLORS.surface}`
            }}
          >
            <h3
              className="text-lg font-semibold mb-4 px-2"
              style={{ color: POS_COLORS.text.secondary }}
            >
              Choose Your Protein:
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {variants.map(itemVariant => {
                const displayName = itemVariant.variant_name || itemVariant.name || item.name;
                const price = getVariantPrice(itemVariant);
                const variantQty = variantQuantities[itemVariant.id] || 1;
                const displayImage = getDisplayImage(itemVariant);
                const description = itemVariant.description_override || item?.description || '';

                return (
                  <motion.div
                    key={itemVariant.id}
                    className="rounded-lg border-2 transition-all overflow-hidden hover:border-opacity-100"
                    style={{
                      background: `linear-gradient(135deg, ${POS_COLORS.primary}15 0%, ${POS_COLORS.surface} 100%)`,
                      borderColor: POS_COLORS.border
                    }}
                    whileHover={{
                      scale: 1.01,
                      borderColor: POS_COLORS.primary
                    }}
                  >
                    {/* Horizontal Layout: Image on Left, Content on Right */}
                    <div className="flex gap-4 p-4">
                      {/* Left: Image */}
                      <div
                        className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden"
                        style={{ backgroundColor: POS_COLORS.surface }}
                      >
                        <img
                          src={displayImage}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
                          }}
                        />
                      </div>

                      {/* Right: Content */}
                      <div className="flex-1 flex flex-col">
                        {/* Header: Name + Price */}
                        <div className="flex items-start justify-between mb-2">
                          <h4
                            className="text-xl font-bold"
                            style={{ color: POS_COLORS.text.primary }}
                          >
                            {displayName}
                          </h4>
                          <span
                            className="text-lg font-bold ml-4"
                            style={{ color: POS_COLORS.text.primary }}
                          >
                            £{price.toFixed(2)}
                          </span>
                        </div>

                        {/* Description */}
                        {description && (
                          <p
                            className="text-sm mb-4 line-clamp-2"
                            style={{ color: POS_COLORS.text.muted }}
                          >
                            {description}
                          </p>
                        )}

                        {/* Footer: Quantity Controls + Action Button */}
                        <div className="mt-auto flex items-center gap-3">
                          {/* Quantity Controls */}
                          <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                            style={{
                              backgroundColor: POS_COLORS.background,
                              borderColor: POS_COLORS.border
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVariantQuantityChange(itemVariant.id, -1);
                              }}
                              disabled={variantQty <= 1}
                              className="p-1 rounded hover:bg-opacity-80 disabled:opacity-30 transition-all"
                              style={{
                                color: POS_COLORS.text.secondary
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span
                              className="text-lg font-semibold w-8 text-center"
                              style={{ color: POS_COLORS.text.primary }}
                            >
                              {variantQty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVariantQuantityChange(itemVariant.id, 1);
                              }}
                              disabled={variantQty >= 20}
                              className="p-1 rounded hover:bg-opacity-80 disabled:opacity-30 transition-all"
                              style={{
                                color: POS_COLORS.text.secondary
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Customise & Add Button - Purple POS Theme */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomizeVariant(itemVariant);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:scale-105"
                            style={{
                              background: `linear-gradient(135deg, ${POS_COLORS.primary} 0%, ${POS_COLORS.primaryHover} 100%)`,
                              color: POS_COLORS.text.primary,
                              boxShadow: `0 0 15px ${POS_COLORS.primary}50`
                            }}
                          >
                            <Sliders className="h-4 w-4" />
                            Customise & Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Customization Modal - Opens when "Customise & Add" is clicked */}
      {selectedVariant && (
        <StaffCustomizationModal
          item={item}
          variant={selectedVariant}
          isOpen={isCustomizationModalOpen}
          onClose={() => setIsCustomizationModalOpen(false)}
          onConfirm={handleAddToOrderFromModal}
          orderType={orderType}
          initialQuantity={variantQuantities[selectedVariant.id] || 1}
        />
      )}
    </>
  );
}
