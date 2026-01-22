import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Heart, 
  FolderPlus, 
  FolderEdit, 
  Trash2, 
  Check, 
  ShoppingCart,
  List,
  MoreVertical,
  Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[#EAECEF]">My Favorites</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => setCreateListModalOpen(true)}
            variant="outline"
            className="border-[#8B1538]/30 text-[#EAECEF] hover:bg-[#8B1538]/20 hover:border-[#8B1538]"
            aria-label="Create new list"
          >
            <FolderPlus className="h-4 w-4 mr-2" aria-hidden="true" />
            Create List
          </Button>
          <Button
            onClick={() => navigate('/online-orders')}
            className="bg-[#8B1538] hover:bg-[#7A1530] text-white shadow-[0_0_24px_#8B153855] border-0"
            aria-label="Browse menu"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Browse Menu
          </Button>
        </div>
      </div>

      {/* List Tabs/Pills */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <button
          onClick={() => setSelectedListId('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedListId === 'all'
              ? 'bg-[#8B1538] text-white shadow-[0_0_16px_#8B153833]'
              : 'bg-black/20 text-white hover:bg-white/10 hover:text-[#EAECEF] border border-white/10'
          }`}
          aria-label="View all favorites"
        >
          <List className="h-4 w-4 inline mr-2" aria-hidden="true" />
          All Favorites ({enrichedFavorites?.length || 0})
        </button>
        
        {favoriteLists && favoriteLists.map((list) => (
          <div key={list.id} className="relative group">
            <button
              onClick={() => setSelectedListId(list.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 pr-10 ${
                selectedListId === list.id
                  ? 'bg-[#8B1538] text-white shadow-[0_0_16px_#8B153833]'
                  : 'bg-black/20 text-white hover:bg-white/10 hover:text-[#EAECEF] border border-white/10'
              }`}
              aria-label={`View ${list.list_name} list`}
            >
              {list.list_name} ({list.item_count || 0})
            </button>
            
            {/* List Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10"
                  aria-label="List options"
                >
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#17191D] border-white/10">
                <DropdownMenuItem
                  onClick={() => {
                    setListToRename(list);
                    setRenameListModalOpen(true);
                  }}
                  className="text-[#EAECEF] hover:bg-white/10 cursor-pointer"
                  aria-label="Rename list"
                >
                  <FolderEdit className="h-4 w-4 mr-2" aria-hidden="true" />
                  Rename List
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setListToDelete(list);
                    setDeleteListModalOpen(true);
                  }}
                  className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                  aria-label="Delete list"
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Favorites List */}
      {enrichedFavorites && enrichedFavorites.length > 0 ? (
        <div className="grid gap-4">
          {enrichedFavorites.map((favorite) => {
            // Show ALL favorites when 'all' is selected
            // Only filter by list when a specific list is selected
            if (selectedListId !== 'all') {
              const isInSelectedList = favoriteLists?.find(l => l.id === selectedListId)?.items?.some(item => item.favorite_id === favorite.favorite_id);
              if (!isInSelectedList) return null;
            }
            
            return (
              <motion.div
                key={favorite.favorite_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-black/20 backdrop-blur-sm border rounded-xl p-6 hover:border-[#8B1538]/30 transition-all duration-200 ${
                  !favorite.display_is_available ? 'border-red-500/30 opacity-75' : 'border-white/10'
                }`}
              >
                <div className="flex gap-4">
                  {favorite.display_image_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img
                        src={favorite.display_image_url}
                        alt={favorite.display_name}
                        className={`w-full h-full object-cover ${
                          !favorite.display_is_available ? 'grayscale opacity-50' : ''
                        }`}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-[#EAECEF]">
                            {favorite.display_name}
                            {favorite.variant_name && ` (${favorite.variant_name})`}
                          </h3>
                          {!favorite.display_is_available && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              No longer available
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#B7BDC6] mb-3 line-clamp-2">
                          {favorite.display_description}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          {favorite.display_price ? (
                            <p className="text-lg font-bold text-[#EAECEF]">
                              £{favorite.display_price?.toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-sm text-[#8B92A0] italic">Price unavailable</p>
                          )}
                          {favorite.display_spice_level && favorite.display_spice_level > 0 && (
                            <div className="flex items-center gap-1">
                              <SpiceLevelIndicator level={favorite.display_spice_level} />
                            </div>
                          )}
                        </div>
                        
                        {/* List Assignment Pills */}
                        {favoriteLists && favoriteLists.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-[#B7BDC6]">Lists:</span>
                            {favoriteLists.map((list) => {
                              const isInThisList = list.items?.some(item => item.favorite_id === favorite.favorite_id);
                              return (
                                <button
                                  key={list.id}
                                  onClick={() => handleToggleItemInList(list.id, favorite.favorite_id, isInThisList)}
                                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                                    isInThisList
                                      ? 'bg-[#8B1538]/30 text-white hover:bg-[#8B1538]/40'
                                      : 'bg-white/5 text-[#8B92A0] hover:bg-white/10 hover:text-white'
                                  }`}
                                  aria-label={isInThisList ? 'Remove from list' : 'Add to list'}
                                >
                                  {isInThisList && <Check className="h-3 w-3 inline mr-1" aria-hidden="true" />}
                                  {list.list_name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToCart(favorite)}
                          disabled={!favorite.display_is_available}
                          className="bg-[#8B1538]/20 text-[#8B1538] hover:bg-[#8B1538] hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#8B1538]/20 disabled:hover:text-[#8B1538]"
                          aria-label="Add to cart"
                        >
                          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFavorite(favorite.favorite_id, favorite.display_name)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          aria-label="Remove from favorites"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="p-4 rounded-full bg-[#8B1538]/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-[#8B1538]" />
          </div>
          <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">No favorites yet</h3>
          <p className="text-[#B7BDC6] mb-6">Heart dishes you love to save them here for easy reordering.</p>
          <Button
            onClick={() => navigate('/online-orders')}
            className="bg-[#8B1538] hover:bg-[#7A1230] text-white shadow-[0_0_24px_#8B153855] border-0"
            aria-label="Discover favorites"
          >
            <Heart className="h-4 w-4 mr-2" aria-hidden="true" />
            Discover Favorites
          </Button>
        </div>
      )}
    </div>
  );
}
