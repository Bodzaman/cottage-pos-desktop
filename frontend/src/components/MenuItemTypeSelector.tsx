import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, FileText } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';

interface Props {
  open: boolean;
  onSelect: (itemType: 'single' | 'variants') => void;
}

export default function MenuItemTypeSelector({ open, onSelect }: Props) {
  return (
    <Dialog open={open} modal>
      <DialogContent 
        className="max-w-2xl"
        style={{
          backgroundColor: '#1E1E1E',
          border: '1px solid rgba(91, 33, 182, 0.2)'
        }}
        // Prevent closing by clicking outside or pressing Escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-2xl font-bold"
            style={{ color: globalColors.text.primary }}
          >
            Choose Menu Item Structure
          </DialogTitle>
          <DialogDescription style={{ color: globalColors.text.secondary }}>
            Select how you want to structure this menu item. This choice will be locked once made.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Single Item Option */}
          <button
            onClick={() => onSelect('single')}
            className="p-6 rounded-lg border-2 transition-all duration-200 hover:scale-105 text-left group"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(91, 33, 182, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(91, 33, 182, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
              >
                <FileText className="w-8 h-8 text-green-400" />
              </div>
              
              <div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: globalColors.text.primary }}
                >
                  Single Item
                </h3>
                <p 
                  className="text-sm mb-3"
                  style={{ color: globalColors.text.secondary }}
                >
                  One fixed item with standard pricing across all order types (dine-in, takeaway, delivery)
                </p>
              </div>

              <div className="space-y-2 w-full">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-green-400">✓</span>
                  <span style={{ color: globalColors.text.secondary }}>Simple setup</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-green-400">✓</span>
                  <span style={{ color: globalColors.text.secondary }}>Quick to configure</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-green-400">✓</span>
                  <span style={{ color: globalColors.text.secondary }}>Perfect for fixed menu items</span>
                </div>
              </div>

              <div 
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: '#22C55E'
                }}
              >
                Best for most items
              </div>
            </div>
          </button>

          {/* Variants Option */}
          <button
            onClick={() => onSelect('variants')}
            className="p-6 rounded-lg border-2 transition-all duration-200 hover:scale-105 text-left group"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(91, 33, 182, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(91, 33, 182, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(147, 51, 234, 0.2)' }}
              >
                <Package className="w-8 h-8 text-purple-400" />
              </div>
              
              <div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: globalColors.text.primary }}
                >
                  Item with Variants
                </h3>
                <p 
                  className="text-sm mb-3"
                  style={{ color: globalColors.text.secondary }}
                >
                  Multiple options like different proteins, sizes, or preparations with individual pricing
                </p>
              </div>

              <div className="space-y-2 w-full">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-purple-400">✓</span>
                  <span style={{ color: globalColors.text.secondary }}>Protein variations (Chicken, Lamb, etc.)</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-purple-400">✓</span>
                  <span style={{ color: globalColors.text.secondary }}>Individual variant pricing</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-purple-400">✓</span>
                  <span style={{ color: globalColors.text.secondary }}>Flexible customization</span>
                </div>
              </div>

              <div 
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(147, 51, 234, 0.2)',
                  color: '#A78BFA'
                }}
              >
                For curry dishes & variations
              </div>
            </div>
          </button>
        </div>

        <div 
          className="mt-6 p-4 rounded-lg border"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.2)'
          }}
        >
          <p className="text-sm" style={{ color: globalColors.text.secondary }}>
            <strong style={{ color: globalColors.text.primary }}>Note:</strong> Once you make a selection, the item structure will be locked for this item. Choose carefully!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
