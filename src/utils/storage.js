// ============================================================
// QUEZ APP LITE — Storage Utility (Complete / Unified)
// Sessions 1–7. All function names preserved.
// DO NOT replace without merging all exports.
// ============================================================
 
const SETTINGS_KEY        = 'quez_settings';
const SESSION_KEY         = 'quez_session';
const EMPLOYEES_KEY       = 'quez_employees';
const MENU_KEY            = 'quez_menu_items';
const LOCKOUT_KEY         = 'quez_pin_lockout';
const PUNCHES_KEY         = 'quez_time_punches';
const DAILY_REC_KEY       = 'quez_daily_checklist_records';
const DAILY_SUB_KEY       = 'quez_daily_submitted';
const CHECKLIST_STATE_KEY = 'quez_checklist_state';
const DRINK_CNT_KEY       = 'quez_drink_count_records';
const FLAGGED_KEY         = 'quez_flagged_items';
const APP_ACCESS_KEY      = 'quez_app_access';
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

// ── Guest user (browse-only preview, no PIN, never persisted to employees) ──
// Triggered from the LoginScreen "Continue as Guest" button. When this user
// is the session, AppContext intercepts localStorage.setItem and drops every
// write outside a tiny allowlist — so nothing the Guest does affects real
// data. Not added to DEFAULT_EMPLOYEES so they never appear in dropdowns,
// the trainer list, the Settings → Employees screen, etc.
export const GUEST_USER = Object.freeze({
  id: 'emp_guest',
  name: 'Guest',
  role: 'barista',
  pin: null,
  active: true,
  guest: true,
  trainingBypass: true,
});
 
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
  // One-time spelling fix: owner's surname is Rodriquez (Q), not Rodriguez (G).
  const employees = storageGet(EMPLOYEES_KEY);
  if (Array.isArray(employees)) {
    let changed = false;
    employees.forEach((e) => {
      if (e && typeof e.name === 'string' && e.name.includes('Rodriguez')) {
        e.name = e.name.replace(/Rodriguez/g, 'Rodriquez');
        changed = true;
      }
    });
    if (changed) storageSet(EMPLOYEES_KEY, employees);
  }
  // Self-heal: ensure at least one active owner exists. If somebody removed
  // Ryan or never had an owner record (e.g. partial restore from backup),
  // the seeded owner gets re-added. Without this the trainer dropdown in
  // Training Portal + Settings would be empty and trainees can't be signed off.
  const empsCheck = storageGet(EMPLOYEES_KEY);
  if (Array.isArray(empsCheck)) {
    const hasActiveOwner = empsCheck.some((e) => e && e.role === 'owner' && e.active !== false);
    if (!hasActiveOwner) {
      empsCheck.push(DEFAULT_EMPLOYEES[0]);
      storageSet(EMPLOYEES_KEY, empsCheck);
    }
  }
  // Cleanup orphaned training records saved before AppContext exposed currentUser.
  try { localStorage.removeItem('quez_training_undefined'); } catch {}
  try { localStorage.removeItem('quez_phase2_progress_undefined'); } catch {}
  try { localStorage.removeItem('quez_phase3_progress_undefined'); } catch {}
  // Every employee must have a PIN. Anyone missing one gets '0000' + mustChangePin flag.
  // Also back-fill trainerId where only trainerName exists.
  const emps2 = storageGet(EMPLOYEES_KEY);
  if (Array.isArray(emps2)) {
    let changed = false;
    const byName = new Map(emps2.filter((e) => e && e.name).map((e) => [e.name, e.id]));
    emps2.forEach((e) => {
      if (!e) return;
      if (!e.pin || !/^\d{4}$/.test(String(e.pin))) {
        e.pin = '0000';
        e.mustChangePin = true;
        changed = true;
      }
      if (e.pin === '0000' && e.mustChangePin === undefined) {
        e.mustChangePin = true;
        changed = true;
      }
      // Trainer id back-fill from legacy trainerName
      if (!e.trainerId && e.trainerName) {
        const tid = byName.get(e.trainerName);
        if (tid) {
          e.trainerId = tid;
          changed = true;
        }
      }
    });
    if (changed) storageSet(EMPLOYEES_KEY, emps2);
  }
};

// Update a single employee record (merges patch into existing fields)
export function updateEmployee(employeeId, patch) {
  const list = getEmployees();
  const idx = list.findIndex((e) => e.id === employeeId);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  saveEmployees(list);
  return list[idx];
}
 
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
export const getPunches = () => storageGet(PUNCHES_KEY) || [];
export const savePunches = (punches) => storageSet(PUNCHES_KEY, punches);
 
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
 
export const recordClockOut = ({ employeeId, name, role, location, clockInTime, clockOutTime }) => {
  const punches = getPunches();
  let found = false;
  for (let i = punches.length - 1; i >= 0; i--) {
    if (punches[i].employeeId === employeeId && !punches[i].clockOutTime) {
      punches[i].clockOutTime = clockOutTime || new Date().toISOString();
      found = true;
      break;
    }
  }
  if (!found) {
    punches.push({
      employeeId, name, role, location,
      clockInTime: clockInTime || new Date().toISOString(),
      clockOutTime: clockOutTime || new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US'),
      autoClose: false,
      sent: false,
    });
  }
  savePunches(punches);
};
 
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
 
export const hasOpenPunchToday = (employeeId) => {
  const today = new Date().toLocaleDateString('en-US');
  return getPunches().some(
    p => p.employeeId === employeeId && p.date === today && !p.clockOutTime
  );
};
 
export const hasPunchToday = (employeeId) => {
  const today = new Date().toLocaleDateString('en-US');
  return getPunches().some(p => p.employeeId === employeeId && p.date === today);
};
 
export const getUnsentPunches = () => getPunches().filter(p => !p.sent);
 
export const markPunchesSent = () => {
  const punches = getPunches();
  const updated = punches.map(p => {
    if (!p.sent && p.clockOutTime) return { ...p, sent: true };
    return p;
  });
  savePunches(updated);
};
 
export const autoCloseOrphanedPunches = () => {
  const today = new Date().toLocaleDateString('en-US');
  const punches = getPunches();
  let changed = false;
  const updated = punches.map(p => {
    if (!p.clockOutTime && p.date !== today) {
      const closeTime = new Date(p.date);
      closeTime.setHours(23, 59, 0, 0);
      changed = true;
      return { ...p, clockOutTime: closeTime.toISOString(), autoClose: true };
    }
    return p;
  });
  if (changed) savePunches(updated);
};
 
// ── Checklist State ───────────────────────────────────────
const checklistStateKey = () => {
  const d = new Date();
  return `${CHECKLIST_STATE_KEY}_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
};
 
export const saveChecklistState = (state) => storageSet(checklistStateKey(), state);
 
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
 
// ── Incomplete checklist alert ────────────────────────────
export const checkAndSendIncompleteAlert = () => {
  recordAppAccess();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-US');
  if (!wasAppAccessedOn(yesterdayStr)) return;
  const alertSentKey = `${INCOMPLETE_SENT_KEY}_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
  if (storageGet(alertSentKey)) return;
  const yChecklistKey = `${CHECKLIST_STATE_KEY}_${yesterday.getFullYear()}_${yesterday.getMonth() + 1}_${yesterday.getDate()}`;
  const yChecklist = storageGet(yChecklistKey);
  if (!yChecklist) return;
  const submitted = yChecklist.sectionSubmitted || {};
  const incomplete = [];
  if (!submitted.opening) incomplete.push('Opening');
  if (!submitted.mid) incomplete.push('Mid-Service');
  if (!submitted.closing) incomplete.push('Closing');
  if (incomplete.length === 0) return;
  storageSet(alertSentKey, true);
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
  const unsent = getUnsentPunches().filter(p => p.clockOutTime);
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
 
// ============================================================
// SESSION 6 — Periodic Checklist Functions
// ============================================================
 
// ── ISO week helper ───────────────────────────────────────
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
 
function getQuarter(date) {
  return Math.floor(date.getMonth() / 3) + 1;
}
 
// ── Key builders ──────────────────────────────────────────
export const weeklyKey = (date = new Date()) => {
  const week = getISOWeek(date);
  return `quez_weekly_submitted_${date.getFullYear()}_W${String(week).padStart(2, '0')}`;
};
 
export const monthlyKey = (date = new Date()) => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `quez_monthly_submitted_${date.getFullYear()}_${mm}`;
};
 
export const quarterlyKey = (date = new Date()) => {
  return `quez_quarterly_submitted_${date.getFullYear()}_Q${getQuarter(date)}`;
};
 
export const annualKey = (date = new Date()) => {
  return `quez_annual_submitted_${date.getFullYear()}`;
};
 
// ── Due today? — config-aware ─────────────────────────────
// Owner can override the natural cadence in Settings → Periodic Schedule.
// Defaults (when no override): weekly Mon, monthly 1st, quarterly 1st of Jan/Apr/Jul/Oct, annual Jan 1.
export const DEFAULT_PERIODIC_DUE = {
  weekly:    { dow: 1 },                              // 0=Sun, 1=Mon, ..., 6=Sat
  monthly:   { dom: 1 },                              // 1–28
  quarterly: { dom: 1, months: [0, 3, 6, 9] },        // 1st of Jan/Apr/Jul/Oct
  annual:    { month: 0, day: 1 },                    // Jan 1
};

export function getPeriodicDueConfig() {
  const s = getSettings();
  const cfg = s.periodicDue || {};
  return {
    weekly:    { ...DEFAULT_PERIODIC_DUE.weekly,    ...(cfg.weekly    || {}) },
    monthly:   { ...DEFAULT_PERIODIC_DUE.monthly,   ...(cfg.monthly   || {}) },
    quarterly: { ...DEFAULT_PERIODIC_DUE.quarterly, ...(cfg.quarterly || {}) },
    annual:    { ...DEFAULT_PERIODIC_DUE.annual,    ...(cfg.annual    || {}) },
  };
}

export function savePeriodicDueConfig(patch) {
  const s = getSettings();
  const cur = s.periodicDue || {};
  saveSettings({ ...s, periodicDue: { ...cur, ...patch } });
}

export const isWeeklyChecklistDue = () => {
  const cfg = getPeriodicDueConfig().weekly;
  return new Date().getDay() === cfg.dow;
};

export const isMonthlyChecklistDue = () => {
  const cfg = getPeriodicDueConfig().monthly;
  return new Date().getDate() === cfg.dom;
};

export const isQuarterlyChecklistDue = () => {
  const cfg = getPeriodicDueConfig().quarterly;
  const d = new Date();
  return d.getDate() === cfg.dom && (cfg.months || []).includes(d.getMonth());
};

export const isAnnualChecklistDue = () => {
  const cfg = getPeriodicDueConfig().annual;
  const d = new Date();
  return d.getMonth() === cfg.month && d.getDate() === cfg.day;
};
 
// ── Already submitted? ────────────────────────────────────
export const isWeeklySubmittedThisWeek = () =>
  localStorage.getItem(weeklyKey()) === 'true';
 
export const isMonthlySubmittedThisMonth = () =>
  localStorage.getItem(monthlyKey()) === 'true';
 
export const isQuarterlySubmittedThisQuarter = () =>
  localStorage.getItem(quarterlyKey()) === 'true';
 
export const isAnnualSubmittedThisYear = () =>
  localStorage.getItem(annualKey()) === 'true';
 
// ── Mark submitted ────────────────────────────────────────
export const markWeeklySubmitted = () =>
  localStorage.setItem(weeklyKey(), 'true');
 
export const markMonthlySubmitted = () =>
  localStorage.setItem(monthlyKey(), 'true');
 
export const markQuarterlySubmitted = () =>
  localStorage.setItem(quarterlyKey(), 'true');
 
export const markAnnualSubmitted = () =>
  localStorage.setItem(annualKey(), 'true');
 
// ── Periodic checklist records ────────────────────────────
export const savePeriodicChecklistRecord = (record) => {
  const key = 'quez_periodic_checklist_records';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(record);
  localStorage.setItem(key, JSON.stringify(existing));
};
 
export const getPeriodicChecklistRecords = () => {
  return JSON.parse(localStorage.getItem('quez_periodic_checklist_records') || '[]');
};

// ============================================================
// SESSION 7 — Training Portal Functions
// ============================================================

const TRAINING_KEY_PREFIX = 'quez_training_';
const QUIZ_LOCKOUT_PREFIX  = 'quez_quiz_lockout_';

// ── Training record helpers ───────────────────────────────

export const getTrainingRecord = (employeeId) => {
  const raw = localStorage.getItem(TRAINING_KEY_PREFIX + employeeId);
  return raw ? JSON.parse(raw) : {
    phase1: { passed: false, date: null },
    phase2: { passed: false, date: null, trainerName: null },
    phase3: { passed: false, date: null, trainerName: null },
  };
};

export const saveTrainingRecord = (employeeId, record) => {
  localStorage.setItem(TRAINING_KEY_PREFIX + employeeId, JSON.stringify(record));
};

export const markPhase1Complete = (employeeId) => {
  const record = getTrainingRecord(employeeId);
  record.phase1 = { passed: true, date: new Date().toISOString() };
  saveTrainingRecord(employeeId, record);
};



export const isPhase1Complete = (employeeId) =>
  getTrainingRecord(employeeId).phase1.passed === true;

export const isPhase2Complete = (employeeId) =>
  getTrainingRecord(employeeId).phase2.passed === true;

export const isPhase3Complete = (employeeId) =>
  getTrainingRecord(employeeId).phase3.passed === true;

// ── Quiz lockout helpers ──────────────────────────────────
// Unlimited attempts policy: lockout is disabled app-wide. The setters
// are no-ops and getQuizLockoutInfo always reports unlocked. Any
// previously-written lockout key is cleared on read so trainees who
// were locked when this shipped immediately get a retry.

export const setQuizLockout = (employeeId) => {
  // No-op — unlimited quiz attempts. Still clear any stale lockout
  // key for this employee so they're not held under the old policy.
  localStorage.removeItem(QUIZ_LOCKOUT_PREFIX + employeeId);
};

export const clearQuizLockout = (employeeId) => {
  localStorage.removeItem(QUIZ_LOCKOUT_PREFIX + employeeId);
};

export const getQuizLockoutInfo = (employeeId) => {
  // Always unlocked. Clean up any old lockout key on the way through.
  if (employeeId) localStorage.removeItem(QUIZ_LOCKOUT_PREFIX + employeeId);
  return { isLocked: false, remainingHours: 0, remainingMinutes: 0 };
};

// ── Training bypass — applies to employee on login / app load ─

export const applyTrainingBypassIfEnabled = (employee) => {
  if (!employee?.trainingBypass) return;
  const record = getTrainingRecord(employee.id);
  let changed = false;
  if (!record.phase1.passed) {
    record.phase1 = { passed: true, date: new Date().toISOString(), bypassed: true };
    changed = true;
  }
  if (!record.phase2.passed) {
    record.phase2 = { passed: true, date: new Date().toISOString(), trainerName: 'Owner Bypass', bypassed: true };
    changed = true;
  }
  if (!record.phase3.passed) {
    record.phase3 = { passed: true, date: new Date().toISOString(), trainerName: 'Owner Bypass', bypassed: true };
    changed = true;
  }
  if (changed) saveTrainingRecord(employee.id, record);
};


// ─────────────────────────────────────────────────────────────────────────────
// SESSION 8 ADDITIONS
// ─────────────────────────────────────────────────────────────────────────────

export function markPhase2Complete(employeeId, trainerName) {
  const record = getTrainingRecord(employeeId);
  record.phase2 = {
    passed: true,
    date: new Date().toISOString(),
    trainerName: trainerName || 'Unknown',
    bypassed: record.phase2?.bypassed || false,
  };
  saveTrainingRecord(employeeId, record);
}

export function markPhase3Complete(employeeId, trainerName) {
  const record = getTrainingRecord(employeeId);
  record.phase3 = {
    passed: true,
    date: new Date().toISOString(),
    trainerName: trainerName || 'Unknown',
    bypassed: record.phase3?.bypassed || false,
  };
  saveTrainingRecord(employeeId, record);
}

export function approveTraineeRoleUpgrade(employeeId, approverName) {
  const employees = getEmployees();
  const idx = employees.findIndex((e) => e.id === employeeId);
  if (idx === -1) return { success: false, message: 'Employee not found' };
  const employee = employees[idx];
  const previousRole = employee.role;
  employees[idx] = {
    ...employee,
    role: 'barista',
    trainingApprovedBy: approverName,
    trainingApprovedDate: new Date().toISOString(),
    previousRole,
  };
  saveEmployees(employees);
  const record = getTrainingRecord(employeeId);
  record.roleUpgraded = true;
  record.roleUpgradeDate = new Date().toISOString();
  record.roleUpgradeApprovedBy = approverName;
  record.roleUpgradedFrom = previousRole;
  saveTrainingRecord(employeeId, record);
  logAudit('role_upgrade', { employeeName: employee.name, from: previousRole, to: 'barista', byName: approverName });
  return { success: true, message: `${employee.name} approved and upgraded to Barista.` };
}

export function getAllTrainingRecords() {
  const employees = getEmployees();
  const results = [];
  for (const employee of employees) {
    const key = `quez_training_${employee.id}`;
    const raw = localStorage.getItem(key);
    const record = raw ? JSON.parse(raw) : null;
    if (record) results.push({ employee, record });
  }
  return results;
}

export function getTraineesReadyForApproval() {
  const all = getAllTrainingRecords();
  return all.filter(({ employee, record }) => {
    const isTrainee = employee.role === 'trainee';
    const allPhasesComplete =
      record.phase1?.passed && record.phase2?.passed && record.phase3?.passed;
    return isTrainee && allPhasesComplete;
  });
}

export function savePhase2Progress(employeeId, signedSkillIds) {
  const key = `quez_phase2_progress_${employeeId}`;
  localStorage.setItem(key, JSON.stringify({ signedSkillIds, updatedAt: new Date().toISOString() }));
}

export function loadPhase2Progress(employeeId) {
  const key = `quez_phase2_progress_${employeeId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { signedSkillIds: [] };
  try { return JSON.parse(raw); } catch { return { signedSkillIds: [] }; }
}

export function clearPhase2Progress(employeeId) {
  localStorage.removeItem(`quez_phase2_progress_${employeeId}`);
}

export function savePhase3Progress(employeeId, signedDrinkIds) {
  const key = `quez_phase3_progress_${employeeId}`;
  localStorage.setItem(key, JSON.stringify({ signedDrinkIds, updatedAt: new Date().toISOString() }));
}

export function loadPhase3Progress(employeeId) {
  const key = `quez_phase3_progress_${employeeId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { signedDrinkIds: [] };
  try { return JSON.parse(raw); } catch { return { signedDrinkIds: [] }; }
}

export function clearPhase3Progress(employeeId) {
  localStorage.removeItem(`quez_phase3_progress_${employeeId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 10 — ORDER QUEUE + DRINK TALLY
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_ORDERS_KEY = 'quez_active_orders';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function getActiveOrders() {
  const raw = localStorage.getItem(ACTIVE_ORDERS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function saveActiveOrders(orders) {
  localStorage.setItem(ACTIVE_ORDERS_KEY, JSON.stringify(orders));
}

export function addOrder(order) {
  const orders = getActiveOrders();
  orders.push(order);
  saveActiveOrders(orders);
}

export function updateOrderItems(orderId, items) {
  const orders = getActiveOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return;
  orders[idx] = { ...orders[idx], items };
  saveActiveOrders(orders);
}

// Cancel an order without recording any drinks served
export function cancelOrder(orderId) {
  const orders = getActiveOrders().filter((o) => o.id !== orderId);
  saveActiveOrders(orders);
}

// Complete an order: removes from active queue, writes each item to today's drink log,
// and pushes a copy onto today's "completed orders" history (last 50, retrievable for recall).
export function completeOrder(orderId) {
  const orders = getActiveOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;
  const remaining = orders.filter((o) => o.id !== orderId);
  saveActiveOrders(remaining);

  const completedAt = new Date().toISOString();
  const key = `quez_drink_log_${todayKey()}`;
  const raw = localStorage.getItem(key);
  const log = raw ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : [];
  order.items.forEach((it) => {
    log.push({
      drinkId: it.drinkId,
      drinkName: it.drinkName,
      size: it.size,
      prepType: it.prepType,
      modifiers: it.modifiers || [],
      note: it.note || '',
      orderId: order.id,
      orderNumber: order.number,
      takenBy: order.takenBy,
      completedAt,
    });
  });
  localStorage.setItem(key, JSON.stringify(log));

  // Push to completed-order history for recall
  const histKey = `quez_completed_orders_${todayKey()}`;
  const histRaw = localStorage.getItem(histKey);
  const hist = histRaw ? (() => { try { return JSON.parse(histRaw); } catch { return []; } })() : [];
  hist.unshift({ ...order, completedAt });
  if (hist.length > 50) hist.length = 50;
  localStorage.setItem(histKey, JSON.stringify(hist));

  return { ...order, completedAt };
}

export function getTodayDrinkLog() {
  const key = `quez_drink_log_${todayKey()}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// Aggregate today's served drinks into { drinkName: { total, byPrep, bySize } }
export function getTodayDrinkTally() {
  const log = getTodayDrinkLog();
  const tally = {};
  log.forEach((it) => {
    if (!tally[it.drinkName]) {
      tally[it.drinkName] = { total: 0, byPrep: {}, bySize: {} };
    }
    const row = tally[it.drinkName];
    row.total += 1;
    row.byPrep[it.prepType] = (row.byPrep[it.prepType] || 0) + 1;
    row.bySize[it.size]     = (row.bySize[it.size]     || 0) + 1;
  });
  return tally;
}

// Next sequential order number for today (resets at midnight via date-keyed counter)
export function getNextOrderNumber() {
  const counterKey = `quez_order_seq_${todayKey()}`;
  const cur = parseInt(localStorage.getItem(counterKey) || '0', 10);
  const next = cur + 1;
  localStorage.setItem(counterKey, String(next));
  return next;
}

// Build a plain-text daily drink report for email
export function buildDailyDrinkReport() {
  const tally = getTodayDrinkTally();
  const log = getTodayDrinkLog();
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const total = log.length;

  if (total === 0) {
    return {
      subject: `[Quez Daily Drink Report] ${date} — No drinks served`,
      body: `No drinks were logged today.\n\n${date}\n\nQUEZ COFFEE CO. LLC · Council Bluffs, Iowa`,
    };
  }

  const names = Object.keys(tally).sort((a, b) => tally[b].total - tally[a].total);
  const lines = names.map((n) => {
    const row = tally[n];
    const sizes = Object.entries(row.bySize).map(([s, c]) => `${s}: ${c}`).join(' · ');
    const preps = Object.entries(row.byPrep).map(([p, c]) => `${p}: ${c}`).join(' · ');
    return `  ${row.total.toString().padStart(3, ' ')}  ${n}\n        sizes  ${sizes}\n        preps  ${preps}`;
  });

  const body =
    `Daily Drink Report — ${date}\n` +
    `Total drinks served: ${total}\n\n` +
    `By drink:\n${lines.join('\n\n')}\n\n` +
    `QUEZ COFFEE CO. LLC · Council Bluffs, Iowa · Veteran Owned & Operated`;

  return {
    subject: `[Quez Daily Drink Report] ${date} — ${total} drinks`,
    body,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 12 — SCHEDULING
// Weekly schedule by date key (YYYY-MM-DD). One employee can have one shift / day.
// shape: { 'YYYY-MM-DD': [ { id, employeeId, employeeName, start: 'HH:MM', end: 'HH:MM', note } ] }
// ─────────────────────────────────────────────────────────────────────────────

const SCHEDULE_KEY = 'quez_schedule';

export function getSchedule() {
  const raw = localStorage.getItem(SCHEDULE_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function saveSchedule(schedule) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}

export function getShiftsForDate(dateStr) {
  const schedule = getSchedule();
  return schedule[dateStr] || [];
}

export function addShift(dateStr, shift) {
  const schedule = getSchedule();
  const day = schedule[dateStr] || [];
  day.push({ id: 'shf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), ...shift });
  schedule[dateStr] = day;
  saveSchedule(schedule);
}

export function updateShift(dateStr, shiftId, patch) {
  const schedule = getSchedule();
  const day = schedule[dateStr] || [];
  const idx = day.findIndex((s) => s.id === shiftId);
  if (idx === -1) return;
  day[idx] = { ...day[idx], ...patch };
  schedule[dateStr] = day;
  saveSchedule(schedule);
}

export function removeShift(dateStr, shiftId) {
  const schedule = getSchedule();
  const day = (schedule[dateStr] || []).filter((s) => s.id !== shiftId);
  if (day.length === 0) delete schedule[dateStr]; else schedule[dateStr] = day;
  saveSchedule(schedule);
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 15 — DURABILITY: persistent storage, backup, restore, health
// ─────────────────────────────────────────────────────────────────────────────

const LAST_BACKUP_KEY = 'quez_last_backup_at';
const BACKUP_VERSION  = 1;

// Ask the browser to NOT evict our localStorage under disk pressure.
// Chrome auto-grants based on engagement signals; Safari needs user gesture.
// Returns a promise that resolves to true if granted.
export async function requestPersistentStorage() {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    // Check current state first — don't re-prompt unnecessarily
    const already = await navigator.storage.persisted();
    if (already) return true;
    const granted = await navigator.storage.persist();
    return !!granted;
  } catch (e) {
    console.warn('persist() failed:', e);
    return false;
  }
}

export async function isStoragePersistent() {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persisted) return false;
  try { return await navigator.storage.persisted(); } catch { return false; }
}

// Return { usedBytes, quotaBytes, percent, isPersistent, lastBackupAt }
export async function getStorageHealth() {
  let usedBytes = 0;
  let quotaBytes = 0;
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      usedBytes = est.usage || 0;
      quotaBytes = est.quota || 0;
    } catch {}
  }
  // Fallback: approximate from our keys
  if (usedBytes === 0) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('quez_')) {
        usedBytes += (k.length + (localStorage.getItem(k) || '').length) * 2; // UTF-16
      }
    }
  }
  const persistent = await isStoragePersistent();
  return {
    usedBytes,
    quotaBytes,
    percent: quotaBytes > 0 ? Math.round((usedBytes / quotaBytes) * 1000) / 10 : 0,
    isPersistent: persistent,
    lastBackupAt: localStorage.getItem(LAST_BACKUP_KEY) || null,
    autoBackupStatus: getAutoBackupStatus(),
  };
}

// ── Auto-backup config + scheduler ──
// Defaults: weekly + on-closing-checklist + max 1 email per 24h.

const AUTO_BACKUP_DEFAULTS = {
  enabled: true,
  daily: true,              // fires on first app interaction of each new calendar day
  onClosingChecklist: true, // additional belt-and-suspenders trigger at end of business day
};
const LAST_AUTO_BACKUP_KEY = 'quez_last_auto_backup_at';
const AUTO_BACKUP_STATUS_KEY = 'quez_auto_backup_status';
const MAX_AUTOBACKUP_BODY_BYTES = 60_000; // EmailJS free tier safety margin
export const AUTO_BACKUP_BODY_LIMIT = MAX_AUTOBACKUP_BODY_BYTES;

export function getAutoBackupConfig() {
  const s = getSettings();
  return { ...AUTO_BACKUP_DEFAULTS, ...(s.autoBackup || {}) };
}
export function setAutoBackupConfig(patch) {
  const s = getSettings();
  saveSettings({ ...s, autoBackup: { ...getAutoBackupConfig(), ...patch } });
}

export function getLastAutoBackupAt() {
  return localStorage.getItem(LAST_AUTO_BACKUP_KEY) || null;
}

// Persisted status of the last auto-backup attempt — read by Owner Dashboard
// so the operator sees when auto-backup has silently degraded (e.g. bundle now
// exceeds EmailJS body limit, recipient missing, send failed).
// Shape: { state: 'ok'|'too_big'|'failed'|'no_recipients', at, sizeBytes?, error? }
export function getAutoBackupStatus() {
  const raw = localStorage.getItem(AUTO_BACKUP_STATUS_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function setAutoBackupStatus(status) {
  try { localStorage.setItem(AUTO_BACKUP_STATUS_KEY, JSON.stringify(status)); } catch {}
}

// Returns true only if all three EmailJS fields are filled. Used to surface
// configuration gaps in the Owner Dashboard "Data Health" banner.
export function isEmailJsConfigured() {
  const s = getSettings();
  const j = s?.emailjs || {};
  return !!(j.serviceId && j.templateId && j.publicKey);
}

// Snapshot every quez_* key into a versioned bundle
export function buildBackupBundle() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('quez_')) continue;
    data[k] = localStorage.getItem(k);
  }
  return {
    appName: 'Quez Coffee Co. — Lite',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    keyCount: Object.keys(data).length,
    data,
  };
}

// Download the backup as a JSON file via the browser
export function downloadBackup() {
  const bundle = buildBackupBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  a.download = `quez-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  logAudit('backup_exported', { keyCount: bundle.keyCount, byName: 'system' });
}

// Restore from an uploaded backup JSON. mode = 'replace' wipes existing first;
// mode = 'merge' overlays the imported keys without clearing others.
export function restoreFromBundle(bundle, mode = 'replace') {
  if (!bundle || !bundle.data || typeof bundle.data !== 'object') {
    throw new Error('Invalid backup file — missing "data" field.');
  }
  if (bundle.version !== BACKUP_VERSION) {
    // Forward-compat: don't refuse, but warn caller
    console.warn(`Backup version ${bundle.version} differs from current ${BACKUP_VERSION}`);
  }
  if (mode === 'replace') {
    // Wipe all quez_* keys, preserve anything else (in case other apps share origin)
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('quez_')) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }
  Object.entries(bundle.data).forEach(([k, v]) => {
    if (typeof v === 'string') localStorage.setItem(k, v);
  });
  logAudit('backup_restored', { keyCount: Object.keys(bundle.data).length, mode, byName: 'system' });
}

export async function readBackupFile(file) {
  const text = await file.text();
  const bundle = JSON.parse(text);
  if (!bundle || !bundle.data) throw new Error('File is not a valid Quez backup.');
  return bundle;
}

// Send the backup bundle via EmailJS to every configured recipient.
// Bundle is embedded in the body as inline JSON (so the recipient can copy and save).
// If the bundle exceeds the EmailJS body limit, fall back to a "please backup manually" alert email.
export async function sendBackupEmail(reason = 'manual', byName = 'system') {
  // Lazy-import to avoid circular dependency at module load
  const { sendQuezEmail } = await import('./emailjs');

  const bundle = buildBackupBundle();
  const bundleJson = JSON.stringify(bundle);
  const tooBig = bundleJson.length > MAX_AUTOBACKUP_BODY_BYTES;
  const recipients = getReportRecipients();
  if (!recipients || recipients.length === 0) {
    setAutoBackupStatus({ state: 'no_recipients', at: new Date().toISOString(), sizeBytes: bundleJson.length });
    return { sent: false, error: 'No recipients configured' };
  }

  const date = new Date().toISOString();
  const reasonLabel = ({
    manual:           'Manual',
    daily:            'Daily auto-backup',
    closing_checklist:'Closing checklist auto-backup',
    boot:             'Auto-backup',
  })[reason] || reason;

  let subject;
  let message;

  if (tooBig) {
    subject = `[Quez ALERT] Backup too large to email — manual export needed (${date.slice(0,10)})`;
    message =
      `Auto-backup attempted (${reasonLabel}) but the data set has grown beyond the email size limit.\n\n` +
      `Current snapshot size: ${(bundleJson.length / 1024).toFixed(1)} KB\n` +
      `Email body limit: ${(MAX_AUTOBACKUP_BODY_BYTES / 1024).toFixed(0)} KB\n\n` +
      `ACTION REQUIRED: Open the app → Settings → Data & Backup → Export Backup → save the file off-device.\n\n` +
      `QUEZ COFFEE CO. LLC · Council Bluffs, Iowa`;
  } else {
    subject = `[Quez Backup] ${reasonLabel} — ${date.slice(0,10)} ${date.slice(11,16)}`;
    message =
      `Automated backup of all Quez app data.\n` +
      `Reason: ${reasonLabel}\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Keys: ${bundle.keyCount}\n` +
      `Size: ${(bundleJson.length / 1024).toFixed(1)} KB\n\n` +
      `To restore: open the Quez app → Settings → Data & Backup → Import Backup → paste this file or save the email attachment.\n\n` +
      `=== BACKUP BUNDLE (JSON — copy everything between the markers below into a .json file) ===\n` +
      `--- BEGIN ---\n` +
      bundleJson + '\n' +
      `--- END ---\n\n` +
      `QUEZ COFFEE CO. LLC · Council Bluffs, Iowa`;
  }

  try {
    for (const to of recipients) {
      await sendQuezEmail({
        subject,
        templateParams: {
          to_email: to,
          subject,
          message,
          operator: byName,
          location: getSettings()?.locations?.[0] || 'Quez Coffee Co.',
          timestamp: date,
        },
      });
    }
    localStorage.setItem(LAST_AUTO_BACKUP_KEY, date);
    setAutoBackupStatus({
      state: tooBig ? 'too_big' : 'ok',
      at: date,
      sizeBytes: bundleJson.length,
      limitBytes: MAX_AUTOBACKUP_BODY_BYTES,
    });
    logAudit('backup_emailed', { reason, recipients: recipients.length, sizeBytes: bundleJson.length, byName });
    return { sent: true, tooBig, recipients: recipients.length };
  } catch (err) {
    console.warn('Auto-backup email failed:', err);
    setAutoBackupStatus({ state: 'failed', at: new Date().toISOString(), sizeBytes: bundleJson.length, error: err?.message || 'send failed' });
    return { sent: false, error: err.message || 'send failed' };
  }
}

// Fire the auto-backup if enabled and the calendar day has rolled over since last backup.
// Throttle: at most one auto-backup per local calendar day, regardless of how many
// triggers fire. So if Saturday's backup fired at 6 AM Saturday and the user opens
// the app again Saturday at 2 PM — no second send. But the first open Sunday morning
// (or any Sunday interaction) fires the next one. Worst-case data-loss window is
// effectively 24 hours.
export async function maybeAutoBackup(trigger = 'boot') {
  const cfg = getAutoBackupConfig();
  if (!cfg.enabled) return { skipped: true, reason: 'disabled' };

  const last = getLastAutoBackupAt();
  const lastDate = last ? new Date(last).toLocaleDateString() : null;
  const todayDate = new Date().toLocaleDateString();

  // Already backed up today? Skip every trigger.
  if (lastDate === todayDate) return { skipped: true, reason: 'already today' };

  // Two paths to "send now":
  //  - It's a new day and daily is enabled (default behavior, fires on first interaction)
  //  - The closing-checklist trigger fired and onClosingChecklist is enabled
  const newDayDue       = cfg.daily && lastDate !== todayDate;
  const closingTrigger  = trigger === 'closing_checklist' && cfg.onClosingChecklist;

  if (!newDayDue && !closingTrigger) return { skipped: true, reason: 'not due' };

  const reason = closingTrigger ? 'closing_checklist' : 'daily';
  return sendBackupEmail(reason, 'auto');
}

// ── Per-employee dashboard layout (rearrange + hide cards on home) ──
// Layout shape: { order: ['cardId', ...], hidden: ['cardId', ...] }
// Stored on the employee record so it follows the user across devices once we sync.

export function getMyHomeLayout(employeeId) {
  if (!employeeId) return null;
  const emp = getEmployees().find((e) => e.id === employeeId);
  return emp?.homeLayout || null;
}
export function saveMyHomeLayout(employeeId, layout) {
  if (!employeeId) return;
  updateEmployee(employeeId, { homeLayout: layout });
}
export function resetMyHomeLayout(employeeId) {
  if (!employeeId) return;
  updateEmployee(employeeId, { homeLayout: null });
}

export function getMyAdminLayout(employeeId) {
  if (!employeeId) return null;
  const emp = getEmployees().find((e) => e.id === employeeId);
  return emp?.adminLayout || null;
}
export function saveMyAdminLayout(employeeId, layout) {
  if (!employeeId) return;
  updateEmployee(employeeId, { adminLayout: layout });
}
export function resetMyAdminLayout(employeeId) {
  if (!employeeId) return;
  updateEmployee(employeeId, { adminLayout: null });
}

// Pure helpers — apply a layout to a default card order
export function applyLayout(defaultOrder, layout) {
  if (!layout) return { ordered: defaultOrder, hidden: new Set() };
  const known = new Set(defaultOrder);
  // Saved order may have stale ids; filter to ones we know
  const ordered = (layout.order || []).filter((id) => known.has(id));
  // Append any new cards that weren't in saved order (forward-compat when we add new cards)
  defaultOrder.forEach((id) => { if (!ordered.includes(id)) ordered.push(id); });
  return { ordered, hidden: new Set(layout.hidden || []) };
}

export function moveItem(arr, id, direction) {
  const idx = arr.indexOf(id);
  if (idx === -1) return arr.slice();
  const next = arr.slice();
  if (direction === 'up' && idx > 0) {
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  } else if (direction === 'down' && idx < arr.length - 1) {
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  }
  return next;
}

// ── Today's playlist URL (Spotify / Apple Music / YouTube — owner sets in Settings) ──
export function getPlaylistUrl() {
  const s = getSettings();
  return s.playlistUrl || '';
}
export function setPlaylistUrl(url) {
  const s = getSettings();
  saveSettings({ ...s, playlistUrl: (url || '').trim() });
}

// ── Birthdays — birthdays this week (MM-DD match on employee.birthday) ──
export function getBirthdaysThisWeek() {
  const employees = getEmployees().filter((e) => e.active && e.birthday);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const results = [];
  employees.forEach((e) => {
    if (!/^\d{2}-\d{2}$/.test(e.birthday)) return; // expect MM-DD
    const [mm, dd] = e.birthday.split('-').map((n) => parseInt(n, 10));
    for (let probeYear of [today.getFullYear(), today.getFullYear() + 1]) {
      const candidate = new Date(probeYear, mm - 1, dd);
      candidate.setHours(0, 0, 0, 0);
      if (candidate >= today && candidate <= weekEnd) {
        results.push({ employee: e, date: candidate });
        break;
      }
    }
  });
  return results.sort((a, b) => a.date - b.date);
}

// ── Pay period estimate (hours × wage in current week, since last Sunday) ──
export function getMyPayPeriodStats(employeeId) {
  const employees = getEmployees();
  const emp = employees.find((e) => e.id === employeeId);
  const wage = emp?.wagePerHour || 0;
  const punches = storageGet(PUNCHES_KEY) || [];
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - start.getDay());
  let hours = 0;
  let openShiftStart = null;
  punches.forEach((p) => {
    if (p.employeeId !== employeeId) return;
    if (!p.clockInTime) return;
    const inAt = new Date(p.clockInTime);
    if (inAt < start) return;
    if (p.clockOutTime) {
      const ms = new Date(p.clockOutTime) - inAt;
      if (ms > 0) hours += ms / 3600000;
    } else {
      // Open shift — count up to now
      openShiftStart = inAt;
      const ms = Date.now() - inAt.getTime();
      if (ms > 0) hours += ms / 3600000;
    }
  });
  return {
    hours: Math.round(hours * 10) / 10,
    wage,
    estimated: Math.round(hours * wage * 100) / 100,
    onShift: !!openShiftStart,
  };
}

// ── Achievement badges (computed from existing data) ──
export function getMyAchievements(employeeId, name) {
  if (!employeeId || !name) return [];
  const achievements = [];

  // Lifetime drinks made by name
  let lifetimeDrinks = 0;
  Object.keys(localStorage).forEach((k) => {
    if (!k.startsWith('quez_drink_log_')) return;
    try {
      const log = JSON.parse(localStorage.getItem(k) || '[]');
      lifetimeDrinks += log.filter((it) => it.takenBy === name).length;
    } catch {}
  });
  if (lifetimeDrinks >= 1000)      achievements.push({ id: 'd1000', icon: '🏆', label: '1,000 drinks served' });
  else if (lifetimeDrinks >= 500)  achievements.push({ id: 'd500',  icon: '⭐', label: '500 drinks served' });
  else if (lifetimeDrinks >= 100)  achievements.push({ id: 'd100',  icon: '☕', label: '100 drinks served' });
  else if (lifetimeDrinks >= 10)   achievements.push({ id: 'd10',   icon: '✨', label: 'First 10 drinks' });

  // Streak (already computed elsewhere)
  const streak = getCurrentStreak();
  if (streak >= 30)      achievements.push({ id: 's30', icon: '🔥', label: '30-day streak' });
  else if (streak >= 7)  achievements.push({ id: 's7',  icon: '🔥', label: '7-day streak' });
  else if (streak >= 3)  achievements.push({ id: 's3',  icon: '🔥', label: '3-day streak' });

  // Training milestones
  const rec = getTrainingRecord(employeeId);
  if (rec.phase1?.passed && rec.phase2?.passed && rec.phase3?.passed) {
    achievements.push({ id: 'allphases', icon: '🎓', label: 'All 3 phases complete' });
  } else if (rec.phase1?.passed) {
    achievements.push({ id: 'phase1', icon: '📖', label: 'Quiz champion' });
  }

  // Tenure (createdAt on employee record)
  const emp = getEmployees().find((e) => e.id === employeeId);
  if (emp?.createdAt) {
    const days = Math.floor((Date.now() - new Date(emp.createdAt).getTime()) / 86400000);
    if (days >= 365)     achievements.push({ id: 't1yr',  icon: '🎖', label: '1 year at Quez' });
    else if (days >= 30) achievements.push({ id: 't30d', icon: '📅', label: 'First month' });
  }

  return achievements;
}

// ── Weather (open-meteo, no API key, 30-min cache) ──
const WEATHER_KEY = 'quez_weather_cache';
const COUNCIL_BLUFFS = { lat: 41.2619, lon: -95.8608 };

export async function fetchWeather(force = false) {
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null'); } catch { return null; }
  })();
  if (!force && cached && (Date.now() - cached.fetchedAt) < 30 * 60 * 1000) return cached;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${COUNCIL_BLUFFS.lat}&longitude=${COUNCIL_BLUFFS.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=3`;
    const r = await fetch(url);
    const data = await r.json();
    const weather = {
      fetchedAt: Date.now(),
      currentTemp: Math.round(data.current_weather?.temperature || 0),
      currentCode: data.current_weather?.weathercode || 0,
      daily: (data.daily?.time || []).map((d, i) => ({
        date: d,
        high: Math.round(data.daily.temperature_2m_max[i] || 0),
        low:  Math.round(data.daily.temperature_2m_min[i] || 0),
        code: data.daily.weathercode[i] || 0,
        precip: data.daily.precipitation_probability_max?.[i] ?? null,
      })),
    };
    localStorage.setItem(WEATHER_KEY, JSON.stringify(weather));
    return weather;
  } catch (e) {
    console.warn('Weather fetch failed:', e);
    return cached || null;
  }
}

export function weatherCodeToIcon(code) {
  if (code === 0)              return { icon: '☀',  label: 'Clear' };
  if (code <= 2)               return { icon: '⛅', label: 'Partly Cloudy' };
  if (code === 3)              return { icon: '☁',  label: 'Cloudy' };
  if (code >= 45 && code <= 48)return { icon: '🌫', label: 'Fog' };
  if (code >= 51 && code <= 67)return { icon: '🌧', label: 'Rain' };
  if (code >= 71 && code <= 77)return { icon: '❄',  label: 'Snow' };
  if (code >= 80 && code <= 82)return { icon: '🌧', label: 'Showers' };
  if (code >= 95 && code <= 99)return { icon: '⛈', label: 'Storms' };
  return { icon: '🌡', label: 'Weather' };
}

export function weatherDrinkSuggestion(temp) {
  if (temp >= 80) return { en: 'Hot day — push cold brews and frappes. Check ice levels.',  es: 'Día caluroso — empuja cold brew y frappés. Revisa hielo.' };
  if (temp >= 65) return { en: 'Mild day — balanced demand. Iced classics will move well.',  es: 'Día templado — demanda balanceada. Los fríos venderán bien.' };
  if (temp >= 45) return { en: 'Cool day — hot lattes lead. Stock honey syrup, mocha sauce.', es: 'Día fresco — calientes lideran. Abastece miel y mocha.' };
  return                 { en: 'Cold day — hot honey signature drinks are the hero today.', es: 'Día frío — bebidas calientes de miel son las héroes hoy.' };
}

// ── Pre-shift briefing helpers (seasonal drink, today's location) ──
export function getSeasonalDrink() {
  const s = getSettings();
  return s.seasonalDrink || '';
}
export function setSeasonalDrink(text) {
  const s = getSettings();
  saveSettings({ ...s, seasonalDrink: (text || '').trim() });
}
export function getTodayLocation() {
  const s = getSettings();
  return s.todayLocation || '';
}
export function setTodayLocation(text) {
  const s = getSettings();
  saveSettings({ ...s, todayLocation: (text || '').trim() });
}

// ── Daily goal (drinks target) ──
export function getDailyGoal() {
  const s = getSettings();
  const n = parseInt(s.dailyDrinkGoal, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
export function setDailyGoal(n) {
  const s = getSettings();
  saveSettings({ ...s, dailyDrinkGoal: parseInt(n, 10) || 0 });
}

// ── Streak — consecutive days where total drink count ≥ daily goal ──
export function getCurrentStreak() {
  const goal = getDailyGoal();
  if (goal <= 0) return 0;
  let streak = 0;
  for (let i = 1; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `quez_drink_log_${dateKeyCompact(d)}`;
    const raw = localStorage.getItem(key);
    if (!raw) break;
    let log = [];
    try { log = JSON.parse(raw); } catch { break; }
    if (log.length >= goal) streak += 1;
    else break;
  }
  return streak;
}

// ── Shift hand-off notes (rolling, 24h auto-expire on read) ──
const HANDOFF_KEY = 'quez_handoff_notes';

export function getHandoffNotes() {
  const raw = localStorage.getItem(HANDOFF_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    // Filter out notes older than 24h
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const live = list.filter((n) => new Date(n.at).getTime() > cutoff);
    if (live.length !== list.length) localStorage.setItem(HANDOFF_KEY, JSON.stringify(live));
    return live;
  } catch { return []; }
}
export function getLatestHandoffNote() {
  return getHandoffNotes()[0] || null;
}
export function postHandoffNote(text, byName) {
  if (!text || !text.trim()) return;
  const list = getHandoffNotes();
  list.unshift({
    id: 'hof_' + Date.now(),
    text: text.trim(),
    byName: byName || 'Unknown',
    at: new Date().toISOString(),
  });
  if (list.length > 20) list.length = 20;
  localStorage.setItem(HANDOFF_KEY, JSON.stringify(list));
}

// ── My week so far stats ──
export function getMyWeekStats(name, employeeId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  // Drinks made this week (by name match in drink log)
  let drinks = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const raw = localStorage.getItem(`quez_drink_log_${dateKeyCompact(d)}`);
    if (!raw) continue;
    try {
      const log = JSON.parse(raw);
      drinks += log.filter((it) => it.takenBy === name).length;
    } catch {}
  }
  // Hours worked this week
  const punches = storageGet(PUNCHES_KEY) || [];
  let hours = 0;
  punches.forEach((p) => {
    if (p.employeeId !== employeeId) return;
    if (!p.clockInTime || !p.clockOutTime) return;
    const inAt = new Date(p.clockInTime);
    if (inAt < start) return;
    const ms = new Date(p.clockOutTime) - inAt;
    if (ms > 0) hours += ms / 3600000;
  });
  return {
    drinks,
    hours: Math.round(hours * 10) / 10,
    drinksPerHour: hours > 0 ? Math.round((drinks / hours) * 10) / 10 : 0,
  };
}

// ── My pending swap/day-off requests ──
export function getMyPendingSwaps(employeeId) {
  return getSwapRequests().filter((r) => r.employeeId === employeeId && r.status === 'pending');
}

// ── Eighty-sixed menu items (for the briefing) ──
export function getEightySixed() {
  const menu = getMenu();
  return (menu || []).filter((m) => m.eightySix);
}

// ── Calendar notes (shared, all-employee visible, admin-edit) ──
const CAL_NOTES_KEY = 'quez_calendar_notes';

export function getCalendarNotes() {
  const raw = localStorage.getItem(CAL_NOTES_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
export function getCalendarNote(dateStr) {
  return getCalendarNotes()[dateStr] || '';
}
export function setCalendarNote(dateStr, text) {
  const notes = getCalendarNotes();
  if (text && text.trim()) notes[dateStr] = text.trim();
  else delete notes[dateStr];
  localStorage.setItem(CAL_NOTES_KEY, JSON.stringify(notes));
}

export function getUpcomingShiftsFor(employeeId, daysAhead = 14) {
  const schedule = getSchedule();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = isoDateKey(d);
    (schedule[key] || []).forEach((s) => {
      if (s.employeeId === employeeId) upcoming.push({ ...s, date: key });
    });
  }
  return upcoming;
}

export function isoDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 12 — AUDIT LOG (admin actions)
// ─────────────────────────────────────────────────────────────────────────────

const AUDIT_KEY = 'quez_audit_log';
const AUDIT_MAX = 500; // bounded log
export const AUDIT_LOG_MAX = AUDIT_MAX;
export const AUDIT_LOG_WARN_AT = 450; // surface a banner when within 50 of cap

export function logAudit(action, details = {}) {
  const list = getAuditLog();
  list.unshift({
    id: 'aud_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    at: new Date().toISOString(),
    action,
    details,
  });
  if (list.length > AUDIT_MAX) list.length = AUDIT_MAX;
  localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
}

export function getAuditLog() {
  const raw = localStorage.getItem(AUDIT_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function clearAuditLog() {
  localStorage.removeItem(AUDIT_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 12 — MODIFIER-AWARE AGGREGATION + COMPLETED ORDER HISTORY
// ─────────────────────────────────────────────────────────────────────────────

// Count how many times each modifier was used today.
export function getTodayModifierTally() {
  const log = getTodayDrinkLog();
  const counts = {};
  log.forEach((item) => {
    (item.modifiers || []).forEach((mid) => {
      counts[mid] = (counts[mid] || 0) + 1;
    });
  });
  return counts;
}

// Store completed orders for a rolling history (last 50 per day, keyed by date)
export function getRecentCompletedOrders(daysBack = 1) {
  const list = [];
  for (let i = 0; i < daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `quez_completed_orders_${dateKeyCompact(d)}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try { list.push(...JSON.parse(raw)); } catch {}
    }
  }
  return list;
}

function dateKeyCompact(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 12 — REPORT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

// Aggregate drinks served across N days. Returns sorted top list + totals.
export function getDrinkReportRange(daysBack = 7) {
  const tally = {};
  let total = 0;
  for (let i = 0; i < daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `quez_drink_log_${dateKeyCompact(d)}`;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    let log = [];
    try { log = JSON.parse(raw); } catch { continue; }
    for (const item of log) {
      total += 1;
      if (!tally[item.drinkName]) tally[item.drinkName] = { count: 0, sizes: {}, preps: {}, mods: {} };
      const row = tally[item.drinkName];
      row.count += 1;
      row.sizes[item.size] = (row.sizes[item.size] || 0) + 1;
      row.preps[item.prepType] = (row.preps[item.prepType] || 0) + 1;
      for (const m of (item.modifiers || [])) row.mods[m] = (row.mods[m] || 0) + 1;
    }
  }
  const ranked = Object.entries(tally)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, row]) => ({ name, ...row }));
  return { total, ranked };
}

// Labor hours per employee across the date range (uses time punches)
export function getLaborReportRange(daysBack = 7) {
  const PUNCHES = storageGet(PUNCHES_KEY) || [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (daysBack - 1));
  const byEmployee = {};
  PUNCHES.forEach((p) => {
    if (!p.clockInTime || !p.clockOutTime) return;
    const inAt = new Date(p.clockInTime);
    if (inAt < start) return;
    const ms = new Date(p.clockOutTime) - inAt;
    if (ms <= 0) return;
    const hours = ms / 3600000;
    if (!byEmployee[p.name]) byEmployee[p.name] = { hours: 0, shifts: 0, role: p.role };
    byEmployee[p.name].hours += hours;
    byEmployee[p.name].shifts += 1;
  });
  const ranked = Object.entries(byEmployee)
    .sort((a, b) => b[1].hours - a[1].hours)
    .map(([name, row]) => ({ name, ...row, hours: Math.round(row.hours * 100) / 100 }));
  const totalHours = ranked.reduce((s, r) => s + r.hours, 0);
  return { totalHours: Math.round(totalHours * 100) / 100, byEmployee: ranked };
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 12 — TRAINING SUMMARY (for trainer overview)
// ─────────────────────────────────────────────────────────────────────────────

export function getActiveTraineesSummary() {
  const employees = getEmployees().filter((e) => e.role === 'trainee' && e.active !== false);
  return employees.map((emp) => {
    const rec = getTrainingRecord(emp.id);
    return {
      employee: emp,
      record: rec,
      completedPhases: (rec.phase1?.passed ? 1 : 0) + (rec.phase2?.passed ? 1 : 0) + (rec.phase3?.passed ? 1 : 0),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 12 — PIN RESET (owner/manager initiated)
// ─────────────────────────────────────────────────────────────────────────────

export function resetEmployeePin(employeeId, byName = 'admin') {
  const updated = updateEmployee(employeeId, { pin: '0000', mustChangePin: true });
  if (updated) {
    logAudit('pin_reset', { employeeId, employeeName: updated.name, byName });
  }
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 14 — REAL-LIFE OPS GAPS (from barista + manager 1-month walkthrough)
// ─────────────────────────────────────────────────────────────────────────────

// ── Last order (per-employee) — used by "Repeat last order" on Take Order ──
export function saveLastOrder(employeeId, items) {
  if (!employeeId || !Array.isArray(items)) return;
  const stripped = items.map((it) => ({
    drinkId: it.drinkId, drinkName: it.drinkName,
    size: it.size, prepType: it.prepType,
    modifiers: it.modifiers || [], note: it.note || '',
  }));
  localStorage.setItem(`quez_last_order_${employeeId}`, JSON.stringify(stripped));
}
export function getLastOrder(employeeId) {
  if (!employeeId) return [];
  const raw = localStorage.getItem(`quez_last_order_${employeeId}`);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ── Currently clocked-in (no clock-out yet today) ──
export function getCurrentlyClockedIn() {
  const records = loadTodayClockRecords() || [];
  return records.filter((r) => r.clockInTime && !r.clockOutTime);
}

// ── My drink count today ──
export function getMyDrinkCountToday(name) {
  if (!name) return 0;
  return getTodayDrinkLog().filter((d) => d.takenBy === name).length;
}

// ── Editable timesheet — list/fix punches across a date range ──
const PUNCHES_FULL_KEY = PUNCHES_KEY; // alias for clarity below

export function getPunchesInRange(daysBack = 14) {
  const list = storageGet(PUNCHES_FULL_KEY) || [];
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (daysBack - 1));
  return list
    .filter((p) => p.clockInTime && new Date(p.clockInTime) >= cutoff)
    .sort((a, b) => new Date(b.clockInTime) - new Date(a.clockInTime));
}

export function updatePunch(originalClockInIso, employeeId, patch, byName = 'admin') {
  const list = storageGet(PUNCHES_FULL_KEY) || [];
  const idx = list.findIndex((p) => p.clockInTime === originalClockInIso && p.employeeId === employeeId);
  if (idx === -1) return false;
  const before = { ...list[idx] };
  list[idx] = { ...list[idx], ...patch, editedAt: new Date().toISOString(), editedBy: byName };
  storageSet(PUNCHES_FULL_KEY, list);
  logAudit('punch_edit', { employeeName: before.name, originalIn: before.clockInTime, byName });
  return true;
}

export function deletePunch(clockInIso, employeeId, byName = 'admin') {
  const list = storageGet(PUNCHES_FULL_KEY) || [];
  const target = list.find((p) => p.clockInTime === clockInIso && p.employeeId === employeeId);
  const filtered = list.filter((p) => !(p.clockInTime === clockInIso && p.employeeId === employeeId));
  storageSet(PUNCHES_FULL_KEY, filtered);
  if (target) logAudit('punch_delete', { employeeName: target.name, clockInTime: clockInIso, byName });
  return list.length !== filtered.length;
}

// ── Drink waste / remake log ──
const WASTE_KEY_PREFIX = 'quez_waste_log_';

export const WASTE_REASONS = [
  { id: 'spill',         label: { en: 'Spill / drop',        es: 'Derrame / caída' } },
  { id: 'wrong_drink',   label: { en: 'Wrong drink made',    es: 'Bebida incorrecta' } },
  { id: 'customer_remake', label: { en: 'Customer remake',   es: 'Cliente pidió rehacer' } },
  { id: 'expired',       label: { en: 'Expired / past hold', es: 'Vencido / fuera de tiempo' } },
  { id: 'milk_temp',     label: { en: 'Milk overheated',     es: 'Leche sobrecalentada' } },
  { id: 'shot_pulled_wrong', label: { en: 'Shot pulled wrong', es: 'Shot mal extraído' } },
  { id: 'other',         label: { en: 'Other',               es: 'Otro' } },
];

export function logWaste({ drinkId, drinkName, size, prepType, reason, note = '', byName }) {
  const dayKey = todayKey();
  const fullKey = `${WASTE_KEY_PREFIX}${dayKey}`;
  const raw = localStorage.getItem(fullKey);
  const list = raw ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : [];
  list.unshift({
    id: 'wst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    at: new Date().toISOString(),
    drinkId, drinkName, size, prepType,
    reason, note: note.trim(), byName,
  });
  if (list.length > 100) list.length = 100;
  localStorage.setItem(fullKey, JSON.stringify(list));
}

export function getWasteLogRange(daysBack = 7) {
  const out = [];
  for (let i = 0; i < daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = `${WASTE_KEY_PREFIX}${dateKeyCompact(d)}`;
    const raw = localStorage.getItem(k);
    if (raw) { try { out.push(...JSON.parse(raw)); } catch {} }
  }
  return out;
}

// ── Inventory tracker ──
const INVENTORY_KEY = 'quez_inventory';

export const DEFAULT_INVENTORY_ITEMS = [
  { id: 'milk_whole',  name: 'Whole milk',         unit: 'gal', par: 3, onHand: 3, category: 'Dairy' },
  { id: 'milk_2pct',   name: '2% milk',            unit: 'gal', par: 2, onHand: 2, category: 'Dairy' },
  { id: 'milk_oat',    name: 'Oat milk',           unit: 'qt',  par: 4, onHand: 4, category: 'Dairy' },
  { id: 'milk_almond', name: 'Almond milk',        unit: 'qt',  par: 2, onHand: 2, category: 'Dairy' },
  { id: 'syrup_honey', name: 'Honey syrup',        unit: 'btl', par: 3, onHand: 3, category: 'Syrups' },
  { id: 'syrup_van',   name: 'Vanilla syrup',      unit: 'btl', par: 2, onHand: 2, category: 'Syrups' },
  { id: 'syrup_car',   name: 'Caramel syrup',      unit: 'btl', par: 2, onHand: 2, category: 'Syrups' },
  { id: 'syrup_mocha', name: 'Mocha sauce',        unit: 'btl', par: 2, onHand: 2, category: 'Syrups' },
  { id: 'syrup_cin',   name: 'Cinnamon syrup',     unit: 'btl', par: 1, onHand: 1, category: 'Syrups' },
  { id: 'syrup_lav',   name: 'Lavender syrup',     unit: 'btl', par: 1, onHand: 1, category: 'Syrups' },
  { id: 'beans',       name: 'Espresso beans',     unit: 'lb',  par: 5, onHand: 5, category: 'Coffee' },
  { id: 'cold_brew',   name: 'Cold brew concentrate', unit: 'gal', par: 2, onHand: 2, category: 'Coffee' },
  { id: 'cups_12',     name: '12oz cups',          unit: 'box', par: 2, onHand: 2, category: 'Cups & Lids' },
  { id: 'cups_16',     name: '16oz cups',          unit: 'box', par: 2, onHand: 2, category: 'Cups & Lids' },
  { id: 'lids',        name: 'Lids (both sizes)',  unit: 'box', par: 2, onHand: 2, category: 'Cups & Lids' },
  { id: 'sleeves',     name: 'Hot sleeves',        unit: 'box', par: 1, onHand: 1, category: 'Cups & Lids' },
  { id: 'whip',        name: 'Whipped cream',      unit: 'can', par: 4, onHand: 4, category: 'Toppings' },
];

export function getInventory() {
  const raw = localStorage.getItem(INVENTORY_KEY);
  if (!raw) return DEFAULT_INVENTORY_ITEMS;
  try { return JSON.parse(raw); } catch { return DEFAULT_INVENTORY_ITEMS; }
}
export function saveInventory(items) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
}
export function updateInventoryItem(id, patch) {
  const items = getInventory();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  saveInventory(items);
  return items[idx];
}
export function getLowStockItems() {
  return getInventory().filter((i) => (i.onHand ?? 0) < (i.par ?? 0));
}

// ── Shift-swap requests (in-app only, no SMS) ──
const SWAP_KEY = 'quez_shift_swaps';

export function getSwapRequests() {
  const raw = localStorage.getItem(SWAP_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
export function saveSwapRequests(list) {
  localStorage.setItem(SWAP_KEY, JSON.stringify(list));
}
export function createSwapRequest({ employeeId, employeeName, dateStr, shiftId, reason = '', type = 'shift_drop' }) {
  const list = getSwapRequests();
  list.unshift({
    id: 'swp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    type, // 'shift_drop' (drop a scheduled shift) | 'day_off' (block a future date)
    employeeId, employeeName, dateStr, shiftId,
    reason: reason.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  saveSwapRequests(list);
  logAudit('swap_requested', { type, employeeName, dateStr, shiftId });
  return list[0];
}
export function resolveSwapRequest(id, status, byName) {
  const list = getSwapRequests();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status, resolvedAt: new Date().toISOString(), resolvedBy: byName };
  saveSwapRequests(list);
  logAudit(status === 'approved' ? 'swap_approved' : 'swap_denied',
    { employeeName: list[idx].employeeName, dateStr: list[idx].dateStr, byName });
  return list[idx];
}
export function getPendingSwapCount() {
  return getSwapRequests().filter((r) => r.status === 'pending').length;
}

// ── CSV export helper (browser download) ──
export function downloadCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => esc(row[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// ── Additional report recipients ──
export function getReportRecipients() {
  const s = getSettings();
  const extras = Array.isArray(s.additionalEmails) ? s.additionalEmails : [];
  return [s.ownerEmail, ...extras].filter(Boolean);
}
export function setAdditionalEmails(arr) {
  const s = getSettings();
  saveSettings({ ...s, additionalEmails: arr.filter(Boolean) });
}

// ── Labor cost (uses wagePerHour on employee) ──
export function getLaborCostRange(daysBack = 7) {
  const employees = getEmployees();
  const wageById = Object.fromEntries(employees.map((e) => [e.id, e.wagePerHour || 0]));
  const wageByName = Object.fromEntries(employees.map((e) => [e.name, e.wagePerHour || 0]));
  const list = storageGet(PUNCHES_FULL_KEY) || [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (daysBack - 1));
  let totalCost = 0;
  const byEmployee = {};
  list.forEach((p) => {
    if (!p.clockInTime || !p.clockOutTime) return;
    const inAt = new Date(p.clockInTime);
    if (inAt < start) return;
    const ms = new Date(p.clockOutTime) - inAt;
    if (ms <= 0) return;
    const hours = ms / 3600000;
    const wage = wageById[p.employeeId] ?? wageByName[p.name] ?? 0;
    const cost = hours * wage;
    totalCost += cost;
    if (!byEmployee[p.name]) byEmployee[p.name] = { hours: 0, cost: 0, wage };
    byEmployee[p.name].hours += hours;
    byEmployee[p.name].cost += cost;
  });
  const ranked = Object.entries(byEmployee)
    .map(([name, r]) => ({ name, hours: Math.round(r.hours * 100) / 100, cost: Math.round(r.cost * 100) / 100, wage: r.wage }))
    .sort((a, b) => b.cost - a.cost);
  return { totalCost: Math.round(totalCost * 100) / 100, byEmployee: ranked };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-LAUNCH TIMELINE — owner-only long-horizon checklist
// Progress is keyed by task id: { done, completedAt, notes }
// Lives at quez_pre_launch_progress so it rides in every JSON backup.
// ─────────────────────────────────────────────────────────────────────────────
const PRELAUNCH_KEY = 'quez_pre_launch_progress';

export function getPreLaunchProgress() {
  const raw = localStorage.getItem(PRELAUNCH_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function savePreLaunchProgress(map) {
  try { localStorage.setItem(PRELAUNCH_KEY, JSON.stringify(map || {})); } catch {}
}

export function setPreLaunchTaskDone(taskId, done, byName = 'system') {
  if (!taskId) return;
  const map = getPreLaunchProgress();
  const prev = map[taskId] || {};
  if (done) {
    map[taskId] = {
      ...prev,
      done: true,
      completedAt: prev.completedAt || new Date().toISOString(),
      completedBy: byName,
    };
  } else {
    map[taskId] = { ...prev, done: false, completedAt: null, completedBy: null };
  }
  savePreLaunchProgress(map);
}

export function setPreLaunchTaskNotes(taskId, notes) {
  if (!taskId) return;
  const map = getPreLaunchProgress();
  map[taskId] = { ...(map[taskId] || {}), notes: notes || '' };
  savePreLaunchProgress(map);
}

export function setPreLaunchTaskHidden(taskId, hidden) {
  if (!taskId) return;
  const map = getPreLaunchProgress();
  map[taskId] = { ...(map[taskId] || {}), hidden: !!hidden };
  savePreLaunchProgress(map);
}

// ============================================================
// LONG-TERM DATA HYGIENE
// ------------------------------------------------------------
// localStorage has a ~5 MB quota on most browsers. Without pruning, drink
// logs, completed-order history, time punches, and per-day waste logs grow
// linearly forever — somewhere around month 6–12 the browser starts refusing
// writes silently and drinks stop saving.
//
// Strategy:
//   • Drinks  → keep 90 days of raw daily logs (so reports + waste-detail UI
//                still work), then collapse older days into a per-month rollup
//                that just stores `{drinkId, size, prepType, count}`. Owner
//                still sees "January sold 412 honey mochas" forever.
//   • Punches → keep 365 days of raw punches (timesheet, labor cost), then
//                collapse older into per-month rollup `{employeeId, name,
//                totalHours, shiftCount}` — payroll history preserved.
//   • Waste   → keep 90 days raw, then per-month rollup `{drinkId, reason,
//                count}`. Lets the owner spot patterns over time.
//   • Schedule, swaps, flagged items, daily checklists, periodic checklists,
//     per-day order seq counters → just delete past retention; nothing of
//     audit value is lost (resolved swaps + submitted checklists exist in
//     audit log + email reports).
//
// Runs at most once per calendar day. Fires from AppContext on boot.
// ============================================================

const PRUNE_LAST_KEY = 'quez_last_prune_at';

const RETENTION_DAYS = {
  drinkLog:          90,
  completedOrders:   90,
  orderSeq:          30,
  punches:           365,
  schedule:          60,
  swapResolved:      60,
  flagged:           90,
  dailyChecklist:    90,
  periodicChecklist: 365,
  wasteLog:          90,
};

function ymKey(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseCompactDateKey(key, prefix) {
  if (!key.startsWith(prefix)) return null;
  const stamp = key.slice(prefix.length);
  if (!/^\d{8}$/.test(stamp)) return null;
  const y = +stamp.slice(0, 4);
  const m = +stamp.slice(4, 6) - 1;
  const d = +stamp.slice(6, 8);
  const date = new Date(y, m, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeParse(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  try {
    const v = JSON.parse(raw);
    return v == null ? fallback : v;
  } catch { return fallback; }
}

function listKeysWithPrefix(prefix) {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) out.push(k);
  }
  return out;
}

function pruneDrinkLogs(now) {
  const prefix = 'quez_drink_log_';
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - RETENTION_DAYS.drinkLog);
  let bytesFreed = 0; let daysRolled = 0;
  const rollups = {}; // ymKey → { "drinkId|size|prepType": rec }

  for (const key of listKeysWithPrefix(prefix)) {
    const d = parseCompactDateKey(key, prefix);
    if (!d || d >= cutoff) continue;
    const raw = localStorage.getItem(key);
    const log = safeParse(raw, []);
    const rollupKey = `quez_drink_rollup_${ymKey(d)}`;
    rollups[rollupKey] = rollups[rollupKey] || {};
    for (const entry of log) {
      const k = `${entry.drinkId}|${entry.size}|${entry.prepType}`;
      if (!rollups[rollupKey][k]) {
        rollups[rollupKey][k] = {
          drinkId: entry.drinkId,
          drinkName: entry.drinkName,
          size: entry.size,
          prepType: entry.prepType,
          count: 0,
        };
      }
      rollups[rollupKey][k].count += 1;
    }
    bytesFreed += (raw || '').length;
    localStorage.removeItem(key);
    daysRolled += 1;
  }

  for (const rollupKey in rollups) {
    const existing = safeParse(localStorage.getItem(rollupKey), []);
    const merged = {};
    for (const e of existing) merged[`${e.drinkId}|${e.size}|${e.prepType}`] = e;
    for (const k in rollups[rollupKey]) {
      const r = rollups[rollupKey][k];
      if (merged[k]) merged[k].count += r.count;
      else merged[k] = r;
    }
    localStorage.setItem(rollupKey, JSON.stringify(Object.values(merged)));
  }
  return { bytesFreed, daysRolled };
}

function prunePerDayKey(prefix, retainDays, now) {
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - retainDays);
  let bytesFreed = 0; let removed = 0;
  for (const key of listKeysWithPrefix(prefix)) {
    const d = parseCompactDateKey(key, prefix);
    if (!d || d >= cutoff) continue;
    const raw = localStorage.getItem(key);
    bytesFreed += (raw || '').length;
    localStorage.removeItem(key);
    removed += 1;
  }
  return { bytesFreed, removed };
}

function pruneWasteLogs(now) {
  const prefix = 'quez_waste_log_';
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - RETENTION_DAYS.wasteLog);
  let bytesFreed = 0; let daysRolled = 0;
  const rollups = {};
  for (const key of listKeysWithPrefix(prefix)) {
    const d = parseCompactDateKey(key, prefix);
    if (!d || d >= cutoff) continue;
    const raw = localStorage.getItem(key);
    const log = safeParse(raw, []);
    const rollupKey = `quez_waste_rollup_${ymKey(d)}`;
    rollups[rollupKey] = rollups[rollupKey] || {};
    for (const entry of log) {
      const k = `${entry.drinkId}|${entry.reason}`;
      if (!rollups[rollupKey][k]) {
        rollups[rollupKey][k] = {
          drinkId: entry.drinkId,
          drinkName: entry.drinkName,
          reason: entry.reason,
          count: 0,
        };
      }
      rollups[rollupKey][k].count += 1;
    }
    bytesFreed += (raw || '').length;
    localStorage.removeItem(key);
    daysRolled += 1;
  }
  for (const rollupKey in rollups) {
    const existing = safeParse(localStorage.getItem(rollupKey), []);
    const merged = {};
    for (const e of existing) merged[`${e.drinkId}|${e.reason}`] = e;
    for (const k in rollups[rollupKey]) {
      const r = rollups[rollupKey][k];
      if (merged[k]) merged[k].count += r.count;
      else merged[k] = r;
    }
    localStorage.setItem(rollupKey, JSON.stringify(Object.values(merged)));
  }
  return { bytesFreed, daysRolled };
}

function prunePunches(now) {
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - RETENTION_DAYS.punches);
  const list = storageGet(PUNCHES_FULL_KEY) || [];
  if (list.length === 0) return { bytesFreed: 0, rolled: 0 };
  const keep = [];
  const old  = [];
  for (const p of list) {
    const ref = p.clockInTime || p.clockOutTime;
    if (!ref) { keep.push(p); continue; }
    const t = new Date(ref);
    if (Number.isNaN(t.getTime()) || t >= cutoff) keep.push(p);
    else old.push(p);
  }
  if (old.length === 0) return { bytesFreed: 0, rolled: 0 };

  const rollups = {}; // ymKey → { "employeeId|name": rec }
  for (const p of old) {
    if (!p.clockInTime || !p.clockOutTime) continue;
    const inAt = new Date(p.clockInTime);
    const outAt = new Date(p.clockOutTime);
    if (Number.isNaN(inAt.getTime()) || Number.isNaN(outAt.getTime())) continue;
    const ms = outAt - inAt;
    if (ms <= 0) continue;
    const month = ymKey(inAt);
    const rollupKey = `quez_punch_rollup_${month}`;
    rollups[rollupKey] = rollups[rollupKey] || {};
    const key = `${p.employeeId || ''}|${p.name || 'Unknown'}`;
    if (!rollups[rollupKey][key]) {
      rollups[rollupKey][key] = { employeeId: p.employeeId || null, name: p.name || 'Unknown', totalHours: 0, shiftCount: 0 };
    }
    rollups[rollupKey][key].totalHours += ms / 3600000;
    rollups[rollupKey][key].shiftCount += 1;
  }
  for (const rollupKey in rollups) {
    const existing = safeParse(localStorage.getItem(rollupKey), []);
    const merged = {};
    for (const e of existing) merged[`${e.employeeId || ''}|${e.name}`] = e;
    for (const k in rollups[rollupKey]) {
      const r = rollups[rollupKey][k];
      r.totalHours = Math.round(r.totalHours * 100) / 100;
      if (merged[k]) {
        merged[k].totalHours = Math.round((merged[k].totalHours + r.totalHours) * 100) / 100;
        merged[k].shiftCount += r.shiftCount;
      } else {
        merged[k] = r;
      }
    }
    localStorage.setItem(rollupKey, JSON.stringify(Object.values(merged)));
  }
  const beforeBytes = (localStorage.getItem(PUNCHES_FULL_KEY) || '').length;
  storageSet(PUNCHES_FULL_KEY, keep);
  const afterBytes = (localStorage.getItem(PUNCHES_FULL_KEY) || '').length;
  return { bytesFreed: Math.max(0, beforeBytes - afterBytes), rolled: old.length };
}

function pruneSchedule(now) {
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - RETENTION_DAYS.schedule);
  const sched = storageGet(SCHEDULE_KEY);
  if (!sched || typeof sched !== 'object') return { bytesFreed: 0, removed: 0 };
  let removed = 0;
  const next = {};
  for (const dateStr in sched) {
    // dateStr is "YYYY-MM-DD"
    const d = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(d.getTime()) || d >= cutoff) {
      next[dateStr] = sched[dateStr];
    } else {
      removed += 1;
    }
  }
  if (removed === 0) return { bytesFreed: 0, removed: 0 };
  const before = (localStorage.getItem(SCHEDULE_KEY) || '').length;
  storageSet(SCHEDULE_KEY, next);
  const after = (localStorage.getItem(SCHEDULE_KEY) || '').length;
  return { bytesFreed: Math.max(0, before - after), removed };
}

function pruneSwaps(now) {
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - RETENTION_DAYS.swapResolved);
  const list = safeParse(localStorage.getItem(SWAP_KEY), []);
  if (list.length === 0) return { bytesFreed: 0, removed: 0 };
  const kept = list.filter((r) => {
    if (r.status === 'pending') return true;
    const ts = r.resolvedAt || r.createdAt;
    if (!ts) return true;
    const t = new Date(ts);
    return Number.isNaN(t.getTime()) || t >= cutoff;
  });
  const removed = list.length - kept.length;
  if (removed === 0) return { bytesFreed: 0, removed: 0 };
  const before = (localStorage.getItem(SWAP_KEY) || '').length;
  localStorage.setItem(SWAP_KEY, JSON.stringify(kept));
  const after = (localStorage.getItem(SWAP_KEY) || '').length;
  return { bytesFreed: Math.max(0, before - after), removed };
}

function pruneArrayByDate(key, retainDays, now, dateField) {
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - retainDays);
  const list = storageGet(key);
  if (!Array.isArray(list) || list.length === 0) return { bytesFreed: 0, removed: 0 };
  const kept = list.filter((entry) => {
    const v = entry?.[dateField];
    if (!v) return true;
    // Accept both ISO and "M/D/YYYY" formats (flagged items use locale string)
    const t = new Date(v);
    return Number.isNaN(t.getTime()) || t >= cutoff;
  });
  const removed = list.length - kept.length;
  if (removed === 0) return { bytesFreed: 0, removed: 0 };
  const before = (localStorage.getItem(key) || '').length;
  storageSet(key, kept);
  const after = (localStorage.getItem(key) || '').length;
  return { bytesFreed: Math.max(0, before - after), removed };
}

export function getLastPruneAt() {
  return localStorage.getItem(PRUNE_LAST_KEY) || null;
}

// One pass over every growing key. Idempotent; safe to call repeatedly.
// Returns a summary the caller can log or surface.
export function pruneOldData({ force = false } = {}) {
  const now = new Date();
  const last = getLastPruneAt();
  if (!force && last) {
    if (new Date(last).toLocaleDateString() === now.toLocaleDateString()) {
      return { skipped: true, reason: 'already today' };
    }
  }
  const summary = {
    drinkLogs:        pruneDrinkLogs(now),
    completedOrders:  prunePerDayKey('quez_completed_orders_', RETENTION_DAYS.completedOrders, now),
    orderSeq:         prunePerDayKey('quez_order_seq_',        RETENTION_DAYS.orderSeq,        now),
    wasteLogs:        pruneWasteLogs(now),
    punches:          prunePunches(now),
    schedule:         pruneSchedule(now),
    swaps:            pruneSwaps(now),
    flagged:          pruneArrayByDate(FLAGGED_KEY,   RETENTION_DAYS.flagged,           now, 'date'),
    dailyChecklist:   pruneArrayByDate(DAILY_REC_KEY, RETENTION_DAYS.dailyChecklist,    now, 'submittedAt'),
    periodicChecklist: pruneArrayByDate('quez_periodic_checklist_records',
                                        RETENTION_DAYS.periodicChecklist, now, 'submittedAt'),
  };
  const totalFreed = Object.values(summary).reduce((sum, r) => sum + (r.bytesFreed || 0), 0);
  localStorage.setItem(PRUNE_LAST_KEY, now.toISOString());
  if (totalFreed > 0) {
    logAudit('data_pruned', {
      bytesFreed: totalFreed,
      kb: Math.round(totalFreed / 1024),
      byName: 'system',
    });
  }
  return { skipped: false, totalFreed, summary };
}

// Compact stats for Owner Dashboard — number of long-term keys still kept,
// total bytes used, last prune timestamp. Doesn't write anything.
export function getRetentionSummary() {
  let drinkLogDays = 0, wasteLogDays = 0, completedOrderDays = 0;
  let drinkRollupMonths = 0, wasteRollupMonths = 0, punchRollupMonths = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith('quez_drink_log_'))          drinkLogDays += 1;
    else if (k.startsWith('quez_waste_log_'))     wasteLogDays += 1;
    else if (k.startsWith('quez_completed_orders_')) completedOrderDays += 1;
    else if (k.startsWith('quez_drink_rollup_'))  drinkRollupMonths += 1;
    else if (k.startsWith('quez_waste_rollup_'))  wasteRollupMonths += 1;
    else if (k.startsWith('quez_punch_rollup_'))  punchRollupMonths += 1;
  }
  return {
    lastPruneAt:       getLastPruneAt(),
    drinkLogDays, wasteLogDays, completedOrderDays,
    drinkRollupMonths, wasteRollupMonths, punchRollupMonths,
    retention:         RETENTION_DAYS,
  };
}