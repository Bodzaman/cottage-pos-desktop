/**
 * Electron Entry Point for Cottage Tandoori POS
 *
 * This is the entry point specifically for the Electron desktop app.
 * It uses MemoryRouter instead of BrowserRouter and includes:
 * - POS Login (authentication for both staff and admin users)
 * - POS Desktop (for staff users)
 * - Admin Portal (for admin/tenant users)
 *
 * Role-based routing is handled by the login page - staff users
 * are directed to POS Desktop, admin users to Admin Portal.
 */
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from 'components/AppProvider';
import { ThemeProvider } from '../frontend/src/internal-components/ThemeProvider';
import { DEFAULT_THEME } from '../frontend/src/constants/default-theme';
import '../frontend/src/index.css';
import '../frontend/src/polyfills/react-polyfill';

// Lazy load POS pages - staff/admin access in Electron
const POSDesktop = lazy(() => import('../frontend/src/pages/POSDesktop'));
const POSLogin = lazy(() => import('../frontend/src/pages/POSLogin'));
// Admin portal for admin/tenant users
const Admin = lazy(() => import('../frontend/src/pages/Admin'));
// Reconciliation page for Quick Tools access
const Reconciliation = lazy(() => import('../frontend/src/pages/Reconciliation'));

// Loading fallback for lazy components — uses inline styles to guarantee centering
// even before Tailwind CSS loads
const LoadingFallback = () => (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000'
  }}>
    <div style={{
      width: 32, height: 32,
      border: '2px solid #9333ea',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  </div>
);

/**
 * ElectronApp - Root component for Electron POS application
 *
 * Uses MemoryRouter for SPA routing without URL bar
 * Only exposes POS Login and POS Desktop routes
 * Always starts at POS Login — user must authenticate on every launch
 */
function ElectronApp() {
  return (
    <StrictMode>
      <ThemeProvider defaultTheme={DEFAULT_THEME}>
        <MemoryRouter initialEntries={['/pos-login']}>
          <AppProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/pos-login" element={<POSLogin />} />
                <Route path="/poslogin" element={<POSLogin />} />
                <Route path="/pos-desktop" element={<POSDesktop />} />
                <Route path="/posdesktop" element={<POSDesktop />} />
                {/* Admin portal for admin/tenant users */}
                <Route path="/admin" element={<Admin />} />
                {/* Reconciliation for Quick Tools access */}
                <Route path="/reconciliation" element={<Reconciliation />} />
                {/* Redirect any other routes to POS Login */}
                <Route path="*" element={<Navigate to="/pos-login" replace />} />
              </Routes>
            </Suspense>
          </AppProvider>
        </MemoryRouter>
      </ThemeProvider>
    </StrictMode>
  );
}

// Force re-authentication on every Electron cold start (POS security)
// Preserve PIN data (pinEnabled, lastUserId, etc.) so PIN pad appears
const storageKey = 'pos-auth-storage';
try {
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed.state) {
      parsed.state.isAuthenticated = false;
      parsed.state.user = null;
      localStorage.setItem(storageKey, JSON.stringify(parsed));
    }
  }
} catch {
  // Ignore parse errors — store will initialize fresh
}

// Fix font path for Electron file:// protocol
// The CSS uses absolute path /fonts/OldeEnglish.ttf which doesn't work with base: './'
// This override uses relative path that works in Electron's packaged app
if (typeof window !== 'undefined') {
  const fontStyle = document.createElement('style');
  fontStyle.textContent = `
    @font-face {
      font-family: 'Cloister Black';
      src: url('./fonts/OldeEnglish.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.head.appendChild(fontStyle);
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ElectronApp />);
}
