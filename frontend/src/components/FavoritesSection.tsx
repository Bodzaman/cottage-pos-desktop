import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Heart,
  FolderPlus,
  Trash2,
  Check,
  ShoppingCart,
  Flame,
  UtensilsCrossed,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PremiumCard } from 'components/PremiumCard';
import { PortalButton } from 'components/PortalButton';
import { FavoriteListRail } from 'components/favorites';
import { PremiumTheme } from 'utils/CustomerDesignSystem';
import { cn } from 'utils/cn';
import type { EnrichedFavoriteItem, FavoriteList } from 'types';

// Simple spice level indicator component
const SpiceLevelIndicator = ({ level }: { level: number }) => {
  const spiceIcons = [];
  for (let i = 0; i < level && i < 5; i++) {
    spiceIcons.push(
      <Flame key={i} className="h-3 w-3 text-red-500 fill-current" />
    );
  }
  return <div className="flex">{spiceIcons}</div>;
};

interface Props {
  enrichedFavorites: EnrichedFavoriteItem[];
  favoriteLists: FavoriteList[] | null;
  selectedListId: string;
  setSelectedListId: (id: string) => void;
  setCreateListModalOpen: (open: boolean) => void;
  setListToRename: (list: { id: string; name: string }) => void;
  setRenameListModalOpen: (open: boolean) => void;
  setListToDelete: (list: { id: string; name: string }) => void;
  setDeleteListModalOpen: (open: boolean) => void;
  handleToggleItemInList: (listId: string, favoriteId: string, isInList: boolean) => Promise<void>;
  handleAddToCart: (favorite: EnrichedFavoriteItem) => void;
  handleRemoveFavorite: (favoriteId: string, itemName: string) => Promise<void>;
  // Error handling props
  loadError?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
}

export default function FavoritesSection({
  enrichedFavorites,
  favoriteLists,
  selectedListId,
  setSelectedListId,
  setCreateListModalOpen,
  setListToRename,
  setRenameListModalOpen,
  setListToDelete,
  setDeleteListModalOpen,
  handleToggleItemInList,
  handleAddToCart,
  handleRemoveFavorite,
  loadError,
  onRetry,
  isLoading,
}: Props) {
  const navigate = useNavigate();

  // Category quick links for empty state discovery
  const categoryLinks = [
    { name: 'Starters', slug: 'starters' },
    { name: 'Curries', slug: 'curries' },
    { name: 'Biryanis', slug: 'biryanis' },
    { name: 'Tandoori', slug: 'tandoori' },
  ];

  return (
    <div className="space-y-4">
      {/* Action Bar + List Rail */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* List Rail */}
        <div className="flex-1 min-w-0 -mx-4 sm:mx-0">
          <FavoriteListRail
            lists={favoriteLists}
            selectedListId={selectedListId}
            onSelectList={setSelectedListId}
            totalFavorites={enrichedFavorites?.length || 0}
            onRenameList={(list) => {
              setListToRename(list);
              setRenameListModalOpen(true);
            }}
            onDeleteList={(list) => {
              setListToDelete(list);
              setDeleteListModalOpen(true);
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <PortalButton
            variant="secondary"
            size="sm"
            onClick={() => setCreateListModalOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Create List</span>
          </PortalButton>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !enrichedFavorites?.length && (
        <PremiumCard subsurface className="py-12 px-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#8B1538]" />
            <p className="text-sm text-gray-400">Loading your favorites...</p>
          </div>
        </PremiumCard>
      )}

      {/* Error State with Retry */}
      {loadError && !isLoading && (
        <PremiumCard subsurface className="py-12 px-6">
          <div className="text-center max-w-sm mx-auto">
            <div className="p-4 rounded-xl bg-red-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Favorites</h3>
            <p className="text-sm text-gray-400 mb-5">
              {loadError}
            </p>
            {onRetry && (
              <PortalButton
                variant="secondary"
                onClick={onRetry}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </PortalButton>
            )}
          </div>
        </PremiumCard>
      )}

      {/* Favorites Grid */}
      {!loadError && !isLoading && enrichedFavorites && enrichedFavorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {enrichedFavorites.map((favorite, index) => {
            // Show ALL favorites when 'all' is selected
            // Only filter by list when a specific list is selected
            if (selectedListId !== 'all') {
              const isInSelectedList = favoriteLists?.find(l => l.id === selectedListId)?.items?.some(item => item.favorite_id === favorite.favorite_id);
              if (!isInSelectedList) return null;
            }

            return (
              <motion.div
                key={favorite.favorite_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(!favorite.display_is_available && 'opacity-75')}
              >
                <PremiumCard
                  subsurface
                  hover
                  padding="none"
                  className={cn(
                    'group overflow-hidden h-full',
                    !favorite.display_is_available && 'border-red-500/30'
                  )}
                >
                  {/* Image Container - Square */}
                  <div className="aspect-square relative overflow-hidden">
                    {favorite.display_image_url ? (
                      <img
                        src={favorite.display_image_url}
                        alt={favorite.display_name}
                        className={cn(
                          'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
                          !favorite.display_is_available && 'grayscale opacity-50'
                        )}
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-[#8B1538]/15 flex items-center justify-center"
                        aria-label={`${favorite.display_name} - no image available`}
                        role="img"
                      >
                        <UtensilsCrossed className="h-10 w-10 text-[#8B1538]/50" aria-hidden="true" />
                      </div>
                    )}

                    {/* Quick Add Overlay - visible on mobile, hover on desktop */}
                    {favorite.display_is_available && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
                        <PortalButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddToCart(favorite)}
                          className="w-full"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Quick Add
                        </PortalButton>
                      </div>
                    )}

                    {/* Unavailable Badge */}
                    {!favorite.display_is_available && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-medium bg-red-500/80 text-white backdrop-blur-sm">
                        Unavailable
                      </div>
                    )}

                    {/* Spice Level Badge */}
                    {favorite.display_spice_level && favorite.display_spice_level > 0 && favorite.display_is_available && (
                      <div className="absolute top-2 left-2">
                        <div className="px-1.5 py-1 rounded-lg text-xs backdrop-blur-sm bg-black/60 flex items-center gap-0.5">
                          <SpiceLevelIndicator level={favorite.display_spice_level} />
                        </div>
                      </div>
                    )}

                    {/* Remove Button - visible on mobile, hover on desktop */}
                    {favorite.display_is_available && (
                      <button
                        onClick={() => handleRemoveFavorite(favorite.favorite_id, favorite.display_name)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white/70 hover:bg-red-500/80 hover:text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
                        aria-label="Remove from favorites"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-3">
                    <h3 className="font-medium text-white text-sm truncate">
                      {favorite.display_name}
                    </h3>
                    {favorite.variant_name && (
                      <p className="text-xs text-gray-500 truncate">{favorite.variant_name}</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {favorite.display_price ? (
                        <p className="text-base font-bold text-[#8B1538]">
                          £{favorite.display_price?.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Price N/A</p>
                      )}

                      {/* List Pills (compact) */}
                      {favoriteLists && favoriteLists.length > 0 && (
                        <div className="flex gap-1">
                          {favoriteLists.slice(0, 3).map((list) => {
                            const isInThisList = list.items?.some(item => item.favorite_id === favorite.favorite_id);
                            if (!isInThisList) return null;
                            return (
                              <div
                                key={list.id}
                                className="w-1.5 h-1.5 rounded-full bg-[#8B1538]"
                                title={list.list_name}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* List Assignment (hidden on mobile) */}
                    {favoriteLists && favoriteLists.length > 0 && (
                      <div className="hidden md:flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-white/5">
                        {favoriteLists.map((list) => {
                          const isInThisList = list.items?.some(item => item.favorite_id === favorite.favorite_id);
                          return (
                            <button
                              key={list.id}
                              onClick={() => handleToggleItemInList(list.id, favorite.favorite_id, isInThisList)}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full transition-all',
                                isInThisList
                                  ? 'bg-[#8B1538]/30 text-white hover:bg-[#8B1538]/40'
                                  : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                              )}
                              aria-label={isInThisList ? `Remove ${favorite.display_name} from ${list.list_name}` : `Add ${favorite.display_name} to ${list.list_name}`}
                              aria-pressed={isInThisList}
                            >
                              {isInThisList && <Check className="h-2 w-2 inline mr-0.5" aria-hidden="true" />}
                              {list.list_name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </PremiumCard>
              </motion.div>
            );
          })}
        </div>
      ) : !loadError && !isLoading ? (
        <PremiumCard subsurface className="py-12 px-6">
          <div className="text-center max-w-sm mx-auto">
            <div className="p-4 rounded-xl bg-[#8B1538]/15 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Heart className="h-7 w-7 text-[#8B1538]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No favorites yet</h3>
            <p className="text-sm text-gray-400 mb-5">
              Heart dishes you love to save them here for easy reordering.
            </p>

            {/* Category Quick Links */}
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {categoryLinks.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => navigate(`/online-orders#${cat.slug}`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <PortalButton
              variant="primary"
              onClick={() => navigate('/online-orders')}
            >
              <Heart className="h-4 w-4" />
              Discover Favorites
            </PortalButton>
          </div>
        </PremiumCard>
      ) : null}
    </div>
  );
}
