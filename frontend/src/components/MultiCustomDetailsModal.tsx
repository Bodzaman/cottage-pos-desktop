


import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wrench, Trash2, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';
import { MultiCustomGroup, generatePortionVariantName, calculateCustomizationCost, getBasePrice } from '../utils/multiCustomGrouping';
import { colors } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';

interface MultiCustomDetailsModalProps {
  isOpen: boolean;
  group: MultiCustomGroup | null;
  onClose: () => void;
  onEditPortion: (portionIndex: number, item: OrderItem) => void;
  triggerElement?: HTMLElement;
}

const formatCurrency = (amount: number): string => {
  return `£${amount.toFixed(2)}`;
};

export function MultiCustomDetailsModal({
  isOpen,
  group,
  onClose,
  onEditPortion,
  triggerElement
}: MultiCustomDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !group) return null;

  // Add safety check for group.items
  if (!group.items || !Array.isArray(group.items)) {
    console.error('MultiCustomDetailsModal: group.items is not a valid array', group);
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        {/* Modal */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            background: 'linear-gradient(145deg, rgba(18, 18, 18, 0.98), rgba(26, 26, 26, 0.98))',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${globalColors.purple.primaryTransparent}40`,
            borderRadius: '0.75rem',
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px ${globalColors.purple.glow}20`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          className="text-white"
        >
          {/* Header */}
          <div className="border-b" style={{
            background: `linear-gradient(135deg, ${globalColors.purple.primary}20 0%, ${globalColors.purple.dark}20 100%)`,
            borderBottomColor: `${globalColors.purple.primaryTransparent}30`,
            padding: '1.25rem',
            flexShrink: 0
          }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-xl text-white">
                  {group.name} Details - {group.items.length} portion{group.items.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm mt-1" style={{ color: globalColors.purple.light }}>
                  {group.variantName} • Total: {formatCurrency(group.totalPrice)}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  background: `${colors.status.error}20`,
                  color: colors.status.error,
                  border: `1px solid ${colors.status.error}30`,
                  borderRadius: '0.375rem',
                  width: '2.5rem',
                  height: '2.5rem'
                }}
                className="flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Portions List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem'
          }}>
            <div className="space-y-4">
              {group.items.map((item, index) => {
                const variantName = generatePortionVariantName(group.name, group.variantName, index);
                const basePrice = getBasePrice(item);
                const customizationCost = calculateCustomizationCost(item);
                const hasCustomizations = (item.customizations && item.customizations.length > 0) || 
                                        (item.modifiers && item.modifiers.length > 0);
                const hasNotes = item.notes && item.notes.trim();

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.8), rgba(34, 34, 34, 0.8))',
                      border: `1px solid ${globalColors.purple.primaryTransparent}20`,
                      borderRadius: '0.5rem',
                      padding: '1rem'
                    }}
                  >
                    {/* Item Header with Edit Button */}
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-lg text-white">
                        {variantName}
                      </h4>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEditPortion(index, item)}
                        style={{
                          background: `linear-gradient(145deg, rgba(91, 33, 182, 0.3) 0%, rgba(91, 33, 182, 0.5) 100%)`,
                          color: globalColors.purple.primary,
                          borderRadius: '0.375rem',
                          border: `1px solid rgba(91, 33, 182, 0.4)`,
                          padding: '0.5rem',
                          minWidth: '2.5rem',
                          height: '2.5rem'
                        }}
                        className="flex items-center justify-center transition-all duration-200 hover:shadow-lg"
                        title="Edit this portion"
                      >
                        <Wrench className="h-4 w-4" />
                      </motion.button>
                    </div>

                    {/* Customizations Display */}
                    {hasCustomizations && (
                      <div className="mb-3 space-y-2">
                        {/* Custom Modifiers */}
                        {item.customizations && item.customizations.length > 0 && (
                          <div>
                            {item.customizations.map((customization, idx) => (
                              <div key={idx} className="flex justify-between text-sm mb-1">
                                <span className="flex items-center" style={{ color: colors.text.secondary }}>
                                  <span className="mr-2">•</span>
                                  {customization.name}
                                </span>
                                {customization.price_adjustment && customization.price_adjustment > 0 && (
                                  <span style={{ color: globalColors.purple.primary }}>+{formatCurrency(customization.price_adjustment)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Standard Modifiers */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div>
                            {item.modifiers.map((group, groupIdx) => (
                              <div key={groupIdx} className="mb-2">
                                {group.options.map((option, optionIdx) => (
                                  <div key={optionIdx} className="flex justify-between text-sm mb-1">
                                    <span className="flex items-center" style={{ color: colors.text.secondary }}>
                                      <span className="mr-2">•</span>
                                      {option.name}
                                    </span>
                                    {option.price > 0 && (
                                      <span style={{ color: globalColors.purple.primary }}>+{formatCurrency(option.price)}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {hasNotes && (
                      <div className="mb-3">
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium" style={{ color: globalColors.purple.light }}>
                            Note:
                          </span>
                        </div>
                        <p className="text-sm italic" style={{ 
                          color: colors.text.secondary,
                          background: `${globalColors.purple.primaryTransparent}10`,
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          border: `1px solid ${globalColors.purple.primaryTransparent}20`
                        }}>
                          "{item.notes.trim()}"
                        </p>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div style={{
                      borderTop: `1px solid ${globalColors.purple.primaryTransparent}20`,
                      paddingTop: '0.75rem'
                    }}>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span style={{ color: colors.text.secondary }}>Base:</span>
                          <span style={{ color: colors.text.primary }}>{formatCurrency(basePrice)}</span>
                        </div>
                        {customizationCost > 0 && (
                          <div className="flex justify-between text-sm">
                            <span style={{ color: colors.text.secondary }}>Customizations:</span>
                            <span style={{ color: globalColors.purple.primary }}>+{formatCurrency(customizationCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold" style={{
                          borderTop: `1px solid ${globalColors.purple.primaryTransparent}20`,
                          paddingTop: '0.5rem',
                          marginTop: '0.5rem'
                        }}>
                          <span style={{ color: colors.text.primary }}>Total:</span>
                          <span style={{ color: globalColors.purple.primary }}>{formatCurrency(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
