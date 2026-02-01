/**
 * OnboardingTooltip Component
 *
 * First-visit tutorial overlay for the Menu Setup Dashboard.
 * Shown once on first visit, then dismissed and remembered via localStorage.
 *
 * Features:
 * - Explains the 5-step setup flow
 * - Dismissible with "Got it" or "Show me around" buttons
 * - Persists dismissal in localStorage
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowRight, FolderTree, Beef, Utensils, Package, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'menu-setup-onboarding-completed';

interface SetupStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    icon: <FolderTree className="w-5 h-5" />,
    title: 'Categories',
    description: 'Define menu sections'
  },
  {
    icon: <Beef className="w-5 h-5" />,
    title: 'Proteins',
    description: 'Set up meat/protein options'
  },
  {
    icon: <Utensils className="w-5 h-5" />,
    title: 'Menu Items',
    description: 'Add your dishes'
  },
  {
    icon: <Package className="w-5 h-5" />,
    title: 'Set Meals',
    description: 'Create meal deals'
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Add-ons',
    description: 'Add extras & modifiers'
  }
];

export interface OnboardingTooltipProps {
  /** Override whether to show (useful for testing) */
  forceShow?: boolean;
  /** Callback when user clicks "Show me around" */
  onStartTour?: () => void;
  /** Callback when user dismisses the tooltip */
  onDismiss?: () => void;
}

export function OnboardingTooltip({
  forceShow = false,
  onStartTour,
  onDismiss
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Check if onboarding has been completed
  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setIsVisible(true);
    }
  }, [forceShow]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  const handleStartTour = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onStartTour?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-w-lg w-full mx-4 shadow-xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">👋</span>
            Welcome to Menu Setup!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Follow these steps to build your menu:
          </p>

          <div className="space-y-3">
            {SETUP_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="flex items-center gap-3 p-2 rounded-lg bg-accent/50"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleDismiss}>
            Got it, let's start!
          </Button>
          {onStartTour && (
            <Button onClick={handleStartTour}>
              Show me around
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Hook to check if onboarding has been completed
 */
export function useOnboardingCompleted(): boolean {
  const [completed, setCompleted] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    const value = localStorage.getItem(STORAGE_KEY);
    setCompleted(value === 'true');
  }, []);

  return completed;
}

/**
 * Reset onboarding state (for testing/dev)
 */
export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export default OnboardingTooltip;
