/**
 * Wizard Helper Functions
 * 
 * Utility functions for the enhanced menu setup wizard
 */

import { colors } from './designSystem';

/**
 * Data attributes for spotlight targeting
 */
export const WIZARD_TARGETS = {
  CATEGORIES_SECTION: '[data-wizard-target="categories-section"]',
  PROTEINS_SECTION: '[data-wizard-target="proteins-section"]',
  MENU_ITEMS_TAB: '[data-wizard-target="menu-items-tab"]',
  CUSTOMIZATIONS_TAB: '[data-wizard-target="customizations-tab"]',
  ADD_NEW_ITEM_BUTTON: '[data-wizard-target="add-new-item"]',
  ADD_NEW_ADDON_BUTTON: '[data-wizard-target="add-new-addon"]'
} as const;

/**
 * Add pulsing indicator to an element
 */
export function addPulsingIndicator(selector: string, color: string = colors.brand.purple) {
  const element = document.querySelector(selector);
  if (!element) return;
  
  // Remove existing indicators
  document.querySelectorAll('.wizard-pulse-indicator').forEach(el => el.remove());
  
  const indicator = document.createElement('div');
  indicator.className = 'wizard-pulse-indicator';
  indicator.style.cssText = `
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    background: ${color};
    border-radius: 50%;
    animation: wizardPulse 1.5s infinite;
    z-index: 50;
    pointer-events: none;
  `;
  
  element.style.position = 'relative';
  element.appendChild(indicator);
}

/**
 * Remove all wizard indicators
 */
export function removeAllIndicators() {
  document.querySelectorAll('.wizard-pulse-indicator').forEach(el => el.remove());
}

/**
 * Scroll element into view with enhanced animation
 */
export function scrollToElement(selector: string, options?: ScrollIntoViewOptions) {
  const element = document.querySelector(selector);
  if (!element) return;
  
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
    ...options
  });
}

/**
 * Create floating tooltip for contextual guidance
 */
export function createFloatingTooltip(selector: string, message: string, duration: number = 5000) {
  const element = document.querySelector(selector);
  if (!element) return;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'wizard-tooltip';
  tooltip.textContent = message;
  
  const rect = element.getBoundingClientRect();
  tooltip.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.bottom + 10}px;
    transform: translateX(-50%);
    z-index: 55;
    white-space: nowrap;
    max-width: 300px;
    white-space: normal;
  `;
  
  document.body.appendChild(tooltip);
  
  // Auto-remove tooltip
  setTimeout(() => {
    tooltip.remove();
  }, duration);
  
  return tooltip;
}

/**
 * Enhanced tab switching with visual feedback
 */
export function switchTabWithAnimation(tabValue: string, onTabChange: (tab: string) => void) {
  // Add loading state to current tab
  const currentTab = document.querySelector('[data-state="active"]');
  if (currentTab) {
    currentTab.classList.add('wizard-transitioning');
  }
  
  // Switch tab after brief delay for visual feedback
  setTimeout(() => {
    onTabChange(tabValue);
    
    // Remove loading state after tab change
    setTimeout(() => {
      document.querySelectorAll('.wizard-transitioning').forEach(el => {
        el.classList.remove('wizard-transitioning');
      });
    }, 200);
  }, 150);
}

/**
 * Check if wizard setup is complete
 */
export function checkWizardCompletion(setupStatus: any) {
  return {
    categoriesComplete: setupStatus.hasMainCategories,
    proteinsComplete: setupStatus.hasProteins,
    menuItemsComplete: false, // TODO: Implement menu items check
    customizationsComplete: false, // TODO: Implement customizations check
    overallComplete: false // All steps complete
  };
}

/**
 * Generate contextual tips based on current step
 */
export function getContextualTips(stepId: string, setupStatus: any) {
  const tips = {
    categories: [
      '💡 Start with 4-6 main categories for optimal customer navigation',
      '📱 Think mobile-first - shorter category names work better',
      '🎯 Focus on how customers mentally organize food choices'
    ],
    proteins: [
      '🥩 Include all protein types you offer across multiple dishes',
      '🌱 Don\'t forget vegetarian and vegan options',
      '⚡ These will speed up menu item creation with variants'
    ],
    'menu-items': [
      '📝 Add detailed descriptions to help customers decide',
      '💰 Set competitive pricing based on your local market',
      '📸 High-quality images significantly boost online orders'
    ],
    customizations: [
      '🆓 Create free options for dietary preferences and spice levels',
      '💵 Add paid options for extra proteins and premium ingredients',
      '👥 Consider which options apply to POS vs online orders'
    ],
    review: [
      '✅ Test the customer ordering experience on mobile',
      '🖥️ Preview how items appear in your POS system',
      '🚀 Your menu is ready for live orders!'
    ]
  };
  
  return tips[stepId as keyof typeof tips] || [];
}

/**
 * Animation utilities for smooth transitions
 */
export const animations = {
  fadeIn: (element: HTMLElement, duration: number = 300) => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  },
  
  slideIn: (element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right' = 'up', duration: number = 400) => {
    const transforms = {
      up: 'translateY(20px)',
      down: 'translateY(-20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)'
    };
    
    element.style.opacity = '0';
    element.style.transform = transforms[direction];
    element.style.transition = `all ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0)';
    });
  },
  
  pulse: (element: HTMLElement, scale: number = 1.05, duration: number = 200) => {
    element.style.transition = `transform ${duration}ms ease-out`;
    element.style.transform = `scale(${scale})`;
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, duration);
  }
};
