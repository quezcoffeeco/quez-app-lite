import { DEFAULT_SETTINGS, DEFAULT_EMPLOYEES, DEFAULT_MENU } from '../data/defaults';

export function storageGet(key) {
  try {
    const raw = localStorage.getItem(`quez_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(`quez_${key}`, JSON.stringify(value));
    return true;
  } catch { return false; }
}

export function storageRemove(key) {
  localStorage.removeItem(`quez_${key}`);
}

export function initializeStorage() {
  if (!storageGet('initialized')) {
    storageSet('settings', DEFAULT_SETTINGS);
    storageSet('employees', DEFAULT_EMPLOYEES);
    storageSet('menu', DEFAULT_MENU);
    storageSet('clockInLog', []);
    storageSet('checklistLog', []);
    storageSet('orderLog', []);
    storageSet('initialized', true);
  }
}

export function getSettings() { return storageGet('settings') || DEFAULT_SETTINGS; }
export function saveSettings(s) { return storageSet('settings', s); }
export function getEmployees() { return storageGet('employees') || DEFAULT_EMPLOYEES; }
export function saveEmployees(e) { return storageSet('employees', e); }
export function getActiveEmployees() { return getEmployees().filter(e => e.active); }
export function getEmployeeById(id) { return getEmployees().find(e => e.id === id) || null; }

export function getPinLockout(employeeId) {
  const all = storageGet('pinLockouts') || {};
  return all[employeeId] || { attempts: 0, lockedUntil: null };
}
export function setPinLockout(employeeId, state) {
  const all = storageGet('pinLockouts') || {};
  all[employeeId] = state;
  storageSet('pinLockouts', all);
}
export function clearPinLockout(employeeId) {
  const all = storageGet('pinLockouts') || {};
  delete all[employeeId];
  storageSet('pinLockouts', all);
}

export function getClockInLog() { return storageGet('clockInLog') || []; }
export function addClockInRecord(record) {
  const log = getClockInLog();
  log.push(record);
  storageSet('clockInLog', log);
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem('quez_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function setSession(data) {
  try { sessionStorage.setItem('quez_session', JSON.stringify(data)); } catch {}
}
export function clearSession() { sessionStorage.removeItem('quez_session'); }

export function getChecklistLog() { return storageGet('checklistLog') || []; }
export function addChecklistRecord(record) {
  const log = getChecklistLog();
  log.push(record);
  storageSet('checklistLog', log);
}

export function getOrderLog() { return storageGet('orderLog') || []; }
export function addOrderRecord(record) {
  const log = getOrderLog();
  log.push(record);
  storageSet('orderLog', log);
}

export function getMenu() { return storageGet('menu') || []; }
export function saveMenu(menu) { return storageSet('menu', menu); }

export function getTodayKey() { return new Date().toISOString().split('T')[0]; }
export function getTodayClockIns() {
  const today = getTodayKey();
  return getClockInLog().filter(r => r.clockInTime.startsWith(today));
}
