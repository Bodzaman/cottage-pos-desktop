/**
 * CommandPalette.tsx
 *
 * VS Code / Spotlight-style command palette for the POS.
 * Triggered by Ctrl+K — fuzzy search for menu items, actions, navigation.
 * Keyboard-first: arrow keys to navigate, Enter to execute, Escape to close.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ShoppingCart, Printer, Lock, RefreshCw, Monitor,
  ChefHat, BarChart3, ClipboardCheck, ArrowRight, Command,
  Zap, Hash, Navigation, Users, Layout, AlertTriangle
} from 'lucide-react';
import { globalColors } from '../../utils/QSAIDesign';
import { colors as designColors } from '../../utils/designSystem';
import { useRealtimeMenuStore } from '../../utils/realtimeMenuStore';
import { usePOSUIStore } from '../../utils/posUIStore';
import { shallow } from 'zustand/shallow';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  keywords: string[];
  icon: React.ReactNode;
  category: 'action' | 'menu' | 'navigation';
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  /** POS action handlers wired from POSDesktop */
  actions: {
    onNewOrder: () => void;
    onCheckout: () => void;
    onPrintReceipt: () => void;
    onLockScreen: () => void;
    onRefreshMenu: () => void;
    onOpenReprint: () => void;
    onOpenKDS: () => void;
    onOpenAllOrders: () => void;
    onOpenQuickTools: () => void;
    onAddMenuItem: (item: any) => void;
    onOpenCustomerDisplay: () => void;
    onOpenEndOfDay: () => void;
    onOpenWorkspaceSetup: () => void;
    onOpen86Board: () => void;
  };
}

// ---------------------------------------------------------------------------
// Fuzzy matching
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, text: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact substring match — highest score
  if (t.includes(q)) {
    const idx = t.indexOf(q);
    // Bonus if match is at the start of the string or a word boundary
    const startBonus = idx === 0 ? 100 : 0;
    const wordBoundary = idx > 0 && (t[idx - 1] === ' ' || t[idx - 1] === '-') ? 50 : 0;
    return { match: true, score: 200 + startBonus + wordBoundary - idx };
  }

  // Character-order match (all query chars appear in order)
  let qi = 0;
  let consecutive = 0;
  let maxConsecutive = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  }

  if (qi === q.length) {
    return { match: true, score: 50 + maxConsecutive * 10 };
  }

  return { match: false, score: 0 };
}

// ---------------------------------------------------------------------------
// Category labels & styling
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  action: { label: 'Actions', color: '#7C3AED' },
  menu: { label: 'Menu Items', color: '#10B981' },
  navigation: { label: 'Navigation', color: '#3B82F6' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, actions }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Menu items from store for searching
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);

  // Build command registry
  const commands = useMemo<CommandItem[]>(() => {
    const staticCommands: CommandItem[] = [
      // Actions
      {
        id: 'new-order',
        label: 'New Order',
        description: 'Clear cart and start fresh (F1)',
        keywords: ['new', 'order', 'clear', 'fresh', 'reset'],
        icon: <ShoppingCart className="h-4 w-4" />,
        category: 'action',
        action: actions.onNewOrder,
      },
      {
        id: 'checkout',
        label: 'Checkout',
        description: 'Open payment flow (F2)',
        keywords: ['checkout', 'pay', 'payment', 'card', 'cash'],
        icon: <ArrowRight className="h-4 w-4" />,
        category: 'action',
        action: actions.onCheckout,
      },
      {
        id: 'print-receipt',
        label: 'Print Receipt',
        description: 'Print current receipt (F3)',
        keywords: ['print', 'receipt', 'ticket', 'kitchen'],
        icon: <Printer className="h-4 w-4" />,
        category: 'action',
        action: actions.onPrintReceipt,
      },
      {
        id: 'lock-screen',
        label: 'Lock Screen',
        description: 'Lock the POS (F4)',
        keywords: ['lock', 'screen', 'secure', 'pin'],
        icon: <Lock className="h-4 w-4" />,
        category: 'action',
        action: actions.onLockScreen,
      },
      {
        id: 'refresh-menu',
        label: 'Refresh Menu',
        description: 'Reload menu from server (F5)',
        keywords: ['refresh', 'menu', 'reload', 'sync'],
        icon: <RefreshCw className="h-4 w-4" />,
        category: 'action',
        action: actions.onRefreshMenu,
      },
      {
        id: 'reprint',
        label: 'Reprint Receipt',
        description: 'Reprint a previous receipt (Ctrl+P)',
        keywords: ['reprint', 'receipt', 'previous', 'last'],
        icon: <Printer className="h-4 w-4" />,
        category: 'action',
        action: actions.onOpenReprint,
      },
      {
        id: 'customer-display',
        label: 'Customer Display',
        description: 'Toggle secondary customer display',
        keywords: ['customer', 'display', 'monitor', 'screen', 'secondary'],
        icon: <Monitor className="h-4 w-4" />,
        category: 'action',
        action: actions.onOpenCustomerDisplay,
      },

      // Navigation
      {
        id: 'nav-kds',
        label: 'Kitchen Display',
        description: 'Open KDS in a new window',
        keywords: ['kitchen', 'display', 'kds', 'cook', 'chef'],
        icon: <ChefHat className="h-4 w-4" />,
        category: 'navigation',
        action: actions.onOpenKDS,
      },
      {
        id: 'nav-orders',
        label: 'View All Orders',
        description: 'View comprehensive order history',
        keywords: ['orders', 'history', 'all', 'view', 'past'],
        icon: <BarChart3 className="h-4 w-4" />,
        category: 'navigation',
        action: actions.onOpenAllOrders,
      },
      {
        id: 'nav-quick-tools',
        label: 'Quick Tools',
        description: 'Staff tools and management features',
        keywords: ['quick', 'tools', 'management', 'admin', 'staff'],
        icon: <Zap className="h-4 w-4" />,
        category: 'navigation',
        action: actions.onOpenQuickTools,
      },
      {
        id: 'nav-end-of-day',
        label: 'End of Day',
        description: 'Cash count and daily report',
        keywords: ['end', 'day', 'close', 'cash', 'z-report', 'report', 'reconciliation'],
        icon: <ClipboardCheck className="h-4 w-4" />,
        category: 'navigation',
        action: actions.onOpenEndOfDay,
      },
      {
        id: 'workspace-setup',
        label: 'Workspace Setup',
        description: 'Configure multi-monitor layout',
        keywords: ['workspace', 'monitor', 'display', 'layout', 'dual', 'screen', 'setup'],
        icon: <Layout className="h-4 w-4" />,
        category: 'action',
        action: actions.onOpenWorkspaceSetup,
      },
      {
        id: '86-board',
        label: '86 Board',
        description: 'View and manage out-of-stock items (Ctrl+8)',
        keywords: ['86', 'eighty-six', 'out', 'stock', 'unavailable', 'sold out'],
        icon: <AlertTriangle className="h-4 w-4" />,
        category: 'action',
        action: actions.onOpen86Board,
      },
    ];

    // Add menu items (capped at 50 to keep the list manageable)
    const menuCommands: CommandItem[] = menuItems.slice(0, 200).map((item: any) => ({
      id: `menu-${item.id}`,
      label: item.name || item.display_name || 'Menu Item',
      description: item.price ? `£${parseFloat(item.price).toFixed(2)}` : undefined,
      keywords: [
        item.name?.toLowerCase() || '',
        item.display_name?.toLowerCase() || '',
        item.description?.toLowerCase() || '',
      ].filter(Boolean),
      icon: <Hash className="h-4 w-4" />,
      category: 'menu' as const,
      action: () => actions.onAddMenuItem(item),
    }));

    return [...staticCommands, ...menuCommands];
  }, [actions, menuItems]);

  // Filter and rank results
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show static commands when no query, grouped by category
      return commands.filter(c => c.category !== 'menu');
    }

    const scored = commands
      .map(cmd => {
        // Match against label and keywords
        const labelMatch = fuzzyMatch(query, cmd.label);
        const keywordMatches = cmd.keywords.map(kw => fuzzyMatch(query, kw));
        const bestKeyword = keywordMatches.reduce(
          (best, m) => (m.score > best.score ? m : best),
          { match: false, score: 0 }
        );
        const bestScore = Math.max(labelMatch.score, bestKeyword.score);
        const isMatch = labelMatch.match || bestKeyword.match;
        return { cmd, score: bestScore, match: isMatch };
      })
      .filter(r => r.match)
      .sort((a, b) => b.score - a.score);

    return scored.map(r => r.cmd).slice(0, 12);
  }, [query, commands]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Group by category for display
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  // Flat list for index tracking
  const flatIndex = useCallback(
    (category: string, indexInGroup: number) => {
      let idx = 0;
      for (const [cat, items] of Object.entries(groupedCommands)) {
        if (cat === category) return idx + indexInGroup;
        idx += items.length;
      }
      return idx;
    },
    [groupedCommands]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-xl mx-4 rounded-xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: designColors.background.primary,
              border: `1px solid ${globalColors.border.medium || 'rgba(255,255,255,0.1)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Search className="h-5 w-5 flex-shrink-0" style={{ color: globalColors.text.secondary }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, menu items..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: globalColors.text.primary }}
                autoComplete="off"
                spellCheck={false}
              />
              <kbd
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: globalColors.text.secondary,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[360px] overflow-y-auto py-1"
              style={{ scrollbarWidth: 'thin' }}
            >
              {filteredCommands.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm" style={{ color: globalColors.text.secondary }}>
                    No results for "{query}"
                  </p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, items]) => (
                  <div key={category}>
                    {/* Category header */}
                    <div
                      className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: CATEGORY_CONFIG[category]?.color || globalColors.text.secondary }}
                    >
                      {CATEGORY_CONFIG[category]?.label || category}
                    </div>

                    {/* Items */}
                    {items.map((cmd, indexInGroup) => {
                      const globalIdx = flatIndex(category, indexInGroup);
                      const isSelected = globalIdx === selectedIndex;

                      return (
                        <button
                          key={cmd.id}
                          data-selected={isSelected}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75"
                          style={{
                            backgroundColor: isSelected
                              ? 'rgba(124, 58, 237, 0.12)'
                              : 'transparent',
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          onClick={() => {
                            cmd.action();
                            onClose();
                          }}
                        >
                          <div
                            className="flex-shrink-0 p-1.5 rounded-md"
                            style={{
                              backgroundColor: isSelected
                                ? 'rgba(124, 58, 237, 0.2)'
                                : 'rgba(255,255,255,0.04)',
                              color: isSelected
                                ? '#A78BFA'
                                : globalColors.text.secondary,
                            }}
                          >
                            {cmd.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-medium truncate"
                              style={{
                                color: isSelected
                                  ? globalColors.text.primary
                                  : globalColors.text.primary,
                              }}
                            >
                              {cmd.label}
                            </div>
                            {cmd.description && (
                              <div
                                className="text-xs truncate mt-0.5"
                                style={{ color: globalColors.text.secondary }}
                              >
                                {cmd.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight
                              className="h-3.5 w-3.5 flex-shrink-0"
                              style={{ color: '#7C3AED' }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px]" style={{ color: globalColors.text.secondary }}>
                  <kbd className="px-1 py-0.5 rounded font-mono text-[9px]" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: globalColors.text.secondary }}>
                  <kbd className="px-1 py-0.5 rounded font-mono text-[9px]" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>↵</kbd>
                  Select
                </span>
              </div>
              <span className="text-[10px]" style={{ color: globalColors.text.secondary }}>
                <Command className="inline h-3 w-3 mr-0.5" style={{ verticalAlign: 'middle' }} />K to toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
