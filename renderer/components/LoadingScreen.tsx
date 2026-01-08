
import React from 'react'

/**
 * LoadingScreen - Professional loading screen for POS desktop app
 */
export function LoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f8fafc',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #334155',
        borderTop: '4px solid #d97706',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1.5rem'
      }}></div>
      <div style={{
        fontSize: '1.125rem',
        fontWeight: '500',
        color: '#d97706',
        marginBottom: '0.5rem'
      }}>
        🏪 Cottage Tandoori POS
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: '#94a3b8'
      }}>
        Initializing system...
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
