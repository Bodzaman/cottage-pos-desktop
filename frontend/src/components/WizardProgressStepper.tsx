import React from 'react';
import { Check, UserCircle, MessageSquare, Mic, Rocket } from 'lucide-react';
import { colors } from 'utils/designSystem';

type WizardStage = 'identity' | 'chat' | 'voice' | 'publish';

interface WizardProgressStepperProps {
  currentStage: WizardStage;
  completedStages: Set<WizardStage>;
  onStageClick: (stage: WizardStage) => void;
  canNavigate?: boolean;
}

interface StepConfig {
  key: WizardStage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  number: number;
}

const steps: StepConfig[] = [
  { key: 'identity', label: 'Identity', icon: UserCircle, number: 1 },
  { key: 'chat', label: 'Chat Bot', icon: MessageSquare, number: 2 },
  { key: 'voice', label: 'Voice', icon: Mic, number: 3 },
  { key: 'publish', label: 'Publish', icon: Rocket, number: 4 },
];

export function WizardProgressStepper({
  currentStage,
  completedStages,
  onStageClick,
  canNavigate = true,
}: WizardProgressStepperProps) {
  const currentStageIndex = steps.findIndex((s) => s.key === currentStage);

  const isStepAccessible = (stepIndex: number): boolean => {
    if (!canNavigate) return stepIndex === currentStageIndex;
    // Can access current step or any completed step
    return stepIndex <= currentStageIndex || completedStages.has(steps[stepIndex].key);
  };

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (completedStages.has(steps[stepIndex].key)) return 'completed';
    if (stepIndex === currentStageIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full py-4 sm:py-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto px-2 sm:px-4">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isAccessible = isStepAccessible(index);
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <div className="flex flex-col items-center relative z-10">
                <button
                  onClick={() => isAccessible && onStageClick(step.key)}
                  disabled={!isAccessible}
                  className={`
                    relative flex items-center justify-center
                    w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                    rounded-full border-2 transition-all duration-300
                    ${isAccessible ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed opacity-50'}
                    ${status === 'completed' ? 'bg-green-600 border-green-500' : ''}
                    ${status === 'current' ? 'bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500 shadow-lg shadow-purple-500/50' : ''}
                    ${status === 'upcoming' ? 'bg-gray-800 border-gray-700' : ''}
                  `}
                  style={{
                    backgroundColor: status === 'upcoming' ? colors.background.tertiary : undefined,
                    borderColor: status === 'upcoming' ? colors.border.medium : undefined,
                  }}
                  aria-label={`${step.label} - Step ${step.number}`}
                >
                  {status === 'completed' ? (
                    <Check 
                      className="icon-bounce w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white"
                    />
                  ) : (
                    <Icon
                      className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"
                      style={{
                        color: status === 'current' ? 'white' : colors.text.secondary,
                      }}
                    />
                  )}
                  
                  {/* Animated ring for current step */}
                  {status === 'current' && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-75"
                      style={{
                        backgroundColor: colors.brand.purple,
                        animationDuration: '2s',
                      }}
                    />
                  )}
                </button>

                {/* Label - Hidden on mobile, abbreviated on tablet, full on desktop */}
                <div className="mt-2 sm:mt-3 text-center">
                  {/* Full label on desktop */}
                  <div
                    className="hidden lg:block text-sm font-medium"
                    style={{
                      color:
                        status === 'current'
                          ? colors.brand.purple
                          : status === 'completed'
                          ? colors.accent.turquoise
                          : colors.text.secondary,
                    }}
                  >
                    {step.label}
                  </div>
                  
                  {/* Abbreviated label on tablet */}
                  <div
                    className="hidden sm:block lg:hidden text-xs font-medium"
                    style={{
                      color:
                        status === 'current'
                          ? colors.brand.purple
                          : status === 'completed'
                          ? colors.accent.turquoise
                          : colors.text.secondary,
                    }}
                  >
                    {step.label === 'Identity' ? 'ID' : step.label === 'Chat Bot' ? 'Chat' : step.label}
                  </div>
                  
                  {/* Step number - visible on all sizes */}
                  <div
                    className="text-[10px] sm:text-xs mt-0.5 sm:mt-1"
                    style={{ color: colors.text.tertiary }}
                  >
                    <span className="sm:hidden">{step.number}</span>
                    <span className="hidden sm:inline">Step {step.number}</span>
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 px-1 sm:px-2 md:px-4 relative -top-4 sm:-top-5">
                  <div
                    className="h-0.5 sm:h-1 rounded-full transition-all duration-500 ease-out"
                    style={{
                      backgroundColor:
                        completedStages.has(steps[index].key) || index < currentStageIndex
                          ? colors.accent.turquoise
                          : colors.border.medium,
                      transform: completedStages.has(steps[index].key) || index < currentStageIndex
                        ? 'scaleX(1)'
                        : 'scaleX(0.8)',
                      transformOrigin: 'left',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
