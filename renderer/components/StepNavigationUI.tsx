import React from 'react';
import { ChevronLeft, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface StepNavigationUIProps {
  currentStep: number;
  totalSteps: number;
  progress: Record<number, number>;
  onNext: () => void;
  onPrevious: () => void;
  canProgress: boolean;
  isComplete?: boolean;
  stepTitles?: string[];
}

const StepNavigationUI: React.FC<StepNavigationUIProps> = ({
  currentStep,
  totalSteps,
  progress,
  onNext,
  onPrevious,
  canProgress,
  isComplete = false,
  stepTitles = ['Select Order Type', 'Choose Template', 'Customize']
}) => {
  return (
    <div className="space-y-4">
      {/* Step indicator with titles */}
      <div className="flex justify-between mb-2 relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
        
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = progress[stepNumber] === 100;
          const isPrevious = stepNumber < currentStep;
          
          return (
            <div 
              key={`step-${stepNumber}`} 
              className={`flex flex-col items-center space-y-1 w-1/${totalSteps}`}
            >
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  border-2 shadow-sm
                  ${isActive ? 'bg-purple-500 border-purple-300 text-white' : ''}
                  ${isCompleted && !isActive ? 'bg-green-500 border-green-300 text-white' : ''}
                  ${isPrevious && !isCompleted ? 'bg-blue-500 border-blue-300 text-white' : ''}
                  ${!isCompleted && !isActive && !isPrevious ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400' : ''}
                  transition-all duration-300 transform ${isActive ? 'scale-110' : 'scale-100'}
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span 
                className={`
                  text-xs font-medium text-center
                  ${isActive ? 'text-purple-500 dark:text-purple-400' : ''}
                  ${isCompleted ? 'text-green-500 dark:text-green-400' : ''}
                  ${isPrevious && !isCompleted ? 'text-blue-500 dark:text-blue-400' : ''}
                  ${!isCompleted && !isActive && !isPrevious ? 'text-gray-500 dark:text-gray-400' : ''}
                `}
              >
                {stepTitles[index]}
              </span>
              {isActive && (
                <Badge variant="outline" className="mt-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  Current
                </Badge>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress bar with step completion label */}
      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progress[currentStep])}% Complete</span>
        </div>
        <Progress 
          value={progress[currentStep]} 
          className={`h-2 ${progress[currentStep] === 100 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-purple-100 dark:bg-purple-900/20'}`} 
        />
      </div>
      
      {/* Navigation buttons with enhanced visuals */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentStep === 1}
          className="flex items-center"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        
        <Button
          variant={isComplete ? "success" : (canProgress ? "default" : "secondary")}
          size="sm"
          onClick={onNext}
          disabled={!canProgress || isComplete}
          className={`flex items-center ${canProgress ? 'animate-pulse-soft' : ''}`}
        >
          {isComplete ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Complete
            </>
          ) : currentStep === totalSteps ? (
            <>
              Finish
              <Check className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Continue to {stepTitles[currentStep]}
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepNavigationUI;