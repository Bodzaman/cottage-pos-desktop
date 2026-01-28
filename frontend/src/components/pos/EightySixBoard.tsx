/**
 * EightySixBoard.tsx
 *
 * Floating panel showing all 86'd (out-of-stock) menu items.
 * Toggled with Ctrl+8. Staff can restore items with one click.
 * Syncs across all terminals via Supabase Realtime on menu_items.is_available.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, RotateCcw, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { globalColors } from '../../utils/QSAIDesign';
import { colors as designColors } from '../../utils/designSystem';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EightySixedItem {
  id: string;
  name: string;
  category_name?: string;
  image_url?: string | null;
  eighty_sixed_at?: string; // ISO timestamp when marked 86
}

interface EightySixBoardProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EightySixBoard: React.FC<EightySixBoardProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<EightySixedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Fetch all 86'd items
  const fetchEightySixedItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, image_url, category:categories(name)')
        .eq('is_available', false)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setItems(
        (data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          category_name: row.category?.name || 'Uncategorised',
          image_url: row.image_url,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch 86 items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchEightySixedItems();
    }
  }, [isOpen, fetchEightySixedItems]);

  // Realtime subscription for cross-terminal sync
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('eighty-six-board')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'menu_items',
          filter: 'active=eq.true',
        },
        (payload: any) => {
          const updated = payload.new;
          if (!updated) return;

          if (updated.is_available === false) {
            // Item was 86'd — add to list if not already there
            setItems(prev => {
              if (prev.find(i => i.id === updated.id)) return prev;
              return [...prev, { id: updated.id, name: updated.name, image_url: updated.image_url }];
            });
          } else {
            // Item was restored — remove from list
            setItems(prev => prev.filter(i => i.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Restore an item (mark as available)
  const handleRestore = useCallback(async (itemId: string) => {
    setRestoringId(itemId);
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: true })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Item restored');
    } catch (err) {
      console.error('Failed to restore item:', err);
      toast.error('Failed to restore item');
    } finally {
      setRestoringId(null);
    }
  }, []);

  // Restore all items
  const handleRestoreAll = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const ids = items.map(i => i.id);
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: true })
        .in('id', ids);

      if (error) throw error;

      setItems([]);
      toast.success(`${ids.length} item${ids.length > 1 ? 's' : ''} restored`);
    } catch (err) {
      console.error('Failed to restore all:', err);
      toast.error('Failed to restore items');
    }
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!filter.trim()) return items;
    const q = filter.toLowerCase();
    return items.filter(
      i => i.name.toLowerCase().includes(q) || (i.category_name || '').toLowerCase().includes(q)
    );
  }, [items, filter]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, EightySixedItem[]> = {};
    for (const item of filteredItems) {
      const cat = item.category_name || 'Uncategorised';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [filteredItems]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-lg mx-4 rounded-xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
            style={{
              backgroundColor: designColors.background.primary,
              border: `1px solid ${globalColors.border.medium || 'rgba(255,255,255,0.1)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                >
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: globalColors.text.primary }}>
                    86 Board
                  </h2>
                  <p className="text-xs" style={{ color: globalColors.text.secondary }}>
                    {items.length} item{items.length !== 1 ? 's' : ''} unavailable
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestoreAll}
                    className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Restore All
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                >
                  <X className="h-4 w-4" style={{ color: globalColors.text.secondary }} />
                </button>
              </div>
            </div>

            {/* Search */}
            {items.length > 5 && (
              <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <Search className="h-3.5 w-3.5" style={{ color: globalColors.text.secondary }} />
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter 86'd items..."
                    className="flex-1 bg-transparent outline-none text-xs"
                    style={{ color: globalColors.text.primary }}
                  />
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Package className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  <p className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                    {items.length === 0 ? 'All items available' : 'No matches'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: globalColors.text.secondary }}>
                    {items.length === 0
                      ? 'Right-click a menu item to mark it as 86\'d'
                      : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, categoryItems]) => (
                  <div key={category}>
                    <div
                      className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: globalColors.text.secondary }}
                    >
                      {category}
                    </div>
                    {categoryItems.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-3 px-4 py-2.5 group"
                      >
                        {/* Item image or fallback */}
                        <div
                          className="w-8 h-8 rounded-md flex-shrink-0 overflow-hidden"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover opacity-50 grayscale"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-400/60" />
                            </div>
                          )}
                        </div>

                        {/* Item name */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: globalColors.text.primary }}
                          >
                            {item.name}
                          </p>
                        </div>

                        {/* Restore button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(item.id)}
                          disabled={restoringId === item.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 h-7 px-2"
                        >
                          {restoringId === item.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-400" />
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-[10px]" style={{ color: globalColors.text.secondary }}>
                Right-click menu items to 86 them
              </span>
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: globalColors.text.secondary,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Ctrl+8
              </kbd>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
