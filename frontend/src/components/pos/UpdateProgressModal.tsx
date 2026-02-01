/**
 * UpdateProgressModal
 *
 * Beautiful auto-update progress modal for Electron app.
 * Shows download progress, speed, ETA, and animated visual feedback.
 * Follows the dark theme design system (InternalDesignSystem.ts).
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Rocket
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'up-to-date';

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

export interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

interface UpdateProgressModalProps {
  open: boolean;
  state: UpdateState;
  info: UpdateInfo | null;
  progress: DownloadProgress | null;
  error: string | null;
  onInstall: () => void;
  onDismiss: () => void;
  onRetry: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s';
}

function formatETA(transferred: number, total: number, bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return 'Calculating...';
  const remaining = total - transferred;
  const seconds = Math.ceil(remaining / bytesPerSecond);

  if (seconds < 60) return `~${seconds}s remaining`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m remaining`;
  return `~${Math.ceil(seconds / 3600)}h remaining`;
}

// ============================================================================
// Progress Ring Component
// ============================================================================

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ percent, size = 120, strokeWidth = 8 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(124, 93, 250, 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(124, 93, 250, 0.5))'
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Animated Checkmark Component
// ============================================================================

function AnimatedCheckmark({ size = 80 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow background */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
        }}
      />

      {/* Checkmark SVG */}
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        className="relative z-10"
      >
        <path
          d="M5 13l4 4L19 7"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-check"
          style={{
            strokeDasharray: 30,
            strokeDashoffset: 0,
            animation: 'drawCheck 0.6s ease forwards'
          }}
        />
      </svg>

      {/* Add keyframe animation via style tag */}
      <style>{`
        @keyframes drawCheck {
          from { stroke-dashoffset: 30; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function UpdateProgressModal({
  open,
  state,
  info,
  progress,
  error,
  onInstall,
  onDismiss,
  onRetry
}: UpdateProgressModalProps) {

  // Smooth progress animation
  const [displayPercent, setDisplayPercent] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (progress?.percent !== undefined) {
      // Smooth animation to target percent
      const target = progress.percent;
      const animate = () => {
        setDisplayPercent(prev => {
          const diff = target - prev;
          if (Math.abs(diff) < 0.1) return target;
          return prev + diff * 0.1;
        });
        if (Math.abs(displayPercent - target) > 0.1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [progress?.percent]);

  const renderContent = () => {
    switch (state) {
      case 'checking':
        return (
          <div className="flex flex-col items-center py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            <p className="text-white text-lg font-medium">Checking for updates...</p>
            <p className="text-gray-400 text-sm">Please wait</p>
          </div>
        );

      case 'up-to-date':
        return (
          <div className="flex flex-col items-center py-8 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <p className="text-white text-lg font-medium">You're up to date!</p>
            <p className="text-gray-400 text-sm">
              Running version {info?.version || 'latest'}
            </p>
            <Button
              variant="outline"
              onClick={onDismiss}
              className="mt-4 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        );

      case 'available':
        return (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Download className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-medium">Update Available</p>
              <p className="text-purple-400 text-xl font-bold mt-1">
                Version {info?.version}
              </p>
            </div>
            <p className="text-gray-400 text-sm text-center max-w-xs">
              A new version is ready to download. The app will restart after installation.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={onDismiss}
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                Later
              </Button>
              <Button
                onClick={onDismiss} // Download starts automatically
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Downloading...
              </Button>
            </div>
          </div>
        );

      case 'downloading':
        return (
          <div className="flex flex-col items-center py-6 space-y-5">
            {/* Progress Ring */}
            <div className="relative">
              <ProgressRing percent={displayPercent} />
              {/* Pulsing glow effect */}
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: 'radial-gradient(circle, rgba(124, 93, 250, 0.15) 0%, transparent 60%)',
                  transform: 'scale(1.3)'
                }}
              />
            </div>

            {/* Status text */}
            <div className="text-center">
              <p className="text-white text-lg font-medium">
                Downloading v{info?.version}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${displayPercent}%` }}
                />
              </div>
            </div>

            {/* Speed and ETA */}
            {progress && (
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{formatSpeed(progress.bytesPerSecond)}</span>
                <span className="text-gray-600">|</span>
                <span>{formatETA(progress.transferred, progress.total, progress.bytesPerSecond)}</span>
              </div>
            )}

            {/* Size info */}
            {progress && (
              <p className="text-xs text-gray-500">
                {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
              </p>
            )}

            {/* Dismiss button */}
            <Button
              variant="ghost"
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              Hide (download continues)
            </Button>
          </div>
        );

      case 'downloaded':
        return (
          <div className="flex flex-col items-center py-6 space-y-5">
            {/* Animated checkmark */}
            <AnimatedCheckmark size={100} />

            {/* Success text */}
            <div className="text-center">
              <p className="text-white text-xl font-bold">Update Ready!</p>
              <p className="text-gray-400 text-sm mt-1">
                Version {info?.version} is ready to install
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
              <Button
                onClick={onInstall}
                className="bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-medium"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Restart Now
              </Button>
              <Button
                variant="ghost"
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-300"
              >
                Later
              </Button>
            </div>

            <p className="text-xs text-gray-600 text-center max-w-xs">
              The app will close and reopen with the new version
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>

            <div className="text-center">
              <p className="text-white text-lg font-medium">Update Failed</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg w-full max-w-xs">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={onRetry}
                className="border-orange-500/50 text-orange-300 hover:text-orange-200 hover:bg-orange-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={onDismiss}
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (state === 'idle') return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        className="max-w-sm bg-gray-900/95 border-gray-700 backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,15,0.98) 0%, rgba(25,25,25,0.95) 100%)',
          boxShadow: '0 0 40px rgba(124, 93, 250, 0.15)'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            Software Update
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Hook: useAutoUpdate
// ============================================================================

export interface UseAutoUpdateResult {
  state: UpdateState;
  info: UpdateInfo | null;
  progress: DownloadProgress | null;
  error: string | null;
  isModalOpen: boolean;
  checkForUpdates: () => void;
  installUpdate: () => void;
  dismissModal: () => void;
  retryUpdate: () => void;
}

export function useAutoUpdate(): UseAutoUpdateResult {
  const [state, setState] = useState<UpdateState>('idle');
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

  useEffect(() => {
    if (!isElectron) return;

    const api = (window as any).electronAPI;

    // Set up listeners
    api.onUpdateChecking?.(() => {
      setState('checking');
      setIsModalOpen(true);
      setError(null);
    });

    api.onUpdateAvailable?.((updateInfo: UpdateInfo) => {
      setState('downloading'); // Auto-download starts immediately
      setInfo(updateInfo);
      setIsModalOpen(true);
    });

    api.onUpdateNotAvailable?.((updateInfo: UpdateInfo) => {
      setState('up-to-date');
      setInfo(updateInfo);
      // Keep modal open to show "up to date" message
    });

    api.onUpdateDownloadProgress?.((prog: DownloadProgress) => {
      setState('downloading');
      setProgress(prog);
      setIsModalOpen(true);
    });

    api.onUpdateDownloaded?.((updateInfo: UpdateInfo) => {
      setState('downloaded');
      setInfo(updateInfo);
      setIsModalOpen(true);
    });

    api.onUpdateError?.((err: { message: string }) => {
      setState('error');
      setError(err.message);
      setIsModalOpen(true);
    });

    return () => {
      api.removeUpdateListeners?.();
    };
  }, [isElectron]);

  const checkForUpdates = useCallback(() => {
    if (!isElectron) return;
    const api = (window as any).electronAPI;
    setState('checking');
    setIsModalOpen(true);
    setError(null);
    api.checkForUpdates?.();
  }, [isElectron]);

  const installUpdate = useCallback(() => {
    if (!isElectron) return;
    const api = (window as any).electronAPI;
    api.installUpdate?.();
  }, [isElectron]);

  const dismissModal = useCallback(() => {
    setIsModalOpen(false);
    // Reset state if not downloading
    if (state !== 'downloading' && state !== 'downloaded') {
      setState('idle');
    }
  }, [state]);

  const retryUpdate = useCallback(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    state,
    info,
    progress,
    error,
    isModalOpen,
    checkForUpdates,
    installUpdate,
    dismissModal,
    retryUpdate
  };
}

export default UpdateProgressModal;
