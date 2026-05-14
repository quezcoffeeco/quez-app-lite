export function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error(err); }
}
export function loadFromStorage(key) {
  try { const raw = localStorage.getItem(key); if (raw === null) return null; return JSON.parse(raw); } catch (err) { return null; }
}
export function removeFromStorage(key) {
  try { localStorage.removeItem(key); } catch (err) { console.error(err); }
}
export function getAllStorageKeys() {
  try { return Object.keys(localStorage); } catch { return []; }
}
export function getKeysByPrefix(prefix) { return getAllStorageKeys().filter(k => k.startsWith(prefix)); }
export function loadAllByPrefix(prefix) { return getKeysByPrefix(prefix).map(key => loadFromStorage(key)).filter(Boolean); }
export const storageGet = loadFromStorage;
export const storageSet = saveToStorage;
export function initializeStorage() {
  if (!loadFromStorage('settings')) saveToStorage('settings', getDefaultSettings());
  if (!loadFromStorage('employees')) saveToStorage('employees', getDefaultEmployees());
  if (!loadFromStorage('menu')) saveToStorage('menu', []);
}
function getDefaultSettings() {
  return {
    ownerEmail: 'support@quezcoffeeco.com',
    emailjs: { serviceId: 'service_jzq67sk', templateId: 'template_lnzie8o', publicKey: 'v9toXIIf8FeSesHd4' },
    language: 'en',
    locations: ['Council Bluffs'],
    defaultLocation: 'Council Bluffs',
    openingUnlockTime: '05:00',
    closingUnlockTime: '14:00',
    timeLockDisabled: false,
    timeLocks: {
      openingLockEnabled: true,
      openingUnlockTime: '05:00',
      closingLockEnabled: true,
      closingUnlockTime: '14:00',
    },
  };
}
function getDefaultEmployees() {
  return [{ id: 'owner-ryan', name: 'Ryan Rodriguez', role: 'owner', pin: '1943', active: true, trainingBypass: false }];
}
export function getSettings() {
  const saved = loadFromStorage('settings');
  if (!saved) return getDefaultSettings();
  if (!saved.emailjs) saved.emailjs = { serviceId: '', templateId: '', publicKey: '' };
  if (!saved.timeLocks) saved.timeLocks = { openingLockEnabled: true, openingUnlockTime: '05:00', closingLockEnabled: true, closingUnlockTime: '14:00' };
  return saved;
}
export function saveSettings(settings) { saveToStorage('settings', settings); }
export function getSession() { return loadFromStorage('currentSession'); }
export function setSession(employeeData) {
  saveToStorage('currentSession', employeeData);
  saveToStorage('currentClockIn', { name: employeeData.name, role: employeeData.role, location: employeeData.location || 'Council Bluffs', clockInTime: new Date().toISOString() });
}
export function clearSession() { removeFromStorage('currentSession'); removeFromStorage('currentClockIn'); }
export function getEmployees() { return loadFromStorage('employees') || []; }
export function saveEmployees(employees) { saveToStorage('employees', employees); }
export function getActiveEmployees() { return getEmployees().filter(e => e.active !== false); }
export function getPinLockout(employeeId) { return loadFromStorage(`pinLockout_${employeeId}`) || null; }
export function setPinLockout(employeeId, data) { saveToStorage(`pinLockout_${employeeId}`, data); }
export function clearPinLockout(employeeId) { removeFromStorage(`pinLockout_${employeeId}`); }
export function getTodayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function addClockInRecord(record) {
  const key = `clockIns_${getTodayKey()}`;
  const existing = loadFromStorage(key) || [];
  existing.push({ ...record, timestamp: new Date().toISOString() });
  saveToStorage(key, existing);
}
export function getClockInsForToday() { return loadFromStorage(`clockIns_${getTodayKey()}`) || []; }
export function getMenu() { return loadFromStorage('menu') || []; }
export function saveMenu(menu) { saveToStorage('menu', menu); }
