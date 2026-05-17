import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSession, setSession, clearSession, initializeStorage, getSettings, requestPersistentStorage, maybeAutoBackup, maybeApplyScheduledLocation, getEmployees, pruneOldData } from '../utils/storage';
import { logAudit } from '../utils/storage';

// Idle minutes before we lock the session and force PIN re-entry
const IDLE_LOCK_MINUTES = 30;
 
const AppContext = createContext(null);
 
function homeScreenForRole(role) {
  // All roles land on the role-aware Dashboard.
  return 'dashboard';
}
 
// ── Logout Popup — lives at provider level, never unmounted ──
const LogoutPopup = ({ onConfirm, onCancel }) => {
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
      background: '#D4AF37', color: '#0D0D0D',
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
        <div style={S.title}>{lang === 'es' ? 'Cerrar Sesión' : 'Sign Out'}</div>
        <p style={S.sub}>
          {lang === 'es' ? '¿Deseas cerrar sesión?' : 'Are you sure you want to sign out?'}
        </p>
        <button style={S.btn} onClick={onConfirm} type="button">
          {lang === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
        </button>
        <button style={S.btnCancel} onClick={onCancel} type="button">
          {lang === 'es' ? 'Cancelar' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};
 
// Guest mode: monkey-patch localStorage.setItem so business-data writes are
// silently dropped while the Guest user is the session. Tiny allowlist
// permits the session record itself + a few pure-UI collapse-state keys so
// navigation feels normal. Original setter is captured on the window so we
// can restore it cleanly on logout.
const GUEST_ALLOW = /^(quez_session|quez_owner_panel_collapsed|quez_prelaunch_panel_collapsed|quez_dashboard_panel)/;
function installGuestMode() {
  if (typeof window === 'undefined') return;
  if (window.__quezOriginalSetItem) return; // already installed
  const original = window.localStorage.setItem.bind(window.localStorage);
  window.__quezOriginalSetItem = original;
  window.localStorage.setItem = function (key, value) {
    if (typeof key !== 'string') return original(key, value);
    if (!key.startsWith('quez_')) return original(key, value); // foreign keys pass through
    if (GUEST_ALLOW.test(key)) return original(key, value);
    // silently drop
  };
}
function uninstallGuestMode() {
  if (typeof window === 'undefined') return;
  if (window.__quezOriginalSetItem) {
    window.localStorage.setItem = window.__quezOriginalSetItem;
    delete window.__quezOriginalSetItem;
  }
}

export function AppProvider({ children }) {
  const [session, setSessionState] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [history, setHistory] = useState([]); // stack of previously visited screens for back navigation
  const [language, setLanguage] = useState('en');
  const [isReady, setIsReady] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  useEffect(() => {
    initializeStorage();
    const settings = getSettings();
    setLanguage(settings.language || 'en');
    const saved = getSession();
    if (saved) {
      // If the saved session is a Guest, re-install the write-blocker BEFORE
      // anything else so refreshes mid-Guest-session stay read-only.
      if (saved.guest) installGuestMode();
      // Refresh session against current employee record — catches role upgrades
      // (e.g. trainee → barista was approved while logged in) and name edits.
      // Guest is not in the employees list, so skip that lookup for Guest.
      const freshEmp = saved.guest ? null : getEmployees().find((e) => e.id === saved.id);
      const refreshed = freshEmp
        ? { ...saved, role: freshEmp.role, name: freshEmp.name }
        : saved;
      if (freshEmp && (freshEmp.role !== saved.role || freshEmp.name !== saved.name)) {
        setSession(refreshed);
      }
      setSessionState(refreshed);
      setCurrentScreen(homeScreenForRole(refreshed.role));
      setHistory([]);
    }
    setIsReady(true);
    // Ask the browser to protect our localStorage from eviction. Silent on Chrome,
    // may prompt on Safari/Firefox. Either way, fire once on boot.
    requestPersistentStorage().catch(() => {});
    // Daily housekeeping pass — collapses old per-day keys into monthly
    // rollups, drops past-retention rows. Runs at most once per calendar day.
    // Has to fire BEFORE the auto-backup so the email bundle stays small.
    try { pruneOldData(); } catch (e) { console.warn('Prune failed:', e); }
    // Auto-backup check — silently fires if we're past the cadence threshold.
    maybeAutoBackup('boot').catch(() => {});
    // Scheduled-location auto-apply — pre-fills today's location from the
    // owner-configured weekly schedule, so the stale-location amber flag
    // doesn't fire just because no one tapped Settings this morning.
    try { maybeApplyScheduledLocation(); } catch (e) { console.warn('Scheduled location apply failed:', e); }
  }, []);

  const login = useCallback((employeeData) => {
    // Install the guest write-blocker BEFORE the session is persisted so the
    // very first write (session) goes through the allowlist path.
    if (employeeData?.guest) installGuestMode();
    setSession(employeeData);
    setSessionState(employeeData);
    setCurrentScreen(homeScreenForRole(employeeData.role));
    setHistory([]);
  }, []);

  // Actual logout — clears session and navigates to login. If the outgoing
  // session was Guest, restore the original localStorage.setItem so the
  // next signed-in user can save again.
  const doLogout = useCallback(() => {
    const wasGuest = session?.guest;
    clearSession();
    if (wasGuest) uninstallGuestMode();
    setSessionState(null);
    setCurrentScreen('login');
    setHistory([]);
    setShowLogoutPopup(false);
  }, [session]);

  // Called by nav button — shows popup instead of logging out immediately
  const logout = useCallback(() => {
    setShowLogoutPopup(true);
  }, []);

  // navigate(): top-level tab switch — clears history
  const navigate = useCallback((screen) => {
    setHistory([]);
    setCurrentScreen(screen);
  }, []);

  // push(): drill into a sub-screen — remembers where we came from
  const push = useCallback((screen) => {
    setHistory((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
  }, [currentScreen]);

  // goBack(): pop the history stack
  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const target = next.pop();
      setCurrentScreen(target);
      return next;
    });
  }, []);

  const canGoBack = history.length > 0;

  // ── Idle / session timeout ──────────────────────────────────
  const lastActivityRef = useRef(Date.now());
  const bumpActivity = useCallback(() => { lastActivityRef.current = Date.now(); }, []);

  useEffect(() => {
    if (!session) return undefined;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, bumpActivity, { passive: true }));
    const tick = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs > IDLE_LOCK_MINUTES * 60 * 1000) {
        // Don't write an audit row for a Guest auto-lock; not real activity.
        if (!session.guest) {
          logAudit('session_lock', { employeeName: session.name, reason: 'idle' });
        }
        clearSession();
        if (session.guest) uninstallGuestMode();
        setSessionState(null);
        setCurrentScreen('login');
        setHistory([]);
      }
    }, 30 * 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bumpActivity));
      clearInterval(tick);
    };
  }, [session, bumpActivity]);
 
  // ── Popup handlers ────────────────────────────────────────
  const handleSignOut = useCallback(() => {
    doLogout();
  }, [doLogout]);

  const handleCancelLogout = useCallback(() => {
    setShowLogoutPopup(false);
  }, []);

  return (
    <AppContext.Provider value={{
      session,
      currentUser: session,
      isGuest: !!session?.guest,
      currentScreen, language, setLanguage,
      login, logout, navigate, push, goBack, canGoBack, isReady,
    }}>
      {children}

      {/* Popup renders at provider level — never unmounted by screen changes */}
      {showLogoutPopup && (
        <LogoutPopup
          onConfirm={handleSignOut}
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