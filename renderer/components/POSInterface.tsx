
import React, { useState } from 'react'
import { usePOSStore, OrderMode } from '../utils/posStore'
import { useSupabaseStore } from '../utils/supabaseStore'

/**
 * POSInterface - Core POS system interface
 * Provides single-page desktop application with four order modes:
 * DINE-IN | WAITING | COLLECTION | DELIVERY
 */
export function POSInterface() {
  const { 
    orderMode, 
    setOrderMode, 
    activeView, 
    setActiveView,
    currentOrder,
    createNewOrder,
    settings
  } = usePOSStore()
  
  const { isConnected } = useSupabaseStore()
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)

  const orderModes = [
    { 
      mode: OrderMode.DINE_IN, 
      label: 'DINE-IN', 
      icon: '🍽️',
      color: '#d97706',
      description: 'Table service orders'
    },
    { 
      mode: OrderMode.WAITING, 
      label: 'WAITING', 
      icon: '⏰',
      color: '#f59e0b',
      description: 'Customer waiting orders'
    },
    { 
      mode: OrderMode.COLLECTION, 
      label: 'COLLECTION', 
      icon: '🛍️',
      color: '#10b981',
      description: 'Pickup orders'
    },
    { 
      mode: OrderMode.DELIVERY, 
      label: 'DELIVERY', 
      icon: '🚗',
      color: '#ef4444',
      description: 'Delivery orders'
    }
  ]

  const navigationViews = [
    { view: 'menu' as const, label: 'Menu', icon: '📋' },
    { view: 'orders' as const, label: 'Orders', icon: '📝' },
    { view: 'settings' as const, label: 'Settings', icon: '⚙️' },
    { view: 'reports' as const, label: 'Reports', icon: '📊' }
  ]

  const handleOrderModeSelect = (mode: OrderMode) => {
    setOrderMode(mode)
    createNewOrder(mode)
    setShowNewOrderModal(false)
    console.log(`🎯 Selected order mode: ${mode}`)
  }

  const handleStartNewOrder = () => {
    setShowNewOrderModal(true)
  }

  // Shared button styles
  const buttonStyle = {
    padding: '1rem 1.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  }

  const primaryButtonStyle = {
    ...buttonStyle,
    background: '#d97706',
    color: 'white'
  }

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: '#334155',
    color: '#f8fafc'
  }

  const cardStyle = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '0.75rem',
    padding: '1rem',
    transition: 'all 0.15s ease-in-out'
  }

  const renderMainContent = () => {
    switch (activeView) {
      case 'menu':
        return (
          <div style={{ flex: 1, padding: '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '2rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>🍛 Menu Management</h2>
              <div>
                {currentOrder ? (
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center',
                    background: '#334155',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem'
                  }}>
                    <span>Current Order: {currentOrder.mode}</span>
                    <span>Items: {currentOrder.items.length}</span>
                    <span>Total: £{currentOrder.total.toFixed(2)}</span>
                  </div>
                ) : (
                  <button 
                    style={primaryButtonStyle}
                    onClick={handleStartNewOrder}
                  >
                    + New Order
                  </button>
                )}
              </div>
            </div>
            <div style={{ 
              ...cardStyle,
              textAlign: 'center',
              padding: '3rem',
              fontSize: '1.125rem',
              color: '#94a3b8'
            }}>
              🚧 Menu interface will be built in Phase 3
              <br />Current focus: Desktop app foundation
            </div>
          </div>
        )
      
      case 'orders':
        return (
          <div style={{ flex: 1, padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.5rem', fontWeight: '600' }}>📝 Order Management</h2>
            <div style={{ 
              ...cardStyle,
              textAlign: 'center',
              padding: '3rem',
              fontSize: '1.125rem',
              color: '#94a3b8'
            }}>
              🚧 Order management interface coming in Phase 3
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div style={{ flex: 1, padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.5rem', fontWeight: '600' }}>⚙️ POS Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#d97706' }}>Restaurant Information</h3>
                <p style={{ margin: '0.5rem 0' }}><strong>Name:</strong> {settings.restaurantName}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Address:</strong> {settings.address}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Phone:</strong> {settings.phone}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Email:</strong> {settings.email}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#d97706' }}>System Settings</h3>
                <p style={{ margin: '0.5rem 0' }}><strong>Tax Rate:</strong> {settings.taxRate}%</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Currency:</strong> {settings.currency}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Printer:</strong> {settings.printerEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Sound:</strong> {settings.soundEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
              </div>
            </div>
          </div>
        )
      
      case 'reports':
        return (
          <div style={{ flex: 1, padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.5rem', fontWeight: '600' }}>📊 Sales Reports</h2>
            <div style={{ 
              ...cardStyle,
              textAlign: 'center',
              padding: '3rem',
              fontSize: '1.125rem',
              color: '#94a3b8'
            }}>
              🚧 Analytics dashboard coming in Phase 3
            </div>
          </div>
        )
      
      default:
        return <div>Unknown view</div>
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* Order Mode Selection Modal */}
      {showNewOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowNewOrderModal(false)}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            padding: '2rem',
            minWidth: '500px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '600', textAlign: 'center' }}>Select Order Mode</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {orderModes.map(({ mode, label, icon, color, description }) => (
                <button
                  key={mode}
                  style={{
                    padding: '1.5rem',
                    border: `2px solid ${color}`,
                    borderRadius: '0.75rem',
                    background: '#334155',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    textAlign: 'center'
                  }}
                  onClick={() => handleOrderModeSelect(mode)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = color
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#334155'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color }}>{icon}</div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{description}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                style={secondaryButtonStyle}
                onClick={() => setShowNewOrderModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div style={{
        width: '280px',
        background: '#1e293b',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>🏪 POS System</h3>
          <div style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem',
            background: isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isConnected ? '#10b981' : '#ef4444',
            textAlign: 'center'
          }}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
        
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Current Mode:</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <span>{orderModes.find(m => m.mode === orderMode)?.icon}</span>
            <span>{orderMode}</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          {navigationViews.map(({ view, label, icon }) => (
            <button
              key={view}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                background: activeView === view ? '#d97706' : 'transparent',
                color: activeView === view ? 'white' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              onClick={() => setActiveView(view)}
              onMouseEnter={(e) => {
                if (activeView !== view) {
                  e.currentTarget.style.background = '#334155'
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== view) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>Quick Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Today's Orders</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#d97706' }}>42</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Revenue</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#10b981' }}>£1,247</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderMainContent()}
      </div>
    </div>
  )
}
