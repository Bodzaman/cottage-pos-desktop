import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './components/AppProvider';
import POSDesktop from './pages/POSDesktop';
import POSLogin from './pages/POSLogin';
import './styles.css';

// Mount the POS Desktop application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <MemoryRouter initialEntries={['/pos-desktop']}>
    <AppProvider>
      <Routes>
        <Route path="/pos-login" element={<POSLogin />} />
        <Route path="/pos-desktop" element={<POSDesktop />} />
        <Route path="/" element={<Navigate to="/pos-desktop" replace />} />
        <Route path="*" element={<Navigate to="/pos-desktop" replace />} />
      </Routes>
    </AppProvider>
  </MemoryRouter>
);

// Log version info
console.log('Cottage Tandoori POS Desktop v1.2.4');
console.log('Environment:', import.meta.env?.MODE || 'production');
