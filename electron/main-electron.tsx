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

// Loading fallback for lazy components
const LoadingFallback = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-black">
    <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
  </div>
);

/**
 * ElectronApp - Root component for Electron POS application
 *
 * Uses MemoryRouter for SPA routing without URL bar
 * Only exposes POS Login and POS Desktop routes
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
