import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSession, setSession, clearSession, initializeStorage, getSettings } from '../utils/storage';
import { recordClockOut } from '../utils/storage';
 
const AppContext = createContext(null);
 
function homeScreenForRole(role) {
  switch (role) {
    case 'owner':       return 'ownerDashboard';
    case 'manager':     return 'dailyChecklist';
    case 'leadBarista': return 'dailyChecklist';
    case 'barista':     return 'dailyChecklist';
    case 'trainee':     return 'training';
    default:            return 'dailyChecklist';
  }
}
 
// ── Logout Popup — lives at provider level, never unmounted ──
const LogoutPopup = ({ session, onSignOutOnly, onClockOutAndSignOut, onCancel }) => {
  const isOwner = session?.role === 'owner';
  const lang = getSettings().language || 'en';
 
  const S = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
      zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    },
    sheet: {
      background: '#1A1A1A', borderTop: '1px solid rgba(212,175,55,0.4)',
      borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 580,
      padding: '28px 20px 44px',
    },
    title: {
      fontFamily: 'Georgia, serif', fontSize: 18, color: '#D4AF37',
      letterSpacing: '0.03em', marginBottom: 8,
    },
    sub: { fontSize: 13, color: '#9A9080', marginBottom: 28, lineHeight: 1.5 },
    btn: {
      width: '100%', padding: '15px', border: 'none', borderRadius: 10,
      fontSize: 15, fontFamily: 'Georgia, serif', letterSpacing: '0.04em',
      cursor: 'pointer', marginBottom: 10, textTransform: 'uppercase',
      display: 'block',
    },
    btnGold: { background: '#D4AF37', color: '#0D0D0D' },
    btnGhost: {
      background: 'transparent', border: '1px solid rgba(212,175,55,0.3)',
      color: '#F5F0E8',
    },
    btnCancel: {
      background: 'transparent', border: 'none',
      color: '#9A9080', fontSize: 14, cursor: 'pointer',
      width: '100%', padding: '10px', marginTop: 4, display: 'block',
    },
  };
 
  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.title}>
          {lang === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
        </div>
        <p style={S.sub}>
          {isOwner
            ? (lang === 'es' ? '¿Deseas cerrar sesión?' : 'Are you sure you want to sign out?')
            : (lang === 'es'
                ? '¿Estás terminando tu turno o solo saliendo temporalmente?'
                : 'Are you ending your shift or just stepping away?')}
        </p>
 
        {!isOwner && (
          <button style={{ ...S.btn, ...S.btnGold }} onClick={onClockOutAndSignOut} type="button">
            {lang === 'es' ? 'Registrar Salida y Cerrar Sesión' : 'Clock Out & Sign Out'}
          </button>
        )}
 
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={onSignOutOnly} type="button">
          {lang === 'es' ? 'Solo Cerrar Sesión' : 'Sign Out Only'}
        </button>
 
        <button style={S.btnCancel} onClick={onCancel} type="button">
          {lang === 'es' ? 'Cancelar' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};
 
export function AppProvider({ children }) {
  const [session, setSessionState] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [language, setLanguage] = useState('en');
  const [isReady, setIsReady] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
 
  useEffect(() => {
    initializeStorage();
    const settings = getSettings();
    setLanguage(settings.language || 'en');
    const saved = getSession();
    if (saved) {
      setSessionState(saved);
      setCurrentScreen(homeScreenForRole(saved.role));
    }
    setIsReady(true);
  }, []);
 
  const login = useCallback((employeeData) => {
    setSession(employeeData);
    setSessionState(employeeData);
    setCurrentScreen(homeScreenForRole(employeeData.role));
  }, []);
 
  // Actual logout — clears session and navigates to login
  const doLogout = useCallback(() => {
    clearSession();
    setSessionState(null);
    setCurrentScreen('login');
    setShowLogoutPopup(false);
  }, []);
 
  // Called by nav button — shows popup instead of logging out immediately
  const logout = useCallback(() => {
    setShowLogoutPopup(true);
  }, []);
 
  const navigate = useCallback((screen) => setCurrentScreen(screen), []);
 
  // ── Popup handlers ────────────────────────────────────────
  const handleSignOutOnly = useCallback(() => {
    doLogout();
  }, [doLogout]);
 
  const handleClockOutAndSignOut = useCallback(() => {
    const isOwner = session?.role === 'owner';
    if (!isOwner && session) {
      recordClockOut({
        employeeId: session.id,
        name: session.name,
        role: session.role,
        location: session.location,
        clockInTime: session.clockInTime,
        clockOutTime: new Date().toISOString(),
      });
    }
    doLogout();
  }, [session, doLogout]);
 
  const handleCancelLogout = useCallback(() => {
    setShowLogoutPopup(false);
  }, []);
 
  return (
    <AppContext.Provider value={{
      session, currentScreen, language, setLanguage,
      login, logout, navigate, isReady,
    }}>
      {children}
 
      {/* Popup renders at provider level — never unmounted by screen changes */}
      {showLogoutPopup && (
        <LogoutPopup
          session={session}
          onSignOutOnly={handleSignOutOnly}
          onClockOutAndSignOut={handleClockOutAndSignOut}
          onCancel={handleCancelLogout}
        />
      )}
    </AppContext.Provider>
  );
}
 
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}