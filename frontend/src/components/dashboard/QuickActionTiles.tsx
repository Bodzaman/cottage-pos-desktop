import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, UtensilsCrossed, MapPin, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from 'utils/cn';

interface QuickActionTile {
  id: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  badge?: string | number;
  hidden?: boolean;
}

interface QuickActionTilesProps {
  lastOrderDate?: string;
  defaultAddressLabel?: string;
  activeOrderCount?: number;
  onReorderLast: () => void;
  onManageAddress: () => void;
  isReordering?: boolean;
  hasLastOrder?: boolean;
}

export function QuickActionTiles({
  lastOrderDate,
  defaultAddressLabel,
  activeOrderCount = 0,
  onReorderLast,
  onManageAddress,
  isReordering = false,
  hasLastOrder = false,
}: QuickActionTilesProps) {
  const navigate = useNavigate();

  const tiles: QuickActionTile[] = [
    {
      id: 'reorder',
      icon: RotateCcw,
      label: 'Reorder',
      sublabel: lastOrderDate || 'Last order',
      onClick: onReorderLast,
      disabled: !hasLastOrder || isReordering,
      loading: isReordering,
      hidden: !hasLastOrder,
    },
    {
      id: 'browse',
      icon: UtensilsCrossed,
      label: 'Browse Menu',
      sublabel: 'Order now',
      onClick: () => navigate('/online-orders'),
    },
    {
      id: 'address',
      icon: MapPin,
      label: 'Address',
      sublabel: defaultAddressLabel || 'Manage',
      onClick: onManageAddress,
    },
    {
      id: 'track',
      icon: Package,
      label: 'Track Order',
      sublabel: activeOrderCount > 0 ? `${activeOrderCount} active` : 'View orders',
      onClick: () => navigate('/customer-portal#orders'),
      badge: activeOrderCount > 0 ? activeOrderCount : undefined,
    },
  ];

  const visibleTiles = tiles.filter(tile => !tile.hidden);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {visibleTiles.map((tile, index) => {
        const Icon = tile.icon;
        return (
          <motion.button
            key={tile.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            onClick={tile.onClick}
            disabled={tile.disabled}
            className={cn(
              'relative flex flex-col items-center justify-center gap-2',
              'p-4 md:p-5 rounded-xl',
              'bg-white/5 border border-white/10 backdrop-blur-sm',
              'transition-all duration-200',
              'hover:bg-white/10 hover:border-[#8B1538]/30 hover:shadow-[0_0_20px_rgba(139,21,56,0.1)]',
              'active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1538]/50'
            )}
          >
            {/* Badge */}
            {tile.badge && (
              <div className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-[#8B1538] text-white text-xs font-medium flex items-center justify-center">
                {tile.badge}
              </div>
            )}

            {/* Icon */}
            <div className={cn(
              'p-3 rounded-xl',
              'bg-[#8B1538]/15 border border-[#8B1538]/20',
              'transition-colors duration-200',
              'group-hover:bg-[#8B1538]/20'
            )}>
              {tile.loading ? (
                <Loader2 className="h-5 w-5 text-[#8B1538] animate-spin" />
              ) : (
                <Icon className="h-5 w-5 text-[#8B1538]" />
              )}
            </div>

            {/* Label */}
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {tile.label}
              </p>
              {tile.sublabel && (
                <p className="text-xs text-gray-500 truncate max-w-[100px]">
                  {tile.sublabel}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export default QuickActionTiles;
