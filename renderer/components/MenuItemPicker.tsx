import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Minus, Trash2, Settings, ImageIcon } from 'lucide-react';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { apiClient } from 'app';
import { OrderItem } from 'utils/menuTypes';

// 7 Hardcoded Category Sections for Restaurant Organization
const CATEGORY_SECTIONS = [
  {
    id: 'starters',
    name: 'STARTERS',
    color: '#FF6B6B',
    keywords: ['starter', 'appetizer', 'appetiser', 'poppadom', 'chat', 'samosa', 'tikka', 'sheek', 'tandoori']
  },
  {
    id: 'main_course', 
    name: 'MAIN COURSE',
    color: '#4ECDC4',
    keywords: ['curry', 'masala', 'biryani', 'karahi', 'bhuna', 'madras', 'vindaloo', 'korma', 'jalfrezi', 'pathia', 'dopiaza', 'rogan']
  },
  {
    id: 'side_dishes',
    name: 'SIDE DISHES', 
    color: '#45B7D1',
    keywords: ['rice', 'pilau', 'fried rice', 'boiled rice', 'coconut rice', 'egg rice', 'mushroom rice']
  },
  {
    id: 'accompaniments',
    name: 'ACCOMPANIMENTS',
    color: '#96CEB4', 
    keywords: ['naan', 'roti', 'chapati', 'paratha', 'bread', 'pickle', 'chutney', 'raita', 'salad']
  },
  {
    id: 'desserts_coffee',
    name: 'DESSERTS & COFFEE',
    color: '#FFEAA7',
    keywords: ['ice cream', 'kulfi', 'dessert', 'sweet', 'coffee', 'tea', 'lassi']
  },
  {
    id: 'drinks_wine', 
    name: 'DRINKS & WINE',
    color: '#DDA0DD',
    keywords: ['wine', 'beer', 'lager', 'drink', 'soft drink', 'juice', 'water', 'cobra', 'kingfisher']
  },
  {
    id: 'set_meals',
    name: 'SET MEALS',
    color: '#F39C12',
    keywords: ['set meal', 'banquet', 'family', 'sharing', 'platter', 'combo', 'special offer']
  }
];

interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
  description?: string;
  parent_category_id?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  active: boolean;
  variants?: MenuItemVariant[];
  media_assets?: MediaAsset[];
}

interface MenuItemVariant {
  id: string;
  name: string;
  variant_name?: string;  // Database-generated full name (e.g., "CHICKEN TIKKA (MAIN)")
  price: number;
  active: boolean;
}

interface MediaAsset {
  id: string;
  original_filename: string;
  public_url: string;
  metadata?: {
    alt_text?: string;
  };
}

interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
}

interface Props {
  onItemsChange: (items: OrderItem[]) => void;
  selectedItems: OrderItem[];
}

// Category mapping function
function mapItemToSection(item: MenuItem, categories: MenuCategory[]): string {
  const itemCategory = categories.find(cat => cat.id === item.category_id);
  const categoryName = itemCategory?.name?.toLowerCase() || '';
  const itemName = item.name.toLowerCase();
  const itemDesc = item.description?.toLowerCase() || '';
  
  // Check each section for keyword matches
  for (const section of CATEGORY_SECTIONS) {
    const searchText = `${categoryName} ${itemName} ${itemDesc}`;
    if (section.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
      return section.id;
    }
  }
  
  // Default fallback
  return 'main_course';
}

// Customize Modal Component
function CustomizeModal({ item, onAddCustomized, trigger }: {
  item: MenuItem;
  onAddCustomized: (item: MenuItem, customizations: any) => void;
  trigger: React.ReactNode;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | null>(null);
  const [instructions, setInstructions] = useState('');
  
  const handleAdd = () => {
    onAddCustomized(item, {
      quantity,
      variant: selectedVariant,
      instructions
    });
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md" style={{ backgroundColor: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.light}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: QSAITheme.text.primary }}>Customize {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.secondary }}>Variant</label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <Button
                  variant={selectedVariant === null ? 'default' : 'outline'}
                  onClick={() => setSelectedVariant(null)}
                  className="justify-between"
                  style={{ backgroundColor: selectedVariant === null ? QSAITheme.purple.primary : 'transparent' }}
                >
                  <span>Standard</span>
                  <span>£{(item.price || 0).toFixed(2)}</span>
                </Button>
                {item.variants.filter(v => v.active).map(variant => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                    onClick={() => setSelectedVariant(variant)}
                    className="justify-between"
                    style={{ backgroundColor: selectedVariant?.id === variant.id ? QSAITheme.purple.primary : 'transparent' }}
                  >
                    <span>{variant.name}</span>
                    <span>£{(variant.price || 0).toFixed(2)}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantity */}
          <div>
            <label className="text-sm font-medium" style={{ color: QSAITheme.text.secondary }}>Quantity</label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ borderColor: QSAITheme.border.light }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium" style={{ color: QSAITheme.text.primary }}>{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuantity(quantity + 1)}
                style={{ borderColor: QSAITheme.border.light }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Special Instructions */}
          <div>
            <label className="text-sm font-medium" style={{ color: QSAITheme.text.secondary }}>Special Instructions</label>
            <Input
              placeholder="e.g., Extra spicy, No onions..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-2"
              style={{ backgroundColor: QSAITheme.background.secondary, border: `1px solid ${QSAITheme.border.light}`, color: QSAITheme.text.primary }}
            />
          </div>
          
          {/* Add Button */}
          <Button
            onClick={handleAdd}
            className="w-full"
            style={{ backgroundColor: QSAITheme.purple.primary, color: QSAITheme.text.primary }}
          >
            Add to Order - £{((selectedVariant?.price || item.price || 0) * quantity).toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MenuItemPicker({ onItemsChange, selectedItems }: Props) {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load menu data
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);
        // ✅ FIX: Use get_menu_with_ordering to get items WITH variants
        const response = await apiClient.get_menu_with_ordering();
        const result = await response.json();
        
        // Extract data from new API structure
        if (result.success && result.data) {
          const menuData = {
            categories: result.data.categories || [],
            items: result.data.items || []
          };
          setMenuData(menuData);
        } else {
          console.error('❌ [MenuItemPicker] Failed to load menu data:', result.message);
          setError(result.message || 'Failed to load menu data');
        }
        setError(null);
      } catch (err) {
        console.error('Failed to load menu data:', err);
        setError('Failed to load menu data');
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, []);

  // Group items by section
  const itemsBySection = React.useMemo(() => {
    if (!menuData) return {};
    
    const sections: Record<string, MenuItem[]> = {};
    
    menuData.items.filter(item => item.active).forEach(item => {
      const section = mapItemToSection(item, menuData.categories);
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(item);
    });
    
    return sections;
  }, [menuData]);

  // Filter items based on section and search
  const filteredItems = React.useMemo(() => {
    if (!menuData) return [];
    
    let items = menuData.items.filter(item => item.active);
    
    // Filter by section
    if (selectedSection !== 'all') {
      items = itemsBySection[selectedSection] || [];
    }
    
    // Filter by search
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return items;
  }, [menuData, selectedSection, searchTerm, itemsBySection]);

  // Simple add to order
  const addItemToOrder = (menuItem: MenuItem, variant?: MenuItemVariant) => {
    const basePrice = variant?.price || menuItem.price || 0;
    // Priority: variant_name (database-generated) > name (custom override)
    const variantLabel = variant ? (variant.variant_name || variant.name || 'Variant') : '';
    
    // Get category info for receipt grouping
    const category = menuData?.categories.find(cat => cat.id === menuItem.category_id);
    
    const orderItem: OrderItem = {
      id: `${menuItem.id}_${variant?.id || 'base'}_${Date.now()}`,
      menu_item_id: menuItem.id, // ✅ ADD: Enable receipt grouping
      variant_id: variant?.id || '',
      name: variant ? `${menuItem.name} (${variantLabel})` : menuItem.name,
      quantity: 1,
      price: basePrice,
      variantName: variantLabel,
      modifiers: [],
      customizations: [],
      category_id: menuItem.category_id, // ✅ ADD: For receipt sections
      category_name: category?.name || 'Other' // ✅ ADD: For receipt sections
    };
    onItemsChange([...selectedItems, orderItem]);
  };

  // Add customized item
  const addCustomizedItem = (menuItem: MenuItem, customizations: any) => {
    const { quantity, variant, instructions } = customizations;
    const basePrice = variant?.price || menuItem.price || 0;
    // Priority: variant_name (database-generated) > name (custom override)
    const variantLabel = variant ? (variant.variant_name || variant.name || 'Variant') : '';
    
    // Get category info for receipt grouping
    const category = menuData?.categories.find(cat => cat.id === menuItem.category_id);
    
    const orderItem: OrderItem = {
      id: `${menuItem.id}_${variant?.id || 'base'}_${Date.now()}`,
      menu_item_id: menuItem.id, // ✅ ADD: Enable receipt grouping
      variant_id: variant?.id || '',
      name: variant ? `${menuItem.name} (${variantLabel})` : menuItem.name,
      quantity: quantity,
      price: basePrice,
      variantName: variantLabel,
      notes: instructions || '',
      modifiers: [],
      customizations: [],
      category_id: menuItem.category_id, // ✅ ADD: For receipt sections
      category_name: category?.name || 'Other' // ✅ ADD: For receipt sections
    };
    onItemsChange([...selectedItems, orderItem]);
  };

  // Update quantity
  const updateQuantity = (itemId: string, change: number) => {
    const updatedItems = selectedItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return {
          ...item,
          quantity: newQuantity
          // No need to store 'total' - calculate on the fly in display
        };
      }
      return item;
    }).filter(item => item.quantity > 0);
    onItemsChange(updatedItems);
  };

  // Remove item
  const removeItem = (itemId: string) => {
    onItemsChange(selectedItems.filter(item => item.id !== itemId));
  };

  if (loading) {
    return (
      <Card style={{ backgroundColor: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.light}` }}>
        <CardContent className="p-6 text-center">
          <div style={{ color: QSAITheme.text.secondary }}>Loading menu items...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ backgroundColor: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.light}` }}>
        <CardContent className="p-6 text-center">
          <div style={{ color: QSAITheme.text.secondary }}>{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card style={{ backgroundColor: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.light}` }}>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: QSAITheme.text.secondary }} />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              style={{ backgroundColor: QSAITheme.background.secondary, border: `1px solid ${QSAITheme.border.light}`, color: QSAITheme.text.primary }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 7-Section Category Navigation */}
      <Card style={{ backgroundColor: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.light}` }}>
        <CardHeader>
          <CardTitle style={{ color: QSAITheme.text.primary }}>Menu Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Button
              variant={selectedSection === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedSection('all')}
              className="h-16 flex-col gap-1 text-xs"
              style={{ 
                backgroundColor: selectedSection === 'all' ? QSAITheme.purple.primary : 'transparent',
                borderColor: selectedSection === 'all' ? QSAITheme.purple.primary : QSAITheme.border.light,
                color: QSAITheme.text.primary 
              }}
            >
              <div className="font-medium">ALL</div>
              <div className="text-xs opacity-70">
                {menuData?.items.filter(item => item.active).length || 0}
              </div>
            </Button>
            
            {CATEGORY_SECTIONS.map(section => {
              const count = itemsBySection[section.id]?.length || 0;
              return (
                <Button
                  key={section.id}
                  variant={selectedSection === section.id ? 'default' : 'outline'}
                  onClick={() => setSelectedSection(section.id)}
                  className="h-16 flex-col gap-1 text-xs relative"
                  style={{ 
                    backgroundColor: selectedSection === section.id ? section.color : 'transparent',
                    borderColor: selectedSection === section.id ? section.color : QSAITheme.border.light,
                    color: selectedSection === section.id ? '#000' : QSAITheme.text.primary
                  }}
                >
                  <div className="font-medium text-center leading-tight">{section.name}</div>
                  <div className="text-xs opacity-70">{count}</div>
                  {count > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: section.color }}
                    >
                      {count > 9 ? '9+' : count}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Menu Items Grid */}
      <Card style={{ backgroundColor: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.light}` }}>
        <CardHeader>
          <CardTitle style={{ color: QSAITheme.text.primary }}>
            {selectedSection === 'all' 
              ? `All Menu Items (${filteredItems.length})`
              : `${CATEGORY_SECTIONS.find(s => s.id === selectedSection)?.name} (${filteredItems.length})`
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const section = CATEGORY_SECTIONS.find(s => s.id === mapItemToSection(item, menuData?.categories || []));
              const thumbnail = item.media_assets?.[0];
              
              return (
                <Card 
                  key={item.id} 
                  className="h-40 flex flex-col" // Fixed height for consistency
                  style={{ backgroundColor: QSAITheme.background.secondary, border: `1px solid ${QSAITheme.border.light}` }}
                >
                  <CardContent className="p-4 flex-1 flex flex-col">
                    {/* Header with thumbnail and category badge */}
                    <div className="flex items-start gap-3 mb-2">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700 flex items-center justify-center">
                        {thumbnail ? (
                          <img 
                            src={thumbnail.public_url} 
                            alt={thumbnail.metadata?.alt_text || item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6" style={{ color: QSAITheme.text.secondary }} />
                        )}
                      </div>
                      
                      {/* Title and Badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight truncate" style={{ color: QSAITheme.text.primary }}>
                            {item.name}
                          </h4>
                          <Badge 
                            className="text-xs px-2 py-1 flex-shrink-0"
                            style={{ 
                              backgroundColor: section?.color || QSAITheme.border.light,
                              color: '#000',
                              border: 'none'
                            }}
                          >
                            {section?.name.split(' ')[0] || 'MISC'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description - Truncated */}
                    {item.description && (
                      <p 
                        className="text-xs flex-1 line-clamp-2 mb-3" 
                        style={{ color: QSAITheme.text.secondary }}
                        title={item.description}
                      >
                        {item.description.length > 80 
                          ? `${item.description.substring(0, 80)}...` 
                          : item.description
                        }
                      </p>
                    )}
                    
                    {/* Footer with Price and Actions */}
                    <div className="flex justify-between items-center mt-auto">
                      <div className="text-lg font-bold" style={{ color: QSAITheme.text.primary }}>
                        £{(item.price || 0).toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => addItemToOrder(item)}
                          className="px-3"
                          style={{ backgroundColor: QSAITheme.purple.primary, color: QSAITheme.text.primary }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <CustomizeModal
                          item={item}
                          onAddCustomized={addCustomizedItem}
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-2"
                              style={{ borderColor: QSAITheme.border.light, color: QSAITheme.text.primary }}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12" style={{ color: QSAITheme.text.secondary }}>
              <div className="text-lg mb-2">No menu items found</div>
              <div className="text-sm">
                {searchTerm 
                  ? `No items match "${searchTerm}" in ${selectedSection === 'all' ? 'any category' : CATEGORY_SECTIONS.find(s => s.id === selectedSection)?.name}`
                  : `No items available in ${selectedSection === 'all' ? 'any category' : CATEGORY_SECTIONS.find(s => s.id === selectedSection)?.name}`
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <Card style={{ backgroundColor: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.light}` }}>
          <CardHeader>
            <CardTitle style={{ color: QSAITheme.text.primary }}>Order Items ({selectedItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {selectedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: QSAITheme.background.secondary }}>
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: QSAITheme.text.primary }}>
                      {item.name}
                    </div>
                    <div className="text-sm" style={{ color: QSAITheme.text.secondary }}>
                      £{(item.price || 0).toFixed(2)} each
                      {item.notes && (
                        <span className="ml-2 italic">({item.notes})</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{ borderColor: QSAITheme.border.light, color: QSAITheme.text.primary }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center" style={{ color: QSAITheme.text.primary }}>
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{ borderColor: QSAITheme.border.light, color: QSAITheme.text.primary }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="w-20 text-right font-semibold" style={{ color: QSAITheme.text.primary }}>
                      £{((item.price || 0) * item.quantity).toFixed(2)}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 border-red-500/50 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-3" style={{ borderColor: QSAITheme.border.light }}>
                <div className="flex justify-between items-center font-bold text-lg">
                  <span style={{ color: QSAITheme.text.primary }}>Total:</span>
                  <span style={{ color: QSAITheme.text.primary }}>
                    £{selectedItems.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Add default export
export default MenuItemPicker;
