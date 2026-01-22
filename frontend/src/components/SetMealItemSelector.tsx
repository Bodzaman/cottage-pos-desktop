import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Plus, Minus, ImageOff, ChevronDown, ChevronRight } from 'lucide-react';
import { Category, MenuItem } from '../utils/menuTypes';
import { useCategories, useMenuItems } from '../utils/menuQueries';
import { formatCurrency } from '../utils/formatUtils';

interface SetMealItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  name: string;
  price: number;
}

interface SetMealItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SetMealItem[];
  onItemsChange: (items: SetMealItem[]) => void;
}

export default function SetMealItemSelector({
  isOpen,
  onClose,
  selectedItems,
  onItemsChange
}: SetMealItemSelectorProps) {
  // React Query hooks - auto-load when dialog opens
  const { data: categories = [], isLoading: categoriesLoading } = useCategories({ enabled: isOpen });
  const { data: menuItems = [], isLoading: menuItemsLoading } = useMenuItems({ enabled: isOpen });
  
  const loading = categoriesLoading || menuItemsLoading;
  
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-expand sections when categories load
  useEffect(() => {
    if (categories.length > 0 && isOpen) {
      const sectionsWithSubs = categories
        .filter(cat => !cat.parent_category_id && cat.active)
        .filter(section => categories.some(sub => sub.parent_category_id === section.id && sub.active))
        .map(section => section.id);
      
      setExpandedSections(new Set(sectionsWithSubs));
    }
  }, [categories, isOpen]);

  // Filter items by category and search
  useEffect(() => {
    let filtered = menuItems;
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.menu_item_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchTerm]);

  // Get the best price for an item (check variants first, then base price)
  const getItemPrice = (item: MenuItem): number => {
    // First check if item has variants with prices
    if (item.variants && item.variants.length > 0) {
      const variantWithPrice = item.variants.find(v => v.price > 0);
      if (variantWithPrice) {
        return variantWithPrice.price;
      }
    }
    
    // Fallback to base item price fields
    if (item.price && item.price > 0) return item.price;
    if (item.takeaway_price && item.takeaway_price > 0) return item.takeaway_price;
    if (item.dine_in_price && item.dine_in_price > 0) return item.dine_in_price;
    
    // Last resort fallback
    return 0;
  };

  // Get the best image for an item
  const getItemImage = (item: MenuItem): string | null => {
    if (item.image_url) return item.image_url;
    if (item.variants && item.variants.length > 0) {
      const variantWithImage = item.variants.find(v => v.image_url);
      if (variantWithImage) return variantWithImage.image_url;
    }
    return null;
  };

  // Handle image loading states
  const handleImageLoad = (itemId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [itemId]: false }));
  };

  const handleImageError = (itemId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [itemId]: false }));
  };

  const handleItemQuantityChange = (item: MenuItem, quantity: number) => {
    const newItems = [...selectedItems];
    const existingIndex = newItems.findIndex(i => i.menu_item_id === item.id);
    
    if (quantity === 0) {
      if (existingIndex > -1) {
        newItems.splice(existingIndex, 1);
      }
    } else {
      const itemPrice = getItemPrice(item);
      const setMealItem: SetMealItem = {
        id: `${item.id}-${Date.now()}`,
        menu_item_id: item.id,
        quantity,
        name: item.name,
        price: itemPrice
      };
      
      if (existingIndex > -1) {
        newItems[existingIndex] = setMealItem;
      } else {
        newItems.push(setMealItem);
      }
    }
    
    onItemsChange(newItems);
  };

  const getItemQuantity = (itemId: string) => {
    return selectedItems.find(i => i.menu_item_id === itemId)?.quantity || 0;
  };

  const totalSelectedItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getSectionsAndCategories = () => {
    const sections = categories.filter(cat => !cat.parent_category_id && cat.active);
    const subcategories = categories.filter(cat => cat.parent_category_id && cat.active);
    
    return sections.map(section => ({
      ...section,
      subcategories: subcategories.filter(sub => sub.parent_category_id === section.id)
    }));
  };

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionClick = (sectionId: string, hasSubcategories: boolean) => {
    if (hasSubcategories) {
      // If section has subcategories, toggle expansion
      toggleSectionExpansion(sectionId);
    } else {
      // If no subcategories, select the section directly
      setSelectedCategory(sectionId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl h-[85vh] bg-[#1E1E1E] border-gray-700">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white text-xl">Select Menu Items for Set Meal</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose menu items to include in your set meal. Browse by sections and categories.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-lg">Loading menu items...</div>
          </div>
        ) : (
          <div className="flex h-full gap-6 overflow-hidden">
            {/* Sidebar - Sections & Categories */}
            <div className="w-72 bg-[#2A2A2A] rounded-lg p-4 flex-shrink-0">
              <h3 className="text-white font-semibold mb-4">Browse by Section</h3>
              <ScrollArea className="h-[calc(100%-3rem)]">
                <div className="space-y-2 pr-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "ghost"}
                    className={`w-full justify-start ${selectedCategory === null ? 'bg-[#7C5DFA] hover:bg-[#6A4CE8] text-white' : 'text-[#7C5DFA] hover:bg-[#3A3A3A]'}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Items ({menuItems.length})
                  </Button>
                  
                  {getSectionsAndCategories().map(section => {
                    const sectionItemCount = menuItems.filter(item => {
                      // Count items in this section or its subcategories
                      if (item.category_id === section.id) return true;
                      return section.subcategories.some(sub => sub.id === item.category_id);
                    }).length;
                    
                    const hasSubcategories = section.subcategories.length > 0;
                    const isExpanded = expandedSections.has(section.id);
                    
                    return (
                      <div key={section.id} className="space-y-1">
                        {/* Parent Section */}
                        <Button
                          variant={selectedCategory === section.id ? "default" : "ghost"}
                          className={`w-full justify-start font-semibold text-sm ${selectedCategory === section.id ? 'bg-[#7C5DFA] hover:bg-[#6A4CE8] text-white' : 'text-[#7C5DFA] hover:bg-[#3A3A3A]'}`}
                          onClick={() => handleSectionClick(section.id, hasSubcategories)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              {hasSubcategories && (
                                isExpanded ? 
                                  <ChevronDown className="h-4 w-4" /> : 
                                  <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="uppercase tracking-wide">{section.name}</span>
                            </div>
                            <span className="text-xs opacity-70">({sectionItemCount})</span>
                          </div>
                        </Button>
                        
                        {/* Subcategories under this section - only show if expanded */}
                        {hasSubcategories && isExpanded && section.subcategories.map(sub => {
                          const subItemCount = menuItems.filter(item => item.category_id === sub.id).length;
                          
                          return (
                            <Button
                              key={sub.id}
                              variant={selectedCategory === sub.id ? "default" : "ghost"}
                              className={`w-full justify-start pl-8 text-sm ${selectedCategory === sub.id ? 'bg-[#7C5DFA] hover:bg-[#6A4CE8] text-white' : 'text-gray-300 hover:bg-[#3A3A3A]'}`}
                              onClick={() => setSelectedCategory(sub.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="uppercase tracking-wide">{sub.name}</span>
                                <span className="text-xs opacity-70">({subItemCount})</span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content - Menu Items Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#2A2A2A] border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              {/* Items Grid */}
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pr-2">
                  {filteredItems.map(item => {
                    const itemPrice = getItemPrice(item);
                    const itemImage = getItemImage(item);
                    const quantity = getItemQuantity(item.id);
                    const isLoading = imageLoadingStates[item.id];
                    
                    return (
                      <Card key={item.id} className="bg-[#2A2A2A] border-gray-600 overflow-hidden hover:border-[#7C5DFA] transition-colors">
                        {/* Image Section */}
                        <div className="relative aspect-[4/3] bg-gray-800">
                          {itemImage ? (
                            <>
                              {isLoading && (
                                <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
                                  <div className="w-8 h-8 border-2 border-[#7C5DFA] border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                              <img
                                src={itemImage}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onLoad={() => handleImageLoad(item.id)}
                                onError={() => handleImageError(item.id)}
                                style={{ display: isLoading ? 'none' : 'block' }}
                              />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <ImageOff className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                          
                          {/* Quantity Badge */}
                          {quantity > 0 && (
                            <div className="absolute top-2 right-2 bg-[#7C5DFA] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                              {quantity}
                            </div>
                          )}
                          
                          {/* Featured Badge */}
                          {item.featured && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                                Featured
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="p-4">
                          <h4 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                            {item.name}
                          </h4>
                          
                          {item.menu_item_description && (
                            <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                              {item.menu_item_description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[#7C5DFA] font-semibold text-sm">
                              {itemPrice > 0 ? formatCurrency(itemPrice) : 'Price TBC'}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 border-gray-600 hover:bg-red-500 hover:border-red-500"
                                onClick={() => handleItemQuantityChange(item, Math.max(0, quantity - 1))}
                                disabled={quantity === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="text-white text-sm w-8 text-center">
                                {quantity}
                              </span>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 border-gray-600 hover:bg-[#7C5DFA] hover:border-[#7C5DFA]"
                                onClick={() => handleItemQuantityChange(item, quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
        
        {/* Footer with Summary and Actions */}
        <div className="bg-[#2A2A2A] border-t border-gray-600 p-4 flex items-center justify-between">
          <div className="text-white">
            <span className="font-semibold">{totalSelectedItems} items selected</span>
            <span className="text-gray-400 ml-2">
              Total: {formatCurrency(totalPrice)}
            </span>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="border-gray-600 text-gray-300 hover:bg-[#3A3A3A] hover:border-gray-500"
            >
              Cancel
            </Button>
            <Button 
              onClick={onClose}
              className="bg-[#7C5DFA] hover:bg-[#6A4CE8] text-white"
              disabled={selectedItems.length === 0}
            >
              Done ({totalSelectedItems})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
