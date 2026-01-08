import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, AlertTriangle, Utensils } from 'lucide-react';
import { PremiumTheme } from '../utils/premiumTheme';
import { CartItem } from '../utils/cartStore';
import { MenuItem } from 'utils/menuTypes';
import { sortCartItemsByCategory } from '../utils/cartSorting';

interface CartRecoveryDialogProps {
  isOpen: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  cartPreview: {
    itemsCount: number;
    totalValue: number;
    items: CartItem[];
    savedDate: string;
    isStale: boolean; // > 7 days old
    hasPriceChanges: boolean;
  };
  menuItems?: MenuItem[]; // NEW: Optional menu data for category sorting
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

// Generic variant names that should be hidden (no useful info)
const GENERIC_VARIANTS = ['standard', 'regular', 'default', 'normal'];

// Helper to extract meaningful variant info (same as CartContent)
const getVariantDisplayName = (itemName: string, variantName?: string): string | null => {
  if (!variantName) return null;
  
  // Remove redundant item name from variant
  const cleanVariant = variantName.replace(itemName, '').trim();
  
  // Filter out generic variants (matches template_variables API pattern)
  if (GENERIC_VARIANTS.includes(cleanVariant.toLowerCase())) {
    return null;
  }
  
  // Check for quantity patterns like "x 4" or "x4"
  const quantityMatch = cleanVariant.match(/x\s*(\d+)/);
  if (quantityMatch) {
    return `${quantityMatch[1]} Pieces`;
  }
  
  // If variant is same as item name or empty after cleaning, return null
  if (!cleanVariant || cleanVariant.toLowerCase() === itemName.toLowerCase()) {
    return null;
  }
  
  return cleanVariant;
};

const getTimeSince = (dateString: string): string => {
  const saved = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - saved.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'just now';
};

export function CartRecoveryDialog({
  isOpen,
  onRestore,
  onDiscard,
  cartPreview,
  menuItems // NEW: Receive menuItems prop
}: CartRecoveryDialogProps) {
  const timeSince = getTimeSince(cartPreview.savedDate);
  
  // ✅ NEW: Sort cart items by category hierarchy
  const sortedItems = sortCartItemsByCategory(cartPreview.items, menuItems);
  
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent
        className="border-0"
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          color: PremiumTheme.colors.text.primary,
          border: `1px solid ${PremiumTheme.colors.border.light}`
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl" style={{ color: PremiumTheme.colors.text.primary }}>
            <ShoppingCart className="h-6 w-6" style={{ color: PremiumTheme.colors.silver[400] }} />
            {cartPreview.isStale ? 'Old Cart Found' : 'Continue Where You Left Off?'}
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: PremiumTheme.colors.text.muted }}>
            {cartPreview.isStale ? (
              <span>We found a cart from {timeSince}. Some items may no longer be available.</span>
            ) : (
              <span>You have items from your last visit ({timeSince}). Would you like to restore your cart?</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Cart Preview */}
        <div 
          className="my-4 p-4 rounded-lg border"
          style={{
            backgroundColor: PremiumTheme.colors.dark[800],
            borderColor: PremiumTheme.colors.border.medium
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: PremiumTheme.colors.text.primary }}>
              {cartPreview.itemsCount} {cartPreview.itemsCount === 1 ? 'item' : 'items'}
            </span>
            <span className="text-lg font-bold" style={{ color: PremiumTheme.colors.silver[400] }}>
              {formatPrice(cartPreview.totalValue)}
            </span>
          </div>
          
          {/* Item List Preview */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sortedItems.slice(0, 5).map((item, idx) => {
              // ✅ FIX #12: Read variant_name from database field first, then fallback to variant object
              const variantName = item.variant_name || item.variant?.variant_name || item.variant?.name;
              const displayVariant = getVariantDisplayName(item.name || '', variantName);
              const customizationsArray = Array.isArray(item.customizations) ? item.customizations : [];
              const hasExtras = customizationsArray.length > 0 || !!item.notes;
              
              // Proper display logic (matches CartContent.tsx):
              // - Multi-variant items (meaningful variant) → show variant name (e.g., "Chicken Shashlick (dry)")
              // - Single items (no variant or generic) → show base name (e.g., "LENTIL SOUP")
              const isGenericVariant = !variantName || variantName.toLowerCase() === 'standard';
              const primaryDisplayName = isGenericVariant ? item.name : variantName;
              
              // ✅ FIXED: Resolve variant image using correct hierarchy (matches CartContent/CheckoutView/OrderSummaryPanel)
              // Priority: display_image_url (backend-resolved) → image_url (raw) → item fallback
              const imageUrl = item.variant?.display_image_url || item.variant?.image_url || item.image_url;
              
              return (
                <div key={idx} className="text-sm">
                  {/* Main item line with thumbnail and variant */}
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div 
                      className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative"
                      style={{
                        border: `1px solid ${PremiumTheme.colors.silver[400]}40`,
                        boxShadow: `0 0 8px ${PremiumTheme.colors.silver[400]}20`
                      }}
                    >
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // On error, hide image and show placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      {/* Fallback placeholder - show if no image or if image fails */}
                      <div 
                        className="w-full h-full flex items-center justify-center rounded-lg"
                        style={{ 
                          backgroundColor: PremiumTheme.colors.dark[700],
                          display: imageUrl ? 'none' : 'flex'
                        }}
                      >
                        <Utensils className="h-5 w-5" style={{ color: PremiumTheme.colors.text.muted }} />
                      </div>
                    </div>
                    
                    {/* Item details and price */}
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {/* Dot indicator for items with extras */}
                          {hasExtras && (
                            <span 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: PremiumTheme.colors.burgundy[400] }}
                            />
                          )}
                          <span style={{ color: PremiumTheme.colors.text.muted }}>
                            {item.quantity}x {primaryDisplayName}
                          </span>
                        </div>
                        
                        {/* Customizations */}
                        {customizationsArray.length > 0 && (
                          <div className="ml-3 mt-0.5 space-y-0.5">
                            {customizationsArray.map((customization, cIdx) => (
                              <div 
                                key={cIdx}
                                className="text-xs flex items-center gap-1"
                                style={{ color: PremiumTheme.colors.text.muted }}
                              >
                                <span>•</span>
                                <span>{customization.name}</span>
                                {customization.price > 0 && (
                                  <span style={{ color: PremiumTheme.colors.gold[500] }}>
                                    +{formatPrice(customization.price)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Notes */}
                        {item.notes && (
                          <div className="ml-3 mt-0.5">
                            <span 
                              className="text-xs italic"
                              style={{ color: PremiumTheme.colors.text.muted }}
                            >
                              "{item.notes.length > 30 ? item.notes.substring(0, 30) + '...' : item.notes}"
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Price */}
                      <span 
                        className="font-medium flex-shrink-0" 
                        style={{ color: PremiumTheme.colors.text.primary }}
                      >
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedItems.length > 5 && (
              <div className="text-xs text-center pt-1" style={{ color: PremiumTheme.colors.text.muted }}>
                +{sortedItems.length - 5} more item{sortedItems.length - 5 > 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {/* Warnings */}
          {(cartPreview.isStale || cartPreview.hasPriceChanges) && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: PremiumTheme.colors.border.light }}>
              {cartPreview.isStale && (
                <Badge 
                  variant="secondary"
                  className="flex items-center gap-1 w-fit mb-2"
                  style={{
                    backgroundColor: PremiumTheme.colors.gold[500] + '30',
                    color: PremiumTheme.colors.gold[500],
                    border: `1px solid ${PremiumTheme.colors.gold[500]}60`
                  }}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Cart is over 7 days old
                </Badge>
              )}
              {cartPreview.hasPriceChanges && (
                <Badge 
                  variant="secondary"
                  className="flex items-center gap-1 w-fit"
                  style={{
                    backgroundColor: PremiumTheme.colors.silver[400] + '20',
                    color: PremiumTheme.colors.silver[400],
                    border: `1px solid ${PremiumTheme.colors.silver[400]}40`
                  }}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Prices may have changed
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onDiscard}
            className="border-gray-600 hover:bg-gray-700"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onRestore}
            style={{
              background: `linear-gradient(135deg, ${PremiumTheme.colors.silver[500]} 0%, ${PremiumTheme.colors.silver[600]} 100%)`,
              color: PremiumTheme.colors.dark[900],
              border: 'none'
            }}
          >
            Restore Cart
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
