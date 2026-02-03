import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { AppWrapper } from './AppWrapper.tsx'
import './index.css'
// Polyfill for support react use in react 18
import "./polyfills/react-polyfill";
// Initialize error tracking
import { initializeSentry } from './utils/errorLogger';
// Initialize i18n (must be imported before any component that uses translations)
import './utils/i18nConfig';

// Initialize Sentry for error telemetry (must be done before rendering)
initializeSentry();

// Loading fallback for i18n translations
const I18nLoadingFallback = () => (
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<I18nLoadingFallback />}>
      <HelmetProvider>
        <AppWrapper />
      </HelmetProvider>
    </Suspense>
  </StrictMode>,
)
