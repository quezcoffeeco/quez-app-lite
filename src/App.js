// ============================================================
// QUEZ APP LITE — App.js
// Session 11: Role-based nav (max 5 tabs), More sheet, Admin hub, per-role Dashboard
// ============================================================

import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './App.css';
import './styles/checklist.css';
import './styles/periodic.css';

import PeriodicChecklists from './screens/PeriodicChecklists';
import LoginScreen from './screens/LoginScreen';
import DailyChecklist from './screens/DailyChecklist';
import SettingsScreen from './screens/SettingsScreen';
import TrainingPortal from './screens/TrainingPortal';
import TrainingApproval from './screens/TrainingApproval';
import DrinkGuide from './screens/DrinkGuide';
import OrderScreen from './screens/OrderScreen';
import Dashboard from './screens/Dashboard';
import AdminHub from './screens/AdminHub';
import Profile from './screens/Profile';
import Reports from './screens/Reports';
import Trainees from './screens/Trainees';
import AuditLog from './screens/AuditLog';
import PreLaunchTimeline from './screens/PreLaunchTimeline';
import WasteLog from './screens/WasteLog';
import Inventory from './screens/Inventory';

import {
  checkAndSendIncompleteAlert,
  getEmployees,
  applyTrainingBypassIfEnabled,
} from './utils/storage';

// ── Role helpers ──────────────────────────────────────────
const ADMIN_ROLES = ['owner', 'manager'];

// ── Nav tabs — always exactly 5: 4 primary + More ─────────
// Drink Guide lives in More for every role (no duplication).
function getNavTabs(role, language) {
  const lang = language || 'en';
  const home  = { screen: 'dashboard',         icon: '⌂', label: lang === 'es' ? 'Inicio' : 'Home' };
  const order = { screen: 'orders',            icon: '🧾', label: lang === 'es' ? 'Pedidos' : 'Orders' };
  const list  = { screen: 'dailyChecklist',    icon: '☑', label: lang === 'es' ? 'Lista' : 'Checklist' };
  const admin = { screen: 'adminHub',          icon: '⚙', label: lang === 'es' ? 'Admin' : 'Admin' };
  const train = { screen: 'training',          icon: '🎓', label: lang === 'es' ? 'Entrena' : 'Training' };
  const more  = { screen: '__more__',          icon: '⋯', label: lang === 'es' ? 'Más' : 'More' };

  // Role-aware 5th slot — every signed-in user gets 5 primary nav items.
  // The 4th slot rotates by role: Admin for owner/mgr, Drink Guide for
  // baristas (most-referenced screen during a rush), Training for trainees.
  const drinkGuide = { screen: 'drinkGuide', icon: '☕', label: lang === 'es' ? 'Bebidas' : 'Drinks' };

  if (ADMIN_ROLES.includes(role)) {
    return [home, order, list, admin, more];
  }
  if (role === 'leadBarista' || role === 'barista') {
    return [home, order, list, drinkGuide, more];
  }
  if (role === 'trainee') {
    return [home, train, drinkGuide, more];
  }
  return [home, more];
}

// ── Items shown inside the "More" sheet, by role ─────────
function getMoreItems(role, language) {
  const lang = language || 'en';
  const items = [];

  // Drink Guide — shown in More for any role whose PRIMARY nav doesn't
  // already include it. Owner/manager + guest get it here; baristas and
  // trainees have it as a primary tab and don't need a duplicate.
  const primaryHasDrinkGuide = role === 'leadBarista' || role === 'barista' || role === 'trainee';
  if (!primaryHasDrinkGuide) {
    items.push({ screen: 'drinkGuide', icon: '☕', label: lang === 'es' ? 'Guía de Bebidas' : 'Drink Guide' });
  }

  // Admin: training portal (review), barista/lead: their own training
  if (ADMIN_ROLES.includes(role)) {
    items.push({ screen: 'training', icon: '🎓', label: lang === 'es' ? 'Entrenamiento' : 'Training Portal' });
  }
  if (['barista', 'leadBarista'].includes(role)) {
    items.push({ screen: 'training', icon: '🎓', label: lang === 'es' ? 'Mi Entrenamiento' : 'My Training' });
  }

  // Periodic for lead barista
  if (role === 'leadBarista') {
    items.push({ screen: 'periodicChecklists', icon: '📅', label: lang === 'es' ? 'Periódico' : 'Periodic' });
  }

  // Profile + Sign Out — everyone
  items.push({ screen: 'profile', icon: '👤', label: lang === 'es' ? 'Mi Perfil' : 'My Profile' });
  items.push({ screen: '__logout__', icon: '⏏', label: lang === 'es' ? 'Cerrar Sesión' : 'Sign Out' });

  return items;
}

// ── Global clock ─ 12-hour h:mm + am/pm, top-right on every screen post-login ──
function GlobalClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Tick every 15s so the minute roll never lags more than that
    const id = setInterval(() => setNow(new Date()), 15 * 1000);
    return () => clearInterval(id);
  }, []);
  const rawH = now.getHours();
  const h12 = ((rawH + 11) % 12) + 1;
  const mm = String(now.getMinutes()).padStart(2, '0');
  const period = rawH < 12 ? 'am' : 'pm';
  return (
    <div style={clockStyles.pill} aria-label="Current time" className="quez-clock-pill">
      {h12}<span style={clockStyles.colon}>:</span>{mm}
      <span style={clockStyles.period} className="quez-clock-period">{period}</span>
    </div>
  );
}

const clockStyles = {
  pill: {
    position: 'fixed',
    top: 'calc(10px + env(safe-area-inset-top, 0px))',
    right: 12,
    zIndex: 90,
    background: 'rgba(13,13,13,0.78)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(212,175,55,0.40)',
    borderRadius: 20,
    padding: '5px 11px',
    color: '#D4AF37',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.04em',
    lineHeight: 1,
    pointerEvents: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 1,
  },
  colon: { opacity: 0.55, margin: '0 1px' },
  period: { fontSize: 9, marginLeft: 4, opacity: 0.7, letterSpacing: '0.08em', fontWeight: 600 },
};

// ── Inner app ─────────────────────────────────────────────
function AppInner() {
  const { session, currentScreen, language, navigate, push, goBack, canGoBack, logout, isReady } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (isReady) {
      checkAndSendIncompleteAlert();
      if (session) {
        const employees = getEmployees();
        const emp = employees.find((e) => e.id === session.id);
        if (emp) applyTrainingBypassIfEnabled(emp);
      }
    }
  }, [isReady, session]);

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

  const navTabs   = getNavTabs(session.role, language);
  const moreItems = getMoreItems(session.role, language);

  const handleTabClick = (screen) => {
    if (screen === '__more__') { setMoreOpen(true); return; }
    setMoreOpen(false);
    navigate(screen);
  };

  const handleMoreClick = (screen) => {
    setMoreOpen(false);
    if (screen === '__logout__') { logout(); return; }
    // Drill-down — preserve back history
    push(screen);
  };

  const isGuest = !!session?.guest;

  return (
    <div className="app">
      {/* Global clock — top-right on every post-login screen */}
      <GlobalClock />

      <div className="app-content">
        {/* Guest mode banner — visible on every screen so the operator knows
            they're in read-only preview mode and changes won't persist. */}
        {isGuest && (
          <div style={guestBannerStyles.bar}>
            <span style={guestBannerStyles.dot} />
            <span style={guestBannerStyles.text}>
              {language === 'es'
                ? 'Modo Invitado · Vista previa de solo lectura — nada se guardará'
                : 'Guest Mode · Read-only preview — nothing will be saved'}
            </span>
          </div>
        )}

        {/* In-flow back bar — sits above each screen's own header so titles stay centered */}
        {canGoBack && (
          <div style={backBtnStyles.bar}>
            <button style={backBtnStyles.btn} onClick={goBack} type="button">
              <span style={backBtnStyles.chev}>‹</span>
              <span>{language === 'es' ? 'Atrás' : 'Back'}</span>
            </button>
          </div>
        )}

        {currentScreen === 'dashboard'           && <Dashboard />}
        {currentScreen === 'dailyChecklist'      && <DailyChecklist />}
        {currentScreen === 'periodicChecklists'  && <PeriodicChecklists />}
        {currentScreen === 'settings'            && <SettingsScreen />}
        {currentScreen === 'training'            && <TrainingPortal />}
        {currentScreen === 'trainingApproval'    && <TrainingApproval />}
        {currentScreen === 'drinkGuide'          && <DrinkGuide />}
        {currentScreen === 'orders'              && <OrderScreen />}
        {currentScreen === 'adminHub'            && <AdminHub />}
        {currentScreen === 'profile'             && <Profile />}
        {currentScreen === 'reports'             && <Reports />}
        {currentScreen === 'trainees'            && <Trainees />}
        {currentScreen === 'auditLog'            && <AuditLog />}
        {currentScreen === 'preLaunchTimeline'   && <PreLaunchTimeline />}
        {currentScreen === 'wasteLog'            && <WasteLog />}
        {currentScreen === 'inventory'           && <Inventory />}
      </div>

      <nav className="app-nav">
        {navTabs.map((tab) => {
          const isActive = (tab.screen === '__more__') ? moreOpen : (currentScreen === tab.screen);
          return (
            <button
              key={tab.screen}
              className={`app-nav-tab ${isActive ? 'app-nav-tab--active' : ''}`}
              onClick={() => handleTabClick(tab.screen)}
              type="button"
            >
              <span className="app-nav-icon">{tab.icon}</span>
              <span className="app-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {moreOpen && (
        <div style={moreStyles.overlay} onClick={() => setMoreOpen(false)}>
          <div style={moreStyles.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={moreStyles.handle} />
            <div style={moreStyles.title}>
              {language === 'es' ? 'Más' : 'More'}
            </div>
            {moreItems.map((item) => (
              <button
                key={item.screen}
                style={{
                  ...moreStyles.item,
                  ...(item.screen === '__logout__' ? moreStyles.itemLogout : {}),
                }}
                onClick={() => handleMoreClick(item.screen)}
              >
                <span style={moreStyles.itemIcon}>{item.icon}</span>
                <span style={moreStyles.itemLabel}>{item.label}</span>
                <span style={moreStyles.chev}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const guestBannerStyles = {
  bar: {
    background: 'rgba(212,175,55,0.12)',
    borderBottom: '1px solid rgba(212,175,55,0.35)',
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'sticky',
    top: 0,
    zIndex: 28,
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#D4AF37',
    boxShadow: '0 0 6px rgba(212,175,55,0.7)',
    flexShrink: 0,
  },
  text: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#D4AF37',
    textTransform: 'uppercase',
  },
};

const backBtnStyles = {
  bar: {
    background: '#0D0D0D',
    borderBottom: '1px solid rgba(212,175,55,0.10)',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 30,
  },
  btn: {
    background: 'transparent',
    border: '1px solid rgba(212,175,55,0.35)',
    borderRadius: 18,
    color: '#D4AF37',
    padding: '5px 13px 5px 9px',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    letterSpacing: '0.04em',
  },
  chev: { fontSize: 18, lineHeight: 1, marginTop: -2 },
};

const moreStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    zIndex: 8000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    background: '#1A1A1A', borderTop: '1px solid rgba(212,175,55,0.4)',
    borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 580,
    padding: '12px 12px calc(20px + env(safe-area-inset-bottom, 0px))',
    marginBottom: 78, // sit above the nav
  },
  handle: {
    width: 44, height: 4, background: '#444', borderRadius: 2,
    margin: '6px auto 14px',
  },
  title: {
    fontFamily: 'Georgia, serif', fontSize: 14, color: '#D4AF37',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    marginLeft: 14, marginBottom: 10, fontWeight: 700,
  },
  item: {
    width: '100%', background: 'transparent', border: 'none',
    borderRadius: 10, padding: '13px 14px',
    color: '#F5F0E8', display: 'flex', alignItems: 'center', gap: 14,
    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
  },
  itemLogout: { color: '#E05252', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' },
  itemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: 600 },
  chev: { fontSize: 20, color: '#555' },
};

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
