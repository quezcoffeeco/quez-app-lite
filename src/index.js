// ============================================================
// QUEZ APP LITE — Entry Point
// Seed data is owned by storage.initializeStorage() (called from
// AppContext on mount). Don't add a second seeding path here —
// any old defaults.js shape was a landmine that disagreed with
// the live settings shape.
// ============================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

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
