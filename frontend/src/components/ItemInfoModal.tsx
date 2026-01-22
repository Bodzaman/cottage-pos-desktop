import React, { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MenuItem, ItemVariant } from "utils/menuTypes";
import { PremiumTheme, getSpiceColor, getSpiceEmoji } from "utils/premiumTheme";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  itemVariants?: ItemVariant[];
  mode?: "delivery" | "collection";
}

export const ItemInfoModal: React.FC<Props> = ({ isOpen, onClose, item, itemVariants = [], mode = "collection" }) => {
  const variants = useMemo(() => itemVariants.filter(v => v.menu_item_id === item.id && (v as any).is_active !== false), [itemVariants, item.id]);
  const isMultiVariant = variants.length > 0;

  // ✅ NEW: Interactive variant selection state
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);

  // ✅ NEW: Auto-select first variant on dialog open
  useEffect(() => {
    if (isOpen && isMultiVariant && variants.length > 0) {
      // Sort by price and select cheapest/first variant
      const sortedVariants = [...variants].sort((a, b) => {
        const priceA = mode === "delivery" ? (a.price_delivery ?? a.price ?? 0) : (a.price ?? 0);
        const priceB = mode === "delivery" ? (b.price_delivery ?? b.price ?? 0) : (b.price ?? 0);
        return priceA - priceB;
      });
      setSelectedVariant(sortedVariants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [isOpen, isMultiVariant, variants, mode]);

  // ✅ NEW: Helper to check if variant/item has any food details configured
  const hasAnyFoodDetails = (target: MenuItem | ItemVariant): boolean => {
    const spice = 'spice_level' in target ? target.spice_level : (item.spice_indicators ? parseInt(item.spice_indicators) || 0 : 0);
    const allergens = (target as any).allergens ?? null;
    const allergenNotes = (target as any).allergen_notes ?? null;
    
    return (
      (spice && spice > 0) ||
      (allergens && allergens.length > 0) ||
      !!(allergenNotes?.trim()) ||
      (target as ItemVariant).is_vegetarian ||
      (target as ItemVariant).is_vegan ||
      (target as ItemVariant).is_gluten_free ||
      (target as ItemVariant).is_halal ||
      (target as ItemVariant).is_dairy_free ||
      (target as ItemVariant).is_nut_free
    );
  };

  const getModeAwareItemPrice = (): number => {
    if (mode === "delivery") {
      return (item.price_delivery ?? item.price_takeaway ?? item.price ?? 0) as number;
    }
    return (item.price_takeaway ?? item.price ?? 0) as number;
  };
  const getModeAwareVariantPrice = (variant: ItemVariant): number => {
    if (mode === "delivery") {
      return (variant.price_delivery ?? variant.price ?? 0) as number;
    }
    return (variant.price ?? 0) as number;
  };

  const basePrice = getModeAwareItemPrice();
  const spiceLevel = item.spice_indicators ? parseInt(item.spice_indicators) || 0 : 0;
  const spiceColor = getSpiceColor(spiceLevel);
  const spiceEmoji = getSpiceEmoji(spiceLevel);

  const fallbackImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  
  // ✅ NEW: Reactive hero image based on selected variant
  const displayImage = useMemo(() => {
    if (selectedVariant) {
      // Priority: variant display_image_url > variant image_url > item image_url > fallback
      return (selectedVariant as any).display_image_url || selectedVariant.image_url || item.image_url || fallbackImage;
    }
    return item.image_url || fallbackImage;
  }, [selectedVariant, item.image_url, fallbackImage]);

  const itemAllergens: string[] | null = (item as any).allergens ?? null;

  // Helper to convert variant dietary booleans to badge array
  const getVariantDietaryBadges = (variant: ItemVariant): string[] => {
    const badges: string[] = [];
    if (variant.is_vegetarian) badges.push('Vegetarian');
    if (variant.is_vegan) badges.push('Vegan');
    if (variant.is_gluten_free) badges.push('Gluten-Free');
    if (variant.is_halal) badges.push('Halal');
    if (variant.is_dairy_free) badges.push('Dairy-Free');
    if (variant.is_nut_free) badges.push('Nut-Free');
    return badges;
  };

  // ✅ NEW: Variant selection handler
  const handleVariantSelect = (variant: ItemVariant) => {
    setSelectedVariant(variant);
  };

  // ✅ NEW: Get food details for currently active variant or base item
  const getActiveFoodDetails = () => {
    const target = isMultiVariant && selectedVariant ? selectedVariant : item;
    const spice = 'spice_level' in target ? target.spice_level : (item.spice_indicators ? parseInt(item.spice_indicators) || 0 : 0);
    const allergens = (target as any).allergens ?? null;
    const dietaryBadges = isMultiVariant && selectedVariant ? getVariantDietaryBadges(selectedVariant) : [];
    
    return { spice, allergens, dietaryBadges, target };
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
          <DialogDescription className="sr-only">Detailed information about {item.name}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="rounded-lg overflow-hidden border border-border bg-card">
              <img src={displayImage} alt={item.name} className="w-full h-full object-cover" />
            </div>
            {/* Details */}
            <div className="flex flex-col gap-4">
              {/* Price + Spice */}
              <div className="flex items-center gap-3 flex-wrap">
                {!isMultiVariant && (
                  <span className="inline-flex items-center px-3 py-1 rounded-md font-semibold text-white" style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}>
                    £{basePrice.toFixed(2)}
                  </span>
                )}
                {spiceLevel > 0 && (
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium"
                    style={{ backgroundColor: `${spiceColor}25`, border: `1px solid ${spiceColor}`, color: spiceColor }}
                    aria-label={`Spice level ${spiceLevel}`}
                  >
                    <span>{spiceEmoji}</span>
                    <span>{spiceLevel === 1 ? 'Mild' : spiceLevel === 2 ? 'Medium' : spiceLevel === 3 ? 'Hot' : 'Extra Hot'}</span>
                  </span>
                )}
              </div>

              {/* Dietary tags */}
              {item.dietary_tags && item.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.dietary_tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-muted text-muted-foreground border border-border">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Allergens */}
              {itemAllergens && itemAllergens.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Allergens</div>
                  <div className="flex flex-wrap gap-2">
                    {itemAllergens.map((a, i) => (
                      <Badge key={i} className="bg-amber-500/20 text-amber-300 border border-amber-500/50">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </div>
              )}

              {/* ✅ NEW: Reactive Food Details Section - Below Description */}
              {(() => {
                const { spice, allergens, dietaryBadges, target } = getActiveFoodDetails();
                const showFoodDetails = hasAnyFoodDetails(target);
                
                if (!showFoodDetails) return null;
                
                // Build compact inline flow parts
                const foodDetailsParts: string[] = [];
                
                // Spice level with emoji
                if (spice && spice > 0) {
                  const spiceText = spice === 1 ? 'Mild' : spice === 2 ? 'Medium' : spice === 3 ? 'Hot' : 'Extra Hot';
                  foodDetailsParts.push(`${getSpiceEmoji(spice)} ${spiceText}`);
                }
                
                // Dietary badges (simple text)
                if (dietaryBadges.length > 0) {
                  foodDetailsParts.push(...dietaryBadges);
                }
                
                // Allergens with warning emoji
                if (allergens && allergens.length > 0) {
                  foodDetailsParts.push(`⚠️ Contains: ${allergens.join(', ')}`);
                }
                
                return (
                  <div className="pt-3 text-sm text-muted-foreground">
                    {foodDetailsParts.join('  •  ')}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Variants list (read-only) */}
          {isMultiVariant && (
            <div className="mt-6">
              <Separator className="my-4" />
              <div className="text-base font-semibold mb-3">Available options</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variants.map((v) => {
                  // Priority 1: variant_name (database-generated), Priority 2: name (custom override), Priority 3: protein_type_name
                  const label = v.variant_name || v.name || v.protein_type_name || 'Option';
                  const price = getModeAwareVariantPrice(v);
                  const isSelected = selectedVariant?.id === v.id;
                  
                  return (
                    <div 
                      key={v.id} 
                      onClick={() => handleVariantSelect(v)}
                      className={`rounded-md border p-3 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-2 bg-card/80' 
                          : 'border-border bg-card hover:border-muted-foreground/50'
                      }`}
                      style={{
                        borderColor: isSelected ? PremiumTheme.colors.gold[400] : undefined,
                        boxShadow: isSelected ? `0 0 0 1px ${PremiumTheme.colors.gold[400]}40` : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{label}</div>
                        <div className="font-semibold">£{price.toFixed(2)}</div>
                      </div>
                      {v.description_override && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {v.description_override}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ItemInfoModal;
