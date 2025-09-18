import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Minimal POSDesktop component for Electron wrapper
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface POSState {
  orderItems: OrderItem[];
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  currentTotal: number;
}

function SimplePOSDesktop() {
  const [state, setState] = React.useState<POSState>({
    orderItems: [],
    orderType: "DINE-IN",
    currentTotal: 0
  });

  const addItem = (name: string, price: number) => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name,
      quantity: 1,
      price
    };

    setState(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, newItem],
      currentTotal: prev.currentTotal + price
    }));
  };

  const removeItem = (id: string) => {
    setState(prev => ({
      ...prev,
      orderItems: prev.orderItems.filter(item => item.id !== id),
      currentTotal: prev.orderItems
        .filter(item => item.id !== id)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }));
  };

  const clearOrder = () => {
    setState(prev => ({
      ...prev,
      orderItems: [],
      currentTotal: 0
    }));
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      backgroundColor: '#1a1a1a', 
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Left Panel - Menu */}
      <div style={{ 
        flex: 1, 
        padding: '20px', 
        borderRight: '1px solid #333'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#7C5DFA' }}>
          Cottage Tandoori POS
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <select 
            value={state.orderType}
            onChange={(e) => setState(prev => ({ 
              ...prev, 
              orderType: e.target.value as any 
            }))}
            style={{
              padding: '10px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              width: '200px'
            }}
          >
            <option value="DINE-IN">Dine In</option>
            <option value="COLLECTION">Collection</option>
            <option value="DELIVERY">Delivery</option>
            <option value="WAITING">Waiting</option>
          </select>
        </div>

        <h3 style={{ marginBottom: '15px' }}>Sample Menu Items</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {[
            { name: 'Chicken Tikka Masala', price: 12.95 },
            { name: 'Lamb Biryani', price: 15.95 },
            { name: 'Naan Bread', price: 3.50 },
            { name: 'Vegetable Curry', price: 10.95 },
            { name: 'Pilau Rice', price: 4.50 },
            { name: 'Mango Lassi', price: 3.95 }
          ].map(item => (
            <button
              key={item.name}
              onClick={() => addItem(item.name, item.price)}
              style={{
                padding: '15px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#444'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333'}
            >
              <div style={{ fontWeight: 'bold' }}>{item.name}</div>
              <div style={{ color: '#7C5DFA' }}>£{item.price.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Order Summary */}
      <div style={{ 
        width: '400px', 
        padding: '20px',
        backgroundColor: '#2a2a2a'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
        <div style={{ color: '#aaa', marginBottom: '15px' }}>
          Order Type: {state.orderType}
        </div>

        <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
          {state.orderItems.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              No items in order
            </div>
          ) : (
            state.orderItems.map(item => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#333',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ color: '#aaa', fontSize: '0.9em' }}>
                    Qty: {item.quantity}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#7C5DFA' }}>
                    £{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      backgroundColor: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '0.8em'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ 
          borderTop: '1px solid #555', 
          paddingTop: '15px',
          marginTop: '15px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '1.2em',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            <span>Total:</span>
            <span style={{ color: '#7C5DFA' }}>
              £{state.currentTotal.toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button
              onClick={clearOrder}
              disabled={state.orderItems.length === 0}
              style={{
                padding: '12px',
                backgroundColor: state.orderItems.length === 0 ? '#555' : '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: state.orderItems.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Clear Order
            </button>

            <button
              onClick={() => alert(`Processing ${state.orderType} order for £${state.currentTotal.toFixed(2)}`)}
              disabled={state.orderItems.length === 0}
              style={{
                padding: '12px',
                backgroundColor: state.orderItems.length === 0 ? '#555' : '#7C5DFA',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: state.orderItems.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              Process Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SimplePOSDesktop />
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
