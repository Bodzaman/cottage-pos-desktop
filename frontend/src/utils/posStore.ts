import { create } from 'zustand'

// Order modes for POS system
export enum OrderMode {
  DINE_IN = 'DINE_IN',
  WAITING = 'WAITING', 
  COLLECTION = 'COLLECTION',
  DELIVERY = 'DELIVERY'
}

// POS settings interface
interface POSSettings {
  restaurantName: string
  address: string
  phone: string
  email: string
  taxRate: number
  currency: string
  printerEnabled: boolean
  soundEnabled: boolean
  autoBackup: boolean
}

// Current order interface
interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  modifiers?: string[]
  notes?: string
}

interface CurrentOrder {
  id: string
  mode: OrderMode
  tableNumber?: number
  customerName?: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  createdAt: Date
}

// POS store state interface
interface POSStore {
  // Settings
  settings: POSSettings
  isLoading: boolean
  error: string | null
  
  // Current order state
  currentOrder: CurrentOrder | null
  orderMode: OrderMode
  
  // UI state
  activeView: 'menu' | 'orders' | 'settings' | 'reports'
  
  // Actions
  loadSettings: () => Promise<void>
  updateSettings: (settings: Partial<POSSettings>) => void
  setOrderMode: (mode: OrderMode) => void
  createNewOrder: (mode: OrderMode) => void
  addItemToOrder: (item: Omit<OrderItem, 'id'>) => void
  removeItemFromOrder: (itemId: string) => void
  updateOrderItem: (itemId: string, updates: Partial<OrderItem>) => void
  calculateOrderTotals: () => void
  clearCurrentOrder: () => void
  setActiveView: (view: 'menu' | 'orders' | 'settings' | 'reports') => void
  clearError: () => void
}

/**
 * POS Store - Manages POS system state and operations
 * Handles current orders, settings, and UI state
 */
export const usePOSStore = create<POSStore>((set, get) => ({
  // Initial settings
  settings: {
    restaurantName: 'Cottage Tandoori',
    address: '123 High Street, London, UK',
    phone: '+44 20 1234 5678',
    email: 'info@cottagetandoori.co.uk',
    taxRate: 20, // 20% VAT
    currency: 'GBP',
    printerEnabled: true,
    soundEnabled: true,
    autoBackup: true
  },
  
  isLoading: false,
  error: null,
  currentOrder: null,
  orderMode: OrderMode.DINE_IN,
  activeView: 'menu',

  // Load POS settings
  loadSettings: async () => {
    set({ isLoading: true, error: null })
    
    try {
      console.log('⚙️ Loading POS settings...')
      
      // In real Electron app, load from local storage or database
      // For demo, use default settings
      const defaultSettings = get().settings
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 500))
      
      set({ 
        settings: defaultSettings, 
        isLoading: false 
      })
      
      console.log('✅ POS settings loaded successfully')
      
    } catch (error: any) {
      console.error('❌ Failed to load POS settings:', error)
      set({ 
        error: error.message || 'Failed to load settings', 
        isLoading: false 
      })
    }
  },

  // Update POS settings
  updateSettings: (newSettings: Partial<POSSettings>) => {
    const currentSettings = get().settings
    const updatedSettings = { ...currentSettings, ...newSettings }
    
    set({ settings: updatedSettings })
    console.log('⚙️ POS settings updated:', newSettings)
    
    // In real Electron app, save to persistent storage
    // localStorage.setItem('pos-settings', JSON.stringify(updatedSettings))
  },

  // Set order mode
  setOrderMode: (mode: OrderMode) => {
    set({ orderMode: mode })
    console.log('🍽️ Order mode set to:', mode)
  },

  // Create new order
  createNewOrder: (mode: OrderMode) => {
    const newOrder: CurrentOrder = {
      id: `order_${Date.now()}`,
      mode,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      createdAt: new Date()
    }
    
    set({ currentOrder: newOrder, orderMode: mode })
    console.log('🆕 New order created:', newOrder.id, 'Mode:', mode)
  },

  // Add item to current order
  addItemToOrder: (item: Omit<OrderItem, 'id'>) => {
    const { currentOrder } = get()
    if (!currentOrder) return
    
    const newItem: OrderItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    const updatedOrder = {
      ...currentOrder,
      items: [...currentOrder.items, newItem]
    }
    
    set({ currentOrder: updatedOrder })
    get().calculateOrderTotals()
    
    console.log('➕ Item added to order:', newItem.name)
  },

  // Remove item from current order
  removeItemFromOrder: (itemId: string) => {
    const { currentOrder } = get()
    if (!currentOrder) return
    
    const updatedOrder = {
      ...currentOrder,
      items: currentOrder.items.filter(item => item.id !== itemId)
    }
    
    set({ currentOrder: updatedOrder })
    get().calculateOrderTotals()
    
    console.log('➖ Item removed from order:', itemId)
  },

  // Update order item
  updateOrderItem: (itemId: string, updates: Partial<OrderItem>) => {
    const { currentOrder } = get()
    if (!currentOrder) return
    
    const updatedOrder = {
      ...currentOrder,
      items: currentOrder.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }
    
    set({ currentOrder: updatedOrder })
    get().calculateOrderTotals()
    
    console.log('✏️ Order item updated:', itemId, updates)
  },

  // Calculate order totals
  calculateOrderTotals: () => {
    const { currentOrder, settings } = get()
    if (!currentOrder) return
    
    const subtotal = currentOrder.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    )
    
    const tax = (subtotal * settings.taxRate) / 100
    const total = subtotal + tax
    
    const updatedOrder = {
      ...currentOrder,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    }
    
    set({ currentOrder: updatedOrder })
  },

  // Clear current order
  clearCurrentOrder: () => {
    set({ currentOrder: null })
    console.log('🗑️ Current order cleared')
  },

  // Set active view
  setActiveView: (view: 'menu' | 'orders' | 'settings' | 'reports') => {
    set({ activeView: view })
    console.log('👁️ Active view set to:', view)
  },

  // Clear error state
  clearError: () => {
    set({ error: null })
  }
}))
