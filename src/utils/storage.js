// src/utils/storage.js
// Centralized localStorage helpers
// All data lives here — no cloud, no server

// ─── Core get/set/remove ──────────────────────────────────────────────────────

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Storage write failed for key "${key}":`, err);
  }
}

export function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Storage read failed for key "${key}":`, err);
    return null;
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Storage remove failed for key "${key}":`, err);
  }
}

export function getAllStorageKeys() {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

export function getKeysByPrefix(prefix) {
  return getAllStorageKeys().filter(k => k.startsWith(prefix));
}

export function loadAllByPrefix(prefix) {
  return getKeysByPrefix(prefix).map(key => loadFromStorage(key)).filter(Boolean);
}

// Aliases used by emailjs.js
export const storageGet = loadFromStorage;
export const storageSet = saveToStorage;

// ─── App initialization ───────────────────────────────────────────────────────

export function initializeStorage() {
  if (!loadFromStorage('settings')) {
    saveToStorage('settings', getDefaultSettings());
  }
  if (!loadFromStorage('employees')) {
    saveToStorage('employees', getDefaultEmployees());
  }
  if (!loadFromStorage('menu')) {
    saveToStorage('menu', []);
  }
}

function getDefaultSettings() {
  return {
    ownerEmail: 'support@quezcoffeeco.com',
    emailjsServiceId: '',
    emailjsTemplateId: '',
    emailjsPublicKey: '',
    language: 'en',
    locations: ['Council Bluffs'],
    defaultLocation: 'Council Bluffs',
    openingUnlockTime: '05:00',
    closingUnlockTime: '14:00',
    timeLockDisabled: false,
  };
}

function getDefaultEmployees() {
  return [
    {
      id: 'owner-ryan',
      name: 'Ryan Rodriguez',
      role: 'owner',
      pin: '1943',
      active: true,
      trainingBypass: false,
    },
  ];
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings() {
  return loadFromStorage('settings') || getDefaultSettings();
}

export function saveSettings(settings) {
  saveToStorage('settings', settings);
}

// ─── Session (current logged-in employee) ────────────────────────────────────

export function getSession() {
  return loadFromStorage('currentSession');
}

export function setSession(employeeData) {
  saveToStorage('currentSession', employeeData);
  saveToStorage('currentClockIn', {
    name: employeeData.name,
    role: employeeData.role,
    location: employeeData.location || getDefaultSettings().defaultLocation,
    clockInTime: new Date().toISOString(),
  });
}

export function clearSession() {
  removeFromStorage('currentSession');
  removeFromStorage('currentClockIn');
}

// ─── Employees ────────────────────────────────────────────────────────────────

export function getEmployees() {
  return loadFromStorage('employees') || [];
}

export function saveEmployees(employees) {
  saveToStorage('employees', employees);
}

export function getActiveEmployees() {
  return getEmployees().filter(e => e.active !== false);
}

// ─── PIN lockout ──────────────────────────────────────────────────────────────

export function getPinLockout(employeeId) {
  return loadFromStorage(`pinLockout_${employeeId}`) || null;
}

export function setPinLockout(employeeId, data) {
  saveToStorage(`pinLockout_${employeeId}`, data);
}

export function clearPinLockout(employeeId) {
  removeFromStorage(`pinLockout_${employeeId}`);
}

// ─── Clock-in records ─────────────────────────────────────────────────────────

export function addClockInRecord(record) {
  const today = getTodayKey();
  const key = `clockIns_${today}`;
  const existing = loadFromStorage(key) || [];
  existing.push({
    ...record,
    timestamp: new Date().toISOString(),
  });
  saveToStorage(key, existing);
}

export function getClockInsForToday() {
  return loadFromStorage(`clockIns_${getTodayKey()}`) || [];
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export function getMenu() {
  return loadFromStorage('menu') || [];
}

export function saveMenu(menu) {
  saveToStorage('menu', menu);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}