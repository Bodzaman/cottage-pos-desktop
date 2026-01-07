/**
 * EnrichedOrderItemCard - Rich menu item display for Review Modal
 * 
 * Displays dine-in order items with:
 * - High-quality menu images (128px × 128px)
 * - Complete item metadata (name, description, price, variant, protein)
 * - Dietary badges (vegetarian, vegan, gluten-free)
 * - Customizations display
 * - CRUD controls (quantity, delete, customize, assign to tab)
 * - Status indicators (pending/sent to kitchen)
 * 
 * Data Source: EnrichedDineInOrderItem from /dine-in-enriched/orders/{id}/enriched-items
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  Users,
  Cog,
  Utensils,
  Leaf,
  Cookie,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QSAITheme } from 'utils/QSAIDesign';
import type { EnrichedDineInOrderItem } from 'types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CustomerTab {
  id: string;
  tab_name: string;
  status: 'active' | 'paid' | 'closed';
}

interface EnrichedOrderItemCardProps {
  item: EnrichedDineInOrderItem;
  customerTabs: CustomerTab[];
  currentCustomerTabId: string | null;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onDeleteItem: (itemId: string) => void;
  onCustomizeItem: (item: EnrichedDineInOrderItem) => void;
  onAssignItemToTab: (itemId: string, customerTabId: string | null) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EnrichedOrderItemCard({
  item,
  customerTabs,
  currentCustomerTabId,
  onUpdateQuantity,
  onDeleteItem,
  onCustomizeItem,
  onAssignItemToTab,
}: EnrichedOrderItemCardProps) {
  const [isReassigning, setIsReassigning] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Lazy load image with IntersectionObserver
  useEffect(() => {
    if (!imageRef.current || !item.image_url) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoadImage(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' } // Load 50px before entering viewport
    );

    observer.observe(imageRef.current);

    return () => observer.disconnect();
  }, [item.image_url]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAssignToTab = (tabId: string | null) => {
    setIsReassigning(true);
    onAssignItemToTab(item.id, tabId);
    setIsDropdownOpen(false);
    // Reset animation after 800ms
    setTimeout(() => setIsReassigning(false), 800);
  };

  const handleConfirmDelete = () => {
    onDeleteItem(item.id);
    setShowDeleteDialog(false);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Get current assignment display name
  const currentAssignmentName = currentCustomerTabId
    ? customerTabs.find((tab) => tab.id === currentCustomerTabId)?.tab_name || 'Unknown'
    : 'Table-level';

  // Check if item is sent to kitchen
  const isSentToKitchen = item.status === 'SENT_TO_KITCHEN' || !!item.sent_to_kitchen_at;

  // Collect dietary badges
  const dietaryBadges = [
    item.is_vegetarian && { icon: Leaf, label: 'Veg', color: '#22C55E' },
    item.is_vegan && { icon: Leaf, label: 'Vegan', color: '#10B981' },
    item.is_gluten_free && { icon: Cookie, label: 'GF', color: '#F59E0B' },
  ].filter(Boolean);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      className="rounded-lg relative overflow-hidden"
      style={{
        background: QSAITheme.background.tertiary,
        border: `1px solid ${
          isReassigning ? QSAITheme.purple.primary : QSAITheme.border.medium
        }`,
      }}
      animate={{
        scale: isReassigning ? [1, 1.02, 1] : 1,
        borderColor: isReassigning
          ? [QSAITheme.border.medium, QSAITheme.purple.primary, QSAITheme.border.medium]
          : QSAITheme.border.medium,
      }}
      whileHover={{
        scale: 1.01,
        boxShadow: '0 8px 24px -4px rgba(124, 58, 237, 0.15), 0 0 0 1px rgba(124, 58, 237, 0.1)',
        borderColor: QSAITheme.purple.light,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Status Badge - Color coded: Pending (orange), Sent (blue), Completed (green) */}
      {isSentToKitchen && (
        <div
          className="absolute top-2 right-2 z-10 px-2.5 py-1 rounded-md text-xs font-semibold"
          style={{
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#3B82F6',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            boxShadow: '0 2px 8px -2px rgba(59, 130, 246, 0.3)',
          }}
        >
          ✓ Sent to Kitchen
        </div>
      )}
      {!isSentToKitchen && (
        <div
          className="absolute top-2 right-2 z-10 px-2.5 py-1 rounded-md text-xs font-semibold"
          style={{
            background: 'rgba(249, 115, 22, 0.15)',
            color: '#F97316',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            boxShadow: '0 2px 8px -2px rgba(249, 115, 22, 0.3)',
          }}
        >
          ⏱ Pending
        </div>
      )}

      {/* Card Content */}
      <div className="p-4">
        {/* Header Row: Image + Details + Delete */}
        <div className="flex items-start gap-3 mb-3">
          {/* Menu Image */}
          <div
            className="w-32 h-32 rounded-md overflow-hidden flex-shrink-0"
            style={{
              border: `1px solid ${QSAITheme.border.medium}`,
              backgroundColor: QSAITheme.background.secondary,
            }}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.item_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: QSAITheme.background.secondary }}
              >
                <Utensils
                  className="h-12 w-12"
                  style={{ color: QSAITheme.text.muted }}
                />
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            {/* Item Name */}
            <h4
              className="text-base font-semibold mb-1 line-clamp-2"
              style={{ color: QSAITheme.text.primary }}
            >
              {item.item_name}
            </h4>

            {/* Description (if available) */}
            {item.item_description && (
              <p
                className="text-xs mb-2 line-clamp-2"
                style={{ color: QSAITheme.text.muted }}
              >
                {item.item_description}
              </p>
            )}

            {/* Badges Row: Variant, Protein, Category, Dietary */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Variant Badge */}
              {item.variant_name && (
                <span
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{
                    backgroundColor: QSAITheme.purple.primaryTransparent,
                    color: QSAITheme.text.secondary,
                  }}
                >
                  {item.variant_name}
                </span>
              )}

              {/* Protein Type Badge */}
              {item.protein_type_name && (
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: QSAITheme.background.secondary,
                    color: QSAITheme.text.muted,
                  }}
                >
                  {item.protein_type_name}
                </span>
              )}

              {/* Category Badge */}
              {item.category_name && (
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: QSAITheme.text.muted,
                  }}
                >
                  {item.category_name}
                </span>
              )}

              {/* Dietary Badges */}
              {dietaryBadges.map((badge: any, idx) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                    style={{
                      backgroundColor: `${badge.color}15`,
                      color: badge.color,
                      border: `1px solid ${badge.color}30`,
                    }}
                  >
                    <Icon className="h-3 w-3" />
                    {badge.label}
                  </span>
                );
              })}
            </div>

            {/* Spice Level (if available) */}
            {item.spice_level && item.spice_level > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs" style={{ color: QSAITheme.text.muted }}>
                  Spice:
                </span>
                {Array.from({ length: item.spice_level }).map((_, idx) => (
                  <span key={idx} className="text-red-500 text-xs">
                    🌶️
                  </span>
                ))}
              </div>
            )}

            {/* Unit Price */}
            <p className="text-sm font-medium" style={{ color: QSAITheme.text.muted }}>
              £{item.unit_price.toFixed(2)} each
            </p>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 w-8 rounded-lg transition-all flex items-center justify-center flex-shrink-0"
            style={{ 
              color: '#EF4444',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Customizations List */}
        {item.customizations && item.customizations.length > 0 && (
          <div
            className="mb-3 p-2 rounded-md"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${QSAITheme.border.light}`,
            }}
          >
            <p
              className="text-xs font-medium mb-1"
              style={{ color: QSAITheme.text.muted }}
            >
              Customizations:
            </p>
            <div className="space-y-0.5">
              {item.customizations.map((customization: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span style={{ color: QSAITheme.text.secondary }}>
                    {customization.name}
                  </span>
                  {customization.price_adjustment > 0 && (
                    <span style={{ color: QSAITheme.text.secondary }}>
                      +£{customization.price_adjustment.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes (if available) */}
        {item.notes && (
          <div
            className="mb-3 p-2 rounded-md"
            style={{
              background: 'rgba(249, 115, 22, 0.1)',
              border: `1px solid rgba(249, 115, 22, 0.3)`,
            }}
          >
            <p className="text-xs" style={{ color: '#F97316' }}>
              Note: {item.notes}
            </p>
          </div>
        )}

        {/* Bottom Row: Quantity Controls, Customize, Assign, Total */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="h-7 w-7 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                border: `1px solid ${QSAITheme.border.medium}`,
                color: QSAITheme.text.primary,
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (item.quantity > 1) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = QSAITheme.purple.light;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = QSAITheme.border.medium;
              }}
            >
              <Minus className="h-3 w-3" />
            </button>

            <span
              className="mx-2 text-sm font-medium min-w-[28px] text-center"
              style={{ color: QSAITheme.text.primary }}
            >
              {item.quantity}
            </span>

            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="h-7 w-7 rounded flex items-center justify-center transition-all"
              style={{
                border: `1px solid ${QSAITheme.border.medium}`,
                color: QSAITheme.text.primary,
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = QSAITheme.purple.light;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = QSAITheme.border.medium;
              }}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Customize Button */}
          <button
            onClick={() => onCustomizeItem(item)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5"
            style={{
              border: `1px solid ${QSAITheme.purple.primary}`,
              color: QSAITheme.text.primary,
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = QSAITheme.purple.primaryTransparent;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(124, 58, 237, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Cog className="h-3.5 w-3.5" />
            Custom
          </button>

          {/* Customer Tab Assignment Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3 py-1.5 rounded text-xs font-medium hover:bg-white/5 transition-all flex items-center gap-1.5 min-w-[140px] justify-between"
              style={{
                border: `1px solid ${QSAITheme.border.accent}`,
                color: currentCustomerTabId ? '#3B82F6' : QSAITheme.text.muted,
              }}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="flex-1 text-left truncate">
                {currentAssignmentName}
              </span>
              <ChevronDown
                className="h-3 w-3 transition-transform"
                style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full right-0 mb-1 rounded-lg shadow-2xl z-50 min-w-[180px]"
                  style={{
                    background: QSAITheme.background.panel,
                    border: `1px solid ${QSAITheme.border.accent}`,
                  }}
                >
                  <div className="p-1.5 space-y-0.5">
                    {/* Table-level option */}
                    <button
                      onClick={() => handleAssignToTab(null)}
                      className="w-full px-3 py-2 rounded text-left text-xs hover:bg-white/5 transition-colors"
                      style={{
                        color: !currentCustomerTabId
                          ? QSAITheme.text.primary
                          : QSAITheme.text.muted,
                        fontWeight: !currentCustomerTabId ? 600 : 400,
                      }}
                    >
                      Table-level (shared)
                    </button>

                    {/* Divider */}
                    {customerTabs.length > 0 && (
                      <div
                        className="h-px"
                        style={{ background: QSAITheme.border.light }}
                      />
                    )}

                    {/* Customer tab options */}
                    {customerTabs
                      .filter((tab) => tab.status === 'active')
                      .map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => handleAssignToTab(tab.id)}
                          className="w-full px-3 py-2 rounded text-left text-xs hover:bg-white/5 transition-colors"
                          style={{
                            color:
                              currentCustomerTabId === tab.id
                                ? '#3B82F6'
                                : QSAITheme.text.muted,
                            fontWeight: currentCustomerTabId === tab.id ? 600 : 400,
                          }}
                        >
                          {tab.tab_name}
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Item Total */}
          <div className="text-right flex-shrink-0">
            <p
              className="text-base font-bold"
              style={{ color: QSAITheme.text.primary }}
            >
              £{item.line_total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent
          style={{
            background: QSAITheme.background.panel,
            border: `1px solid ${QSAITheme.border.accent}`,
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{ color: QSAITheme.text.primary }}
            >
              Delete {item.item_name}?
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{ color: QSAITheme.text.muted }}
            >
              This will remove this item from the order. This action cannot be undone.
              {item.quantity > 1 && (
                <span className="block mt-2 font-medium" style={{ color: QSAITheme.text.secondary }}>
                  Quantity: {item.quantity} × £{item.unit_price.toFixed(2)} = £{item.line_total.toFixed(2)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                border: `1px solid ${QSAITheme.border.medium}`,
                color: QSAITheme.text.secondary,
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
              }}
              className="hover:bg-red-600"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
