# Cottage Tandoori POS Desktop

A comprehensive Point of Sale system extracted from the Cottage Tandoori web platform and adapted for Electron desktop deployment.

## 🎯 Overview

This repository contains the complete POS system extracted from the Cottage Tandoori Databutton platform, adapted and optimized for Electron desktop deployment. The system provides a full-featured restaurant POS with real-time order management, AI voice integration, and comprehensive admin capabilities.

## 🏗️ Architecture

### Extracted Components Structure

```
src/renderer/
├── components/           # React POS Components
│   ├── POSDesktop.tsx           # 🎯 Main POS Interface (1,329 lines)
│   ├── ManagementHeader.tsx     # Header with navigation controls
│   ├── POSNavigation.tsx        # Order type selector navigation
│   ├── CategorySidebar.tsx      # Menu category display
│   └── ... (25+ UI components)
├── stores/              # Zustand State Management  
│   ├── realtimeMenuStore.ts     # 🔄 Real-time menu sync (35KB)
│   ├── tableOrdersStore.ts      # 📊 Table orders management (31KB)
│   ├── customerDataStore.ts     # 👥 Customer management (5KB)
│   ├── voiceOrderStore.ts       # 🎤 AI voice integration (13KB)
│   ├── simple-auth-context.tsx  # 🔐 Staff authentication (21KB)
│   └── headerViewChange.ts      # 🖥️ View state management (13KB)
├── styles/              # Design System
│   └── QSAIDesign.ts           # 🎨 Complete design system (17KB)
├── utils/               # Utility Functions
│   ├── formatters.ts           # 💰 Currency & time formatting
│   ├── formatUtils.ts          # 📱 Phone, date & file formatting
│   └── types/                  # TypeScript definitions
├── api/                 # API Integration
│   ├── apiClient.ts           # 🌐 Supabase API client
│   └── supabaseConfig.ts      # ⚙️ Database configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Electron 25+
- TypeScript 4.9+
- Zustand for state management
- Supabase for backend integration

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/Bodzaman/cottage-pos-desktop.git
   cd cottage-pos-desktop
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure Supabase credentials
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Development Setup**
   ```bash
   # Start Electron in development mode
   npm run dev

   # Or start renderer only for testing
   npm run start:renderer
   ```

## 🔧 Integration Guide

### Step 1: Import Core Components

The main POS interface is in `POSDesktop.tsx`. Import and use in your main renderer:

```typescript
import POSDesktop from './components/POSDesktop';
import { useRealtimeMenuStore } from './stores/realtimeMenuStore';
import { QSAITheme } from './styles/QSAIDesign';

function App() {
  return (
    <div style={{ background: QSAITheme.background.primary }}>
      <POSDesktop />
    </div>
  );
}
```

### Step 2: Initialize State Stores

Set up the Zustand stores for state management:

```typescript
// Initialize stores in your main App component
import { useRealtimeMenuStore } from './stores/realtimeMenuStore';
import { useTableOrdersStore } from './stores/tableOrdersStore';
import { useSimpleAuth } from './stores/simple-auth-context';

function App() {
  // Initialize authentication
  const { initializeAuth } = useSimpleAuth();

  // Initialize menu synchronization
  const { initializeMenuSync } = useRealtimeMenuStore();

  useEffect(() => {
    initializeAuth();
    initializeMenuSync();
  }, []);

  return <POSDesktop />;
}
```

### Step 3: Configure API Client

The API client replaces the original `brain.*` calls:

```typescript
// src/renderer/api/apiClient.ts is already configured
// Import and use in your components:
import apiClient from '../api/apiClient';

// Example usage:
const orders = await apiClient.getOrders();
const menuItems = await apiClient.getMenuItems();
```

## 🎨 Design System Integration

### QSAI Design System

The complete design system is available in `QSAIDesign.ts`:

```typescript
import { QSAITheme, styles, effects } from './styles/QSAIDesign';

// Use theme colors
const buttonStyle = {
  background: QSAITheme.purple.primary,
  color: QSAITheme.text.primary,
  ...styles.gradientButton('medium')
};

// Apply effects
const glowEffect = effects.outerGlow('medium');
```

### Electron-Specific Enhancements

- **Window Controls**: Desktop window management styling
- **Print Styles**: Thermal receipt printer compatibility  
- **Notifications**: Native desktop notification styling
- **Keyboard Shortcuts**: Visual indicators for hotkeys
- **Accessibility**: High contrast theme option

## 🔌 API Integration

### Supabase Connection

The system connects directly to Supabase for real-time data:

```typescript
// Configuration is in src/renderer/api/supabaseConfig.ts
import { supabase } from '../api/supabaseConfig';

// Real-time subscriptions
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'orders' 
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

### Replaced Brain API Calls

All original `brain.*` calls have been replaced with `apiClient.*`:

```typescript
// OLD (Databutton):
import brain from 'brain';
const result = await brain.get_orders();

// NEW (Electron):
import apiClient from '../api/apiClient';
const result = await apiClient.getOrders();
```

## 🔐 Authentication System

### Staff Authentication

Enhanced authentication system for POS staff:

```typescript
import { useSimpleAuth } from './stores/simple-auth-context';

function LoginComponent() {
  const { login, currentUser, isAuthenticated } = useSimpleAuth();

  const handleLogin = async (credentials) => {
    await login(credentials.username, credentials.password);
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>Welcome {currentUser?.name}</div>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}
```

### Permission System

Role-based access control:

```typescript
import { headerViewHelpers } from './stores/headerViewChange';

// Check user permissions
const userPermissions = currentUser?.permissions || [];
const accessibleViews = headerViewHelpers.getAccessibleViews(userPermissions);

// Check specific permissions
const canAccessAdmin = userPermissions.includes('admin.access');
```

## 🎤 AI Voice Integration

### Ultravox Voice Orders

The system includes AI voice ordering capabilities:

```typescript
import { useVoiceOrderStore } from './stores/voiceOrderStore';

function VoiceOrderComponent() {
  const { 
    startListening, 
    stopListening, 
    isListening, 
    currentOrder 
  } = useVoiceOrderStore();

  return (
    <div>
      <button onClick={startListening}>
        {isListening ? 'Stop Listening' : 'Start Voice Order'}
      </button>
      {currentOrder && <OrderPreview order={currentOrder} />}
    </div>
  );
}
```

## 📊 Real-Time Features

### Menu Synchronization

Real-time menu updates across all POS terminals:

```typescript
import { useRealtimeMenuStore } from './stores/realtimeMenuStore';

function MenuComponent() {
  const { 
    categories, 
    menuItems, 
    isLoading, 
    lastUpdated 
  } = useRealtimeMenuStore();

  // Menu automatically updates in real-time
  return (
    <div>
      {categories.map(category => (
        <CategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}
```

### Order Management

Real-time order tracking with optimistic updates:

```typescript
import { useTableOrdersStore } from './stores/tableOrdersStore';

function OrdersComponent() {
  const { 
    orders, 
    addOrderItem, 
    updateOrderStatus, 
    processPayment 
  } = useTableOrdersStore();

  // Orders sync automatically across terminals
  return (
    <OrderList 
      orders={orders}
      onStatusUpdate={updateOrderStatus}
      onPayment={processPayment}
    />
  );
}
```

## 🖨️ Printing Integration

### Thermal Receipt Printing

Print-ready styling for thermal printers:

```typescript
import { electronEnhancements } from './styles/QSAIDesign';

function ReceiptComponent({ order }) {
  const printStyles = electronEnhancements.printStyles;

  return (
    <div style={printStyles}>
      <h2>Cottage Tandoori</h2>
      <div>Order #{order.id}</div>
      {order.items.map(item => (
        <div key={item.id}>
          {item.quantity}x {item.name} - {formatCurrency(item.price)}
        </div>
      ))}
      <div>Total: {formatCurrency(order.total)}</div>
    </div>
  );
}
```

## 🔧 Development Workflow

### Build Commands

```bash
# Development
npm run dev              # Start Electron in development
npm run start:renderer   # Start renderer only
npm run start:main      # Start main process only

# Production
npm run build           # Build for production
npm run package         # Package Electron app
npm run dist           # Create distributable
```

### Testing

```bash
# Unit tests
npm run test

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📚 Component Reference

### Core Components

- **POSDesktop.tsx** - Main POS interface with order management
- **ManagementHeader.tsx** - Navigation header with view controls
- **POSNavigation.tsx** - Order type selector (DINE-IN, TAKEAWAY, DELIVERY)
- **CategorySidebar.tsx** - Menu category navigation

### State Management

- **realtimeMenuStore.ts** - Menu data and real-time synchronization
- **tableOrdersStore.ts** - Order management with customer tabs
- **customerDataStore.ts** - Customer information management
- **voiceOrderStore.ts** - AI voice order processing
- **simple-auth-context.tsx** - Staff authentication and permissions

### Utilities

- **formatters.ts** - Currency, time, and data formatting
- **formatUtils.ts** - Phone numbers, dates, file sizes
- **QSAIDesign.ts** - Complete design system and theming

## 🔑 Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Ultravox Voice API
ULTRAVOX_API_KEY=your_ultravox_api_key

# Stripe Payments (optional)
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Failed**
   - Verify environment variables are set correctly
   - Check network connectivity
   - Ensure Supabase project is active

2. **Real-time Subscriptions Not Working**
   - Check Supabase RLS policies
   - Verify subscription permissions
   - Monitor console for connection errors

3. **Authentication Issues**
   - Clear local storage and retry
   - Check staff credentials in Supabase
   - Verify permission assignments

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('DEBUG_POS', 'true');

// Monitor store state
window.__ZUSTAND_STORES__ = {
  menu: useRealtimeMenuStore.getState(),
  orders: useTableOrdersStore.getState(),
  auth: useSimpleAuth.getState()
};
```

## 📈 Performance Optimization

### Memory Management

- Use React.memo for expensive components
- Implement virtualization for large order lists
- Clean up subscriptions in useEffect cleanup

### Bundle Optimization

```javascript
// Electron main process optimization
const isDev = process.env.NODE_ENV === 'development';

if (!isDev) {
  // Disable debugging features
  process.env.NODE_ENV = 'production';
}
```

## 🚀 Deployment

### Production Build

```bash
# Build and package
npm run build
npm run package

# Create installer
npm run dist
```

### Distribution

The packaged app will be available in the `dist/` directory with platform-specific installers.

## 📞 Support

For integration support and questions:

- **Repository**: [cottage-pos-desktop](https://github.com/Bodzaman/cottage-pos-desktop)
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: This README and inline code comments

## 🔄 Migration Notes

### From Databutton Web Platform

1. **API Calls**: All `brain.*` calls replaced with `apiClient.*`
2. **Imports**: Updated for Electron renderer structure
3. **State Management**: Enhanced with desktop-specific features
4. **Authentication**: Improved for multi-staff desktop environment
5. **Styling**: Added Electron-specific enhancements

### Breaking Changes

- Import paths changed from `'utils/...'` to `'./utils/...'`
- Authentication system enhanced with session management
- Real-time subscriptions require explicit initialization
- Design system includes desktop-specific themes

---

**🏠 Cottage Tandoori POS Desktop** - Comprehensive restaurant management for the modern kitchen.
