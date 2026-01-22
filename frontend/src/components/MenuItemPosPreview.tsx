import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileVideo, AudioLines, BrainCircuit } from 'lucide-react';
import { Category, ProteinType } from '../utils/menuTypes';
import { OptimizedImage } from 'components/OptimizedImage';

interface Media {
  url: string | null;
  type: 'image' | 'video' | null;
}

interface MenuItemPosPreviewProps {
  formValues: any;
  primaryMedia: Media;
  categories: Category[];
  proteinTypes: ProteinType[];
}

export default function MenuItemPosPreview({ 
  formValues, 
  primaryMedia, 
  categories,
  proteinTypes 
}: MenuItemPosPreviewProps) {
  return (
    <div className="space-y-4">
      {/* POS Preview */}
      <div className="max-w-md mx-auto bg-[#18181B] rounded-lg overflow-hidden shadow-lg border border-[#27272A]">
        <div className="bg-[#27272A] px-4 py-2 flex justify-between items-center">
          <h4 className="font-medium text-white">{formValues.name || 'Untitled Item'}</h4>
          <Badge className="bg-[#2D323F] text-xs">
            {categories.find(c => c.id === formValues.category_id)?.name || 'Uncategorized'}
          </Badge>
        </div>
        
        <div className="p-4 grid grid-cols-12 gap-3">
          {/* Image thumbnail in POS (smaller) */}
          {primaryMedia.url && (
            <div className="col-span-3">
              <div className="relative rounded-md overflow-hidden" style={{ paddingBottom: '100%' }}>
                {primaryMedia.type === 'image' ? (
                  <OptimizedImage
                    fallbackUrl={primaryMedia.url}
                    variant="square"
                    alt={formValues.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black rounded-md">
                    <FileVideo className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Variant details */}
          <div className={`${primaryMedia.url ? 'col-span-9' : 'col-span-12'} space-y-3`}>
            <div className="space-y-2">
              {formValues.variants?.map((variant: any, index: number) => {
                // Get POS label (either variant name or protein type name)
                const variantLabel = variant.name || 
                  proteinTypes.find(p => p.id === variant.protein_type_id)?.name || 
                  'Standard';
                
                // POS displays both normal and dine-in prices if available
                const hasDineInPrice = variant.price_dine_in !== null && variant.price_dine_in !== undefined;
                
                return (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center py-2 px-3 rounded-md 
                      ${variant.is_default ? 'bg-[#2D323F]/60' : 'bg-[#1D1D1D]'} 
                      ${variant.is_default ? 'border-l-2 border-l-[#7C5DFA]' : ''}`}
                  >
                    <div>
                      <span className="text-sm font-medium text-white">{variantLabel}</span>
                      {variant.is_default && (
                        <Badge className="ml-2 bg-[#7C5DFA]/20 text-[#7C5DFA] text-xs">Default</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">£{variant.price?.toFixed(2) || '0.00'}</div>
                      {hasDineInPrice && (
                        <div className="text-xs text-[#7C5DFA]/80">In: £{variant.price_dine_in?.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* AI and Voice assistant indicators */}
            {(formValues.voice_description || formValues.voice_upsell_prompts) && (
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-[#2D323F] text-xs flex items-center gap-1">
                  <AudioLines className="h-3 w-3" />
                  Voice Ready
                </Badge>
                {formValues.ai_attributes && (
                  <Badge className="bg-[#2D323F] text-xs flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    AI Enhanced
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* POS Detail View Preview */}
      <div className="max-w-md mx-auto mt-4 bg-[#18181B] rounded-lg overflow-hidden shadow-lg border border-[#27272A]">
        <div className="bg-[#27272A] px-4 py-2">
          <h4 className="font-medium text-white">POS Details View</h4>
        </div>
        <div className="p-4 space-y-3">
          {/* Item Description - what staff see when they need details */}
          <div className="space-y-1">
            <h5 className="text-xs text-gray-400">Item Description</h5>
            <p className="text-sm text-white">
              {formValues.menu_item_description || 'No description available'}
            </p>
          </div>
          
          {/* Dietary Info */}
          {formValues.dietary_tags?.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs text-gray-400">Dietary Information</h5>
              <div className="flex flex-wrap gap-1">
                {formValues.dietary_tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-transparent border-gray-500 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Voice Assistant Information */}
          {formValues.voice_description && (
            <div className="space-y-1 bg-[#1D1D1D] p-2 rounded-md">
              <h5 className="text-xs text-[#7C5DFA] flex items-center gap-1">
                <AudioLines className="h-3 w-3" />
                Voice Assistant Script
              </h5>
              <p className="text-xs text-gray-300 italic">
                "{formValues.voice_description}"
              </p>
              {formValues.voice_upsell_prompts && (
                <div className="mt-2">
                  <h6 className="text-xs text-[#7C5DFA]">Upsell Suggestions</h6>
                  <p className="text-xs text-gray-300 italic">
                    "{formValues.voice_upsell_prompts}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
