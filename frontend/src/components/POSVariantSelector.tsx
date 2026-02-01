import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '../utils/supabaseClient';
import { MenuItem, ItemVariant, ProteinType, OrderItem } from '../utils/types';
import { Skeleton } from '@/components/ui/skeleton';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { convertSpiceIndicatorsToEmoji, getSpiceLevelDisplay } from '../utils/spiceLevelUtils';
import brain from 'brain';
import { OptimizedImage } from 'components/OptimizedImage';

interface Props {
  menuItem: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (orderItem: OrderItem) => void;
  orderType?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
}

export function POSVariantSelector({ menuItem, isOpen, onClose, onAddToOrder, orderType = "COLLECTION" }: Props) {
  const [variants, setVariants] = useState<ItemVariant[]>([]);
  const [proteinTypes, setProteinTypes] = useState<ProteinType[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Define a consistent placeholder image
  const placeholderImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  
  useEffect(() => {
    const fetchVariantsAndProteinTypes = async () => {
      if (!menuItem) return;
      
      try {
        setLoading(true);
        setError(null);
        setNotes("");
        setQuantity(1);
        
        // Fetch variants with protein types
        const { data: variantsData, error: variantsError } = await supabase
          .from('menu_item_variants')
          .select(`
            *,
            protein_type:menu_protein_types(*)
          `)
          .eq('menu_item_id', menuItem.id);
          
        if (variantsError) throw variantsError;
        
        // Fetch all protein types for reference
        const { data: proteinTypesData, error: proteinTypesError } = await supabase
          .from('menu_protein_types')
          .select('*')
          .order('display_order', { ascending: true });
          
        if (proteinTypesError) throw proteinTypesError;
        
        setVariants(variantsData || []);
        setProteinTypes(proteinTypesData || []);
        
        // Auto-select the default variant if exists
        const defaultVariant = variantsData?.find(variant => variant.is_default);
        if (defaultVariant) {
          setSelectedVariant(defaultVariant);
        } else if (variantsData && variantsData.length > 0) {
          setSelectedVariant(variantsData[0]);
        }
        
      } catch (err: any) {
        console.error('Error fetching variants:', err);
        setError(err.message || 'Failed to load item variants');
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && menuItem) {
      fetchVariantsAndProteinTypes();
    }
  }, [menuItem, isOpen]);

  // Helper function to get the variant price based on order type
  const getVariantPrice = (variant: ItemVariant, orderType: string): number => {
    if (orderType === "DINE-IN" && variant.price_dine_in !== null && variant.price_dine_in !== undefined) {
      return variant.price_dine_in;
    }
    else if (orderType === "DELIVERY" && variant.price_delivery !== null && variant.price_delivery !== undefined) {
      return variant.price_delivery;
    }
    
    // Default to regular price for collection, waiting, etc.
    return variant.price;
  };
  
  // Helper function to determine if variant has a delivery price
  const hasDeliveryPrice = (variant: ItemVariant): boolean => {
    return variant.price_delivery !== null && variant.price_delivery !== undefined;
  };
  
  const handleAddToOrder = () => {
    if (!menuItem || !selectedVariant) return;
    
    // Calculate price based on variant and order type
    let calculatedPrice = selectedVariant.price; // Default to takeaway price
    
    if (orderType === "DINE-IN" && selectedVariant.price_dine_in !== null) {
      calculatedPrice = selectedVariant.price_dine_in;
    } else if (orderType === "DELIVERY" && selectedVariant.price_delivery !== null) {
      calculatedPrice = selectedVariant.price_delivery;
    } else if (orderType === "WAITING") {
      // For WAITING, use the same price as COLLECTION (default price)
      calculatedPrice = selectedVariant.price;
    }
    
    const selectedProteinType = proteinTypes.find(pt => pt.id === selectedVariant.protein_type_id);
    
    const orderItem: OrderItem = {
      id: Date.now().toString(), // temporary id
      menu_item_id: menuItem.id,
      category_id: menuItem.category_id, // Required for section dividers on receipts
      variant_id: selectedVariant.id,
      name: menuItem.name,
      variantName: selectedProteinType ? selectedProteinType.name : '',
      quantity,
      price: calculatedPrice,
      notes: notes || undefined,
      image_url: menuItem.image_url, // Include image URL for thumbnails
      modifiers: [] // We'll add modifiers in a future update
    };
    
    onAddToOrder(orderItem);
    onClose();
  };

  if (!menuItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="text-white sm:max-w-xl backdrop-blur-md" style={{
        background: `linear-gradient(145deg, #121212f5 0%, #1a1a1af5 100%)`,
        backdropFilter: 'blur(16px)',
        border: `1px solid rgba(124, 93, 250, 0.8)`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.25), 0 0 15px rgba(124, 93, 250, 0.4)`
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl" style={{
            backgroundImage: `linear-gradient(to right, #FFFFFF, rgba(255, 255, 255, 0.85))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.1)' 
          }}>{menuItem.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-2 space-y-4">
          {/* Item image */}
          <div className="relative w-full h-48 rounded-md overflow-hidden" style={{ 
            background: '#222222',
            border: `1px solid rgba(255, 255, 255, 0.07)`,
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)'
          }}>
            {menuItem.image_url ? (
              <OptimizedImage
                fallbackUrl={menuItem.image_url}
                variant="widescreen"
                alt={menuItem.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
          </div>
          <p className="text-sm mb-4" style={{ color: QSAITheme.text.secondary }}>{menuItem.description}</p>
          
          {(menuItem.spice_indicators || menuItem.default_spice_level !== null) && (
            <div className="text-sm mb-4" style={{ 
              color: '#D0A000',
              background: `rgba(124, 93, 250, 0.15)`,
              borderRadius: '0.375rem',
              padding: '0.5rem',
              border: `1px solid rgba(124, 93, 250, 0.3)` 
            }}>
              Spice Level: {convertSpiceIndicatorsToEmoji(menuItem.default_spice_level || menuItem.spice_indicators) || 'None'}
            </div>
          )}
          
          <h3 className="font-medium mb-2" style={{ color: QSAITheme.text.primary }}>Select Variant:</h3>
          
          {loading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-sm py-2" style={{ color: QSAITheme.purple.primary }}>{error}</div>
          ) : variants.length === 0 ? (
            <div className="text-sm py-2" style={{ color: QSAITheme.purple.light }}>
              No variants available for this item
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {variants.map(variant => {
                const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
                let price = variant.price; // Default to takeaway price
                
                if (orderType === "DINE-IN" && variant.price_dine_in !== null) {
                  price = variant.price_dine_in;
                } else if (orderType === "DELIVERY" && variant.price_delivery !== null) {
                  price = variant.price_delivery;
                } else if (orderType === "WAITING") {
                  // For WAITING, use the same price as COLLECTION (default price)
                  price = variant.price;
                }
                  
                return (
                  <Button
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                    className="w-full justify-between" 
                    style={{
                      background: selectedVariant?.id === variant.id 
                        ? `linear-gradient(135deg, #7C5DFA 0%, #6B4DEA 100%)` 
                        : '#222222',
                      border: selectedVariant?.id === variant.id 
                        ? `1px solid #7C5DFA` 
                        : `1px solid rgba(255, 255, 255, 0.07)`,
                      boxShadow: selectedVariant?.id === variant.id 
                        ? `0 4px 12px rgba(124, 93, 250, 0.4)` 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <span>{proteinType?.name || 'Unknown'}</span>
                    <span className="flex flex-col items-end text-right">
                      <span style={{ 
                        color: selectedVariant?.id === variant.id ? '#FFFFFF' : '#7C5DFA',
                        fontWeight: 'medium'
                      }}>
                        £{price.toFixed(2)}
                      </span>
                      {orderType === "DINE-IN" && variant.price_dine_in !== null && variant.price !== variant.price_dine_in && (
                        <span className="text-xs" style={{ color: QSAITheme.text.secondary }}>
                          Dine-in price
                        </span>
                      )}
                      
                      {/* Show takeaway price if different from dine-in */}
                      {orderType === "DINE-IN" && variant.price_dine_in !== null && variant.price !== variant.price_dine_in && (
                        <span className="text-xs mt-1" style={{ color: QSAITheme.text.secondary }}>
                          Takeaway: £{variant.price.toFixed(2)}
                        </span>
                      )}
                      
                      {/* Show delivery price if available and different */}
                      {orderType !== "DELIVERY" && hasDeliveryPrice(variant) && variant.price_delivery !== price && (
                        <span className="text-xs mt-1" style={{ color: QSAITheme.text.secondary }}>
                          Delivery: £{variant.price_delivery.toFixed(2)}
                        </span>
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
          
          <Separator className="my-4" style={{ background: `rgba(124, 93, 250, 0.8)` }} />
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2" style={{ color: QSAITheme.text.primary }}>Quantity:</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="text-white"
                  style={{ 
                    border: `1px solid rgba(124, 93, 250, 0.8)`,
                    background: '#222222'
                  }}
                >
                  -
                </Button>
                <span className="w-8 text-center" style={{ color: QSAITheme.text.primary }}>{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-white"
                  style={{ 
                    border: `1px solid rgba(124, 93, 250, 0.8)`,
                    background: '#222222'
                  }}
                >
                  +
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2" style={{ color: QSAITheme.text.primary }}>Special Instructions:</h3>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests?"
                className="text-white transition-colors duration-200"
                style={{
                  background: '#222222',
                  border: `1px solid rgba(124, 93, 250, 0.8)`,
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-white"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            Cancel
          </Button>
          <Button 
            className="text-white transition-all duration-200"
            onClick={handleAddToOrder}
            disabled={!selectedVariant || loading}
            style={{
              background: `linear-gradient(135deg, #7C5DFA 0%, #6B4DEA 100%)`,
              boxShadow: `0 4px 12px rgba(124, 93, 250, 0.4)`,
              border: `1px solid rgba(124, 93, 250, 0.8)`
            }}
          >
            Add to Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
