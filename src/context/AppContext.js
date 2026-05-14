import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSession, setSession, clearSession, initializeStorage, getSettings } from '../utils/storage';

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

export function AppProvider({ children }) {
  const [session, setSessionState] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [language, setLanguage] = useState('en');
  const [isReady, setIsReady] = useState(false);

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

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
    setCurrentScreen('login');
  }, []);

  const navigate = useCallback((screen) => setCurrentScreen(screen), []);

  return (
    <AppContext.Provider value={{ session, currentScreen, language, setLanguage, login, logout, navigate, isReady }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
