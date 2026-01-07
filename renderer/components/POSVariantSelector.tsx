import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '../utils/supabaseClient';
import { MenuItem, ItemVariant, ProteinType, OrderItem } from '../utils/menuTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { convertSpiceIndicatorsToEmoji, getSpiceLevelDisplay } from '../utils/spiceLevelUtils';
import { toast } from 'sonner';
import { apiClient } from 'app';
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
  const [variantImages, setVariantImages] = useState<Record<string, string>>({});

  // Define a consistent placeholder image
  const placeholderImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  
  // Calculate display price based on order type and selected variant
  const displayPrice = useMemo(() => {
    if (!selectedVariant) return 0;
    
    if (orderType === "DINE-IN") {
      return selectedVariant.price_dine_in ?? selectedVariant.price;
    }
    if (orderType === "DELIVERY") {
      return selectedVariant.price_delivery ?? selectedVariant.price;
    }
    // WAITING and COLLECTION use standard collection price
    return selectedVariant.price;
  }, [selectedVariant, orderType]);
  
  // Helper function to get price for any variant based on order type
  const getVariantPrice = (variant: ItemVariant): number => {
    if (orderType === "DINE-IN") {
      return variant.price_dine_in ?? variant.price;
    }
    if (orderType === "DELIVERY") {
      return variant.price_delivery ?? variant.price;
    }
    // WAITING and COLLECTION use standard collection price
    return variant.price;
  };
  
  useEffect(() => {
    const fetchVariantsAndProteinTypes = async () => {
      if (!menuItem) return;
      
      try {
        setLoading(true);
        setError(null);
        setNotes("");
        setQuantity(1);
        
        // Fetch variants with protein types AND resolve images via media_assets
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
          .order('name', { ascending: true });
          
        if (proteinTypesError) throw proteinTypesError;
        
        // Resolve variant images by fetching from media_assets
        const imageMap: Record<string, string> = {};
        if (variantsData && variantsData.length > 0) {
          const assetIds = variantsData
            .map(v => v.image_asset_id)
            .filter((id): id is string => id !== null && id !== undefined);
          
          if (assetIds.length > 0) {
            const { data: assetsData, error: assetsError } = await supabase
              .from('media_assets')
              .select('id, url')
              .in('id', assetIds);
            
            if (!assetsError && assetsData) {
              assetsData.forEach(asset => {
                imageMap[asset.id] = asset.url;
              });
            }
          }
        }
        
        setVariantImages(imageMap);
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

  const handleAddToOrder = () => {
    if (!menuItem || !selectedVariant) return;
    
    // Use displayPrice which already has the correct pricing logic
    const calculatedPrice = displayPrice;
    
    const selectedProteinType = proteinTypes.find(pt => pt.id === selectedVariant.protein_type_id);
    
    const orderItem: OrderItem = {
      id: Date.now().toString(), // temporary id
      menu_item_id: menuItem.id,
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
          <DialogTitle 
            className="font-semibold" 
            style={{ 
              color: QSAITheme.text.primary,
              borderBottom: `1px solid rgba(124, 93, 250, 0.2)`,
              paddingBottom: '0.75rem'
            }}
          >
            {menuItem?.name || 'Select Variant'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Item Image */}
          <div className="flex justify-center mb-4">
            {selectedVariant?.image_asset_id && variantImages[selectedVariant.image_asset_id] ? (
              <OptimizedImage
                fallbackUrl={variantImages[selectedVariant.image_asset_id]}
                alt={selectedVariant.protein_type_id || menuItem?.name || 'Variant'}
                className="w-full h-40 object-cover rounded-lg"
              />
            ) : menuItem?.image_url ? (
              <OptimizedImage
                fallbackUrl={menuItem.image_url}
                alt={menuItem.name}
                className="w-full h-40 object-cover rounded-lg"
              />
            ) : (
              <div 
                className="w-full h-40 flex items-center justify-center rounded-lg" 
                style={{ 
                  background: '#222222',
                  border: '1px solid rgba(124, 93, 250, 0.2)'
                }}
              >
                <span style={{ color: QSAITheme.text.secondary }}>No image available</span>
              </div>
            )}
          </div>

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
                const price = getVariantPrice(variant);
                  
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
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
