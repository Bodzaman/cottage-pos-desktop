/**
 * WorkspaceSetupWizard.tsx
 *
 * Multi-monitor workspace setup modal.
 * Detects connected monitors, offers one-click preset layouts,
 * and saves layout for auto-restore on startup.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, ChefHat, Users, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { globalColors } from '../../utils/QSAIDesign';
import { colors as designColors } from '../../utils/designSystem';
import { toast } from 'sonner';

interface DisplayInfo {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  isPrimary: boolean;
  scaleFactor: number;
}

interface WorkspaceLayout {
  pos: { displayId: number };
  kds?: { displayId: number };
  customerDisplay?: { displayId: number };
}

interface WorkspaceSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Preset layouts based on monitor count
const PRESETS = {
  single: {
    label: 'Single Monitor',
    description: 'POS fullscreen on your main display',
    icon: <Monitor className="h-5 w-5" />,
  },
  dual_pos_customer: {
    label: 'POS + Customer Display',
    description: 'POS on primary, customer display on secondary',
    icon: <Users className="h-5 w-5" />,
  },
  dual_pos_kds: {
    label: 'POS + Kitchen Display',
    description: 'POS on primary, KDS on secondary',
    icon: <ChefHat className="h-5 w-5" />,
  },
  triple: {
    label: 'Full Setup',
    description: 'POS + KDS + Customer Display, each on its own screen',
    icon: <Monitor className="h-5 w-5" />,
  },
};

export const WorkspaceSetupWizard: React.FC<WorkspaceSetupWizardProps> = ({ isOpen, onClose }) => {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
  const isElectron = !!electronAPI?.getDisplays;

  // Fetch displays
  useEffect(() => {
    if (!isOpen || !isElectron) return;

    const fetchDisplays = async () => {
      setLoading(true);
      try {
        const result = await electronAPI.getDisplays();
        if (result?.success) {
          setDisplays(result.displays);
        }
      } catch {
        toast.error('Failed to detect monitors');
      }
      setLoading(false);
    };

    fetchDisplays();

    // Listen for display changes
    electronAPI.onDisplaysChanged?.(() => fetchDisplays());
    return () => electronAPI.removeDisplaysChangedListener?.();
  }, [isOpen, isElectron]);

  // Build layout from preset
  const buildLayout = useCallback((preset: string): WorkspaceLayout | null => {
    if (displays.length === 0) return null;

    const primary = displays.find(d => d.isPrimary) || displays[0];
    const secondary = displays.find(d => !d.isPrimary);
    const tertiary = displays.length >= 3 ? displays.find(d => !d.isPrimary && d.id !== secondary?.id) : null;

    switch (preset) {
      case 'single':
        return { pos: { displayId: primary.id } };
      case 'dual_pos_customer':
        return {
          pos: { displayId: primary.id },
          customerDisplay: secondary ? { displayId: secondary.id } : undefined,
        };
      case 'dual_pos_kds':
        return {
          pos: { displayId: primary.id },
          kds: secondary ? { displayId: secondary.id } : undefined,
        };
      case 'triple':
        return {
          pos: { displayId: primary.id },
          kds: secondary ? { displayId: secondary.id } : undefined,
          customerDisplay: tertiary ? { displayId: tertiary.id } : (secondary ? { displayId: secondary.id } : undefined),
        };
      default:
        return null;
    }
  }, [displays]);

  // Apply layout
  const handleApply = useCallback(async () => {
    if (!selectedPreset || !isElectron) return;

    const layout = buildLayout(selectedPreset);
    if (!layout) return;

    setApplying(true);
    try {
      const result = await electronAPI.applyWorkspaceLayout(layout);
      if (result?.success) {
        toast.success('Workspace layout applied');
        onClose();
      } else {
        toast.error('Failed to apply layout');
      }
    } catch {
      toast.error('Failed to apply layout');
    }
    setApplying(false);
  }, [selectedPreset, buildLayout, isElectron, onClose]);

  // Available presets based on monitor count
  const availablePresets = displays.length >= 3
    ? ['single', 'dual_pos_customer', 'dual_pos_kds', 'triple']
    : displays.length >= 2
    ? ['single', 'dual_pos_customer', 'dual_pos_kds']
    : ['single'];

  if (!isElectron) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-lg mx-4 rounded-xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: designColors.background.primary,
              border: `1px solid ${globalColors.border.light}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: globalColors.text.primary }}>
                  Workspace Setup
                </h2>
                <p className="text-xs mt-0.5" style={{ color: globalColors.text.secondary }}>
                  {displays.length} monitor{displays.length !== 1 ? 's' : ''} detected
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Monitor visualisation */}
            <div className="px-6 py-4">
              <div className="flex items-end justify-center gap-3 mb-6">
                {loading ? (
                  <div className="text-sm" style={{ color: globalColors.text.secondary }}>Detecting monitors...</div>
                ) : (
                  displays.map((d, i) => (
                    <div key={d.id} className="flex flex-col items-center">
                      <div
                        className="rounded-lg border-2 flex items-center justify-center"
                        style={{
                          width: Math.max(80, (d.bounds.width / d.bounds.height) * 60),
                          height: 60,
                          borderColor: d.isPrimary ? '#7C3AED' : 'rgba(255,255,255,0.15)',
                          backgroundColor: d.isPrimary ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <Monitor className="h-4 w-4" style={{ color: d.isPrimary ? '#7C3AED' : 'rgba(255,255,255,0.3)' }} />
                      </div>
                      <span className="text-[10px] mt-1" style={{ color: globalColors.text.secondary }}>
                        {d.isPrimary ? 'Primary' : `Monitor ${i + 1}`}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Layout presets */}
              <div className="space-y-2">
                {availablePresets.map((presetKey) => {
                  const preset = PRESETS[presetKey as keyof typeof PRESETS];
                  const isSelected = selectedPreset === presetKey;
                  return (
                    <button
                      key={presetKey}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-150"
                      style={{
                        backgroundColor: isSelected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                      onClick={() => setSelectedPreset(presetKey)}
                    >
                      <div
                        className="p-2 rounded-md flex-shrink-0"
                        style={{
                          backgroundColor: isSelected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                          color: isSelected ? '#A78BFA' : globalColors.text.secondary,
                        }}
                      >
                        {preset.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                          {preset.label}
                        </div>
                        <div className="text-xs" style={{ color: globalColors.text.secondary }}>
                          {preset.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#7C3AED' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {displays.length < 2 && (
                <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-300">
                    Connect additional monitors to unlock multi-display layouts
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={!selectedPreset || applying}
                className="text-white font-medium"
                style={{
                  backgroundColor: selectedPreset ? '#7C3AED' : 'rgba(124,58,237,0.3)',
                }}
              >
                {applying ? 'Applying...' : 'Apply Layout'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
