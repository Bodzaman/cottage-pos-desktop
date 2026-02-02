import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { AppWrapper } from './AppWrapper.tsx'
import './index.css'
// Polyfill for support react use in react 18
import "./polyfills/react-polyfill";
// Initialize error tracking
import { initializeSentry } from './utils/errorLogger';

// Initialize Sentry for error telemetry (must be done before rendering)
initializeSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <AppWrapper />
    </HelmetProvider>
  </StrictMode>,
)
