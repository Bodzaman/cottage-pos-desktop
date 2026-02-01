import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Plus } from 'lucide-react';
import { MenuItem } from '../utils/types';
import { computeUnitPrice } from 'utils/priceUtils';
import { useCartStore } from 'utils/cartStore';

interface ChatMenuCardProps {
  item: MenuItem;
  animationDelay?: number;
  onView: (item: MenuItem) => void;
  onAdd: (item: MenuItem) => void;
}

export function ChatMenuCard({ item, animationDelay = 0, onView, onAdd }: ChatMenuCardProps) {
  const { currentOrderMode } = useCartStore();
  const mode: 'delivery' | 'collection' = currentOrderMode === 'delivery' ? 'delivery' : 'collection';

  const unitPrice = computeUnitPrice({ item, variant: null, mode });

  const imageUrl = item.image_url || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay / 1000, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 w-[172px] snap-start rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      {/* Image */}
      {imageUrl ? (
        <div className="relative w-full h-[100px] bg-black/20">
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-[100px] bg-gradient-to-br from-orange-900/30 to-amber-900/20 flex items-center justify-center">
          <span className="text-2xl opacity-40">🍽</span>
        </div>
      )}

      {/* Content */}
      <div className="p-2.5 flex flex-col gap-1.5">
        {/* Name */}
        <h4 className="text-sm font-semibold text-white truncate" title={item.name}>
          {item.name}
        </h4>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-tight">
            {item.description}
          </p>
        )}

        {/* Price */}
        <span className="text-sm font-semibold text-orange-300">
          {unitPrice > 0 ? `£${unitPrice.toFixed(2)}` : 'From menu'}
        </span>

        {/* Buttons */}
        <div className="flex gap-1.5 mt-1">
          <button
            onClick={() => onView(item)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          <button
            onClick={() => onAdd(item)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-white bg-orange-600 hover:bg-orange-500 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
