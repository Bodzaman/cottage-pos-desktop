/**
 * Wizard Overlay Component
 * 
 * Provides the global overlay and spotlight management system
 * for the enhanced menu setup wizard experience
 */

import React, { useEffect } from 'react';
import '../utils/wizardStyles.css';

interface WizardOverlayProps {
  isVisible: boolean;
  spotlightTarget?: string;
  onDismiss?: () => void;
}

export function WizardOverlay({ isVisible, spotlightTarget, onDismiss }: WizardOverlayProps) {
  useEffect(() => {
    if (isVisible) {
      // Add wizard mode class to body
      document.body.classList.add('wizard-mode');
      
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      
      // Add spotlight effect if target specified
      if (spotlightTarget) {
        const targetElement = document.querySelector(spotlightTarget);
        if (targetElement) {
          targetElement.classList.add('wizard-spotlight');
          
          // Scroll target into view smoothly
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }
      }
    } else {
      // Cleanup when overlay is hidden
      document.body.classList.remove('wizard-mode');
      document.body.style.overflow = '';
      
      // Remove all spotlight effects
      document.querySelectorAll('.wizard-spotlight').forEach(el => {
        el.classList.remove('wizard-spotlight');
      });
      
      // Remove all callouts and tooltips
      document.querySelectorAll('.wizard-callout, .wizard-tooltip').forEach(el => {
        el.remove();
      });
    }
    
    return () => {
      // Cleanup on unmount
      document.body.classList.remove('wizard-mode');
      document.body.style.overflow = '';
      document.querySelectorAll('.wizard-spotlight').forEach(el => {
        el.classList.remove('wizard-spotlight');
      });
    };
  }, [isVisible, spotlightTarget]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="wizard-overlay"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 40,
        pointerEvents: onDismiss ? 'auto' : 'none'
      }}
    />
  );
}

/**
 * Hook for managing wizard visual effects
 */
export function useWizardEffects() {
  const addSpotlight = (selector: string) => {
    // Remove existing spotlights
    document.querySelectorAll('.wizard-spotlight').forEach(el => {
      el.classList.remove('wizard-spotlight');
    });
    
    // Add new spotlight
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('wizard-spotlight');
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };
  
  const removeSpotlight = () => {
    document.querySelectorAll('.wizard-spotlight').forEach(el => {
      el.classList.remove('wizard-spotlight');
    });
  };
  
  const addCallout = (selector: string, message: string, position: 'top' | 'bottom' = 'top') => {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const callout = document.createElement('div');
    callout.className = `wizard-tooltip ${position}`;
    callout.textContent = message;
    
    const rect = element.getBoundingClientRect();
    callout.style.position = 'fixed';
    callout.style.left = `${rect.left + rect.width / 2}px`;
    callout.style.transform = 'translateX(-50%)';
    
    if (position === 'top') {
      callout.style.bottom = `${window.innerHeight - rect.top + 10}px`;
    } else {
      callout.style.top = `${rect.bottom + 10}px`;
    }
    
    document.body.appendChild(callout);
    
    // Auto-remove after delay
    setTimeout(() => {
      callout.remove();
    }, 5000);
  };
  
  return {
    addSpotlight,
    removeSpotlight,
    addCallout
  };
}