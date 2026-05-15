// ============================================================
// QUEZ APP LITE — Entry Point
// ============================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { applyDefaultsIfNeeded } from './data/defaults';

// Apply seed data on first launch
applyDefaultsIfNeeded();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker so the app launches offline (airplane mode,
// dead WiFi, mobile-bar travel between events). Only in production and only
// when the browser supports SW. PUBLIC_URL respects the GitHub Pages subpath.
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
    navigator.serviceWorker.register(swUrl).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
