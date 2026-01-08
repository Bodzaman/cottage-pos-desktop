import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, X } from 'lucide-react';
import { AuthTheme } from 'utils/authTheme';
import { Button } from '@/components/ui/button';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'utility';
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
}

/**
 * KeyboardShortcutsHelp - Help modal for keyboard shortcuts
 * 
 * Displays all available keyboard shortcuts grouped by category
 * Triggered by pressing "?" (Shift + /)
 */
export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  isAuthenticated = false
}: KeyboardShortcutsHelpProps) {
  
  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts (authenticated users only)
    ...(isAuthenticated ? [
      { keys: ['Alt', '1'], description: 'Go to Profile section', category: 'navigation' as const },
      { keys: ['Alt', '2'], description: 'Go to Addresses section', category: 'navigation' as const },
      { keys: ['Alt', '3'], description: 'Go to Orders section', category: 'navigation' as const },
      { keys: ['Alt', '4'], description: 'Go to Favorites section', category: 'navigation' as const },
      { keys: ['Alt', 'M'], description: 'Go to Menu', category: 'navigation' as const },
      { keys: ['Alt', 'C'], description: 'Open Cart', category: 'actions' as const },
    ] : []),
    
    // Utility shortcuts (always available)
    { keys: ['Esc'], description: 'Close modals and drawers', category: 'utility' as const },
    { keys: ['?'], description: 'Show this help dialog', category: 'utility' as const },
  ];

  const categoryLabels = {
    navigation: '🧭 Navigation',
    actions: '⚡ Actions',
    utility: '🛠️ Utility'
  };

  const categories = ['navigation', 'actions', 'utility'] as const;
  const groupedShortcuts = categories.reduce((acc, category) => {
    acc[category] = shortcuts.filter(s => s.category === category);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl bg-[#17191D] border-white/10 text-[#EAECEF]"
        aria-describedby="keyboard-shortcuts-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Keyboard className="h-6 w-6 text-[#8B1538]" aria-hidden="true" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description" className="text-[#B7BDC6]">
            Use these keyboard shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map(category => {
            const categoryShortcuts = groupedShortcuts[category];
            if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-[#8B92A0] mb-3">
                  {categoryLabels[category]}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <motion.div
                      key={`${category}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:border-[#8B1538]/30 transition-colors"
                    >
                      <span className="text-[#EAECEF]">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && (
                              <span className="text-[#8B92A0] mx-1" aria-hidden="true">+</span>
                            )}
                            <Badge 
                              className="bg-[#8B1538]/20 text-[#EAECEF] border border-[#8B1538]/40 font-mono px-2 py-1"
                              variant="outline"
                            >
                              {key}
                            </Badge>
                          </React.Fragment>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-[#8B92A0] text-center">
            Shortcuts are disabled when typing in input fields
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
