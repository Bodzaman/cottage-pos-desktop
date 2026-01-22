/**
 * Menu Setup Wizard Component
 * 
 * A progressive setup wizard that guides users through the optimal
 * menu structure creation flow: Categories → Proteins → Menu Items
 * 
 * Redesigned with sophisticated dark theme and premium glassmorphism effects
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  BookmarkPlus,
  Utensils,
  PlusCircle,
  Sparkles,
  X,
  Info,
  Settings,
  Eye,
  Target
} from 'lucide-react';
import { MenuSetupStatus } from '../utils/menuSetupAnalysis';
import { colors, cardStyle, frostedGlassStyle, buttonGradients, badgeStyles, animation } from '../utils/designSystem';

interface SetupWizardProps {
  setupStatus: MenuSetupStatus;
  onStepComplete: (step: 'categories' | 'proteins' | 'menu-items' | 'customizations' | 'review') => void;
  onClose: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // New props for visual enhancement system
  onTabSwitch?: (tab: 'structure' | 'items' | 'customizations') => void;
  currentTab?: string;
}

interface WizardStep {
  id: 'categories' | 'proteins' | 'menu-items' | 'customizations' | 'review';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  examples: string[];
  tips: string[];
  isComplete: boolean;
  isAvailable: boolean;
  targetTab?: 'structure' | 'items' | 'customizations';
  spotlightTarget?: string; // CSS selector for spotlight effect
  actionType?: 'tab-switch' | 'form-action' | 'review';
}

export function MenuSetupWizard({ setupStatus, onStepComplete, onClose, isOpen, onOpenChange, onTabSwitch, currentTab }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Define enhanced 5-step wizard journey
  const steps: WizardStep[] = [
    {
      id: 'categories',
      title: 'Choose Your Menu Sections',
      description: 'Start by choosing where each category fits in the meal journey. This helps orders print in the right sequence for your kitchen.',
      icon: BookmarkPlus,
      targetTab: 'structure',
      spotlightTarget: '[data-section="categories"]',
      actionType: 'form-action',
      examples: [
        '"Appetizers" → STARTERS',
        '"Biryanis" → MAIN COURSE', 
        '"Naan Bread" → ACCOMPANIMENTS',
        '"Vegetable Curry" → MAIN COURSE',
        '"Mango Kulfi" → DESSERTS',
        '"Lassi" → DRINKS & WINE'
      ],
      tips: [
        'Choose from 6 meal stages: STARTERS, MAIN COURSE, SIDE DISHES, ACCOMPANIMENTS, DESSERTS, DRINKS & WINE',
        'Kitchen staff will see orders in the right cooking sequence automatically',
        'Customers can browse your menu in a logical flow',
        'New staff can find dishes quickly using this organized structure',
        'Your menu will look professional and increase sales'
      ],
      isComplete: setupStatus.hasMainCategories,
      isAvailable: true
    },
    {
      id: 'proteins',
      title: 'Set Up Your Protein Options',
      description: 'Let customers choose their protein and cooking style. This makes it easy to offer the same dish with different proteins.',
      icon: Utensils,
      targetTab: 'structure',
      spotlightTarget: '[data-section="proteins"]',
      actionType: 'form-action',
      examples: [
        'Chicken (Grilled, Tandoori, Curry)',
        'Lamb (Medium, Well-done)',
        'Beef (Mild, Medium, Hot)',
        'Prawn (Butterfly, Whole)',
        'Fish (Grilled, Fried)',
        'Paneer (Soft, Firm)',
        'Vegetarian Options',
        'Vegan Alternatives'
      ],
      tips: [
        'Think about proteins you use across multiple dishes',
        'Customers love being able to choose exactly how they want their food',
        'Include vegetarian and vegan options to reach more customers',
        'This saves time - create one curry base, offer multiple protein choices',
        'Kitchen staff can prepare proteins consistently using these options'
      ],
      isComplete: setupStatus.hasProteins,
      isAvailable: setupStatus.hasMainCategories
    },
    {
      id: 'menu-items',
      title: 'Add Your Signature Dishes',
      description: 'Create the dishes that make your restaurant special. Each dish gets an easy reference number for your kitchen staff.',
      icon: PlusCircle,
      targetTab: 'items',
      spotlightTarget: '[data-tab="items"]',
      actionType: 'tab-switch',
      examples: [
        'Chicken Tikka Masala (Ref: CTM-001)',
        'Lamb Biryani (Ref: LB-002)',
        'Vegetable Korma (Ref: VK-003)',
        'Garlic Naan (Ref: GN-004)',
        'Mango Lassi (Ref: ML-005)',
        'Paneer Butter Masala (Ref: PBM-006)',
        'Tandoori Mixed Grill (Ref: TMG-007)'
      ],
      tips: [
        'Click the "Menu Items" tab to start adding your dishes',
        'Each dish automatically gets a reference code for easy kitchen ordering',
        'Connect dishes to your categories so they appear in the right menu section',
        'Use your meat options to create different versions of the same dish',
        'Add mouth-watering descriptions and photos to increase sales'
      ],
      isComplete: false, // TODO: Add menu items completion check
      isAvailable: setupStatus.hasMainCategories && setupStatus.hasProteins
    },
    {
      id: 'customizations',
      title: 'Set Up Extras & Upgrades',
      description: 'Create extras that increase your order value. Set up both free instructions and paid upgrades for customers.',
      icon: Settings,
      targetTab: 'customizations',
      spotlightTarget: '[data-tab="customizations"]',
      actionType: 'tab-switch',
      examples: [
        '**Free Instructions:**',
        '• "Extra Hot" (£0.00) - spice level',
        '• "No Onions" (£0.00) - dietary needs',
        '• "On the side" (£0.00) - serving style',
        '**Paid Extras:**',
        '• "Extra Chicken" (+£2.50) - more protein',
        '• "Large Portion" (+£1.50) - bigger serving',
        '• "Extra Sauce" (+£0.75) - additional sauce'
      ],
      tips: [
        'Click the "Add-ons & Instructions" tab to start setting up extras',
        'Free instructions help customers get exactly what they want',
        'Paid extras boost your average order value significantly',
        'Both work seamlessly in your POS system and online ordering',
        'Kitchen staff see all special requests clearly on order tickets'
      ],
      isComplete: false, // TODO: Add customizations completion check
      isAvailable: setupStatus.hasMainCategories && setupStatus.hasProteins
    },
    {
      id: 'review',
      title: 'Launch Your Menu System',
      description: 'Your professional menu system is ready! Launch it now and start taking orders with confidence.',
      icon: Eye,
      actionType: 'review',
      examples: [
        '✅ Menu sections organized for smooth kitchen workflow',
        '✅ Meat options ready for customer choice',
        '✅ Signature dishes added with reference codes',
        '✅ Extras configured to boost order values',
        '🚀 Ready to serve customers professionally!'
      ],
      tips: [
        'Your menu now flows logically from starters to desserts',
        'Kitchen staff will receive orders in the right cooking sequence', 
        'Customers can easily browse and order online or in-person',
        'Staff can find any dish quickly using reference codes',
        'You can add more dishes anytime as your menu grows'
      ],
      isComplete: false, // Will be true when all other steps complete
      isAvailable: setupStatus.hasMainCategories && setupStatus.hasProteins
    }
  ];
  
  const currentStepData = steps[currentStep];
  const totalSteps = steps.length;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleStartStep = () => {
    const step = currentStepData;
    
    // Handle different action types
    if (step.actionType === 'tab-switch' && step.targetTab && onTabSwitch) {
      // Switch to target tab with visual enhancement
      setShowOverlay(true);
      onTabSwitch(step.targetTab);
      
      // Add spotlight effect after tab switch
      setTimeout(() => {
        addSpotlightEffect(step.spotlightTarget);
      }, 300);
    }
    
    // Complete the wizard step
    onStepComplete(currentStepData.id);
    
    // Keep wizard open for visual guidance unless it's the final step
    if (step.actionType !== 'review') {
      // Don't close wizard - keep it open for guidance
      return;
    }
    
    onClose();
  };
  
  // Function to add spotlight effect to target elements
  const addSpotlightEffect = (selector?: string) => {
    if (!selector) return;
    
    // Remove existing spotlight effects
    document.querySelectorAll('.wizard-spotlight').forEach(el => {
      el.classList.remove('wizard-spotlight');
    });
    
    // Add new spotlight effect
    const targetElement = document.querySelector(selector);
    if (targetElement) {
      targetElement.classList.add('wizard-spotlight');
      
      // Add pulsing effect
      targetElement.style.setProperty('--spotlight-glow', colors.brand.purple);
    }
  };
  
  // Function to remove overlay and spotlight effects
  const removeVisualEffects = () => {
    setShowOverlay(false);
    document.querySelectorAll('.wizard-spotlight').forEach(el => {
      el.classList.remove('wizard-spotlight');
    });
  };
  
  // Enhanced close handler
  const handleClose = () => {
    removeVisualEffects();
    onClose();
  };
  
  const handleSkip = () => {
    removeVisualEffects();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto" 
        style={{
          ...cardStyle,
          backgroundColor: "rgba(26, 26, 26, 0.95)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${colors.border.purple}`,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px ${colors.border.purple}`
        }}
      >
        <DialogHeader className="border-b" style={{ borderColor: colors.border.light }}>
          <DialogTitle className="text-xl font-bold flex items-center gap-3" style={{ color: colors.text.primary }}>
            <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{
                background: buttonGradients.primary,
                boxShadow: buttonGradients.glow.primary
              }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Restaurant Menu Setup
          </DialogTitle>
          <DialogDescription className="mt-2" style={{ color: colors.text.secondary }}>
            Build your professional menu system in 5 simple steps. Get orders flowing smoothly from kitchen to customer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4 lg:space-y-8">
          {/* Enhanced Progress Section */}
          <Card className="border-0" style={{
            ...frostedGlassStyle,
            border: `1px solid ${colors.border.light}`,
            backgroundColor: "rgba(34, 34, 34, 0.4)"
          }}>
            <CardContent className="p-4 lg:p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    Setup Progress
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.brand.purple }}>
                    {Math.round(progressPercentage)}% Complete
                  </span>
                </div>
                <div className="relative">
                  <div 
                    className="h-2 rounded-full bg-gray-700 overflow-hidden"
                    style={{ backgroundColor: colors.background.tertiary }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${progressPercentage}%`,
                        background: `linear-gradient(90deg, ${colors.brand.purple} 0%, ${colors.brand.gold} 100%)`,
                        boxShadow: `0 0 10px rgba(124, 93, 250, 0.5)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Enhanced Step Indicators */}
          <div className="flex items-center justify-between px-4 lg:px-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isPast = index < currentStep;
              const isFuture = index > currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-3 relative">
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div 
                      className="absolute top-5 left-12 w-16 lg:w-24 h-0.5 transition-all duration-500"
                      style={{
                        background: isPast || isActive 
                          ? `linear-gradient(90deg, ${colors.brand.purple} 0%, ${colors.brand.gold} 100%)`
                          : colors.background.tertiary
                      }}
                    />
                  )}
                  
                  {/* Step Circle */}
                  <div 
                    className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-all duration-300 relative z-10"
                    style={{
                      borderColor: step.isComplete 
                        ? colors.status.success
                        : isActive 
                        ? colors.brand.purple
                        : isPast 
                        ? colors.brand.gold
                        : colors.border.medium,
                      backgroundColor: step.isComplete 
                        ? colors.status.success
                        : isActive 
                        ? colors.brand.purple
                        : isPast 
                        ? colors.brand.gold
                        : colors.background.tertiary,
                      boxShadow: (isActive || step.isComplete) 
                        ? `0 0 15px ${step.isComplete ? colors.status.success : colors.brand.purple}30`
                        : 'none',
                      color: (isActive || isPast || step.isComplete) ? 'white' : colors.text.tertiary
                    }}
                  >
                    {step.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 lg:h-6 lg:w-6" />
                    ) : (
                      <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <span 
                    className="text-xs lg:text-sm text-center max-w-[80px] lg:max-w-[100px] font-medium transition-colors duration-300"
                    style={{
                      color: step.isComplete 
                        ? colors.status.success
                        : isActive 
                        ? colors.brand.purple
                        : isPast 
                        ? colors.brand.gold
                        : colors.text.tertiary
                    }}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          
          <Separator style={{ backgroundColor: colors.border.light }} />
          
          {/* Current Step Content Card */}
          <Card className="border-0" style={{
            ...cardStyle,
            border: `1px solid ${colors.border.light}`,
            background: `linear-gradient(135deg, rgba(34, 34, 34, 0.4) 0%, rgba(42, 42, 42, 0.4) 100%)`
          }}>
            <CardContent className="p-6 lg:p-8">
              <div className="space-y-4 lg:space-y-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-xl text-white transition-all duration-300"
                    style={{
                      background: currentStepData.isComplete 
                        ? `linear-gradient(135deg, ${colors.status.success} 0%, ${colors.brand.turquoise} 100%)`
                        : buttonGradients.primary,
                      boxShadow: currentStepData.isComplete 
                        ? `0 0 20px ${colors.status.success}40`
                        : buttonGradients.glow.primary
                    }}
                  >
                    {currentStepData.isComplete ? (
                      <CheckCircle2 className="h-7 w-7 lg:h-8 lg:w-8" />
                    ) : (
                      <currentStepData.icon className="h-7 w-7 lg:h-8 lg:w-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl lg:text-2xl font-bold mb-1 lg:mb-2" style={{ color: colors.text.primary }}>
                      {currentStepData.title}
                    </h3>
                    <p className="text-sm lg:text-base leading-relaxed" style={{ color: colors.text.secondary }}>
                      {currentStepData.description}
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Status Badge */}
                <div className="flex justify-start">
                  {currentStepData.isComplete ? (
                    <Badge 
                      className="px-3 py-1 border-0 font-medium"
                      style={{
                        backgroundColor: `${colors.status.success}20`,
                        color: colors.status.success,
                        border: `1px solid ${colors.status.success}40`
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : currentStepData.isAvailable ? (
                    <Badge 
                      className="px-3 py-1 border-0 font-medium"
                      style={{
                        backgroundColor: `${colors.brand.purple}20`,
                        color: colors.brand.purple,
                        border: `1px solid ${colors.brand.purple}40`
                      }}
                    >
                      <Circle className="h-3 w-3 mr-1" />
                      Ready to Start
                    </Badge>
                  ) : (
                    <Badge 
                      className="px-3 py-1 border-0 font-medium"
                      style={{
                        backgroundColor: `${colors.text.disabled}20`,
                        color: colors.text.disabled,
                        border: `1px solid ${colors.text.disabled}40`
                      }}
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Prerequisites Required
                    </Badge>
                  )}
                </div>
                
                {/* Enhanced Examples Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm lg:text-base flex items-center gap-2" style={{ color: colors.text.primary }}>
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: colors.brand.gold }} />
                    Examples:
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    {currentStepData.examples.map((example, index) => (
                      <div 
                        key={index} 
                        className="text-sm lg:text-base px-3 py-2 lg:px-4 lg:py-3 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          backgroundColor: `${colors.background.tertiary}80`,
                          borderColor: colors.border.light,
                          color: colors.text.secondary
                        }}
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Enhanced Tips Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm lg:text-base flex items-center gap-2" style={{ color: colors.text.primary }}>
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: colors.brand.purple }} />
                    Pro Tips:
                  </h4>
                  <ul className="space-y-2">
                    {currentStepData.tips.map((tip, index) => (
                      <li key={index} className="text-sm lg:text-base flex items-start gap-3 leading-relaxed" style={{ color: colors.text.secondary }}>
                        <div 
                          className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: colors.brand.purple }}
                        />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-between pt-4 lg:pt-6" style={{ borderTop: `1px solid ${colors.border.light}` }}>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
                size="sm"
                className="border-0 hover:bg-white/10 disabled:opacity-30"
                style={{
                  backgroundColor: `${colors.background.tertiary}80`,
                  color: colors.text.secondary,
                  borderColor: colors.border.light
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleNext}
                disabled={currentStep === totalSteps - 1}
                size="sm"
                className="border-0 hover:bg-white/10 disabled:opacity-30"
                style={{
                  backgroundColor: `${colors.background.tertiary}80`,
                  color: colors.text.secondary,
                  borderColor: colors.border.light
                }}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                size="sm"
                className="hover:bg-white/10"
                style={{ color: colors.text.tertiary }}
              >
                Skip Guide
              </Button>
              
              {currentStepData.isAvailable && !currentStepData.isComplete && (
                <Button 
                  onClick={handleStartStep}
                  size="sm"
                  className="border-0 text-white font-medium hover:scale-105 transition-all duration-200"
                  style={{
                    background: buttonGradients.primary,
                    boxShadow: buttonGradients.glow.primary
                  }}
                >
                  {currentStepData.actionType === 'tab-switch' ? (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Go to {currentStepData.title}
                    </>
                  ) : (
                    <>
                      Start {currentStepData.title}
                    </>
                  )}
                </Button>
              )}
              
              {currentStepData.isComplete && (
                <Button 
                  variant="outline"
                  onClick={handleStartStep}
                  size="sm"
                  className="border-0 hover:bg-white/10"
                  style={{
                    backgroundColor: `${colors.brand.gold}20`,
                    color: colors.brand.gold,
                    borderColor: `${colors.brand.gold}40`
                  }}
                >
                  View {currentStepData.title}
                </Button>
              )}
              
              {currentStepData.actionType === 'review' && (
                <Button 
                  onClick={handleStartStep}
                  size="sm"
                  className="border-0 text-white font-medium hover:scale-105 transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${colors.status.success} 0%, ${colors.brand.turquoise} 100%)`,
                    boxShadow: `0 0 15px ${colors.status.success}40`
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Enhanced trigger button for the setup wizard with premium styling
 */
export function SetupWizardTrigger({ setupStatus, onOpen }: { setupStatus: MenuSetupStatus; onOpen: () => void }) {
  // Only show if setup is not complete
  if (setupStatus.setupPhase === 'complete') {
    return null;
  }
  
  return (
    <Button 
      onClick={onOpen}
      variant="outline"
      size="sm"
      className="border-0 hover:scale-105 transition-all duration-200 font-medium"
      style={{
        background: `linear-gradient(135deg, ${colors.brand.purple}20 0%, ${colors.brand.gold}20 100%)`,
        color: colors.brand.purple,
        border: `1px solid ${colors.brand.purple}40`,
        boxShadow: `0 0 10px ${colors.brand.purple}20`
      }}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Setup Guide
    </Button>
  );
}
