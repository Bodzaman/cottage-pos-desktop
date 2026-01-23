/**
 * Electron Entry Point for Cottage Tandoori POS
 *
 * This is the entry point specifically for the Electron desktop app.
 * It uses MemoryRouter instead of BrowserRouter and only includes
 * the POS Login and POS Desktop routes (staff/admin access only).
 */
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from 'components/AppProvider';
import { ThemeProvider } from '../frontend/src/internal-components/ThemeProvider';
import { DEFAULT_THEME } from '../frontend/src/constants/default-theme';
import '../frontend/src/index.css';
import '../frontend/src/polyfills/react-polyfill';

// Lazy load POS pages only - staff/admin access in Electron
const POSDesktop = lazy(() => import('../frontend/src/pages/POSDesktop'));
const POSLogin = lazy(() => import('../frontend/src/pages/POSLogin'));

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

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ElectronApp />);
}
