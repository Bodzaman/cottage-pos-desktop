import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignatureDish, VariantInfo } from "utils/menuTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PremiumTheme } from "../utils/premiumTheme";
import { toast } from 'sonner';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { apiClient } from 'app';

interface Props {
  dish: SignatureDish | null;
  isOpen: boolean;
  onClose: () => void;
}

const getSpiceLevelDisplay = (level: number) => {
    if (level >= 4) return "Extra Hot 🌶️🌶️🌶️";
    if (level === 3) return "Hot 🌶️🌶️";
    if (level === 2) return "Medium 🌶️";
    if (level === 1) return "Mild";
    return null;
};


const DishDetailsModal: React.FC<Props> = ({ dish, isOpen, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState<VariantInfo | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (dish?.variants && dish.variants.length > 0) {
      setSelectedVariant(dish.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setQuantity(1); // Reset quantity when dish changes
  }, [dish]);

  if (!dish) {
    return null;
  }

  const handleVariantChange = (variantId: string) => {
    const variant = dish.variants.find(v => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const handleAddToCart = () => {
    // Logic to add to cart will be implemented later
    console.log(`Added ${quantity} of ${dish.title} (${selectedVariant?.variant_name || ''}) to cart.`);
    onClose();
  };

  const currentPrice = selectedVariant ? selectedVariant.price : (dish.variants[0]?.price || 'N/A');
  const currentImage = selectedVariant?.image_url || dish.main_image;
  const spiceLevelDisplay = getSpiceLevelDisplay(dish.spice_level);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl w-full p-0"
        style={{
          background: PremiumTheme.colors.background.card,
          borderColor: PremiumTheme.colors.border.light,
          color: PremiumTheme.colors.text.primary,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left side: Image */}
          <div className="relative h-96 md:h-auto">
            <img 
              src={currentImage} 
              alt={dish.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
          </div>

          {/* Right side: Details */}
          <div className="p-8 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-3xl font-playfair mb-2">{dish.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" style={{ backgroundColor: PremiumTheme.colors.burgundy[800]}}>{dish.category}</Badge>
                {spiceLevelDisplay && <Badge variant="destructive">{spiceLevelDisplay}</Badge>}
              </div>
            </DialogHeader>
            
            <DialogDescription className="text-base font-lora flex-grow mb-6">
              {dish.description}
            </DialogDescription>

            {/* Variant Selection */}
            {dish.has_variants && dish.variants.length > 1 && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Options</label>
                <Select onValueChange={handleVariantChange} defaultValue={selectedVariant?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {dish.variants.map(variant => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.variant_name} - £{variant.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Price and Quantity */}
            <div className="flex items-center justify-between mb-6">
                <p className="text-3xl font-bold" style={{ color: PremiumTheme.colors.burgundy[400] }}>
                    £{currentPrice}
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                    <span className="w-10 text-center text-lg font-semibold">{quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 1)}>+</Button>
                </div>
            </div>

            <DialogFooter className="mt-auto">
              <DialogClose asChild>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddToCart} 
                style={{ backgroundColor: PremiumTheme.colors.burgundy[500], color: 'white' }}
                className="hover:opacity-90"
              >
                Add to Order (£{(parseFloat(currentPrice) * quantity).toFixed(2)})
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DishDetailsModal;
