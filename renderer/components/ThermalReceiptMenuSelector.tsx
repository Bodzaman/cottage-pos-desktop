import React, { useState, useEffect } from 'react';
import { CategorySidebar } from 'components/CategorySidebar';
import { MenuItemListView } from 'components/MenuItemListView';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { OrderItem } from 'utils/menuTypes';
import { globalColors as QSAITheme } from 'utils/QSAIDesign';
import { apiClient } from 'app';

interface Props {
  selectedItems: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

/**
 * ThermalReceiptMenuSelector - POSDesktop-style menu interface for thermal receipt designer
 * Combines CategorySidebar + MenuItemListView for professional restaurant workflow
 */
export function ThermalReceiptMenuSelector({ selectedItems, onItemsChange }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use realtime menu store for consistent data access
  const {
    categories,
    menuItems,
    isLoading: menuLoading,
    error: menuError,
    forceFullRefresh
  } = useRealtimeMenuStore();
  
  // Load menu data on mount
  useEffect(() => {
    if (categories.length === 0 && menuItems.length === 0 && !menuLoading) {
      forceFullRefresh();
    }
  }, [categories.length, menuItems.length, menuLoading, forceFullRefresh]);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSearchTerm(''); // Clear search when changing category
  };
  
  // Handle item addition
  const handleItemAdd = (newItem: OrderItem) => {
    const updatedItems = [...selectedItems, newItem];
    onItemsChange(updatedItems);
  };
  
  // Filter menu items based on selected category
  const filteredMenuItems = selectedCategory 
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;
  
  if (menuError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load menu data</p>
          <p className="text-gray-400 text-sm">{menuError}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="flex h-96 border rounded-lg overflow-hidden"
      style={{
        backgroundColor: QSAITheme.background.primary,
        borderColor: QSAITheme.border.light
      }}
    >
      {/* Left Sidebar - Categories (25% width) */}
      <div 
        className="w-1/4 border-r flex-shrink-0"
        style={{
          borderColor: QSAITheme.border.light,
          minWidth: '200px'
        }}
      >
        <CategorySidebar
          categories={categories}
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
          isLoading={menuLoading}
        />
      </div>
      
      {/* Right Panel - Menu Items List (75% width) */}
      <div className="flex-1">
        <MenuItemListView
          menuItems={filteredMenuItems}
          selectedCategory={selectedCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onItemAdd={handleItemAdd}
          isLoading={menuLoading}
        />
      </div>
    </div>
  );
}

export default ThermalReceiptMenuSelector;
