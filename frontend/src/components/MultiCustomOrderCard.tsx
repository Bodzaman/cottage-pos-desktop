import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ChevronDown, ChevronUp, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { colors, globalColors } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';
import { MultiCustomGroup } from '../utils/multiCustomGrouping';
import { OptimizedImage } from 'components/OptimizedImage';

interface MultiCustomOrderCardProps {
  group: MultiCustomGroup;
  onViewDetails: (group: MultiCustomGroup) => void;
  onCustomizeItem?: (index: number, item: OrderItem) => void;
  onRemoveGroup: () => void;
  onUpdateQuantity?: (itemId: string, newQuantity: number) => void;
}

const formatCurrency = (amount: number): string => {
  return `£${amount.toFixed(2)}`;
};

export function MultiCustomOrderCard({ 
  group, 
  onViewDetails, 
  onCustomizeItem, 
  onRemoveGroup,
  onUpdateQuantity 
}: MultiCustomOrderCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate quantity controls for the group
  const handleDecreaseQuantity = () => {
    // For multi-custom groups, we need to adjust all items proportionally
    if (group.items.length > 0 && onUpdateQuantity) {
      group.items.forEach(item => {
        const newQuantity = Math.max(1, item.quantity - 1);
        onUpdateQuantity(item.id, newQuantity);
      });
    }
  };

  const handleIncreaseQuantity = () => {
    if (group.items.length > 0 && onUpdateQuantity) {
      group.items.forEach(item => {
        onUpdateQuantity(item.id, item.quantity + 1);
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      layout
      style={{
        background: `linear-gradient(145deg, #1e1e1e 0%, #222222 100%)`,
        backdropFilter: 'blur(8px)',
        border: `1px solid rgba(91, 33, 182, 0.3)`,
        boxShadow: `0 8px 16px rgba(91, 33, 182, 0.1)`,
        borderRadius: '0.5rem',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: `rgba(91, 33, 182, 0.05)`
      }}
      className="transition-all duration-300 hover:shadow-lg"
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Multi-Custom Badge - Now smaller and positioned like "NEW" badge */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`,
        color: '#FFF',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        padding: '0.1rem 0.5rem',
        borderBottomLeftRadius: '0.375rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
      }}>
        MULTI-CUSTOM
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {/* Item Thumbnail - Match individual item style */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden" style={{
                background: `linear-gradient(135deg, ${globalColors.purple.primaryTransparent}20 0%, ${globalColors.purple.primaryTransparent}10 100%)`,
                border: `1px solid ${globalColors.purple.primaryTransparent}30`
              }}>
                {group.image_url ? (
                  <OptimizedImage
                    fallbackUrl={group.image_url}
                    variant="thumbnail"
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils className="h-5 w-5" style={{ color: globalColors.purple.primary, opacity: 0.6 }} />
                  </div>
                )}
              </div>

              {/* Item Details - Match individual item style */}
              <div className="flex-1">
                <h4 className="font-medium" style={{ 
                  backgroundImage: `linear-gradient(to right, ${colors.text.primary}, ${colors.text.secondary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>{group.name}</h4>
                
                {/* Variant Information */}
                {group.variantName && (
                  <div className="text-sm mt-1" style={{ color: globalColors.purple.light }}>
                    {group.variantName}
                  </div>
                )}
                
                {/* Multi-custom description */}
                <div className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                  {group.items.length} portion{group.items.length > 1 ? 's' : ''} with individual customizations
                </div>
              </div>
            </div>
            
            {/* Price - Match individual item style */}
            <span className="font-semibold" style={{ 
              color: '#FFFFFF'
            }}>
              {formatCurrency(group.totalPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls - Match individual item pattern exactly */}
      <div className="flex items-center justify-between mt-3">
        {/* Quantity Controls - Left side, same style as individual items */}
        <div className="flex items-center overflow-hidden p-0.5 rounded-lg" 
          style={{ 
            background: `linear-gradient(145deg, ${colors.background.tertiary}80 0%, ${colors.background.secondary}80 100%)`,
            border: `1px solid rgba(255, 255, 255, 0.07)`,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(8px)'
          }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            style={{ 
              height: '1.75rem',
              width: '1.75rem',
              color: colors.text.primary,
              borderRadius: '0.375rem 0 0 0.375rem',
              borderRight: `1px solid rgba(255, 255, 255, 0.05)`
            }}
            className="flex items-center justify-center hover:bg-[rgba(0,0,0,0.2)] transition-colors duration-200"
            onClick={handleDecreaseQuantity}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.button>
          <span className="w-7 text-center font-medium" style={{ 
            backgroundImage: `linear-gradient(to right, ${colors.text.primary}, ${colors.text.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>{group.totalQuantity}</span>
          <motion.button
            whileTap={{ scale: 0.8 }}
            style={{ 
              height: '1.65rem',
              width: '1.75rem',
              color: colors.text.primary,
              borderRadius: '0 0.375rem 0.375rem 0',
              borderLeft: `1px solid rgba(255, 255, 255, 0.05)`
            }}
            className="flex items-center justify-center hover:bg-[rgba(0,0,0,0.2)] transition-colors duration-200"
            onClick={handleIncreaseQuantity}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </motion.button>
        </div>
        
        {/* Action Buttons - Right side, same style as individual items */}
        <div className="flex items-center space-x-2">
          {/* Customize Button - Replace "View Details" with customize button that opens modal */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onViewDetails(group)}
            style={{ 
              height: '1.65rem',
              width: '1.75rem',
              background: `linear-gradient(145deg, ${globalColors.purple.primaryTransparent}30 0%, ${globalColors.purple.primaryTransparent}80 100%)`,
              color: globalColors.purple.primary,
              borderRadius: '0.375rem',
              border: `1px solid ${globalColors.purple.primaryTransparent}30`,
              boxShadow: `0 2px 4px ${globalColors.purple.glow}15`,
              backdropFilter: 'blur(4px)'
            }}
            className="flex items-center justify-center transition-colors duration-200 hover:shadow-lg"
            title="View details and customize"
          >
            <Eye className="h-3.5 w-3.5" />
          </motion.button>
          
          {/* Remove Button - Same style as individual items */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onRemoveGroup}
            style={{ 
              height: '1.65rem',
              width: '1.75rem',
              background: `linear-gradient(145deg, ${colors.status.error}30 0%, ${colors.status.error}80 100%)`,
              color: colors.status.error,
              borderRadius: '0.375rem',
              border: `1px solid ${colors.status.error}30`,
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)',
              backdropFilter: 'blur(4px)'
            }}
            className="flex items-center justify-center transition-colors duration-200"
            title="Remove group"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
