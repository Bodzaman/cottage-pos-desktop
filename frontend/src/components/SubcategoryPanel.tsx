import React from 'react';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { globalColors } from 'utils/QSAIDesign';

interface SubcategoryPanelProps {
  className?: string;
}

/**
 * SubcategoryPanel Component
 * 
 * Displays subcategories for the currently selected parent category
 * in the POS menu navigation. This panel appears in the middle area
 * when a parent category is selected, providing a clean hierarchical
 * navigation experience.
 */
export function SubcategoryPanel({ className = '' }: SubcategoryPanelProps) {
  const realtimeMenuStore = useRealtimeMenuStore();
  
  // Early return for loading state or missing data
  if (realtimeMenuStore.isLoading || !realtimeMenuStore.categories) {
    return null;
  }
  
  // Only show if a parent category is selected
  if (!realtimeMenuStore.selectedParentCategory) {
    return null;
  }

  // Get subcategories for the selected parent with null safety
  const subcategories = realtimeMenuStore.categories
    .filter(cat => 
      cat.parent_category_id === realtimeMenuStore.selectedParentCategory &&
      cat.parent_category_id !== null
    )
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));  // Use display_order from mapped frontend data

  // Get parent category name for header
  const parentCategory = realtimeMenuStore.categories.find(
    cat => cat.id === realtimeMenuStore.selectedParentCategory
  );

  return (
    <div className={`${className} h-full flex flex-col overflow-hidden`} style={{
      background: `linear-gradient(135deg, ${globalColors.background.primary} 0%, ${globalColors.background.secondary} 100%)`,
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '8px'
    }}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex-shrink-0" style={{
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        background: `linear-gradient(135deg, ${globalColors.background.primary} 0%, rgba(124, 93, 250, 0.03) 100%)`
      }}>
        <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-3">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: globalColors.purple.primary }}></div>
          {parentCategory?.name?.toUpperCase() || 'SUBCATEGORIES'}
        </h3>
      </div>

      {/* Subcategory Buttons */}
      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600/30 hover:scrollbar-thumb-gray-500/50">
        <div className="space-y-3">
          {/* All Items Button */}
          <button
            onClick={() => realtimeMenuStore.setSelectedMenuCategory(null)}
            className={`w-full text-left py-4 px-6 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              !realtimeMenuStore.selectedMenuCategory
                ? 'text-white shadow-xl transform scale-[1.02]'
                : 'text-gray-300 hover:text-white hover:shadow-lg hover:scale-[1.01]'
            }`}
            style={!realtimeMenuStore.selectedMenuCategory ? {
              background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`,
              boxShadow: `0 8px 25px -8px ${globalColors.purple.primary}50`
            } : {
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  !realtimeMenuStore.selectedMenuCategory ? 'bg-white shadow-lg' : 'bg-gray-500 group-hover:bg-purple-400'
                }`} />
                <span className="font-bold text-sm tracking-wide">ALL ITEMS</span>
              </div>
              <div className="text-xs opacity-70">
                {realtimeMenuStore.menuItems.filter(item => {
                  const subcategoryIds = subcategories.map(sub => sub.id);
                  return subcategoryIds.includes(item.category_id) && item.active;
                }).length} items
              </div>
            </div>
            {/* Glass morphism overlay */}
            {!realtimeMenuStore.selectedMenuCategory && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
            )}
          </button>

          {/* Subcategory Buttons */}
          {subcategories.map(subcategory => {
            const itemCount = realtimeMenuStore.menuItems.filter(
              item => item.category_id === subcategory.id && item.active
            ).length;

            return (
              <button
                key={subcategory.id}
                onClick={() => realtimeMenuStore.setSelectedMenuCategory(subcategory.id)}
                className={`w-full text-left py-4 px-6 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  realtimeMenuStore.selectedMenuCategory === subcategory.id
                    ? 'text-white shadow-xl transform scale-[1.02]'
                    : 'text-gray-300 hover:text-white hover:shadow-lg hover:scale-[1.01]'
                }`}
                style={realtimeMenuStore.selectedMenuCategory === subcategory.id ? {
                  background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`,
                  boxShadow: `0 8px 25px -8px ${globalColors.purple.primary}50`
                } : {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      realtimeMenuStore.selectedMenuCategory === subcategory.id 
                        ? 'bg-white shadow-lg' 
                        : 'bg-gray-500 group-hover:bg-purple-400'
                    }`} />
                    <span className="font-semibold text-sm tracking-wide">
                      {subcategory.name.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs opacity-70">
                    {itemCount} items
                  </div>
                </div>
                {/* Glass morphism overlay */}
                {realtimeMenuStore.selectedMenuCategory === subcategory.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                )}
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {subcategories.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">
              No subcategories available
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
