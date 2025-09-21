
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem, OrderItem } from '../utils/menuTypes';
import { EditOrderItemModal } from './EditOrderItemModal';
import { SetMealCustomizeModal } from './SetMealCustomizeModal';
import { toast } from 'sonner';

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

  // Helper function to convert MenuItem to OrderItem
  const createOrderItemFromMenuItem = (menuItem: MenuItem): OrderItem => {
    // Check if it's a set meal
    if ((menuItem as any).item_type === 'set_meal') {
      return {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price || 0,
        notes: '',
        modifiers: [],
        customizations: [],
        variant_id: 'default',
        variantName: 'Standard',
        item_type: 'set_meal'
      };
    }

    // For regular menu items, use default variant if available
    const variants = (menuItem as any).variants || [];
    let variantId: string = 'default';
    let variantName: string = 'Standard';
    let basePrice = menuItem.price || 0;

    if (variants.length > 0) {
      const defaultVariant = variants.find((v: any) => v.is_default) || variants[0];
      variantId = defaultVariant.id;
      variantName = defaultVariant.name || defaultVariant.variant_name || 'Standard';
      basePrice = defaultVariant.price || menuItem.price || 0;
    }

    return {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: menuItem.id,
      name: menuItem.name,
      quantity: 1,
      price: basePrice,
      notes: '',
      modifiers: [],
      customizations: [],
      variant_id: variantId,
      variantName: variantName,
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
