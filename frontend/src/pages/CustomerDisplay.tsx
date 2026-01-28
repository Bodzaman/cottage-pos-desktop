/**
 * CustomerDisplay
 *
 * A customer-facing display shown on a secondary monitor via Electron.
 * Receives real-time cart updates from the main POS window via IPC.
 *
 * Shows:
 * - Restaurant branding
 * - Current order items with prices
 * - Running total
 * - Idle animations when no active order
 *
 * Route: /customer-display (loaded in secondary BrowserWindow)
 */

import React, { useEffect, useState, useCallback } from 'react';

interface DisplayItem {
  name: string;
  quantity: number;
  price: number;
  variantName?: string;
  modifiers?: Array<{ name: string; price?: number }>;
}

interface DisplayData {
  items: DisplayItem[];
  subtotal: number;
  total: number;
  orderType?: string;
  tableNumber?: number | null;
  customerName?: string;
}

export default function CustomerDisplay() {
  const [data, setData] = useState<DisplayData | null>(null);
  const [clock, setClock] = useState(new Date());

  // Listen for IPC updates from main POS window
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.onCustomerDisplayUpdate) {
      electronAPI.onCustomerDisplayUpdate((update: DisplayData) => {
        setData(update);
      });
    }

    return () => {
      if (electronAPI?.removeCustomerDisplayUpdateListener) {
        electronAPI.removeCustomerDisplayUpdateListener();
      }
    };
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasItems = data && data.items && data.items.length > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1025 50%, #0a0a0a 100%)',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header — Branding */}
      <div
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(124, 93, 250, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(124, 93, 250, 0.05)'
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Cottage Tandoori
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
            Your order
          </p>
        </div>
        <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 32px' }}>
        {!hasItems ? (
          /* Idle State */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: 64,
                marginBottom: 24,
                animation: 'pulse 3s ease-in-out infinite'
              }}
            >
              🍽️
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 600, margin: '0 0 12px', color: 'rgba(255,255,255,0.8)' }}>
              Welcome
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', maxWidth: 400 }}>
              Your order will appear here as items are added
            </p>
          </div>
        ) : (
          /* Active Order */
          <>
            {/* Order info bar */}
            {(data?.orderType || data?.tableNumber) && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginBottom: 16,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.5)'
                }}
              >
                {data.orderType && (
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: 'rgba(124, 93, 250, 0.2)',
                      color: '#a78bfa',
                      fontWeight: 600,
                      fontSize: 12
                    }}
                  >
                    {data.orderType}
                  </span>
                )}
                {data.tableNumber && <span>Table {data.tableNumber}</span>}
                {data.customerName && <span>{data.customerName}</span>}
              </div>
            )}

            {/* Items list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {data!.items.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>
                        {item.quantity}x
                      </span>
                      {item.name}
                    </div>
                    {item.variantName && (
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {item.variantName}
                      </div>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        {item.modifiers.map(m => typeof m === 'string' ? m : m.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                    {'\u00A3'}{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer — Total */}
      {hasItems && (
        <div
          style={{
            padding: '20px 32px',
            borderTop: '2px solid rgba(124, 93, 250, 0.3)',
            background: 'rgba(124, 93, 250, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            {data!.items.reduce((sum, item) => sum + item.quantity, 0)} items
          </div>
          <div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginRight: 12 }}>
              Total
            </span>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {'\u00A3'}{(data!.total || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
