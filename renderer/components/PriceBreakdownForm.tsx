import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Truck, Utensils, Home, Package } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../utils/formatters";
import { apiClient } from "app";

interface PriceBreakdownFormProps {
  variantId: string;
  variantName: string;
  takeawayPrice: number;
  dineInPrice: number | null;
  deliveryPrice: number | null;
  onUpdateComplete: () => void;
}

export function PriceBreakdownForm({
  variantId,
  variantName,
  takeawayPrice,
  dineInPrice,
  deliveryPrice,
  onUpdateComplete
}: PriceBreakdownFormProps) {
  const [prices, setPrices] = React.useState({
    takeaway: takeawayPrice,
    dineIn: dineInPrice || takeawayPrice,
    delivery: deliveryPrice || takeawayPrice
  });
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Handle input changes
  const handlePriceChange = (type: "takeaway" | "dineIn" | "delivery", value: string) => {
    const numericValue = value ? parseFloat(value) : 0;
    
    setPrices(prev => ({
      ...prev,
      [type]: numericValue
    }));
    
    // If takeaway price changes, auto-update other prices if they match the old takeaway price
    if (type === "takeaway") {
      if (prev.dineIn === prev.takeaway) {
        setPrices(prev => ({ ...prev, dineIn: numericValue }));
      }
      if (prev.delivery === prev.takeaway) {
        setPrices(prev => ({ ...prev, delivery: numericValue }));
      }
    }
  };
  
  // Handle saving the price breakdown
  const handleSave = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if takeaway price is valid
      if (prices.takeaway <= 0) {
        toast.error("Takeaway price must be greater than zero");
        return;
      }
      
      // Prepare dine-in price as null if it equals takeaway price
      const effectiveDineInPrice = prices.dineIn === prices.takeaway ? null : prices.dineIn;
      
      // Prepare delivery price as null if it equals takeaway price
      const effectiveDeliveryPrice = prices.delivery === prices.takeaway ? null : prices.delivery;
      
      // Send update to the API
      const response = await apiClient.update_variant_pricing({
        variant_id: variantId,
        price_takeaway: prices.takeaway,
        price_dine_in: effectiveDineInPrice,
        price_delivery: effectiveDeliveryPrice
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Price breakdown updated successfully");
        onUpdateComplete();
      } else {
        toast.error(data.message || "Failed to update price breakdown");
      }
    } catch (error) {
      console.error("Error updating price breakdown:", error);
      toast.error("An error occurred while updating prices");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-lg font-semibold text-tandoor-platinum">
          Price Breakdown for {variantName || "Variant"}
        </h3>
        <p className="text-sm text-tandoor-platinum/70">
          Set different prices for takeaway, dine-in, and delivery orders
        </p>
      </div>
      
      <Alert className="bg-tandoor-black/40 border-tandoor-red/20">
        <Info className="h-4 w-4 text-tandoor-red" />
        <AlertDescription className="text-xs text-tandoor-platinum/70">
          The takeaway price is your base price. Dine-in and delivery prices are optional and will default to the takeaway price if not specified.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        {/* Takeaway Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-tandoor-platinum" />
            <Label htmlFor="takeaway-price" className="text-tandoor-platinum">
              Takeaway Price
            </Label>
            <Badge variant="outline" className="text-xs ml-auto bg-tandoor-black/40 border-tandoor-red/20 text-tandoor-platinum/70">
              Base Price
            </Badge>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-tandoor-platinum">£</span>
            <Input
              id="takeaway-price"
              type="number"
              step="0.01"
              min="0"
              value={prices.takeaway}
              onChange={(e) => handlePriceChange("takeaway", e.target.value)}
              className="pl-7 bg-tandoor-black border-tandoor-red/20 text-tandoor-platinum"
            />
          </div>
        </div>
        
        <Separator className="bg-tandoor-red/10" />
        
        {/* Dine-In Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-tandoor-platinum" />
            <Label htmlFor="dine-in-price" className="text-tandoor-platinum">
              Dine-In Price
            </Label>
            {prices.dineIn !== prices.takeaway && (
              <Badge className="ml-auto bg-green-950/30 text-green-500 border-green-700/30 hover:bg-green-950/50">
                +{formatCurrency(prices.dineIn - prices.takeaway)}
              </Badge>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-tandoor-platinum">£</span>
            <Input
              id="dine-in-price"
              type="number"
              step="0.01"
              min="0"
              value={prices.dineIn}
              onChange={(e) => handlePriceChange("dineIn", e.target.value)}
              className="pl-7 bg-tandoor-black border-tandoor-red/20 text-tandoor-platinum"
            />
          </div>
          {prices.dineIn === prices.takeaway && (
            <p className="text-xs text-tandoor-platinum/60">
              Same as takeaway price
            </p>
          )}
        </div>
        
        <Separator className="bg-tandoor-red/10" />
        
        {/* Delivery Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-tandoor-platinum" />
            <Label htmlFor="delivery-price" className="text-tandoor-platinum">
              Delivery Price
            </Label>
            {prices.delivery !== prices.takeaway && (
              <Badge className="ml-auto bg-amber-950/30 text-amber-500 border-amber-700/30 hover:bg-amber-950/50">
                +{formatCurrency(prices.delivery - prices.takeaway)}
              </Badge>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-tandoor-platinum">£</span>
            <Input
              id="delivery-price"
              type="number"
              step="0.01"
              min="0"
              value={prices.delivery}
              onChange={(e) => handlePriceChange("delivery", e.target.value)}
              className="pl-7 bg-tandoor-black border-tandoor-red/20 text-tandoor-platinum"
            />
          </div>
          {prices.delivery === prices.takeaway && (
            <p className="text-xs text-tandoor-platinum/60">
              Same as takeaway price
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onUpdateComplete}
          className="border-tandoor-red/20 text-tandoor-platinum hover:bg-tandoor-red/10"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-tandoor-red hover:bg-tandoor-red/90 text-white"
        >
          {isSubmitting ? "Saving..." : "Save Price Breakdown"}
        </Button>
      </div>
    </div>
  );
}
