import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { MenuItem, OrderItem } from 'utils/menuTypes';
import { globalColors as QSAITheme } from 'utils/QSAIDesign';
import { formatCurrency } from 'utils/formatters';

interface Props {
  menuItems: MenuItem[];
  selectedCategory: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onItemAdd: (item: OrderItem) => void;
  isLoading?: boolean;
}

/**
 * MenuItemListView - Professional list interface for fast item scanning
 * Following POSDesktop component architecture with compact row design
 * Simplified for thermal receipt designer - no customization modal needed
 */
export function MenuItemListView({
  menuItems,
  selectedCategory,
  searchTerm,
  onSearchChange,
  onItemAdd,
  isLoading = false
}: Props) {
  // Track expanded descriptions by item ID
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  
  // DEBUG: Check if component is rendering
  console.log('🔍 MenuItemListView rendering:', {
    menuItemsCount: menuItems.length,
    selectedCategory,
    searchTerm,
    isLoading
  });
  
  // Filter items based on category and search
  const filteredItems = useMemo(() => {
    let items = menuItems.filter(item => item.active);
    
    // Filter by category
    if (selectedCategory) {
      items = items.filter(item => item.category_id === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.menu_item_description && item.menu_item_description.toLowerCase().includes(searchLower))
      );
    }
    
    console.log('🔍 Filtered items:', items.length);
    return items.sort((a, b) => a.display_order - b.display_order);
  }, [menuItems, selectedCategory, searchTerm]);
  
  // Generate unique order item ID
  const generateOrderItemId = () => `thermal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Handle quick add (no customization)
  const handleQuickAdd = (menuItem: MenuItem) => {
    console.log('🔍 Quick add clicked for:', menuItem.name);
    
    const orderItem: OrderItem = {
      id: generateOrderItemId(),
      menu_item_id: menuItem.id,
      variant_id: '',
      name: menuItem.name,
      quantity: 1,
      price: menuItem.price || 0,
      modifiers: [],
      customizations: [],
      image_url: menuItem.image_url
    };
    
    onItemAdd(orderItem);
  };
  
  // Get placeholder image
  const getItemImage = (item: MenuItem): string => {
    return item.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  };
  
  // Truncate long names for display
  const truncateName = (name: string, maxLength: number = 35): string => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  // Toggle description expansion for an item
  const toggleDescription = (itemId: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading menu items...</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Search Header - Compact */}
      <div 
        className="p-3 border-b flex-shrink-0"
        style={{ 
          backgroundColor: QSAITheme.background.panel,
          borderColor: QSAITheme.border.light 
        }}
      >
        <div className="relative">
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search menu items..."
            className="pl-10 h-8"
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
      </div>
      
      {/* Items List - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/70 scrollbar-track-transparent"
        style={{ minHeight: 0 }}
      >
        {filteredItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-gray-400">
              <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
              <p>No items found</p>
              {searchTerm && (
                <p className="text-sm mt-1">Try adjusting your search</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {filteredItems.map((item) => {
              console.log('🔍 Rendering item:', item.name, 'with price:', item.price);
              
              return (
                <div
                  key={item.id}
                  className="flex items-center p-2 mb-1 rounded-md transition-all duration-200 group hover:bg-opacity-80"
                  style={{
                    backgroundColor: 'rgba(30, 30, 30, 0.5)',
                    minHeight: '44px' // Consistent row height
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.5)';
                  }}
                >
                  {/* Item Image - Small thumbnail */}
                  <div className="flex-shrink-0 w-8 h-8 mr-3">
                    <img
                      src={getItemImage(item)}
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
                      }}
                    />
                  </div>
                  
                  {/* Item Details - Flexible width */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 
                        className="text-sm font-medium truncate pr-2"
                        style={{ color: QSAITheme.text.primary }}
                        title={item.name}
                      >
                        {truncateName(item.name)}
                      </h4>
                      
                      {/* Price */}
                      <div 
                        className="text-sm font-semibold flex-shrink-0"
                        style={{ color: QSAITheme.text.accent }}
                      >
                        {formatCurrency(item.price || 0)}
                      </div>
                    </div>
                    
                    {/* Description - With See More/See Less Toggle */}
                    {item.menu_item_description && (
                      <div className="mt-0.5">
                        <p 
                          className="text-xs"
                          style={{ color: QSAITheme.text.secondary }}
                        >
                          {expandedDescriptions.has(item.id)
                            ? item.menu_item_description
                            : item.menu_item_description.length > 80
                            ? `${item.menu_item_description.substring(0, 80)}...`
                            : item.menu_item_description
                          }
                        </p>
                        
                        {/* See More / See Less Toggle - Only show if description is long */}
                        {item.menu_item_description.length > 80 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDescription(item.id);
                            }}
                            className="text-xs font-semibold mt-0.5 flex items-center gap-1 hover:opacity-80 transition-opacity"
                            style={{ color: QSAITheme.purple.light }}
                          >
                            {expandedDescriptions.has(item.id) ? 'See Less' : 'See More'}
                            {expandedDescriptions.has(item.id) 
                              ? <ChevronUp className="h-3 w-3" /> 
                              : <ChevronDown className="h-3 w-3" />
                            }
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons - Compact */}
                  <div className="flex-shrink-0 flex items-center space-x-1 ml-2">
                    {/* Quick Add Button */}
                    <Button
                      onClick={() => handleQuickAdd(item)}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      style={{
                        backgroundColor: QSAITheme.purple.medium,
                        color: 'white',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = QSAITheme.purple.light;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = QSAITheme.purple.medium;
                      }}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer Summary - Compact */}
      <div 
        className="p-2 border-t flex-shrink-0"
        style={{ 
          backgroundColor: QSAITheme.background.panel,
          borderColor: QSAITheme.border.light 
        }}
      >
        <div className="text-xs text-center" style={{ color: QSAITheme.text.secondary }}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          {selectedCategory && ' in this category'}
        </div>
      </div>
    </div>
  );
}

export default MenuItemListView;
