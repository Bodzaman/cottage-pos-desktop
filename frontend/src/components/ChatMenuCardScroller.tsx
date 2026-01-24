import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ChatMenuCard } from './ChatMenuCard';
import { ItemInfoModal } from './ItemInfoModal';
import { MenuItem } from '../utils/menuTypes';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { useCartStore } from 'utils/cartStore';
import { useCartProposalActions } from 'utils/chat-store';
import { computeUnitPrice } from 'utils/priceUtils';
import { CartProposal } from '../types/structured-events';
import { MenuRef } from '../types/structured-events';

interface ChatMenuCardScrollerProps {
  /** Full menu items from structured_data event */
  items?: MenuItem[];
  /** Menu refs (IDs only) from menu_refs event — resolved via realtimeMenuStore */
  menuRefs?: MenuRef[];
  messageId: string;
}

const MAX_VISIBLE_CARDS = 8;

export function ChatMenuCardScroller({ items, menuRefs, messageId }: ChatMenuCardScrollerProps) {
  const { menuItems, itemVariants } = useRealtimeMenuStore();
  const { currentOrderMode } = useCartStore();
  const { setPendingCartProposal, openCartConfirmDialog } = useCartProposalActions();

  const [viewItem, setViewItem] = useState<MenuItem | null>(null);

  // Resolve items: prefer direct items, fall back to resolving menuRefs via store
  const resolvedItems: MenuItem[] = React.useMemo(() => {
    if (items && items.length > 0) return items;
    if (menuRefs && menuRefs.length > 0) {
      return menuRefs
        .map(ref => menuItems?.find(item => item.id === ref.menu_item_id))
        .filter(Boolean) as MenuItem[];
    }
    return [];
  }, [items, menuRefs, menuItems]);

  if (resolvedItems.length === 0) return null;

  const mode: 'delivery' | 'collection' = currentOrderMode === 'delivery' ? 'delivery' : 'collection';

  const handleView = (item: MenuItem) => {
    setViewItem(item);
  };

  const handleAdd = (item: MenuItem) => {
    const variants = itemVariants?.filter(v => v.menu_item_id === item.id && v.is_active) || [];

    // If multiple variants, open info modal so user picks one
    if (variants.length > 1) {
      setViewItem(item);
      return;
    }

    const variant = variants[0] || null;
    const unitPrice = computeUnitPrice({ item, variant, mode });

    const proposal: CartProposal = {
      operation: 'add',
      items: [{
        menu_item_id: item.id,
        variant_id: variant?.id,
        quantity: 1,
        item_name: item.name,
        variant_name: variant?.name || (variant as any)?.variant_name,
        unit_price: unitPrice,
      }],
      total_delta: unitPrice,
      confirmation_required: true,
      allow_qty_edit: true,
    };

    setPendingCartProposal(proposal);
    openCartConfirmDialog();
  };

  const showMoreCard = resolvedItems.length >= MAX_VISIBLE_CARDS;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="mt-3 overflow-hidden"
      >
        <div
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {resolvedItems.slice(0, MAX_VISIBLE_CARDS).map((item, index) => (
            <ChatMenuCard
              key={`${messageId}-card-${item.id}-${index}`}
              item={item}
              animationDelay={index * 100}
              onView={handleView}
              onAdd={handleAdd}
            />
          ))}

          {/* Show more card */}
          {showMoreCard && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (MAX_VISIBLE_CARDS * 100) / 1000 }}
              className="flex-shrink-0 w-[172px] snap-start rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => {
                // Trigger a "show more" message in chat
                const input = document.querySelector<HTMLTextAreaElement>('[data-chat-input]');
                if (input) {
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype, 'value'
                  )?.set;
                  nativeInputValueSetter?.call(input, 'Show me more options');
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  // Submit after a tick
                  setTimeout(() => {
                    const form = input.closest('form');
                    form?.dispatchEvent(new Event('submit', { bubbles: true }));
                  }, 50);
                }
              }}
            >
              <div className="flex flex-col items-center gap-2 p-4">
                <ChevronRight className="w-6 h-6 text-orange-300" />
                <span className="text-sm font-medium text-orange-300">Show more</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Item Info Modal */}
      {viewItem && (
        <ItemInfoModal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          item={viewItem}
          itemVariants={itemVariants?.filter(v => v.menu_item_id === viewItem.id) || []}
          mode={mode}
        />
      )}
    </>
  );
}
