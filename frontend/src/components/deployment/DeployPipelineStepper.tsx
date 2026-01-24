import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2, Loader2, Circle, AlertCircle, XCircle,
  ExternalLink, RefreshCw, Copy, Clock
} from 'lucide-react';
import { colors } from '../../utils/designSystem';
import { toast } from 'sonner';

export type FlowType = 'everything' | 'till' | 'app-only';

export type StepStatus = 'pending' | 'active' | 'complete' | 'error' | 'skipped';

export interface PipelineStepInfo {
  key: string;
  label: string;
  description: string;
  status: StepStatus;
  progress?: number;
  currentSubStep?: string;
  elapsedSeconds?: number;
}

export interface PipelineError {
  failedStep?: string;
  rawError?: string;
  friendlyExplanation?: string;
  fixGuide?: string;
  logsUrl?: string;
  isKnownError?: boolean;
}

interface DeployPipelineStepperProps {
  steps: PipelineStepInfo[];
  error?: PipelineError | null;
  onCancel?: () => void;
  onRetry?: () => void;
  onReset?: () => void;
  canCancel?: boolean;
  isComplete?: boolean;
  completionLinks?: { label: string; url: string; color: string }[];
}

export default function DeployPipelineStepper({
  steps,
  error,
  onCancel,
  onRetry,
  onReset,
  canCancel = false,
  isComplete = false,
  completionLinks = [],
}: DeployPipelineStepperProps) {
  const completedSteps = steps.filter(s => s.status === 'complete' || s.status === 'skipped').length;
  const totalSteps = steps.length;
  const activeStep = steps.find(s => s.status === 'active');
  const hasError = steps.some(s => s.status === 'error');
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case 'active': return <Loader2 className="h-5 w-5 animate-spin" style={{ color: colors.brand.purple }} />;
      case 'error': return <XCircle className="h-5 w-5 text-red-400" />;
      case 'skipped': return <CheckCircle2 className="h-5 w-5 text-yellow-400" />;
      default: return <Circle className="h-5 w-5" style={{ color: colors.text.secondary }} />;
    }
  };

  const formatElapsed = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const copyError = () => {
    if (error?.rawError) {
      navigator.clipboard.writeText(error.rawError);
      toast.success('Error copied to clipboard');
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Overall Progress Bar */}
      {!isComplete && !hasError && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              Step {completedSteps + (activeStep ? 1 : 0)} of {totalSteps}
            </span>
            {canCancel && onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}
                className="h-6 text-xs border-red-500/50 text-red-400 hover:bg-red-500/10">
                Cancel Deploy
              </Button>
            )}
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: colors.background.tertiary }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${overallProgress}%`,
                backgroundColor: colors.brand.purple,
              }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.key} className="space-y-1">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">{getStepIcon(step.status)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{
                    color: step.status === 'active' ? colors.brand.purple :
                           step.status === 'complete' ? '#6EE7B7' :
                           step.status === 'error' ? '#F87171' :
                           step.status === 'skipped' ? '#FCD34D' :
                           colors.text.secondary
                  }}>
                    {step.label}
                    {step.status === 'skipped' && (
                      <span className="ml-2 text-xs text-yellow-400">(skipped)</span>
                    )}
                  </p>
                  {step.status === 'active' && step.elapsedSeconds != null && (
                    <span className="text-xs flex items-center" style={{ color: colors.text.secondary }}>
                      <Clock className="h-3 w-3 mr-1" />{formatElapsed(step.elapsedSeconds)}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: colors.text.secondary }}>{step.description}</p>

                {/* Per-step progress bar */}
                {step.status === 'active' && step.progress != null && (
                  <div className="mt-1.5 space-y-1">
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: colors.background.tertiary }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${step.progress}%`,
                          backgroundColor: colors.brand.purple,
                        }}
                      />
                    </div>
                    {step.currentSubStep && (
                      <p className="text-xs italic" style={{ color: colors.text.tertiary }}>
                        {step.currentSubStep}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Panel */}
      {hasError && error && (
        <div className="mt-4 rounded-lg p-4 space-y-3" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
        }}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-sm font-medium text-red-300">
              Build Failed{error.failedStep ? `: ${error.failedStep}` : ''}
            </p>
          </div>

          {error.rawError && (
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>Error:</p>
              <pre className="text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap break-words"
                style={{ backgroundColor: colors.background.primary, color: '#F87171', maxHeight: '120px', overflowY: 'auto' }}>
                {error.rawError}
              </pre>
            </div>
          )}

          {error.friendlyExplanation && (
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>What this means:</p>
              <p className="text-sm" style={{ color: colors.text.primary }}>{error.friendlyExplanation}</p>
            </div>
          )}

          {error.fixGuide && (
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>How to fix:</p>
              <p className="text-sm whitespace-pre-line" style={{ color: colors.text.primary }}>{error.fixGuide}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {error.logsUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(error.logsUrl, '_blank')}
                className="h-7 text-xs" style={{ borderColor: colors.border.medium, color: colors.text.secondary }}>
                <ExternalLink className="h-3 w-3 mr-1" /> View Full Logs
              </Button>
            )}
            {error.rawError && (
              <Button variant="outline" size="sm" onClick={copyError}
                className="h-7 text-xs" style={{ borderColor: colors.border.medium, color: colors.text.secondary }}>
                <Copy className="h-3 w-3 mr-1" /> Copy Error
              </Button>
            )}
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}
                className="h-7 text-xs" style={{ borderColor: colors.brand.purple + '50', color: colors.brand.purple }}>
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Completion Links */}
      {isComplete && (
        <div className="flex flex-wrap gap-2 mt-3">
          {completionLinks.map((link, i) => (
            <Button key={i} variant="outline" size="sm" onClick={() => window.open(link.url, '_blank')}
              style={{ borderColor: link.color, color: link.color }}>
              <ExternalLink className="h-3 w-3 mr-1" /> {link.label}
            </Button>
          ))}
        </div>
      )}

      {/* Reset Button */}
      {(isComplete || hasError) && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="mt-2"
          style={{ color: colors.text.secondary }}>
          <RefreshCw className="h-3 w-3 mr-1" /> Reset
        </Button>
      )}
    </div>
  );
}
