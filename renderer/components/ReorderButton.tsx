import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { useCartStore } from '../utils/cartStore';
import { ReorderConfirmationModal } from './ReorderConfirmationModal';
import {
  ReorderValidationRequest,
  ReorderValidationResponse,
  ValidationResult,
  OrderItemForReorder
} from '../utils/reorderTypes';

interface ReorderButtonProps {
  orderId: string;
  orderItems: OrderItemForReorder[];
  orderType?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

export function ReorderButton({
  orderId,
  orderItems,
  orderType = 'takeaway',
  className = '',
  variant = 'default',
  size = 'default',
  showText = true
}: ReorderButtonProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationData, setValidationData] = useState<ReorderValidationResponse | null>(null);
  const { addItem } = useCartStore();

  const handleReorderClick = async () => {
    if (orderItems.length === 0) {
      toast.error('No items to reorder');
      return;
    }

    setIsValidating(true);
    
    try {
      // Prepare validation request
      const validationRequest: ReorderValidationRequest = {
        order_id: orderId,
        items: orderItems.map(item => ({
          item_id: item.item_id,
          name: item.name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          original_price: item.price,
          notes: item.notes
        }))
      };

      // Call validation API
      const response = await apiClient.validate_reorder(validationRequest);
      const data: ReorderValidationResponse = await response.json();

      if (!data.success) {
        toast.error(`Validation failed: ${data.message}`);
        return;
      }

      setValidationData(data);

      // If all items are available with no changes, add directly to cart
      if (data.unavailable_items === 0 && data.price_changed_items === 0) {
        await addValidatedItemsToCart(data.validation_results);
        toast.success(`Added ${data.available_items} items to cart`);
      } else {
        // Show confirmation modal for changes
        setShowConfirmation(true);
      }

    } catch (error) {
      console.error('Error validating reorder:', error);
      toast.error('Failed to validate order items. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const addValidatedItemsToCart = async (validItems: ValidationResult[]) => {
    try {
      let addedCount = 0;
      let failedCount = 0;

      for (const item of validItems) {
        try {
          // Only add items that are available or have price changes
          if (item.status === 'available' || item.status === 'price_changed' || item.status === 'variant_unavailable') {
            const currentPrice = item.current_price || item.original_price;
            
            // Create menu item and variant objects for cart
            const menuItem = {
              id: item.matched_item_id || item.item_id,
              name: item.name,
              image_url: null
            };

            const variant = {
              id: item.matched_variant_id || item.variant_id || `${item.item_id}-default`,
              name: item.variant_name || '',
              price: currentPrice
            };

            addItem(menuItem, variant, item.quantity, item.notes || '');
            addedCount++;
          }
        } catch (itemError) {
          console.error(`Error adding item ${item.name}:`, itemError);
          failedCount++;
        }
      }

      if (addedCount > 0) {
        toast.success(`Added ${addedCount} item${addedCount !== 1 ? 's' : ''} to cart`);
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to add ${failedCount} item${failedCount !== 1 ? 's' : ''}`);
      }

    } catch (error) {
      console.error('Error adding items to cart:', error);
      toast.error('Failed to add items to cart');
    }
  };

  const handleConfirmReorder = async (validItems: ValidationResult[]) => {
    setShowConfirmation(false);
    await addValidatedItemsToCart(validItems);
  };

  const handleCloseModal = () => {
    setShowConfirmation(false);
    setValidationData(null);
  };

  return (
    <>
      <Button
        onClick={handleReorderClick}
        disabled={isValidating || orderItems.length === 0}
        variant={variant}
        size={size}
        className={`${className} ${variant === 'default' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
      >
        {isValidating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )}
        {showText && (
          <span className="ml-2">
            {isValidating ? 'Validating...' : 'Order Again'}
          </span>
        )}
      </Button>

      <ReorderConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCloseModal}
        onConfirm={handleConfirmReorder}
        validationData={validationData}
        isLoading={isValidating}
      />
    </>
  );
}
