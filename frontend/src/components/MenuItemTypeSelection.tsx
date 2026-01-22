import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UtensilsCrossed, Wine, Coffee, ArrowLeft, ChevronRight } from 'lucide-react';
import { colors } from 'utils/designSystem';
import { Button } from '@/components/ui/button';
import { PricingModeSelector } from './PricingModeSelector';
import { PricingMode } from 'utils/menuItemConfiguration';

interface MenuItemTypeSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'food' | 'drinks_wine' | 'coffee_desserts', pricingMode: 'single' | 'variants') => void;
}

const MenuItemTypeSelection: React.FC<MenuItemTypeSelectionProps> = ({
  isOpen,
  onClose,
  onSelectType
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<'food' | 'drinks_wine' | 'coffee_desserts' | null>(null);
  const [selectedPricingMode, setSelectedPricingMode] = useState<PricingMode | null>(null);

  // Reset wizard when dialog closes
  const handleClose = () => {
    setWizardStep(1);
    setSelectedType(null);
    onClose();
  };

  // Step 1: Handle item type selection
  const handleTypeClick = (type: 'food' | 'drinks_wine' | 'coffee_desserts') => {
    setSelectedType(type);
    setSelectedPricingMode(null); // Reset pricing mode when changing type
    setWizardStep(2);
  };

  // Step 2: Handle pricing mode selection
  const handlePricingModeSelect = (pricingMode: 'single' | 'variants') => {
    setSelectedPricingMode(pricingMode);
  };

  // Handle continue from Step 2
  const handleContinue = () => {
    if (selectedType && selectedPricingMode) {
      onSelectType(selectedType, selectedPricingMode);
      handleClose();
    }
  };

  // Go back to step 1
  const handleBackToStep1 = () => {
    setWizardStep(1);
    setSelectedPricingMode(null);
  };

  const itemTypes = [
    {
      id: 'food',
      title: 'Create Food Item',
      description: 'Starters, main courses, side dishes & accompaniments',
      icon: UtensilsCrossed,
      examples: ['Chicken Tikka Masala', 'Lamb Biryani', 'Garlic Naan', 'Poppadums'],
      color: colors.brand.purple,
      gradient: 'from-[#7C5DFA] to-[#9277FF]'
    },
    {
      id: 'drinks_wine',
      title: 'Create Drinks & Wine Item',
      description: 'Soft drinks, juices, beers, wines & spirits',
      icon: Wine,
      examples: ['Mango Lassi', 'Cobra Beer', 'House Red Wine', 'Mineral Water'],
      color: colors.brand.turquoise,
      gradient: 'from-[#0EBAB1] to-[#14D4CB]'
    },
    {
      id: 'coffee_desserts',
      title: 'Create Coffee & Desserts Item',
      description: 'Hot beverages, cold desserts & sweet treats',
      icon: Coffee,
      examples: ['Masala Chai', 'Gulab Jamun', 'Kulfi Ice Cream', 'Cappuccino'],
      color: colors.brand.silver,
      gradient: 'from-[#C0C0C0] to-[#E5E5E5]'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            {wizardStep === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToStep1}
                className="-ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <span>
              Step {wizardStep}/2: {wizardStep === 1 ? 'Choose Item Type' : 'Configure Pricing Structure'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {wizardStep === 1 
              ? 'Select the category for your menu item'
              : 'Choose how this item will be priced. This choice cannot be changed after creation.'}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Item Type Selection */}
        {wizardStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {itemTypes.map((type) => {
              const Icon = type.icon;
              const isHovered = hoveredCard === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeClick(type.id as 'food' | 'drinks_wine' | 'coffee_desserts')}
                  onMouseEnter={() => setHoveredCard(type.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 p-6 text-left"
                  style={{
                    backgroundColor: isHovered ? 'rgba(91, 33, 182, 0.1)' : 'rgba(30, 30, 30, 0.5)',
                    borderColor: isHovered ? type.color : 'rgba(255, 255, 255, 0.1)',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />
                  
                  <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: `${type.color}20`,
                        boxShadow: isHovered ? `0 0 20px ${type.color}40` : 'none'
                      }}
                    >
                      <Icon className="w-8 h-8" style={{ color: type.color }} />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
                      {type.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      {type.description}
                    </p>

                    {/* Examples */}
                    <div className="w-full space-y-1 pt-2">
                      <p className="text-xs font-semibold" style={{ color: colors.text.secondary }}>Examples:</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {type.examples.slice(0, 2).map((example, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: `${type.color}15`,
                              color: type.color
                            }}
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <ChevronRight 
                      className="w-5 h-5 mt-2 transition-transform group-hover:translate-x-1" 
                      style={{ color: type.color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 2: Pricing Structure Selection */}
        {wizardStep === 2 && (
          <div className="mt-6">
            <PricingModeSelector
              selectedMode={selectedPricingMode}
              onSelect={handlePricingModeSelect}
              onBack={handleBackToStep1}
              onContinue={handleContinue}
              canContinue={selectedPricingMode !== null}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemTypeSelection;
