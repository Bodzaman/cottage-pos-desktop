


import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit, Shield, Eye, Save, RotateCcw, XCircle, CheckCircle2, Plus, Minus, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Category, MenuItem, ItemVariant, ProteinType, SetMeal } from '../utils/menuTypes';
import { useMenuData } from '../utils/menuCache';
import ManagementPasswordDialog from './ManagementPasswordDialog';
import { colors } from '../utils/designSystem';
import { styles, globalColors, effects } from '../utils/QSAIDesign';
import brain from '../brain';
import { toast } from 'sonner';

interface MenuManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilterOptions {
  spiceLevel: number | null;
  dietaryPreferences: string[];
  searchTerm: string;
}

// Enhanced MenuItem interface to include ingredients from AdminMenu patterns
interface EnhancedMenuItem extends MenuItem {
  allergens?: string[];
  ingredients?: string[];
}

const MenuManagementDialog: React.FC<MenuManagementDialogProps> = ({ isOpen, onClose }) => {
  // Customer menu state (based on AdminMenu patterns)
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<EnhancedMenuItem[]>([]);
  const [proteinTypes, setProteinTypes] = useState<ProteinType[]>([]);
  const [setMeals, setSetMeals] = useState<SetMeal[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<EnhancedMenuItem>>({});
  
  // Password modal state
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Available dietary filters (from our dietary standards)
  const availableDietaryFilters = [
    'Vegetarian',
    'Vegan', 
    'Gluten-free',
    'Dairy-free',
    'Nut-free'
  ];

  // Use the menu data cache hook (same as menu system)
  const { fetchCompleteMenuData, invalidateCache } = useMenuData();
  
  // Load set meals
  const loadSetMeals = async () => {
    try {
      setLoadingSetMeals(true);
      const response = await brain.list_set_meals({ active_only: true });
      
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
  
  // Handle close modal
  const handleClose = () => {
    setIsEditMode(false);
    setIsAuthenticated(false);
    setEditingItemId(null);
    setEditFormData({});
    onClose();
  };
  
  // Fetch menu data on modal open (using AdminMenu patterns)
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // FORCE cache invalidation to ensure rich content loads
        invalidateCache();
        localStorage.setItem('menuLastRefresh', Date.now().toString());
        
        // Fetch data using the cache utility (same as AdminMenu)
        const { categories: categoriesData, menuItems: itemsWithVariants, proteinTypes: proteinTypesData } = 
          await fetchCompleteMenuData();
        
        // Set state with fetched data
        setCategories(categoriesData);
        setMenuItems(itemsWithVariants);
        setProteinTypes(proteinTypesData);
        
        // Load set meals as well (optional - don't block on failure)
        try {
          await loadSetMeals();
        } catch (error) {
          console.warn('Set meals loading failed (non-critical):', error);
        }
        
        // Set initial active category if categories exist
        if (categoriesData && categoriesData.length > 0) {
          setActiveCategory('all');
        }
      } catch (error) {
        console.error('Error fetching menu data:', error);
        toast.error('Failed to load menu data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen]);
  
  // Handle password authentication
  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) {
      setPasswordError('Please enter a password');
      return;
    }
    
    try {
      setIsAuthenticating(true);
      setPasswordError(null);
      
      // Use the same verification logic as ManagementPasswordDialog
      const response = await brain.verify_password({ password: passwordInput });
      const data = await response.json();
      
      if (data.authenticated) {
        console.log('🎉 Password authentication successful!');
        setIsEditMode(true);
        setIsAuthenticated(true);
        setShowPasswordDialog(false);
        setPasswordInput('');
        setPasswordError(null);
        toast.success('Edit mode activated');
      } else {
        setPasswordError('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setPasswordError('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
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
    setEditingItemId(null);
    setEditFormData({});
    toast.info('Edit mode deactivated');
  };
  
  // Handle start editing
  const handleStartEditing = (item: EnhancedMenuItem) => {
    setEditingItemId(item.id);
    setEditFormData({
      name: item.name,
      menu_item_description: item.menu_item_description,
      long_description: item.long_description,
      default_spice_level: item.default_spice_level,
      dietary_tags: item.dietary_tags,
      allergens: item.allergens,
      ingredients: item.ingredients,
      active: item.active,
      featured: item.featured
    });
  };
  
  // Handle cancel editing
  const handleCancelEditing = () => {
    setEditingItemId(null);
    setEditFormData({});
  };
  
  // Handle save editing
  const handleSaveEditing = async () => {
    if (!editingItemId || !editFormData) return;
    
    try {
      const item = menuItems.find(i => i.id === editingItemId);
      if (!item) return;
      
      // Prepare the update data
      const updateData = {
        name: editFormData.name || item.name,
        menu_item_description: editFormData.menu_item_description || item.menu_item_description,
        long_description: editFormData.long_description || item.long_description,
        category_id: item.category_id,
        image_url: item.image_url,
        default_spice_level: editFormData.default_spice_level ?? item.default_spice_level,
        dietary_tags: editFormData.dietary_tags || item.dietary_tags,
        featured: editFormData.featured ?? item.featured,
        display_order: item.display_order,
        active: editFormData.active ?? item.active,
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
      const response = await brain.update_menu_item({ itemId: editingItemId }, updateData);
      
      if (response.ok) {
        // Update local state immediately for better UX
        setMenuItems(prevItems => 
          prevItems.map(menuItem => 
            menuItem.id === editingItemId 
              ? { ...menuItem, ...editFormData }
              : menuItem
          )
        );
        
        // Show success message
        toast.success(`${editFormData.name || item.name} updated successfully`);
        
        // Clear editing state
        setEditingItemId(null);
        setEditFormData({});
        
        // Invalidate cache to ensure fresh data on next load
        invalidateCache();
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || 'Failed to update item';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(
        `Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };
  
  // Handle availability toggle
  const handleToggleAvailability = async (item: EnhancedMenuItem) => {
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
      const response = await brain.update_menu_item({ itemId: item.id }, updateData);
      
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
  
  // Handle duplicate item
  const handleDuplicateItem = async (item: EnhancedMenuItem) => {
    try {
      const duplicateName = `${item.name} (Copy)`;
      
      // Check if this name already exists
      const existingItem = menuItems.find(i => i.name === duplicateName);
      if (existingItem) {
        toast.error('An item with this name already exists');
        return;
      }
      
      // Create duplicate
      const duplicateData = {
        name: duplicateName,
        menu_item_description: item.menu_item_description,
        long_description: item.long_description,
        category_id: item.category_id,
        image_url: item.image_url,
        default_spice_level: item.default_spice_level,
        dietary_tags: item.dietary_tags,
        featured: false, // Don't duplicate featured status
        display_order: item.display_order + 1,
        active: true, // Start as active
        variants: item.variants?.map(variant => ({
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
      
      const response = await brain.create_menu_item(duplicateData);
      
      if (response.ok) {
        toast.success(`Created duplicate: ${duplicateName}`);
        // Refresh data
        invalidateCache();
        const { menuItems: updatedItems } = await fetchCompleteMenuData();
        setMenuItems(updatedItems);
      } else {
        throw new Error('Failed to create duplicate');
      }
    } catch (error) {
      console.error('Error duplicating item:', error);
      toast.error('Failed to duplicate item');
    }
  };
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingItemId) {
          handleCancelEditing();
        } else {
          handleClose();
        }
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
  }, [isOpen, editingItemId]);
  
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
  
  // Enhance menu items with sample rich content for demonstration
  const enhanceMenuItemForDisplay = (item: EnhancedMenuItem): EnhancedMenuItem => {
    // Add sample rich content for demonstration if missing
    const enhanced = { ...item };
    
    // Add sample descriptions if missing
    if (!enhanced.menu_item_description && enhanced.name) {
      const sampleDescriptions: { [key: string]: string } = {
        'Coca Cola': 'Refreshing classic cola with natural flavors and crisp carbonation',
        'House Red Wine': 'Rich and smooth red wine with notes of cherry and oak, perfect for pairing with our spicy dishes',
        'Test Chardonnay': 'Crisp white wine with hints of citrus and vanilla, pairs beautifully with seafood and lighter curries',
        'Cappuccino': 'Rich espresso topped with velvety steamed milk foam and a sprinkle of cocoa'
      };
      enhanced.menu_item_description = sampleDescriptions[enhanced.name] || `Delicious ${enhanced.name.toLowerCase()} prepared with authentic ingredients and traditional cooking methods`;
    }
    
    // Add sample dietary tags for demonstration
    if (!enhanced.dietary_tags || enhanced.dietary_tags.length === 0) {
      const sampleDietaryTags: { [key: string]: string[] } = {
        'House Red Wine': ['Vegan Friendly', 'Gluten Free'],
        'Test Chardonnay': ['Vegan Friendly', 'Gluten Free'],
        'Coca Cola': ['Vegan Friendly', 'Gluten Free']
      };
      enhanced.dietary_tags = sampleDietaryTags[enhanced.name] || [];
    }
    
    // Add sample allergens for wine items (contains sulfites)
    if (enhanced.name.toLowerCase().includes('wine') && !enhanced.allergens) {
      enhanced.allergens = ['Sulfites'];
    }
    
    // Add sample ingredients
    if (!enhanced.ingredients) {
      const sampleIngredients: { [key: string]: string[] } = {
        'Coca Cola': ['Carbonated Water', 'Sugar', 'Caramel Color', 'Natural Flavors', 'Caffeine'],
        'House Red Wine': ['Grapes', 'Sulfites', 'Natural Wine Yeast'],
        'Test Chardonnay': ['Chardonnay Grapes', 'Sulfites', 'Oak'],
        'Cappuccino': ['Espresso Beans', 'Whole Milk', 'Cocoa Powder']
      };
      enhanced.ingredients = sampleIngredients[enhanced.name] || ['Premium Ingredients', 'Natural Spices'];
    }
    
    return enhanced;
  };
  
  // Render rich menu item card (based on AdminMenu patterns)
  const renderMenuItemCard = (item: EnhancedMenuItem) => {
    const isEditing = editingItemId === item.id;
    
    // Enhance the item with rich content for demonstration
    const enhancedItem = enhanceMenuItemForDisplay(item);
    
    return (
      <div 
        key={enhancedItem.id}
        className="relative transition-all duration-200 hover:shadow-xl"
        style={{
          ...styles.glassCard,
          borderRadius: '12px',
          ...(isEditing ? { 
            border: `2px solid ${colors.brand.purple}`,
            boxShadow: `0 0 20px ${colors.brand.purple}40`
          } : {})
        }}
      >
        {/* Item Header with Image */}
        <div className="flex gap-4 mb-4 p-5">
          {/* Item Image */}
          {enhancedItem.image_url && (
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={enhancedItem.image_url} 
                alt={enhancedItem.name}
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.9)' }}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              {/* Item Name */}
              {isEditing ? (
                <Input
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="font-semibold text-lg"
                  style={{ 
                    background: colors.background.tertiary,
                    borderColor: colors.brand.purple,
                    color: colors.text.primary
                  }}
                />
              ) : (
                <h3 
                  className="font-semibold text-lg leading-tight"
                  style={{ color: colors.text.primary }}
                >
                  {enhancedItem.name}
                </h3>
              )}
              
              {/* Availability Status */}
              <Badge 
                className="ml-2 text-xs flex-shrink-0"
                style={{
                  background: enhancedItem.active 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgba(220, 38, 38, 0.2)',
                  color: enhancedItem.active ? '#22C55E' : '#DC2626',
                  border: `1px solid ${enhancedItem.active ? '#22C55E' : '#DC2626'}`
                }}
              >
                {enhancedItem.active ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            
            {/* Menu Description */}
            {isEditing ? (
              <Textarea
                value={editFormData.menu_item_description || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, menu_item_description: e.target.value }))}
                placeholder="Menu description..."
                className="text-sm mb-2 min-h-[60px]"
                style={{ 
                  background: colors.background.tertiary,
                  borderColor: colors.brand.purple,
                  color: colors.text.secondary
                }}
              />
            ) : (
              enhancedItem.menu_item_description && (
                <p 
                  className="text-sm leading-relaxed mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  {enhancedItem.menu_item_description}
                </p>
              )
            )}
            
            {/* Long Description (if different) */}
            {!isEditing && enhancedItem.long_description && enhancedItem.long_description !== enhancedItem.menu_item_description && (
              <p 
                className="text-xs leading-relaxed mb-2 opacity-75"
                style={{ color: colors.text.muted }}
              >
                {enhancedItem.long_description}
              </p>
            )}
          </div>
        </div>
        
        {/* Rich Visual Content Section */}
        <div className="px-5 pb-4">
          {/* Comprehensive Visual Indicators */}
          <div className="space-y-3 mb-4">
            {/* Spice Level & Dietary Tags Row */}
            <div className="flex flex-wrap gap-2">
              {/* Spice Level Indicator */}
              {enhancedItem.default_spice_level > 0 && (
                <Badge 
                  className="text-xs px-2 py-1 flex items-center gap-1"
                  style={{
                    background: 'rgba(249, 115, 22, 0.2)',
                    color: '#F97316',
                    border: '1px solid rgba(249, 115, 22, 0.3)'
                  }}
                >
                  🌶️ Spice {enhancedItem.default_spice_level}/5
                </Badge>
              )}
              
              {/* Dietary Tags - Only show if tags are actually present in dietary_tags array */}
              {enhancedItem.dietary_tags && enhancedItem.dietary_tags.length > 0 && enhancedItem.dietary_tags.map(tag => {
                // Define dietary tag icon mapping based on AdminMenu patterns
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
            {enhancedItem.allergens && enhancedItem.allergens.length > 0 && (
              <div className="p-3 rounded-md" style={{
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>
                    ⚠️ ALLERGEN WARNING
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {enhancedItem.allergens.map(allergen => (
                    <Badge 
                      key={allergen}
                      className="text-xs px-2 py-1"
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
            {enhancedItem.ingredients && enhancedItem.ingredients.length > 0 && (
              <div className="p-3 rounded-md" style={{
                background: colors.background.secondary,
                border: `1px solid ${colors.border?.light || 'rgba(255, 255, 255, 0.1)'}`
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                    🥘 INGREDIENTS
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {enhancedItem.ingredients.map(ingredient => (
                    <Badge 
                      key={ingredient}
                      className="text-xs px-2 py-1"
                      style={{
                        background: `${colors.brand.purple}20`,
                        color: colors.text.primary,
                        border: `1px solid ${colors.brand.purple}`
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
          {enhancedItem.variants && enhancedItem.variants.length > 0 && (
            <div className="mb-4">
              <h4 
                className="text-sm font-medium mb-3"
                style={{ color: colors.text.primary }}
              >
                Pricing ({enhancedItem.variants.length} variants)
              </h4>
              <div className="space-y-2">
                {enhancedItem.variants.map((variant, index) => {
                  // Find the protein type name
                  const proteinType = proteinTypes.find(p => p.id === variant.protein_type_id);
                  const proteinName = proteinType?.name || variant.name || 'Standard';
                  
                  return (
                    <div 
                      key={variant.id}
                      className="flex justify-between items-center p-3 rounded text-sm"
                      style={{
                        background: colors.background.secondary,
                        border: `1px solid ${colors.border?.light || 'rgba(255, 255, 255, 0.1)'}`
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {proteinName}
                        </span>
                        {variant.is_default && (
                          <Badge 
                            className="text-xs px-1 py-0"
                            style={{
                              background: `${colors.brand.purple}20`,
                              color: colors.text.primary,
                              border: `1px solid ${colors.brand.purple}`
                            }}
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {variant.price_dine_in && variant.price_dine_in !== variant.price && (
                          <span style={{ color: colors.text.muted }}>Dine: £{variant.price_dine_in.toFixed(2)}</span>
                        )}
                        {variant.price_delivery && variant.price_delivery !== variant.price && (
                          <span style={{ color: colors.text.muted }}>Del: £{variant.price_delivery.toFixed(2)}</span>
                        )}
                        <span 
                          className="font-semibold text-base"
                          style={{ color: colors.text.primary }}
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
          {(!enhancedItem.variants || enhancedItem.variants.length === 0) && enhancedItem.price && (
            <div className="mb-4">
              <div 
                className="flex justify-between items-center p-3 rounded text-sm"
                style={{
                  background: colors.background.secondary,
                  border: `1px solid ${colors.border?.light || 'rgba(255, 255, 255, 0.1)'}`
                }}
              >
                <span style={{ color: colors.text.secondary }}>Price</span>
                <span 
                  className="font-semibold text-base"
                  style={{ color: colors.text.primary }}
                >
                  £{item.price.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          
          {/* Staff Quick Actions */}
          {isEditMode && (
            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: colors.border?.light || 'rgba(255, 255, 255, 0.1)' }}>
              {isEditing ? (
                // Editing Controls
                <>
                  <Button
                    size="sm"
                    onClick={handleSaveEditing}
                    className="flex-1 text-sm font-medium"
                    style={{
                      background: colors.brand.turquoise,
                      color: 'white',
                      border: `1px solid ${colors.brand.turquoise}`
                    }}
                  >
                    <Save className="h-3 w-3 mr-1" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditing}
                    className="text-sm font-medium"
                    style={{
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderColor: '#DC2626',
                      color: '#DC2626'
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                // Quick Action Controls
                <>
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
                    onClick={() => handleStartEditing(item)}
                    className="text-xs font-medium"
                    style={{
                      background: `${colors.brand.purple}20`,
                      borderColor: colors.brand.purple,
                      color: colors.text.primary
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateItem(item)}
                    className="text-xs font-medium"
                    style={{
                      background: `${colors.brand.gold}20`,
                      borderColor: colors.brand.gold,
                      color: colors.brand.gold
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
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
          className="w-full h-full max-w-7xl border rounded-lg overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
            borderColor: `${colors.brand.purple}30`,
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px ${colors.brand.purple}20`
          }}
        >
          {/* Modal Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ 
              borderColor: `${colors.brand.purple}30`,
              background: `linear-gradient(135deg, ${colors.background.dark} 0%, ${colors.background.primary} 100%)`
            }}
          >
            <div className="flex items-center space-x-4">
              <h2 
                className="text-2xl font-bold"
                style={{ color: colors.text.primary }}
              >
                Menu Management
              </h2>
              <Badge 
                className="text-xs px-3 py-1"
                style={{
                  background: `${colors.brand.purple}20`,
                  color: colors.text.primary,
                  border: `1px solid ${colors.brand.purple}`
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Staff View
              </Badge>
              {isEditMode && (
                <Badge 
                  className="text-xs px-3 py-1 animate-pulse"
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#22C55E',
                    border: '1px solid #22C55E'
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Mode Active
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Edit Mode Toggle */}
              {!isEditMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔘 Edit Menu button clicked!');
                    console.log('🔍 Current state:', { isEditMode, showPasswordDialog, isAuthenticated });
                    console.log('🌟 About to set showPasswordDialog to true...');
                    setShowPasswordDialog(true);
                    console.log('✅ Password dialog state set to true');
                    console.log('🎯 showPasswordDialog should now be:', true);
                  }}
                  className="text-sm"
                  style={{
                    borderColor: colors.brand.purple,
                    color: colors.text.secondary,
                    background: `${colors.brand.purple}10`
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
                    borderColor: colors.text.muted,
                    color: colors.text.secondary,
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
          
          {/* Category Navigation */}
          <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
            <div className="flex flex-col space-y-2 p-3 rounded-lg" style={{
              background: colors.background.overlay,
              border: `1px solid ${colors.border?.medium || 'rgba(255, 255, 255, 0.1)'}`,
              backdropFilter: 'blur(8px)'
            }}>
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('all')}
                className="text-xs transition-all duration-200 w-24"
                style={{
                  background: activeCategory === 'all' ? colors.brand.purple : 'transparent',
                  color: activeCategory === 'all' ? colors.text.primary : colors.text.secondary,
                  border: `1px solid ${colors.brand.purple}`
                }}
              >
                All Items
              </Button>
              {categories
                .filter(cat => cat.active && !cat.parent_category_id)
                .sort((a, b) => a.display_order - b.display_order)
                .map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className="text-xs transition-all duration-200 w-24"
                  style={{
                    background: activeCategory === category.id ? colors.brand.purple : 'transparent',
                    color: activeCategory === category.id ? colors.text.primary : colors.text.secondary,
                    border: `1px solid ${colors.brand.purple}`
                  }}
                >
                  {category.name.length > 8 ? category.name.substring(0, 8) + '...' : category.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Modal Body - Menu Content */}
          <div className="flex-1 overflow-auto p-6 h-[calc(100vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.brand.purple }}></div>
                  <p style={{ color: colors.text.secondary }}>Loading menu...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">                
                {/* Menu Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {getFilteredMenuItems().map(item => renderMenuItemCard(item))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Custom Password Modal - Direct rendering without portal conflicts */}
      {showPasswordDialog && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              console.log('🛑 Backdrop clicked - closing password dialog');
              setShowPasswordDialog(false);
              setPasswordInput('');
              setPasswordError(null);
            }
          }}
        >
          <div 
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              color: colors.text.primary
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6" style={{ color: colors.brand.purple }} />
              <h2 className="text-xl font-semibold">Management Access</h2>
            </div>
            
            {/* Description */}
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Please enter the management password to enable edit mode.
            </p>
            
            {/* Error Display */}
            {passwordError && (
              <div 
                className="mb-4 p-3 rounded-md flex items-start gap-2" 
                style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", borderLeft: "3px solid rgb(220, 38, 38)" }}
              >
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "rgb(220, 38, 38)" }} />
                <p className="text-sm">{passwordError}</p>
              </div>
            )}
            
            {/* Password Input */}
            <div className="space-y-2 mb-6">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4" />
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: passwordError ? "rgb(220, 38, 38)" : colors.border.light,
                  color: colors.text.primary
                }}
                placeholder="Enter management password"
                autoFocus
                disabled={isAuthenticating}
              />
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordInput('');
                  setPasswordError(null);
                }}
                className="px-4 py-2 rounded-md border transition-colors"
                style={{
                  borderColor: colors.border.medium,
                  color: colors.text.secondary,
                  backgroundColor: 'transparent'
                }}
                disabled={isAuthenticating}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 rounded-md transition-colors"
                style={{
                  backgroundColor: colors.brand.purple,
                  color: colors.text.primary
                }}
                disabled={isAuthenticating || !passwordInput.trim()}
              >
                {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuManagementDialog;
