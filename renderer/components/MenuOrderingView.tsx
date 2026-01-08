import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Search, ChevronLeft, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from 'app';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useVoiceAgentStore } from '../utils/voiceAgentStore';
import { CategoryNavigation } from '../components/CategoryNavigation';
import { MenuGrid } from '../components/MenuGrid';
import { CustomerVariantSelector } from '../components/CustomerVariantSelector';
import { useCartStore } from '../utils/cartStore';
import { PremiumTheme } from '../utils/premiumTheme';
import { MenuItem, ItemVariant, Category } from '../utils/menuTypes';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function MenuOrderingView() {
  // Menu data and filtering - using reactive store (exactly like OnlineOrders)
  const realtimeMenuStore = useRealtimeMenuStore();
  const { menuItems, categories, isLoading: menuLoading } = realtimeMenuStore;
  
  // Auth integration (same as OnlineOrders)
  const { isAuthenticated } = useSimpleAuth();
  
  // Voice agent integration (copied from OnlineOrders)
  const { hasSelectedAgent, getSelectedAgentName, getSelectedAgentPassportImage, masterSwitchEnabled } = useVoiceAgentStore();
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  // Hierarchical category state (exactly like OnlineMenu)
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>('all');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Order mode
  const [orderMode, setOrderMode] = useState<'delivery' | 'collection'>('collection');
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  
  // Cart functionality (exactly like OnlineMenu)
  const { addItem } = useCartStore();
  
  // Handle starting voice order (copied from OnlineMenu)
  const handleStartVoiceOrder = () => {
    if (!hasSelectedAgent()) {
      toast.error('No AI assistant selected');
      return;
    }
    
    setShowVoiceModal(true);
    toast.success(`Starting voice session with ${getSelectedAgentName()}`);
  };

  // Initialize menu store on mount (exactly like OnlineMenu)
  useEffect(() => {
    const initializeMenu = async () => {
      if (!realtimeMenuStore.isConnected) {
        try {
          await realtimeMenuStore.initialize();
        } catch (error) {
          console.error('Failed to initialize menu store:', error);
          toast.error('Failed to load menu data');
        }
      }
    };
    
    initializeMenu();
  }, []);
  
  // Initialize filteredItems with menuItems (exactly like OnlineMenu)
  useEffect(() => {
    setFilteredItems(menuItems);
  }, [menuItems]);

  // Filter items based on search term and category (exactly like OnlineMenu)
  useEffect(() => {
    let filtered = menuItems.filter(item => item.active);
    
    // Filter by category (hierarchical logic)
    if (selectedMenuCategory && selectedMenuCategory !== 'all') {
      filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.menu_item_description?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredItems(filtered);
  }, [menuItems, selectedMenuCategory, searchTerm]);
  
  // Handle adding to cart (exactly like OnlineOrders)
  const handleAddToCart = (item: MenuItem, variant: any, quantity: number, notes?: string) => {
    // **CORRECT PRICING LOGIC FOR ONLINE ORDERS**
    // OnlineOrders is for collection/delivery only - NOT dine-in
    let price = 0;
    
    if (variant && variant.id !== `single-${item.id}`) {
      // Multi-variant item with real variant data
      if (orderMode === "delivery") {
        price = variant.price_delivery || variant.price || 0;
      } else {
        // Collection mode - use base price (which is takeaway price)
        price = variant.price || 0;
      }
    } else {
      // Single item - use item pricing
      if (orderMode === "delivery") {
        price = item.price_delivery || item.price_takeaway || item.price || 0;
      } else {
        // Collection mode
        price = item.price_takeaway || item.price || 0;
      }
    }
    
    // Use addItem from useCartStore (exactly like OnlineOrders)
    addItem(item, variant, quantity, notes);
    setIsVariantSelectorOpen(false);
    setSelectedItem(null);
  };
  
  // Handle menu item click (exactly like OnlineMenu)
  const handleItemClick = (item: MenuItem, variant?: ItemVariant) => {
    setSelectedItem(item);
    setIsVariantSelectorOpen(true);
  };

  // Calculate menu item counts for categories (exactly like OnlineMenu)
  const menuItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Count all items
    counts.all = filteredItems.length;
    
    // Count by category
    categories.forEach(category => {
      counts[category.id] = filteredItems.filter(
        item => item.category_id === category.id
      ).length;
    });
    
    return counts;
  }, [filteredItems, categories]);
  
  return (
    <div className="min-h-screen" style={{
      background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[950]} 0%, ${PremiumTheme.colors.charcoal[900]} 50%, ${PremiumTheme.colors.dark[900]} 100%)`,
      color: PremiumTheme.colors.text.primary
    }}>
      {/* Header with Search and Order Mode Toggle (exactly like OnlineMenu) */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{
        background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]}95 0%, ${PremiumTheme.colors.charcoal[800]}90 100%)`,
        borderColor: PremiumTheme.colors.border.medium,
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 ${PremiumTheme.colors.border.light}`
      }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <motion.h1 
              className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${PremiumTheme.colors.silver[400]} 0%, ${PremiumTheme.colors.platinum[500]} 100%)`
              }}
              whileHover={{ scale: 1.05 }}
            >
              Cottage Tandoori
            </motion.h1>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                  style={{ color: PremiumTheme.colors.text.muted }} 
                />
                <Input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 border-0"
                  style={{
                    background: `${PremiumTheme.colors.dark[800]}80`,
                    color: PremiumTheme.colors.text.primary,
                    backdropFilter: 'blur(8px)'
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Order Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={orderMode === 'collection' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderMode('collection')}
                className="text-xs"
                style={orderMode === 'collection' ? {
                  background: `linear-gradient(135deg, ${PremiumTheme.colors.royal[600]} 0%, ${PremiumTheme.colors.royal[500]} 100%)`
                } : {}}
              >
                Collection
              </Button>
              <Button
                variant={orderMode === 'delivery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderMode('delivery')}
                className="text-xs"
                style={orderMode === 'delivery' ? {
                  background: `linear-gradient(135deg, ${PremiumTheme.colors.silver[600]} 0%, ${PremiumTheme.colors.silver[500]} 100%)`
                } : {}}
              >
                Delivery
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <motion.aside 
            className="hidden lg:block lg:col-span-1"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div 
              className="sticky top-24 rounded-2xl border overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[800]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
                borderColor: PremiumTheme.colors.dark[600],
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}
            >
              {/* AI Voice Panel - Above Categories (exactly like OnlineMenu) */}
              {isAuthenticated && hasSelectedAgent() && (
                <div className="border-b border-gray-800 p-4">
                  <div 
                    className="rounded-xl p-6 border transition-all duration-300 hover:shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[800]} 0%, ${PremiumTheme.colors.dark[850]} 50%, ${PremiumTheme.colors.burgundy[900]}20 100%)`,
                      borderColor: PremiumTheme.colors.dark[600],
                      boxShadow: 'none'
                    }}
                  >
                    <div className="text-center mb-4">
                      <div 
                        className="w-16 h-16 mx-auto mb-3 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[700]} 0%, ${PremiumTheme.colors.dark[800]} 100%)`,
                          borderColor: PremiumTheme.colors.dark[500],
                          boxShadow: 'none'
                        }}
                      >
                        <Sparkles className="w-7 h-7 transition-colors duration-300 text-gray-400" />
                      </div>
                      
                      <div className="mb-1">
                        <h3 className="text-lg font-bold text-white mb-1">
                          Hi, I'm Ash
                        </h3>
                        <p className="text-sm font-semibold" style={{ color: PremiumTheme.colors.burgundy[400] }}>
                          AI Assistant
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-white mb-2">
                          Get help in under 5 minutes
                        </p>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          I'll help you explore our menu, answer questions, and place your order quickly!
                        </p>
                      </div>
                    </div>
                    
                    {/* Start Voice Order Button */}
                    <button
                      onClick={handleStartVoiceOrder}
                      className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 text-sm"
                      style={{
                        background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(139, 21, 56, 0.3)',
                        border: 'none'
                      }}
                    >
                      <span className="text-lg">🗣️</span>
                      <span>Start Voice Order</span>
                    </button>
                  </div>
                </div>
              )}
              
              <CategoryNavigation
                categories={categories}
                selectedParentCategory={selectedParentCategory}
                selectedMenuCategory={selectedMenuCategory}
                onParentCategorySelect={setSelectedParentCategory}
                onMenuCategorySelect={setSelectedMenuCategory}
                menuItemCount={menuItemCounts}
              />
            </div>
          </motion.aside>
          
          {/* Main Content Area */}
          <main className="lg:col-span-3 overflow-y-auto pb-20">
            
            {/* REMOVE_AI: AI Recommendations widget retired */}
            
            {/* Menu Grid */}
            <MenuGrid 
              menuItems={filteredItems}
              onItemSelect={(item: MenuItem, variant?: ItemVariant) => {
                setSelectedItem(item);
                setIsVariantSelectorOpen(true);
              }}
              mode={orderMode}
              isLoading={menuLoading}
              searchQuery={searchQuery}
              selectedCategory={selectedMenuCategory}
            />
          </main>
        </div>
      </div>
      
      {/* Variant Selector Modal */}
      <CustomerVariantSelector
        menuItem={selectedItem}
        isOpen={isVariantSelectorOpen}
        onClose={() => {
          setSelectedItem(null);
          setIsVariantSelectorOpen(false);
        }}
        onAddToCart={handleAddToCart}
        mode={orderMode}
      />
    </div>
  );
}
