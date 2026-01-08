import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, ImageIcon } from 'lucide-react';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { MenuItem, OrderItem } from 'utils/menuTypes';
import { globalColors as QSAITheme, styles } from 'utils/QSAIDesign';
import { formatCurrency } from 'utils/formatters';

interface Props {
  selectedItems: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

/**
 * ThermalReceiptMenuPicker - Dedicated menu picker for thermal receipt designer
 * Simplified workflow focused on adding items to receipts (no complex customization)
 * Ensures buttons are always visible and functional
 */
export function ThermalReceiptMenuPicker({ selectedItems, onItemsChange }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Use realtime menu store for consistent data access
  const {
    categories,
    menuItems,
    itemVariants,
    isLoading: menuLoading,
    error: menuError,
    forceFullRefresh
  } = useRealtimeMenuStore();
  
  // 🔍 DEBUG: Log menu data to see if variants are populated
  useEffect(() => {
    if (menuItems.length > 0) {
      console.log('🔍 [MENU DATA DEBUG] Total items:', menuItems.length);
      
      // Check how many items have variants
      const itemsWithVariants = menuItems.filter(item => item.variants && item.variants.length > 0);
      console.log('🔍 [MENU DATA DEBUG] Items with variants:', itemsWithVariants.length);
      
      // Log first item with variants
      const firstVariantItem = itemsWithVariants[0];
      if (firstVariantItem) {
        console.log('🔍 [MENU DATA DEBUG] Sample item with variants:', {
          id: firstVariantItem.id,
          name: firstVariantItem.name,
          variantsCount: firstVariantItem.variants?.length || 0,
          variants: firstVariantItem.variants?.map(v => ({
            id: v.id,
            name: v.name,
            variant_name: v.variant_name,
            protein_type_name: v.protein_type_name
          }))
        });
      } else {
        console.log('❌ [MENU DATA DEBUG] NO items have variants array populated!');
        // Check if any item even has the variants property
        const firstItem = menuItems[0];
        console.log('🔍 [MENU DATA DEBUG] First item structure:', {
          id: firstItem.id,
          name: firstItem.name,
          hasVariantsProperty: 'variants' in firstItem,
          variantsValue: firstItem.variants
        });
      }
    }
  }, [menuItems]);
  
  // Load menu data on mount
  useEffect(() => {
    if (categories.length === 0 && menuItems.length === 0 && !menuLoading) {
      forceFullRefresh();
    }
  }, [categories.length, menuItems.length, menuLoading, forceFullRefresh]);
  
  // Get parent categories for sidebar
  const parentCategories = useMemo(() => {
    return categories
      .filter(cat => !cat.parent_category_id && cat.active)
      .sort((a, b) => a.display_order - b.display_order);
  }, [categories]);
  
  // Filter menu items based on selected category and search
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
    
    return items.sort((a, b) => a.display_order - b.display_order);
  }, [menuItems, selectedCategory, searchTerm]);
  
  // Generate unique order item ID
  const generateOrderItemId = (): string => {
    return `order-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Get variants for a specific menu item from the store
   */
  const getItemVariants = (menuItemId: string) => {
    return itemVariants.filter(v => v.menu_item_id === menuItemId && v.is_active);
  };

  /**
   * Get variant display name following priority:
   * 1. variant_name (database-generated full name like "CHICKEN TIKKA MASALA")
   * 2. name (custom override)
   * 3. protein_type_name (fallback)
   */
  const getVariantDisplayName = (variant: ItemVariant): string => {
    if (variant.variant_name) return variant.variant_name;
    if (variant.name) return variant.name;
    if (variant.protein_type_name) return variant.protein_type_name;
    return '';
  };

  // Helper to get the correct display name for menu items (handles variant items)
  const getMenuItemDisplayName = (item: MenuItem): string => {
    // For items with variants, check if there's a single default variant
    // and use its display name instead of the base item name
    const variants = getItemVariants(item.id);
    if (variants.length > 0) {
      const defaultVariant = variants.find(v => v.is_default) || variants[0];
      const displayName = getVariantDisplayName(defaultVariant);
      
      console.log('🔍 [MENU ITEM DISPLAY] Item with variants:', {
        baseItemName: item.name,
        variantData: {
          variant_name: defaultVariant.variant_name,
          name: defaultVariant.name,
          protein_type_name: defaultVariant.protein_type_name
        },
        displayName: displayName
      });
      
      return displayName;
    }
    
    // For regular items without variants, use the base name
    return item.name;
  };

  // Add item to selected items
  const handleAddItem = (item: MenuItem) => {
    console.log('👉 [ADD ITEM] Clicked item:', {
      id: item.id,
      name: item.name,
      hasVariants: 'variants' in item,
      variantsCount: item.variants?.length || 0,
      variants: item.variants?.map(v => ({
        id: v.id,
        name: v.name,
        variant_name: v.variant_name,
        protein_type_name: v.protein_type_name
      }))
    });
    
    // Look up variants from store instead of item.variants
    const variants = getItemVariants(item.id);
    const itemHasVariants = variants.length > 0;
    
    console.log('🔍 [VARIANT LOOKUP] Store lookup result:', {
      itemId: item.id,
      itemName: item.name,
      variantsFound: variants.length,
      variantDetails: variants.map(v => ({
        id: v.id,
        name: v.name,
        variant_name: v.variant_name,
        protein_type_name: v.protein_type_name
      }))
    });
    
    let itemName = item.name;
    let variantId = '';
    let variantName = '';
    let itemPrice = item.price || 0;

    // Check if item has variants
    if (itemHasVariants) {
      // Find default variant or use first one
      const defaultVariant = variants.find(v => v.is_default) || variants[0];
      
      console.log('🔍 [DEBUG] Default variant object:', {
        id: defaultVariant.id,
        variant_name: defaultVariant.variant_name,
        name: defaultVariant.name,
        protein_type_name: defaultVariant.protein_type_name,
        is_default: defaultVariant.is_default,
        price: defaultVariant.price,
        fullObject: defaultVariant
      });
      
      // Use full variant name (e.g., "LAMB TIKKA MASALA")
      itemName = getVariantDisplayName(defaultVariant);
      variantId = defaultVariant.id;
      variantName = defaultVariant.protein_type_name || '';
      itemPrice = defaultVariant.price;
      
      console.log('🔧 [VARIANT FIX] Adding variant item:', {
        baseItemName: item.name,
        variantDisplayName: itemName,
        variantData: {
          variant_name: defaultVariant.variant_name,
          name: defaultVariant.name,
          protein_type_name: defaultVariant.protein_type_name
        },
        finalOrderItemName: itemName
      });
    } else {
      console.log('✅ [NO VARIANT] Adding regular item:', item.name);
    }

    const orderItem: OrderItem = {
      id: generateOrderItemId(),
      menu_item_id: item.id,
      variant_id: variantId,
      name: itemName, // Now using full variant name for variant items
      quantity: 1,
      price: itemPrice,
      modifiers: [],
      customizations: [],
      image_url: item.image_url,
      category_id: item.category_id, // Add category_id for receipt grouping
      variantName: variantName // Store protein type separately for reference
    };
    
    const updatedItems = [...selectedItems, orderItem];
    onItemsChange(updatedItems);
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSearchTerm(''); // Clear search when changing category
  };
  
  // Get placeholder image
  const getItemImage = (item: MenuItem): string => {
    return item.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  };
  
  // Truncate long names for display
  const truncateName = (name: string, maxLength: number = 30): string => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };
  
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
        borderColor: QSAITheme.border.light,
        ...styles.frostedGlassStyle
      }}
    >
      {/* Left Sidebar - Categories */}
      <div 
        className="w-64 border-r flex-shrink-0 flex flex-col"
        style={{
          borderColor: QSAITheme.border.light,
          backgroundColor: QSAITheme.background.panel
        }}
      >
        {/* Category Header */}
        <div 
          className="p-3 border-b"
          style={{ borderColor: QSAITheme.border.light }}
        >
          <h3 
            className="text-sm font-semibold"
            style={{ color: QSAITheme.text.primary }}
          >
            Categories
          </h3>
        </div>
        
        {/* Category List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* All Items */}
            <Button
              onClick={() => handleCategorySelect(null)}
              variant={selectedCategory === null ? "default" : "ghost"}
              className="w-full justify-start mb-1 text-sm h-8"
              style={{
                backgroundColor: selectedCategory === null ? QSAITheme.purple.primary : 'transparent',
                color: selectedCategory === null ? QSAITheme.text.primary : QSAITheme.text.secondary
              }}
            >
              All Items
            </Button>
            
            {/* Category Buttons */}
            {parentCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className="w-full justify-start mb-1 text-sm h-8"
                style={{
                  backgroundColor: selectedCategory === category.id ? QSAITheme.purple.primary : 'transparent',
                  color: selectedCategory === category.id ? QSAITheme.text.primary : QSAITheme.text.secondary
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        {/* Category Count */}
        <div 
          className="p-2 border-t text-xs text-center"
          style={{ 
            borderColor: QSAITheme.border.light,
            color: QSAITheme.text.secondary 
          }}
        >
          {parentCategories.length} categories
        </div>
      </div>
      
      {/* Right Panel - Menu Items */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Header */}
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
        
        {/* Items List - Fixed Layout */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading || menuLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-400">Loading menu items...</div>
            </div>
          ) : filteredItems.length === 0 ? (
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
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center p-3 rounded-md transition-all duration-200 group"
                    style={{
                      backgroundColor: 'rgba(30, 30, 30, 0.5)',
                      minHeight: '60px' // Consistent height for better scanning
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.5)';
                    }}
                  >
                    {/* Item Image */}
                    <div className="flex-shrink-0 w-10 h-10 mr-3">
                      <img
                        src={getItemImage(item)}
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
                        }}
                      />
                    </div>
                    
                    {/* Item Details - Flexible */}
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 
                        className="text-sm font-medium mb-1"
                        style={{ color: QSAITheme.text.primary }}
                        title={getMenuItemDisplayName(item)}
                      >
                        {truncateName(getMenuItemDisplayName(item))}
                      </h4>
                      
                      {/* Price */}
                      <div 
                        className="text-lg font-bold"
                        style={{ color: QSAITheme.text.accent }}
                      >
                        {formatCurrency(item.price || 0)}
                      </div>
                      
                      {/* Description - Optional */}
                      {item.menu_item_description && (
                        <p 
                          className="text-xs mt-1 opacity-80"
                          style={{ color: QSAITheme.text.secondary }}
                          title={item.menu_item_description}
                        >
                          {item.menu_item_description.length > 40 
                            ? `${item.menu_item_description.substring(0, 40)}...`
                            : item.menu_item_description
                          }
                        </p>
                      )}
                    </div>
                    
                    {/* Add Button - Always Visible */}
                    <div className="flex-shrink-0">
                      <Button
                        onClick={() => handleAddItem(item)}
                        size="sm"
                        className="h-10 px-4"
                        style={{
                          backgroundColor: QSAITheme.purple.primary,
                          color: 'white',
                          border: 'none',
                          minWidth: '80px' // Ensure consistent button width
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = QSAITheme.purple.light;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = QSAITheme.purple.primary;
                        }}
                      >
                        <Plus size={16} className="mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        {/* Footer Summary */}
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
    </div>
  );
}

export default ThermalReceiptMenuPicker;
