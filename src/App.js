// ============================================================
// QUEZ APP LITE — App.js
// Updated: Session 6 — Periodic Checklists + Owner Dashboard
// Logout handled entirely by AppContext — no duplicate popup here
// ============================================================
 
import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './App.css';
import './styles/checklist.css';
import './styles/periodic.css';
import PeriodicChecklists from './screens/PeriodicChecklists';
import OwnerDashboard from './screens/OwnerDashboard';
import LoginScreen from './screens/LoginScreen';
import DailyChecklist from './screens/DailyChecklist';
import SettingsScreen from './screens/SettingsScreen';
 
import {
  autoCloseOrphanedPunches,
  checkAndSendIncompleteAlert,
  isWeeklyChecklistDue,
  isWeeklySubmittedThisWeek,
  isMonthlyChecklistDue,
  isMonthlySubmittedThisMonth,
  isQuarterlyChecklistDue,
  isQuarterlySubmittedThisQuarter,
  isAnnualChecklistDue,
  isAnnualSubmittedThisYear,
} from './utils/storage';
 
// ── Periodic checklist badge helper ──────────────────────────
function hasPeriodicChecklistDue(role) {
  const rank = { owner: 4, manager: 3, lead_barista: 2, leadBarista: 2, barista: 1, trainee: 0 };
  const r = rank[role] || 0;
  if (r >= 2 && isWeeklyChecklistDue() && !isWeeklySubmittedThisWeek()) return true;
  if (r >= 3 && isMonthlyChecklistDue() && !isMonthlySubmittedThisMonth()) return true;
  if (r >= 3 && isQuarterlyChecklistDue() && !isQuarterlySubmittedThisQuarter()) return true;
  if (r >= 3 && isAnnualChecklistDue() && !isAnnualSubmittedThisYear()) return true;
  return false;
}
 
// ── Nav tabs ──────────────────────────────────────────────
function getNavTabs(role, language) {
  const lang = language || 'en';
  const tabs = [];
 
  if (['owner', 'manager', 'lead_barista', 'leadBarista', 'barista'].includes(role)) {
    tabs.push({
      screen: 'dailyChecklist',
      icon: '☑',
      label: lang === 'es' ? 'Lista' : 'Checklist',
      badge: false,
    });
  }
 
  if (['owner', 'manager', 'lead_barista', 'leadBarista'].includes(role)) {
    tabs.push({
      screen: 'periodicChecklists',
      icon: '📅',
      label: lang === 'es' ? 'Periódico' : 'Periodic',
      badge: hasPeriodicChecklistDue(role),
    });
  }
 
  if (role === 'owner') {
    tabs.push({
      screen: 'ownerDashboard',
      icon: '◉',
      label: lang === 'es' ? 'Panel' : 'Dashboard',
      badge: false,
    });
    tabs.push({
      screen: 'settings',
      icon: '⚙',
      label: lang === 'es' ? 'Ajustes' : 'Settings',
      badge: false,
    });
  }
 
  return tabs;
}
 
// ── Inner app ─────────────────────────────────────────────
function AppInner() {
  const { session, currentScreen, language, navigate, logout, isReady } = useApp();
 
  useEffect(() => {
    if (isReady) {
      autoCloseOrphanedPunches();
      checkAndSendIncompleteAlert();
    }
  }, [isReady]);
 
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
 
  if (currentScreen === 'login' || !session) {
    return <LoginScreen />;
  }
 
  const navTabs = getNavTabs(session.role, language);
 
  return (
    <div className="app">
      <div className="app-content">
        {currentScreen === 'dailyChecklist'      && <DailyChecklist />}
        {currentScreen === 'periodicChecklists'  && <PeriodicChecklists />}
        {currentScreen === 'ownerDashboard'      && <OwnerDashboard />}
        {currentScreen === 'settings'            && <SettingsScreen />}
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
            <div style={{ fontSize: 13 }}>Coming in Session 7</div>
          </div>
        )}
      </div>
 
      <nav className="app-nav">
        {navTabs.map((tab) => (
          <button
            key={tab.screen}
            className={`app-nav-tab ${currentScreen === tab.screen ? 'app-nav-tab--active' : ''}`}
            onClick={() => navigate(tab.screen)}
            type="button"
            style={{ position: 'relative' }}
          >
            {tab.badge && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: '50%',
                transform: 'translateX(10px)',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#e05252',
                border: '1.5px solid #0D0D0D',
              }} />
            )}
            <span className="app-nav-icon">{tab.icon}</span>
            <span className="app-nav-label">{tab.label}</span>
          </button>
        ))}
 
        {/* Logout — triggers AppContext popup, no local state needed */}
        <button className="app-nav-tab" onClick={logout} type="button">
          <span className="app-nav-icon">⏏</span>
          <span className="app-nav-label">{language === 'es' ? 'Salir' : 'Logout'}</span>
        </button>
      </nav>
    </div>
  );
}
 
export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}