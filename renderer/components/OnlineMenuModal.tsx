import React, { useState, useEffect } from 'react';
import { X, Edit, Shield, Eye, Save, RotateCcw, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuItemCard } from 'components/MenuItemCard';
import { SetMealsSection } from 'components/SetMealsSection';
import { Category, MenuItem, ItemVariant, ProteinType, SetMeal } from '../utils/menuTypes';
import { useCompleteMenuData, menuKeys } from '../utils/menuQueries';
import { useQueryClient } from '@tanstack/react-query';
import ManagementPasswordDialog from './ManagementPasswordDialog';
import { globalColors, styles, effects } from '../utils/QSAIDesign';
import { apiClient } from 'app';
import { toast } from 'sonner';

interface OnlineMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilterOptions {
  spiceLevel: number | null;
  dietaryPreferences: string[];
  searchTerm: string;
}

const OnlineMenuModal: React.FC<OnlineMenuModalProps> = ({ isOpen, onClose }) => {
  // React Query hooks - only fetch when dialog is open
  const queryClient = useQueryClient();
  const { 
    data: menuData, 
    isLoading: loading 
  } = useCompleteMenuData({ enabled: isOpen });
  
  // Extract data from React Query result
  const categories = menuData?.categories || [];
  const menuItems = menuData?.menuItems || [];
  const proteinTypes = menuData?.proteinTypes || [];
  
  // Keep non-React Query state
  const [setMeals, setSetMeals] = useState<SetMeal[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loadingSetMeals, setLoadingSetMeals] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterOptions>({
    spiceLevel: null,
    dietaryPreferences: [],
    searchTerm: ''
  });
  
  // Staff editing state
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Available dietary filters
  const availableDietaryFilters = [
    'Vegetarian',
    'Vegan', 
    'Gluten-free',
    'Dairy-free',
    'Nut-free'
  ];

  // Load set meals
  const loadSetMeals = async () => {
    try {
      setLoadingSetMeals(true);
      const response = await apiClient.list_set_meals({ active_only: true });
      
      if (response.ok) {
        const data = await response.json();
        setSetMeals(data || []);
      }
    } catch (error) {
      console.error('Error loading set meals:', error);
    } finally {
      setLoadingSetMeals(false);
    }
  };
  
  // Load set meals when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadSetMeals();
      // Set initial active category if categories exist
      if (categories.length > 0) {
        setActiveCategory('all');
      }
    }
  }, [isOpen, categories.length]);
  
  // Handle close modal
  const handleClose = () => {
    setIsEditMode(false);
    setIsAuthenticated(false);
    onClose();
  };
  
  // Handle admin authentication
  const handleAdminAuthenticated = () => {
    setIsAuthenticated(true);
    setIsEditMode(true);
    setShowPasswordDialog(false);
    toast.success('Edit mode activated');
  };
  
  // Handle exit edit mode
  const handleExitEditMode = () => {
    setIsEditMode(false);
    setIsAuthenticated(false);
    toast.info('Edit mode deactivated');
  };
  
  // Handle availability toggle
  const handleToggleAvailability = async (item: MenuItem) => {
    const newAvailability = !item.active;
    
    try {
      // Prepare the update data with only the active field
      const updateData = {
        name: item.name,
        menu_item_description: item.menu_item_description,
        long_description: item.long_description,
        category_id: item.category_id,
        image_url: item.image_url,
        default_spice_level: item.default_spice_level,
        dietary_tags: item.dietary_tags,
        featured: item.featured,
        display_order: item.display_order,
        active: newAvailability, // Toggle the active status
        variants: item.variants?.map(variant => ({
          id: variant.id,
          protein_type_id: variant.protein_type_id,
          name: variant.name,
          price: variant.price,
          price_dine_in: variant.price_dine_in,
          price_delivery: variant.price_delivery,
          is_default: variant.is_default,
          description_override: variant.description_override,
          spice_level_override: variant.spice_level_override,
          dietary_tags_override: variant.dietary_tags_override,
          available_for_delivery: variant.available_for_delivery,
          available_for_takeaway: variant.available_for_takeaway
        })) || []
      };
      
      // Call the API to update the menu item
      const response = await apiClient.update_menu_item({ itemId: item.id }, updateData);
      
      if (response.ok) {
        // Update local state immediately for better UX
        setMenuItems(prevItems => 
          prevItems.map(menuItem => 
            menuItem.id === item.id 
              ? { ...menuItem, active: newAvailability }
              : menuItem
          )
        );
        
        // Show success message
        toast.success(
          `${item.name} is now ${newAvailability ? 'available' : 'unavailable'}`
        );
        
        // Invalidate cache to ensure fresh data on next load
        invalidateCache();
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || 'Failed to update availability';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error(
        `Failed to update ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Filter menu items based on active category and filters
  const getFilteredMenuItems = () => {
    let filteredItems = menuItems;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filteredItems = filteredItems.filter(item => item.category_id === activeCategory);
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.menu_item_description && item.menu_item_description.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by spice level
    if (filters.spiceLevel !== null) {
      filteredItems = filteredItems.filter(item => item.default_spice_level <= filters.spiceLevel);
    }
    
    // Filter by dietary preferences
    if (filters.dietaryPreferences.length > 0) {
      filteredItems = filteredItems.filter(item => {
        const itemTags = item.dietary_tags || [];
        return filters.dietaryPreferences.some(pref => itemTags.includes(pref));
      });
    }
    
    return filteredItems;
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        style={{ backdropFilter: 'blur(4px)' }}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div 
          className="w-full h-full max-w-7xl bg-black/95 border border-white/10 rounded-lg overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: `linear-gradient(135deg, ${globalColors.background.primary} 0%, ${globalColors.background.secondary} 100%)`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(124, 93, 250, 0.1)'
          }}
        >
          {/* Modal Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ 
              borderColor: globalColors.border.light,
              background: `linear-gradient(135deg, ${globalColors.background.dark} 0%, ${globalColors.background.primary} 100%)`
            }}
          >
            <div className="flex items-center space-x-4">
              <h2 
                className="text-2xl font-bold"
                style={{ color: globalColors.text.primary }}
              >
                Menu Management
              </h2>
              <Badge 
                className="text-xs px-3 py-1"
                style={{
                  background: globalColors.purple.primaryTransparent,
                  color: globalColors.text.primary,
                  border: `1px solid ${globalColors.purple.primary}`
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Staff View
              </Badge>
              {isEditMode && (
                <Badge 
                  className="text-xs px-3 py-1"
                  style={{
                    background: globalColors.purple.primaryTransparent,
                    color: globalColors.text.primary,
                    border: `1px solid ${globalColors.purple.primary}`
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Mode
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Edit Mode Toggle */}
              {!isEditMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                  className="text-sm"
                  style={{
                    borderColor: globalColors.border.accent,
                    color: globalColors.text.secondary,
                    background: 'rgba(124, 93, 250, 0.1)'
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Edit Menu
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExitEditMode}
                  className="text-sm"
                  style={{
                    borderColor: globalColors.border.light,
                    color: globalColors.text.secondary,
                    background: 'rgba(220, 38, 38, 0.1)'
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Exit Edit
                </Button>
              )}
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Modal Body - Menu Content */}
          <div className="flex-1 overflow-auto p-6 h-[calc(100vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: globalColors.purple.primary }}></div>
                  <p style={{ color: globalColors.text.secondary }}>Loading menu...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Category Tabs */}
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                  <TabsList 
                    className="grid w-full grid-cols-auto gap-2 p-2 mb-8"
                    style={{
                      background: globalColors.background.tertiary,
                      border: `1px solid ${globalColors.border.light}`
                    }}
                  >
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-purple-primary data-[state=active]:text-white"
                      style={{
                        color: activeCategory === 'all' ? globalColors.text.primary : globalColors.text.muted
                      }}
                    >
                      All Items
                    </TabsTrigger>
                    {categories
                      .filter(cat => cat.active && !cat.parent_category_id)
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(category => (
                        <TabsTrigger 
                          key={category.id}
                          value={category.id}
                          className="data-[state=active]:bg-purple-primary data-[state=active]:text-white"
                          style={{
                            color: activeCategory === category.id ? globalColors.text.primary : globalColors.text.muted
                          }}
                        >
                          {category.name}
                        </TabsTrigger>
                      ))
                    }
                  </TabsList>
                  
                  {/* Menu Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {getFilteredMenuItems().map(item => (
                      <div key={item.id} className="relative">
                        {/* Enhanced Staff Menu Item Card */}
                        <div 
                          className="p-5 rounded-lg border transition-all duration-200 hover:shadow-xl"
                          style={{
                            background: globalColors.background.tertiary,
                            borderColor: globalColors.border.light,
                            ...(isEditMode ? { cursor: 'pointer' } : {})
                          }}
                        >
                          {/* Item Header with Image */}
                          <div className="flex gap-4 mb-4">
                            {/* Item Image */}
                            {item.image_url && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  style={{ filter: 'brightness(0.9)' }}
                                />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 
                                  className="font-semibold text-lg leading-tight"
                                  style={{ color: globalColors.text.primary }}
                                >
                                  {item.name}
                                </h3>
                                
                                {/* Availability Status */}
                                <Badge 
                                  className="ml-2 text-xs flex-shrink-0"
                                  style={{
                                    background: item.active 
                                      ? 'rgba(34, 197, 94, 0.2)' 
                                      : 'rgba(220, 38, 38, 0.2)',
                                    color: item.active ? '#22C55E' : '#DC2626',
                                    border: `1px solid ${item.active ? '#22C55E' : '#DC2626'}`
                                  }}
                                >
                                  {item.active ? 'Available' : 'Unavailable'}
                                </Badge>
                              </div>
                              
                              {/* Menu Description */}
                              {item.menu_item_description && (
                                <p 
                                  className="text-sm leading-relaxed mb-2"
                                  style={{ color: globalColors.text.secondary }}
                                >
                                  {item.menu_item_description}
                                </p>
                              )}
                              
                              {/* Long Description (if different) */}
                              {item.long_description && item.long_description !== item.menu_item_description && (
                                <p 
                                  className="text-xs leading-relaxed mb-2 opacity-75"
                                  style={{ color: globalColors.text.muted }}
                                >
                                  {item.long_description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Comprehensive Visual Indicators */}
                          <div className="space-y-3 mb-4">
                            {/* Spice Level & Dietary Tags Row */}
                            <div className="flex flex-wrap gap-2">
                              {/* Spice Level Indicator */}
                              {item.default_spice_level > 0 && (
                                <Badge 
                                  className="text-xs px-2 py-1 flex items-center gap-1"
                                  style={{
                                    background: 'rgba(249, 115, 22, 0.2)',
                                    color: '#F97316',
                                    border: '1px solid rgba(249, 115, 22, 0.3)'
                                  }}
                                >
                                  🌶️ Spice {item.default_spice_level}/5
                                </Badge>
                              )}
                              
                              {/* Dietary Tags - Only show if tags are actually present in dietary_tags array */}
                              {item.dietary_tags && item.dietary_tags.length > 0 && item.dietary_tags.map(tag => {
                                // Define dietary tag icon mapping based on AdminMenu/DietaryIcons
                                const dietaryIconMap: { [key: string]: { icon: string; color: string; bgColor: string } } = {
                                  'Vegan Friendly': { icon: '🌱', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.15)' },
                                  'Vegetarian': { icon: '🥬', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.15)' },
                                  'Dairy Free': { icon: '🥛', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' },
                                  'Gluten Free': { icon: '🌾', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' },
                                  'Contains Nuts': { icon: '🥜', color: '#EA580C', bgColor: 'rgba(234, 88, 12, 0.15)' },
                                  'Contains Shellfish': { icon: '🦐', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.15)' },
                                  'Halal': { icon: '☪️', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
                                  'Chef\'s Special': { icon: '⭐', color: '#EAB308', bgColor: 'rgba(234, 179, 8, 0.15)' },
                                  'New Item': { icon: '✨', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.15)' },
                                  // Legacy compatibility
                                  'Vegan': { icon: '🌱', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.15)' },
                                  'Gluten-Free': { icon: '🌾', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' }
                                };
                                
                                const tagConfig = dietaryIconMap[tag] || { icon: '🏷️', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' };
                                
                                return (
                                  <Badge 
                                    key={tag}
                                    className="text-xs px-2 py-1 flex items-center gap-1"
                                    style={{
                                      background: tagConfig.bgColor,
                                      color: tagConfig.color,
                                      border: `1px solid ${tagConfig.color.replace(')', ', 0.3)')}`
                                    }}
                                  >
                                    {tagConfig.icon} {tag}
                                  </Badge>
                                );
                              })}
                            </div>
                            
                            {/* Allergen Information */}
                            {item.allergens && item.allergens.length > 0 && (
                              <div className="p-2 rounded-md" style={{
                                background: 'rgba(220, 38, 38, 0.1)',
                                border: '1px solid rgba(220, 38, 38, 0.3)'
                              }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold" style={{ color: '#DC2626' }}>
                                    ⚠️ ALLERGEN WARNING
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.allergens.map(allergen => (
                                    <Badge 
                                      key={allergen}
                                      className="text-xs px-1.5 py-0.5"
                                      style={{
                                        background: 'rgba(220, 38, 38, 0.2)',
                                        color: '#DC2626',
                                        border: '1px solid rgba(220, 38, 38, 0.4)'
                                      }}
                                    >
                                      {allergen}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Ingredients List */}
                            {item.ingredients && item.ingredients.length > 0 && (
                              <div className="p-2 rounded-md" style={{
                                background: globalColors.background.secondary,
                                border: `1px solid ${globalColors.border.light}`
                              }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold" style={{ color: globalColors.text.primary }}>
                                    🥘 INGREDIENTS
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.ingredients.map(ingredient => (
                                    <Badge 
                                      key={ingredient}
                                      className="text-xs px-1.5 py-0.5"
                                      style={{
                                        background: globalColors.purple.primaryTransparent,
                                        color: globalColors.text.primary,
                                        border: `1px solid ${globalColors.purple.primary}`
                                      }}
                                    >
                                      {ingredient}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Complete Variant Pricing Information */}
                          {item.variants && item.variants.length > 0 && (
                            <div className="mb-4">
                              <h4 
                                className="text-sm font-medium mb-2"
                                style={{ color: globalColors.text.primary }}
                              >
                                Pricing ({item.variants.length} variants)
                              </h4>
                              <div className="space-y-2">
                                {item.variants.map((variant, index) => {
                                  // Find the protein type name
                                  const proteinType = proteinTypes.find(p => p.id === variant.protein_type_id);
                                  const proteinName = proteinType?.name || variant.name || 'Standard';
                                  
                                  return (
                                    <div 
                                      key={variant.id}
                                      className="flex justify-between items-center p-2 rounded text-sm"
                                      style={{
                                        background: globalColors.background.secondary,
                                        border: `1px solid ${globalColors.border.light}`
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span 
                                          className="font-medium"
                                          style={{ color: globalColors.text.primary }}
                                        >
                                          {proteinName}
                                        </span>
                                        {variant.is_default && (
                                          <Badge 
                                            className="text-xs px-1 py-0"
                                            style={{
                                              background: globalColors.purple.primaryTransparent,
                                              color: globalColors.text.primary,
                                              border: `1px solid ${globalColors.purple.primary}`
                                            }}
                                          >
                                            Default
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        {variant.price_dine_in && variant.price_dine_in !== variant.price && (
                                          <span style={{ color: globalColors.text.muted }}>Dine: £{variant.price_dine_in.toFixed(2)}</span>
                                        )}
                                        {variant.price_delivery && variant.price_delivery !== variant.price && (
                                          <span style={{ color: globalColors.text.muted }}>Del: £{variant.price_delivery.toFixed(2)}</span>
                                        )}
                                        <span 
                                          className="font-semibold"
                                          style={{ color: globalColors.text.primary }}
                                        >
                                          £{variant.price.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Default Price (if no variants) */}
                          {(!item.variants || item.variants.length === 0) && item.price && (
                            <div className="mb-4">
                              <div 
                                className="flex justify-between items-center p-2 rounded text-sm"
                                style={{
                                  background: globalColors.background.secondary,
                                  border: `1px solid ${globalColors.border.light}`
                                }}
                              >
                                <span style={{ color: globalColors.text.secondary }}>Price</span>
                                <span 
                                  className="font-semibold"
                                  style={{ color: globalColors.text.primary }}
                                >
                                  £{item.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Staff Quick Actions */}
                          {isEditMode && (
                            <div className="flex gap-2 pt-3 border-t" style={{ borderColor: globalColors.border.light }}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAvailability(item)}
                                className="flex-1 text-xs font-medium"
                                style={{
                                  background: item.active 
                                    ? 'rgba(220, 38, 38, 0.1)' 
                                    : 'rgba(34, 197, 94, 0.1)',
                                  borderColor: item.active ? '#DC2626' : '#22C55E',
                                  color: item.active ? '#DC2626' : '#22C55E'
                                }}
                              >
                                {item.active ? (
                                  <><XCircle className="h-3 w-3 mr-1" /> Disable</>
                                ) : (
                                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Enable</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  toast.info(`Edit functionality for ${item.name} - redirecting to admin menu`);
                                }}
                                className="text-xs font-medium"
                                style={{
                                  background: globalColors.purple.primaryTransparent,
                                  borderColor: globalColors.purple.primary,
                                  color: globalColors.text.primary
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Set Meals Section */}
                  {setMeals.length > 0 && (
                    <div className="mt-12">
                      <h3 
                        className="text-2xl font-bold mb-6"
                        style={{ color: globalColors.text.primary }}
                      >
                        Set Meals
                      </h3>
                      <SetMealsSection
                        setMeals={setMeals}
                        onSetMealSelect={() => {}} // No cart functionality in staff view
                        isStaffView={true}
                        isEditMode={isEditMode}
                        showCartControls={false} // Hide customer cart controls
                      />
                    </div>
                  )}
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Admin Password Dialog */}
      <ManagementPasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onAuthenticated={handleAdminAuthenticated}
      />
    </>
  );
};

export default OnlineMenuModal;
