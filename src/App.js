// ============================================================
// QUEZ APP LITE — App.js
// Built to match existing AppContext navigation system.
// Session 5: adds DailyChecklist (mid/closing), 
// ============================================================
 
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './App.css';
import './styles/checklist.css';
 
// Screens
import LoginScreen from './screens/LoginScreen';
import DailyChecklist from './screens/DailyChecklist';
import SettingsScreen from './screens/SettingsScreen';
 
// ── Nav tab definitions per role ──────────────────────────
function getNavTabs(role, language) {
  const lang = language || 'en';
  const tabs = [];
 
  if (['owner', 'manager', 'leadBarista', 'barista'].includes(role)) {
    tabs.push({
      screen: 'dailyChecklist',
      icon: '☑',
      label: lang === 'es' ? 'Lista' : 'Checklist',
    });
  }
 

 
  if (role === 'owner') {
    tabs.push({
      screen: 'ownerDashboard',
      icon: '◉',
      label: lang === 'es' ? 'Panel' : 'Dashboard',
    });
    tabs.push({
      screen: 'settings',
      icon: '⚙',
      label: lang === 'es' ? 'Ajustes' : 'Settings',
    });
  }
 
  return tabs;
}
 
// ── Inner app — reads from AppContext ─────────────────────
function AppInner() {
  const { session, currentScreen, language, navigate, logout, isReady } = useApp();
 
  if (!isReady) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0D0D0D',
      }}>
        <div style={{ color: '#D4AF37', fontFamily: 'Georgia, serif', fontSize: 18 }}>
          Quez Coffee Co.
        </div>
      </div>
    );
  }
 
  // Not logged in
  if (currentScreen === 'login' || !session) {
    return <LoginScreen />;
  }
 
  const navTabs = getNavTabs(session.role, language);
 
  // Clock-out callback passed to DailyChecklist
  function handleClockOut() {
    // Stays on checklist screen showing "done" state.
    // Full logout via Settings or nav.
  }
 
  return (
    <div className="app">
      {/* Screen content */}
      <div className="app-content">
        {currentScreen === 'dailyChecklist' && (
          <DailyChecklist onClockOut={handleClockOut} />
       
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen />
        )}
        {currentScreen === 'ownerDashboard' && (
          // Owner Dashboard coming in a future session
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 16,
            background: '#0D0D0D', color: '#555',
          }}>
            <div style={{ fontSize: 40 }}>◉</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#D4AF37' }}>
              Owner Dashboard
            </div>
            <div style={{ fontSize: 13 }}>Coming in a future session</div>
          </div>
        )}
        {currentScreen === 'training' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 16,
            background: '#0D0D0D', color: '#555',
          }}>
            <div style={{ fontSize: 40 }}>🎓</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#D4AF37' }}>
              Training Portal
            </div>
            <div style={{ fontSize: 13 }}>Coming in a future session</div>
          </div>
        )}
      </div>
 
      {/* Bottom navigation */}
      <nav className="app-nav">
        {navTabs.map((tab) => (
          <button
            key={tab.screen}
            className={`app-nav-tab ${currentScreen === tab.screen ? 'app-nav-tab--active' : ''}`}
            onClick={() => navigate(tab.screen)}
            type="button"
          >
            <span className="app-nav-icon">{tab.icon}</span>
            <span className="app-nav-label">{tab.label}</span>
          </button>
        ))}
 
        {/* Logout always visible */}
        <button
          className="app-nav-tab"
          onClick={logout}
          type="button"
        >
          <span className="app-nav-icon">⏏</span>
          <span className="app-nav-label">{language === 'es' ? 'Salir' : 'Logout'}</span>
        </button>
      </nav>
    </div>
  );
}
 
// ── Root export — wraps everything in AppProvider ─────────
export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
 