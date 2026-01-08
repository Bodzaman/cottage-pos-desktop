import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MenuItem, OrderItem } from 'utils/menuTypes';
import { useRealtimeMenuStore, getMenuDataForPOS } from '../utils/realtimeMenuStore';
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

interface POSMenuSectionProps {
  onAddToOrder: (item: OrderItem) => void;
  orderMode: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  className?: string;
}

/**
 * POSMenuSection - Desktop POS menu management interface
 * Replicates POSMenuSelector functionality for the desktop app
 */
export function POSMenuSection({ onAddToOrder, orderMode, className = '' }: POSMenuSectionProps) {
  // 🚀 SELECTIVE SUBSCRIPTIONS: Only subscribe to what we need
  const categories = useRealtimeMenuStore(state => state.categories, shallow);
  const filteredMenuItems = useRealtimeMenuStore(state => state.filteredMenuItems, shallow);
  const isLoading = useRealtimeMenuStore(state => state.isLoading);
  const selectedMenuCategory = useRealtimeMenuStore(state => state.selectedMenuCategory);
  const searchQuery = useRealtimeMenuStore(state => state.searchQuery);
  const setSelectedMenuCategory = useRealtimeMenuStore(state => state.setSelectedMenuCategory);
  const setSearchQuery = useRealtimeMenuStore(state => state.setSearchQuery);
  
  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Get menu data
  const menuData = getMenuDataForPOS();
  
  // Update search query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery, setSearchQuery]);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedMenuCategory(categoryId);
  };
  
  // Handle add to order
  const handleAddItem = (menuItem: MenuItem) => {
    const orderItem: OrderItem = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      variant_id: menuItem.defaultVariant?.id || null,
      variant_name: menuItem.defaultVariant?.name || null,
      notes: '',
      modifiers: [],
      protein_type: null,
      customization_notes: '',
      special_instructions: ''
    };
    
    onAddToOrder(orderItem);
    toast.success(`Added ${menuItem.name} to order`);
  };
  
  // Filter categories (only show parent categories)
  const parentCategories = categories.filter(cat => !cat.parent_category_id);
  
  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center h-full`}
           style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p style={{ color: '#e5e5e5' }}>Loading menu...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className} flex flex-col h-full`}
         style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: '#333', backgroundColor: '#2a2a2a' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6" style={{ color: '#fb923c' }} />
            <h2 className="text-xl font-semibold" style={{ color: '#e5e5e5' }}>Menu</h2>
            <Badge variant="outline" style={{ borderColor: '#fb923c', color: '#fb923c' }}>
              {orderMode}
            </Badge>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 p-1 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
              style={viewMode === 'grid' ? { backgroundColor: '#fb923c' } : {}}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
              style={viewMode === 'list' ? { backgroundColor: '#fb923c' } : {}}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#9ca3af' }} />
          <Input
            placeholder="Search menu items..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
            style={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#e5e5e5' }}
          />
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Categories Sidebar */}
        <div className="w-64 border-r" style={{ borderColor: '#333', backgroundColor: '#2a2a2a' }}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {parentCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedMenuCategory === category.id ? 'default' : 'ghost'}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => handleCategorySelect(category.id)}
                  style={{
                    backgroundColor: selectedMenuCategory === category.id ? '#fb923c' : 'transparent',
                    color: selectedMenuCategory === category.id ? '#000' : '#e5e5e5'
                  }}
                >
                  <div>
                    <div className="font-medium">{category.name}</div>
                    {category.description && (
                      <div className="text-sm opacity-75 mt-1">{category.description}</div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Menu Items */}
        <div className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              {filteredMenuItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Package className="h-16 w-16 mb-4" style={{ color: '#6b7280' }} />
                  <p className="text-lg" style={{ color: '#6b7280' }}>No items found</p>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>Try selecting a different category or adjusting your search</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {filteredMenuItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2"
                        style={{ 
                          backgroundColor: '#2a2a2a', 
                          borderColor: '#333',
                          ':hover': { borderColor: '#fb923c' }
                        }}
                        onClick={() => handleAddItem(item)}
                      >
                        <CardContent className="p-4">
                          {viewMode === 'grid' ? (
                            // Grid View
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-base leading-tight" style={{ color: '#e5e5e5' }}>
                                  {item.name}
                                </h3>
                                {item.description && (
                                  <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9ca3af' }}>
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold" style={{ color: '#fb923c' }}>
                                  £{item.price.toFixed(2)}
                                </span>
                                
                                {item.is_available === false && (
                                  <Badge variant="secondary" className="text-xs">
                                    Unavailable
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            // List View
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold" style={{ color: '#e5e5e5' }}>
                                  {item.name}
                                </h3>
                                {item.description && (
                                  <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {item.is_available === false && (
                                  <Badge variant="secondary" className="text-xs">
                                    Unavailable
                                  </Badge>
                                )}
                                <span className="text-lg font-bold" style={{ color: '#fb923c' }}>
                                  £{item.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default POSMenuSection;
