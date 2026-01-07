import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem, OrderItem } from '../utils/menuTypes';
import { EditOrderItemModal } from './EditOrderItemModal';
import { SetMealCustomizeModal } from './SetMealCustomizeModal';
import { toast } from 'sonner';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';

// Types for the orchestrator
interface CustomizeRequest {
  source: MenuItem | OrderItem;
  context: 'menu' | 'order_summary';
  onSave: (item: OrderItem) => void;
}

interface CustomizeOrchestratorState {
  // Modal states
  showEditModal: boolean;
  showSetMealModal: boolean;
  
  // Data for modals
  currentOrderItem: OrderItem | null;
  currentMenuItem: MenuItem | null;
  
  // Callback for saving
  onSave: ((item: OrderItem) => void) | null;
}

interface CustomizeOrchestratorContextType {
  customize: (request: CustomizeRequest) => void;
}

const CustomizeOrchestratorContext = createContext<CustomizeOrchestratorContextType | null>(null);

export function useCustomizeOrchestrator() {
  const context = useContext(CustomizeOrchestratorContext);
  if (!context) {
    throw new Error('useCustomizeOrchestrator must be used within CustomizeOrchestratorProvider');
  }
  return context;
}

interface CustomizeOrchestratorProviderProps {
  children: ReactNode;
}

export function CustomizeOrchestratorProvider({ children }: CustomizeOrchestratorProviderProps) {
  const [state, setState] = useState<CustomizeOrchestratorState>({
    showEditModal: false,
    showSetMealModal: false,
    currentOrderItem: null,
    currentMenuItem: null,
    onSave: null,
  });
  
  // 🎯 Access categories to look up category_name
  const { categories } = useRealtimeMenuStore();

  // Helper function to convert MenuItem to OrderItem
  const createOrderItemFromMenuItem = (menuItem: MenuItem): OrderItem => {
    // 🔍 Look up category_name from category_id
    const category = categories.find(cat => cat.id === menuItem.category_id);
    const categoryName = category?.name || 'Uncategorized';
    
    console.log('📦 [CustomizeOrchestrator] Creating OrderItem with category data:', {
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      category_id: menuItem.category_id,
      category_name: categoryName,
      found_category: !!category
    });
    
    // Check if it's a set meal
    if ((menuItem as any).item_type === 'set_meal') {
      return {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menu_item_id: menuItem.id,
        category_id: menuItem.category_id,
        category_name: categoryName,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price || 0,
        notes: '',
        modifiers: [],
        customizations: [],
        variant_id: 'default',
        variantName: 'Standard',
        image_url: menuItem.image_url || undefined,
        item_type: 'set_meal'
      };
    }

    // For regular menu items, use default variant if available
    const variants = (menuItem as any).variants || [];
    
    // 🔍 ENHANCED DEBUG: Log complete variant data structure
    console.log('🔍 [VARIANT DEBUG] Full variant data for item:', {
      item_id: menuItem.id,
      item_name: menuItem.name,
      total_variants: variants.length,
      variants_detail: variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        variant_name: v.variant_name,
        protein_type_name: v.protein_type_name,
        is_default: v.is_default,
        price: v.price,
        image_url: v.image_url,
        all_fields: Object.keys(v)
      }))
    });
    
    let variantId: string = 'default';
    let variantName: string = 'Standard';
    let basePrice = menuItem.price || 0;
    let imageUrl: string | undefined = menuItem.image_url || undefined;

    if (variants.length > 0) {
      const defaultVariant = variants.find((v: any) => v.is_default) || variants[0];
      variantId = defaultVariant.id;
      // Use database-generated variant_name (e.g., "CHICKEN TIKKA MASALA") instead of manual construction
      variantName = defaultVariant.variant_name || menuItem.name || 'Standard';
      basePrice = defaultVariant.price || menuItem.price || 0;
      // ✅ FIX: Use variant image_url with fallback to menu item image_url
      imageUrl = defaultVariant.image_url || menuItem.image_url || undefined;
      
      // 🔍 LOG SELECTED VARIANT
      console.log('✅ [VARIANT SELECTED] Using variant:', {
        variant_id: variantId,
        variant_name: variantName,
        source: defaultVariant.variant_name ? 'variant_name field' : 'fallback to item name',
        price: basePrice,
        image_url: imageUrl
      });
    }

    return {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: menuItem.id,
      category_id: menuItem.category_id,
      category_name: categoryName,
      name: menuItem.name,
      variantName: variantName,
      quantity: 1,
      price: basePrice,
      image_url: imageUrl,
      notes: '',
      modifiers: [],
      customizations: [],
      variant_id: variantId,
      item_type: (menuItem as any).item_type || 'menu_item'
    };
  };

  // Main customize function - single entry point
  const customize = (request: CustomizeRequest) => {
    console.log('🎯 CustomizeOrchestrator.customize called:', {
      sourceType: 'source' in request.source && 'menu_item_id' in request.source ? 'OrderItem' : 'MenuItem',
      context: request.context,
      itemName: request.source.name,
      itemType: (request.source as any).item_type
    });

    let orderItem: OrderItem;
    let menuItem: MenuItem | null = null;

    // Determine if source is MenuItem or OrderItem
    if ('menu_item_id' in request.source) {
      // Source is OrderItem
      orderItem = request.source as OrderItem;
    } else {
      // Source is MenuItem - convert to OrderItem
      menuItem = request.source as MenuItem;
      orderItem = createOrderItemFromMenuItem(menuItem);
    }

    // Route to appropriate modal based on item type
    const itemType = (orderItem as any).item_type || (menuItem as any)?.item_type;
    
    if (itemType === 'set_meal') {
      console.log('🎯 Routing to SetMealCustomizeModal');
      setState({
        showEditModal: false,
        showSetMealModal: true,
        currentOrderItem: orderItem,
        currentMenuItem: menuItem,
        onSave: request.onSave,
      });
    } else {
      console.log('🎯 Routing to EditOrderItemModal');
      setState({
        showEditModal: true,
        showSetMealModal: false,
        currentOrderItem: orderItem,
        currentMenuItem: menuItem,
        onSave: request.onSave,
      });
    }
  };

  // Handle saving from EditOrderItemModal
  const handleEditModalSave = (updatedItem: OrderItem) => {
    console.log('💾 CustomizeOrchestrator.handleEditModalSave:', updatedItem);
    if (state.onSave) {
      state.onSave(updatedItem);
    }
    setState({
      showEditModal: false,
      showSetMealModal: false,
      currentOrderItem: null,
      currentMenuItem: null,
      onSave: null,
    });
  };

  // Handle saving from SetMealCustomizeModal
  const handleSetMealModalSave = (updatedItem: OrderItem) => {
    console.log('💾 CustomizeOrchestrator.handleSetMealModalSave:', updatedItem);
    if (state.onSave) {
      state.onSave(updatedItem);
    }
    setState({
      showEditModal: false,
      showSetMealModal: false,
      currentOrderItem: null,
      currentMenuItem: null,
      onSave: null,
    });
  };

  // Handle closing modals
  const handleCloseModal = () => {
    setState({
      showEditModal: false,
      showSetMealModal: false,
      currentOrderItem: null,
      currentMenuItem: null,
      onSave: null,
    });
  };

  return (
    <CustomizeOrchestratorContext.Provider value={{ customize }}>
      {children}
      
      {/* EditOrderItemModal for regular menu items */}
      {state.showEditModal && state.currentOrderItem && (
        <EditOrderItemModal
          isOpen={state.showEditModal}
          orderItem={state.currentOrderItem}
          onClose={handleCloseModal}
          onSave={handleEditModalSave}
        />
      )}
      
      {/* SetMealCustomizeModal for set meals */}
      {state.showSetMealModal && state.currentMenuItem && (
        <SetMealCustomizeModal
          isOpen={state.showSetMealModal}
          onClose={handleCloseModal}
          setMealItem={state.currentMenuItem as any}
          onSave={handleSetMealModalSave}
        />
      )}
    </CustomizeOrchestratorContext.Provider>
  );
}
