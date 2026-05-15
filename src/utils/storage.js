// ============================================================
// QUEZ APP LITE — Storage Utility (Complete / Unified)
// All function names from all sessions preserved.
// DO NOT replace without merging all exports.
// ============================================================
 
const SETTINGS_KEY      = 'quez_settings';
const SESSION_KEY       = 'quez_session';
const EMPLOYEES_KEY     = 'quez_employees';
const MENU_KEY          = 'quez_menu_items';
const LOCKOUT_KEY       = 'quez_pin_lockout';
const PUNCHES_KEY       = 'quez_time_punches';
const DAILY_REC_KEY     = 'quez_daily_checklist_records';
const DAILY_SUB_KEY     = 'quez_daily_submitted';
const CHECKLIST_STATE_KEY = 'quez_checklist_state';
const DRINK_CNT_KEY     = 'quez_drink_count_records';
const FLAGGED_KEY       = 'quez_flagged_items';
const APP_ACCESS_KEY    = 'quez_app_access';
const INCOMPLETE_SENT_KEY = 'quez_incomplete_alert_sent';
 
// ── Default settings ──────────────────────────────────────
const DEFAULT_SETTINGS = {
  ownerEmail: 'support@quezcoffeeco.com',
  emailjs: { serviceId: '', templateId: '', publicKey: '' },
  locations: ['Council Bluffs — Main'],
  timeLocks: {
    openingLockEnabled: true,
    openingUnlockTime: '05:30',
    closingLockEnabled: true,
    closingUnlockTime: '13:00',
  },
  language: 'en',
};
 
const DEFAULT_EMPLOYEES = [
  {
    id: 'emp_ryan',
    name: 'Ryan Rodriquez',
    role: 'owner',
    pin: '1943',
    active: true,
    trainingBypass: true,
  },
];
 
// ── Core primitives ───────────────────────────────────────
 
export const storageGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch { return null; }
};
 
export const storageSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[Quez] localStorage write failed:', e);
  }
};
 
export const storageRemove = (key) => {
  try { localStorage.removeItem(key); } catch {}
};
 
export const loadFromStorage = (key, fallback = null) => storageGet(key) ?? fallback;
export const saveToStorage = (key, value) => storageSet(key, value);
 
// ── Initialize on first launch ────────────────────────────
export const initializeStorage = () => {
  if (!storageGet(SETTINGS_KEY)) storageSet(SETTINGS_KEY, DEFAULT_SETTINGS);
  if (!storageGet(EMPLOYEES_KEY)) storageSet(EMPLOYEES_KEY, DEFAULT_EMPLOYEES);
  if (!storageGet(MENU_KEY)) storageSet(MENU_KEY, []);
};
 
// ── Settings ──────────────────────────────────────────────
export const getSettings = () => {
  const stored = storageGet(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  if (!stored.timeLocks) stored.timeLocks = DEFAULT_SETTINGS.timeLocks;
  if (!stored.emailjs) stored.emailjs = DEFAULT_SETTINGS.emailjs;
  return stored;
};
export const saveSettings = (settings) => storageSet(SETTINGS_KEY, settings);
export const loadSettings = getSettings;
 
// ── Employees ─────────────────────────────────────────────
export const getEmployees = () => storageGet(EMPLOYEES_KEY) || DEFAULT_EMPLOYEES;
export const saveEmployees = (e) => storageSet(EMPLOYEES_KEY, e);
export const getActiveEmployees = () => getEmployees().filter(e => e.active !== false);
 
// ── Menu ──────────────────────────────────────────────────
export const getMenu = () => storageGet(MENU_KEY) || [];
export const saveMenu = (menu) => storageSet(MENU_KEY, menu);
 
// ── Session ───────────────────────────────────────────────
export const getSession = () => storageGet(SESSION_KEY);
export const setSession = (userData) => {
  storageSet(SESSION_KEY, {
    ...userData,
    clockInTime: userData.clockInTime || new Date().toISOString(),
  });
};
export const clearSession = () => storageRemove(SESSION_KEY);
export const saveCurrentUser = (u) => storageSet(SESSION_KEY, u);
export const loadCurrentUser = () => storageGet(SESSION_KEY);
export const clearCurrentUser = clearSession;
 
// ── PIN Lockout ───────────────────────────────────────────
export const getPinLockout = (employeeId) => {
  const all = storageGet(LOCKOUT_KEY) || {};
  return all[employeeId] || null;
};
export const setPinLockout = (employeeId, data) => {
  const all = storageGet(LOCKOUT_KEY) || {};
  all[employeeId] = data;
  storageSet(LOCKOUT_KEY, all);
};
export const clearPinLockout = (employeeId) => {
  const all = storageGet(LOCKOUT_KEY) || {};
  delete all[employeeId];
  storageSet(LOCKOUT_KEY, all);
};
 
// ── Time Punches ──────────────────────────────────────────
// Each punch: { employeeId, name, role, location, clockInTime, clockOutTime, date, autoClose, sent }
 
export const getPunches = () => storageGet(PUNCHES_KEY) || [];
export const savePunches = (punches) => storageSet(PUNCHES_KEY, punches);
 
/** Record a clock-in punch */
export const recordClockIn = ({ employeeId, name, role, location, clockInTime }) => {
  const punches = getPunches();
  punches.push({
    employeeId,
    name,
    role,
    location,
    clockInTime: clockInTime || new Date().toISOString(),
    clockOutTime: null,
    date: new Date().toLocaleDateString('en-US'),
    autoClose: false,
    sent: false,
  });
  savePunches(punches);
};
 
/** Record a clock-out on the most recent open punch for this employee */
export const recordClockOut = ({ employeeId, name, role, location, clockInTime, clockOutTime }) => {
  const punches = getPunches();
  // Find last open punch for this employee
  let found = false;
  for (let i = punches.length - 1; i >= 0; i--) {
    if (punches[i].employeeId === employeeId && !punches[i].clockOutTime) {
      punches[i].clockOutTime = clockOutTime || new Date().toISOString();
      found = true;
      break;
    }
  }
  // If no open punch found, create a complete one
  if (!found) {
    punches.push({
      employeeId,
      name,
      role,
      location,
      clockInTime: clockInTime || new Date().toISOString(),
      clockOutTime: clockOutTime || new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US'),
      autoClose: false,
      sent: false,
    });
  }
  savePunches(punches);
};
 
/** Legacy alias used by LoginScreen */
export const addClockInRecord = ({ employeeId, name, role, location, clockInTime }) =>
  recordClockIn({ employeeId, name, role, location, clockInTime });
 
export const saveClockInRecord = ({ name, role, location }) =>
  recordClockIn({ name, role, location });
 
export const saveClockOutRecord = (index, clockOutTime) => {
  const punches = getPunches();
  if (punches[index]) punches[index].clockOutTime = clockOutTime;
  savePunches(punches);
};
 
export const loadTodayClockRecords = () => {
  const today = new Date().toLocaleDateString('en-US');
  return getPunches().filter(p => p.date === today);
};
 
/** Check if employee has an open (clocked-in, not clocked-out) punch today */
export const hasOpenPunchToday = (employeeId) => {
  const today = new Date().toLocaleDateString('en-US');
  const punches = getPunches();
  return punches.some(
    p => p.employeeId === employeeId && p.date === today && !p.clockOutTime
  );
};
 
/** Check if employee has any punch today (open or closed) */
export const hasPunchToday = (employeeId) => {
  const today = new Date().toLocaleDateString('en-US');
  return getPunches().some(p => p.employeeId === employeeId && p.date === today);
};
 
/** Get all unsent punches for time clock report */
export const getUnsentPunches = () => getPunches().filter(p => !p.sent);
 
/** Mark punches as sent */
export const markPunchesSent = (beforeDate) => {
  const punches = getPunches();
  const updated = punches.map(p => {
    if (!p.sent && p.clockOutTime) {
      return { ...p, sent: true };
    }
    return p;
  });
  savePunches(updated);
};
 
/**
 * Auto-close orphaned punches from yesterday or earlier.
 * Called on every app open.
 * Sets clockOutTime to 23:59 of that day, flags autoClose = true.
 */
export const autoCloseOrphanedPunches = () => {
  const today = new Date().toLocaleDateString('en-US');
  const punches = getPunches();
  let changed = false;
 
  const updated = punches.map(p => {
    if (!p.clockOutTime && p.date !== today) {
      // Build 11:59 PM timestamp for that date
      const closeTime = new Date(p.date);
      closeTime.setHours(23, 59, 0, 0);
      changed = true;
      return {
        ...p,
        clockOutTime: closeTime.toISOString(),
        autoClose: true,
      };
    }
    return p;
  });
 
  if (changed) savePunches(updated);
};
 
// ── Global Checklist State (persisted across user sessions) ──
// Saved against today's date so it resets each day automatically.
 
const checklistStateKey = () => {
  const d = new Date();
  return `${CHECKLIST_STATE_KEY}_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
};
 
export const saveChecklistState = (state) => {
  storageSet(checklistStateKey(), state);
};
 
export const loadChecklistState = () => {
  return storageGet(checklistStateKey()) || {
    values: {},
    sectionStartTimes: {},
    sectionSubmitted: { opening: false, mid: false, closing: false },
  };
};
 
// ── Daily checklist submission tracking ───────────────────
const todaySubmitKey = () => {
  const d = new Date();
  return `${DAILY_SUB_KEY}_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
};
 
export const markDailyChecklistSubmitted = (operator, location) => {
  storageSet(todaySubmitKey(), {
    submitted: true, operator, location,
    timestamp: new Date().toISOString(),
  });
};
 
export const isDailyChecklistSubmittedToday = () => {
  return storageGet(todaySubmitKey())?.submitted === true;
};
 
export const saveDailyChecklistRecord = (record) => {
  const existing = storageGet(DAILY_REC_KEY) || [];
  existing.push(record);
  storageSet(DAILY_REC_KEY, existing);
};
 
export const loadDailyChecklistRecords = () => storageGet(DAILY_REC_KEY) || [];
 
// ── App access tracking ───────────────────────────────────
// Records each day the app was opened — used by incomplete checklist check.
 
export const recordAppAccess = () => {
  const today = new Date().toLocaleDateString('en-US');
  const access = storageGet(APP_ACCESS_KEY) || {};
  access[today] = true;
  storageSet(APP_ACCESS_KEY, access);
};
 
export const wasAppAccessedOn = (dateStr) => {
  const access = storageGet(APP_ACCESS_KEY) || {};
  return access[dateStr] === true;
};
 
// ── Incomplete checklist check ────────────────────────────
// Called on app open. Checks if yesterday's checklist was incomplete.
// If the app was accessed yesterday but any section wasn't submitted,
// sends an alert. Only fires once per day.
 
export const checkAndSendIncompleteAlert = () => {
  // Record today's access
  recordAppAccess();
 
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-US');
 
  // Only check if app was accessed yesterday
  if (!wasAppAccessedOn(yesterdayStr)) return;
 
  // Check if alert already sent today
  const alertSentKey = `${INCOMPLETE_SENT_KEY}_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
  if (storageGet(alertSentKey)) return;
 
  // Check yesterday's submission status
  const yKey = `${DAILY_SUB_KEY}_${yesterday.getFullYear()}_${yesterday.getMonth() + 1}_${yesterday.getDate()}`;
  const yState = storageGet(yKey);
 
  // Get yesterday's checklist state to see which sections were done
  const yChecklistKey = `${CHECKLIST_STATE_KEY}_${yesterday.getFullYear()}_${yesterday.getMonth() + 1}_${yesterday.getDate()}`;
  const yChecklist = storageGet(yChecklistKey);
 
  if (!yChecklist) return; // App was accessed but checklist never touched
 
  const submitted = yChecklist.sectionSubmitted || {};
  const incomplete = [];
  if (!submitted.opening) incomplete.push('Opening');
  if (!submitted.mid) incomplete.push('Mid-Service');
  if (!submitted.closing) incomplete.push('Closing');
 
  if (incomplete.length === 0) return; // All done, no alert needed
 
  // Mark alert as sent for today
  storageSet(alertSentKey, true);
 
  // Import and send — dynamic to avoid circular dependency
  import('./emailjs').then(({ sendQuezEmail }) => {
    sendQuezEmail({
      subject: `⚠ Incomplete Checklist — ${yesterdayStr}`,
      templateParams: {
        event_type: 'Incomplete Checklist Alert',
        employee_name: 'System',
        location: 'All Locations',
        date: yesterdayStr,
        message: `INCOMPLETE CHECKLIST ALERT\n═══════════════════════════════\nDate: ${yesterdayStr}\n\nThe following checklist sections were NOT submitted yesterday:\n${incomplete.map(s => `  • ${s}`).join('\n')}\n\nThe app was accessed on this date but these sections were left incomplete.\n═══════════════════════════════\nQuez Coffee Co. — Auto-Generated`,
      },
    });
  });
};
 
// ── Time clock report ─────────────────────────────────────
export const buildTimeClockReport = () => {
  const unsent = getUnsentPunches().filter(p => p.clockOutTime); // only complete punches
 
  if (!unsent.length) return null;
 
  const lines = unsent.map(p => {
    const inTime = new Date(p.clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const outTime = new Date(p.clockOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const ms = new Date(p.clockOutTime) - new Date(p.clockInTime);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
    const flag = p.autoClose ? ' ⚠ AUTO-CLOSED (no clock-out recorded)' : '';
    return `  ${p.date} | ${p.name} (${p.role}) | In: ${inTime} | Out: ${outTime} | ${duration}${flag}`;
  });
 
  const firstDate = unsent[0]?.date || '';
  const lastDate = unsent[unsent.length - 1]?.date || '';
 
  return {
    subject: `[Quez] Time Clock Report — ${firstDate} to ${lastDate}`,
    body: `TIME CLOCK REPORT\n═══════════════════════════════\nPeriod: ${firstDate} → ${lastDate}\nTotal Punches: ${unsent.length}\n\n${lines.join('\n')}\n═══════════════════════════════\nQuez Coffee Co. — Auto-Generated`,
    count: unsent.length,
  };
};
 
// ── Flagged items ─────────────────────────────────────────
export const saveFlaggedItem = (item) => {
  const existing = storageGet(FLAGGED_KEY) || [];
  existing.push({ ...item, date: new Date().toLocaleDateString('en-US') });
  storageSet(FLAGGED_KEY, existing);
};
 
export const loadTodayFlaggedItems = () => {
  const today = new Date().toLocaleDateString('en-US');
  return (storageGet(FLAGGED_KEY) || []).filter(f => f.date === today);
};
 
// ── Drink count records ───────────────────────────────────
export const saveDrinkCountRecord = (record) => {
  const existing = storageGet(DRINK_CNT_KEY) || [];
  existing.push(record);
  storageSet(DRINK_CNT_KEY, existing);
};
export const loadDrinkCountRecords = () => storageGet(DRINK_CNT_KEY) || [];
export const loadTodayDrinkCount = () => {
  const today = new Date().toLocaleDateString('en-US');
  return (storageGet(DRINK_CNT_KEY) || []).filter(r => r.date === today);
};
 
// ── Time lock check ───────────────────────────────────────
export const isSectionUnlocked = (section) => {
  const settings = getSettings();
  const tl = settings.timeLocks || DEFAULT_SETTINGS.timeLocks;
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (section === 'opening') {
    if (!tl.openingLockEnabled) return true;
    return hhmm >= (tl.openingUnlockTime || '05:30');
  }
  if (section === 'closing') {
    if (!tl.closingLockEnabled) return true;
    return hhmm >= (tl.closingUnlockTime || '13:00');
  }
  return true;
};