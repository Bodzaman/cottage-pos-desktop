import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PremiumCard } from 'components/PremiumCard';
import { ActiveOrderCard } from 'components/dashboard/ActiveOrderCard';
import { NoActiveOrderCTA } from 'components/dashboard/NoActiveOrderCTA';
import { QuickActionTiles } from 'components/dashboard/QuickActionTiles';
import type { EnrichedFavoriteItem } from 'types';

interface RecommendedItem {
  menu_item_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  spice_level: number;
  score: number;
  reason_tags: string[];
}

interface Props {
  profile: any;
  addresses?: any[];
  orderHistory: any[] | null;
  enrichedFavorites: EnrichedFavoriteItem[];
  recommendations: RecommendedItem[] | null;
  recommendationsLoading: boolean;
  onReorder: (order: any) => Promise<void>;
  onAddToCart: (favorite: EnrichedFavoriteItem) => void;
  isReordering: string | null;
  onNavigateToAddresses?: () => void;
}

// Reason tag to human-readable label
const reasonTagLabels: Record<string, string> = {
  reorder_staple: 'Ordered often',
  bought_together: 'Goes well together',
  new_in_category: 'New for you',
  matches_spice: 'Matches your taste',
  popular: 'Customer favorite'
};

// Active order statuses
const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'on_the_way'];

// Favorites strip with scroll affordance
function FavoritesStrip({
  favorites,
  totalCount,
  onAddToCart,
  onViewAll
}: {
  favorites: EnrichedFavoriteItem[];
  totalCount: number;
  onAddToCart: (favorite: EnrichedFavoriteItem) => void;
  onViewAll: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and update states
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      // Also check on resize
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [favorites]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -120 : 120;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative group/strip">
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#17191D]/90 border border-white/20 flex items-center justify-center text-white hover:bg-[#8B1538] hover:border-[#8B1538] transition-all shadow-lg -ml-2"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#17191D]/90 border border-white/20 flex items-center justify-center text-white hover:bg-[#8B1538] hover:border-[#8B1538] transition-all shadow-lg -mr-2"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Gradient fade left */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#1A1C20] to-transparent pointer-events-none z-[5]" />
      )}

      {/* Gradient fade right */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#1A1C20] to-transparent pointer-events-none z-[5]" />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth"
      >
        {favorites.map((favorite) => (
          <button
            key={favorite.favorite_id}
            onClick={() => favorite.display_is_available && onAddToCart(favorite)}
            disabled={!favorite.display_is_available}
            className="flex-shrink-0 group relative w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#8B1538]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={favorite.display_name}
          >
            {favorite.display_image_url ? (
              <img
                src={favorite.display_image_url}
                alt={favorite.display_name}
                className={`w-full h-full object-cover ${!favorite.display_is_available ? 'grayscale' : ''}`}
              />
            ) : (
              <div className="w-full h-full bg-[#8B1538]/20 flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-[#8B1538]" />
              </div>
            )}
            {/* Add overlay on hover/touch */}
            {favorite.display_is_available && (
              <div className="absolute inset-0 bg-[#8B1538]/80 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
            )}
          </button>
        ))}
        {totalCount > 6 && (
          <button
            onClick={onViewAll}
            className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/5 border border-white/10 hover:border-[#8B1538]/30 transition-all flex items-center justify-center"
          >
            <span className="text-xs text-gray-400">+{totalCount - 6}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomerDashboard({
  profile,
  addresses = [],
  orderHistory,
  enrichedFavorites,
  recommendations,
  recommendationsLoading,
  onReorder,
  onAddToCart,
  isReordering,
  onNavigateToAddresses
}: Props) {
  const navigate = useNavigate();

  // Get active orders and last completed order
  const { activeOrder, lastOrder, activeOrderCount } = useMemo(() => {
    if (!orderHistory || orderHistory.length === 0) {
      return { activeOrder: null, lastOrder: null, activeOrderCount: 0 };
    }

    const activeOrders = orderHistory.filter(order => ACTIVE_STATUSES.includes(order.status));
    const completedOrders = orderHistory.filter(order => !ACTIVE_STATUSES.includes(order.status));

    return {
      activeOrder: activeOrders[0] || null,
      lastOrder: completedOrders[0] || orderHistory[0],
      activeOrderCount: activeOrders.length,
    };
  }, [orderHistory]);

  // Get default address label
  const defaultAddressLabel = useMemo((): string => {
    const defaultAddr = addresses?.find((a: { is_default?: boolean }) => a.is_default);
    if (defaultAddr?.label) return defaultAddr.label;
    if (defaultAddr?.address_line1) {
      return defaultAddr.address_line1.substring(0, 20) + (defaultAddr.address_line1.length > 20 ? '...' : '');
    }
    return addresses?.length ? 'Select address' : 'Add address';
  }, [addresses]);

  // Get last order date for quick tiles
  const lastOrderDate = useMemo(() => {
    if (!lastOrder) return undefined;
    return new Date(lastOrder.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  }, [lastOrder]);

  // Get top favorites (max 6 for horizontal strip)
  const topFavorites = enrichedFavorites?.slice(0, 6) || [];

  // Get top recommendations (max 4)
  const topRecommendations = recommendations?.slice(0, 4) || [];

  const handleReorderLast = async () => {
    if (lastOrder) {
      await onReorder(lastOrder);
    }
  };

  const handleManageAddress = () => {
    if (onNavigateToAddresses) {
      onNavigateToAddresses();
    } else {
      navigate('/customer-portal#addresses');
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Order Card or No Active Order CTA */}
      {activeOrder ? (
        <ActiveOrderCard order={activeOrder} />
      ) : (
        <NoActiveOrderCTA
          hasOrderHistory={!!(orderHistory && orderHistory.length > 0)}
          firstName={profile?.first_name}
        />
      )}

      {/* Quick Action Tiles */}
      <QuickActionTiles
        lastOrderDate={lastOrderDate}
        defaultAddressLabel={defaultAddressLabel}
        activeOrderCount={activeOrderCount}
        onReorderLast={handleReorderLast}
        onManageAddress={handleManageAddress}
        isReordering={isReordering === lastOrder?.id}
        hasLastOrder={!!lastOrder}
      />

      {/* Two-Column Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Favorites Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <PremiumCard subsurface padding="md" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#8B1538]/15">
                  <Heart className="h-4 w-4 text-[#8B1538]" />
                </div>
                <h3 className="text-base font-semibold text-white">Your Favorites</h3>
                {topFavorites.length > 0 && (
                  <span className="text-xs text-gray-500">({enrichedFavorites?.length || 0})</span>
                )}
              </div>
              {topFavorites.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/customer-portal#favorites')}
                  className="text-[#8B1538] hover:text-[#8B1538] hover:bg-[#8B1538]/10 text-xs h-8 px-2"
                >
                  See all
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>

            {topFavorites.length > 0 ? (
              <FavoritesStrip
                favorites={topFavorites}
                totalCount={enrichedFavorites?.length || 0}
                onAddToCart={onAddToCart}
                onViewAll={() => navigate('/customer-portal#favorites')}
              />
            ) : (
              <div className="flex items-center gap-3 py-2">
                <div className="p-2.5 rounded-xl bg-white/5 border border-dashed border-white/20">
                  <Heart className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">No favorites yet</p>
                  <p className="text-xs text-gray-500">Heart dishes you love</p>
                </div>
              </div>
            )}
          </PremiumCard>
        </motion.div>

        {/* Right: Recommendations Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <PremiumCard subsurface padding="md" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#8B1538]/15">
                  <Sparkles className="h-4 w-4 text-[#8B1538]" />
                </div>
                <h3 className="text-base font-semibold text-white">Recommended</h3>
              </div>
              {topRecommendations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/online-orders')}
                  className="text-[#8B1538] hover:text-[#8B1538] hover:bg-[#8B1538]/10 text-xs h-8 px-2"
                >
                  Browse
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>

            {recommendationsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#8B1538]" />
              </div>
            ) : topRecommendations.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {topRecommendations.slice(0, 4).map((item) => (
                  <div
                    key={item.menu_item_id}
                    className="group relative rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-[#8B1538]/30 transition-all cursor-pointer"
                    onClick={() => navigate('/online-orders')}
                  >
                    <div className="aspect-[4/3] relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#8B1538]/20 flex items-center justify-center">
                          <UtensilsCrossed className="h-5 w-5 text-[#8B1538]" />
                        </div>
                      )}
                      {/* Reason tag */}
                      {item.reason_tags?.[0] && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm bg-[#8B1538]/80 text-white">
                          {reasonTagLabels[item.reason_tags[0]] || 'For you'}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-[#8B1538]">£{item.price?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <div className="flex gap-1">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <Sparkles className="h-4 w-4 text-[#8B1538]/60" />
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-dashed border-white/20">
                    <UtensilsCrossed className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">AI Picks Coming Soon</p>
                  <p className="text-xs text-gray-500">Order to unlock suggestions</p>
                </div>
              </div>
            )}
          </PremiumCard>
        </motion.div>
      </div>
    </div>
  );
}
