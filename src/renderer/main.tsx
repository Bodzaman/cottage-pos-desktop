import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/main.css';

// Initialize React App
const container = document.getElementById('app');
if (!container) {
  throw new Error('Failed to find the app element');
}

const root = createRoot(container);
root.render(<App />);
