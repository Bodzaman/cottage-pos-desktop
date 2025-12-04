import React from 'react';
import ReactDOM from 'react-dom/client';
import POSDesktop from './pages/POSDesktop';
import './styles.css';

// Mount the POS Desktop application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <POSDesktop />
  </React.StrictMode>
);

// Log version info
console.log('Cottage Tandoori POS Desktop v1.2.4');
console.log('Environment:', import.meta.env.MODE);
