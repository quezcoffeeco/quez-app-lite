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
 
// NOTE: When the Guest user is signed in, AppContext.installGuestMode()
// monkey-patches localStorage.setItem so most quez_* keys silently drop.
// That's intentional — Guest writes never persist. If a button you wrote
// doesn't seem to save in Guest mode, that's why; check the allowlist in
// AppContext for the small set of keys that DO pass through.
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
  storageSet(SESSION_KEY, { ...userData });
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
 
// ── Checklist State ───────────────────────────────────────
const checklistStateKey = () => {
  const d = new Date();
  return `${CHECKLIST_STATE_KEY}_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
};
 
export const saveChecklistState = (state) => storageSet(checklistStateKey(), state);
 
export const loadChecklistState = () => {
  const state = storageGet(checklistStateKey()) || {
    values: {},
    sectionStartTimes: {},
    sectionSubmitted: { opening: false, mid: false, closing: false },
  };
  // Per-item attribution: who last touched each item + when. Older state
  // documents won't have this; default to empty so legacy days don't crash.
  if (!state.meta) state.meta = {};
  return state;
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

// Inline customer-name update — applied to the order's orderNote field so the
// rest of the queue card stays untouched. Used by the tap-header inline editor.
export function updateOrderNote(orderId, note) {
  const orders = getActiveOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return;
  orders[idx] = { ...orders[idx], orderNote: (note || '').trim() };
  saveActiveOrders(orders);
}

// Cancel an order without recording any drinks served. Pushes a snapshot onto
// today's quez_cancelled_orders_YYYYMMDD bucket so owners can investigate
// "customer says they ordered 10 min ago" disputes after the undo window.
// Accepts an optional reason ({ category, note }) for audit + report context.
export function cancelOrder(orderId, reason = null) {
  const orders = getActiveOrders();
  const order = orders.find((o) => o.id === orderId);
  saveActiveOrders(orders.filter((o) => o.id !== orderId));
  if (order && !order.practice) {
    const histKey = `quez_cancelled_orders_${todayKey()}`;
    const histRaw = localStorage.getItem(histKey);
    const hist = histRaw ? (() => { try { return JSON.parse(histRaw); } catch { return []; } })() : [];
    hist.unshift({
      ...order,
      cancelledAt: new Date().toISOString(),
      cancelReason: reason || null,
    });
    if (hist.length > 50) hist.length = 50;
    localStorage.setItem(histKey, JSON.stringify(hist));
  }
}

// Cancelled-order history viewer. Used by the OrderScreen Cancelled tab.
export function getRecentCancelledOrders(daysBack = 1) {
  const out = [];
  for (let i = 0; i < daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const raw = localStorage.getItem(`quez_cancelled_orders_${dateKeyCompact(d)}`);
    if (!raw) continue;
    try { out.push(...JSON.parse(raw)); } catch {}
  }
  return out;
}

// Build-time analytics — reads completed-order buckets, returns average +
// median build time (in seconds) over the requested window, plus a per-prep
// breakdown (espresso/drip/iced/blended). Hot is split because espresso pulls
// have different bottlenecks than drip pours — owner needs to see them apart.
export function getBuildTimeStats(daysBack = 1) {
  // Cache espresso flag per drink id — avoids repeated find() inside the loop.
  let recipeMap = null;
  const isEspressoDrink = (drinkId) => {
    if (!recipeMap) {
      try {
        // eslint-disable-next-line global-require
        const { drinkRecipes } = require('../data/drinkRecipes');
        recipeMap = {};
        (drinkRecipes || []).forEach((d) => {
          recipeMap[d.id] = !!(d.tags && d.tags.usesEspresso);
        });
      } catch { recipeMap = {}; }
    }
    return !!recipeMap[drinkId];
  };

  const ms = [];
  const byPrep = { espresso: [], drip: [], iced: [], blended: [] };
  for (let i = 0; i < daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const raw = localStorage.getItem(`quez_completed_orders_${dateKeyCompact(d)}`);
    if (!raw) continue;
    try {
      const list = JSON.parse(raw);
      list.forEach((o) => {
        if (o.practice) return;
        if (!o.createdAt || !o.completedAt) return;
        const delta = new Date(o.completedAt) - new Date(o.createdAt);
        if (delta <= 0 || delta >= 30 * 60 * 1000) return; // skip outliers
        ms.push(delta);
        // Bucket by the dominant prep — for "hot" items, further split
        // espresso vs drip based on the recipe tag.
        const counts = { espresso: 0, drip: 0, iced: 0, blended: 0 };
        (o.items || []).forEach((it) => {
          if (it.prepType === 'iced') counts.iced += 1;
          else if (it.prepType === 'blended') counts.blended += 1;
          else if (it.prepType === 'hot') {
            if (isEspressoDrink(it.drinkId)) counts.espresso += 1;
            else counts.drip += 1;
          }
        });
        // Pick the bucket with the highest count; ties favor espresso → drip → iced → blended.
        let prep = 'drip';
        let max = 0;
        ['espresso', 'drip', 'iced', 'blended'].forEach((k) => {
          if (counts[k] > max) { max = counts[k]; prep = k; }
        });
        byPrep[prep].push(delta);
      });
    } catch {}
  }
  const summarize = (arr) => {
    if (arr.length === 0) return { count: 0, avgSec: 0 };
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return { count: arr.length, avgSec: Math.round(avg / 1000) };
  };
  if (ms.length === 0) {
    return {
      count: 0, avgSec: 0, medianSec: 0,
      byPrep: {
        espresso: { count: 0, avgSec: 0 },
        drip:     { count: 0, avgSec: 0 },
        iced:     { count: 0, avgSec: 0 },
        blended:  { count: 0, avgSec: 0 },
      },
    };
  }
  const avg = ms.reduce((a, b) => a + b, 0) / ms.length;
  const sorted = [...ms].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return {
    count: ms.length,
    avgSec: Math.round(avg / 1000),
    medianSec: Math.round(median / 1000),
    byPrep: {
      espresso: summarize(byPrep.espresso),
      drip:     summarize(byPrep.drip),
      iced:     summarize(byPrep.iced),
      blended:  summarize(byPrep.blended),
    },
  };
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
  // Practice orders never touch the drink log OR the inventory — keeps reports
  // and stock counts clean during training.
  if (!order.practice) {
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

    // Deduct ingredients from inventory — per-recipe, per-size, modifier-aware.
    try { deductInventoryForOrder(order); } catch (e) { console.warn('Inventory deduction failed:', e); }
  }

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

  // Track per-recipient delivery — only mark the backup successful if EVERY
  // recipient was actually delivered to. If any send is queued (offline / no
  // credentials / send-error), the backup is "queued" not "done", so the next
  // boot will try again instead of skipping it.
  let lastFailReason = null;
  let anyFailed = false;
  try {
    for (const to of recipients) {
      const result = await sendQuezEmail({
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
      if (!result.ok) {
        anyFailed = true;
        lastFailReason = result.reason;
      }
    }
  } catch (err) {
    console.warn('Auto-backup email exception:', err);
    setAutoBackupStatus({ state: 'failed', at: new Date().toISOString(), sizeBytes: bundleJson.length, error: err?.message || 'send failed' });
    return { sent: false, error: err.message || 'send failed' };
  }

  if (anyFailed) {
    setAutoBackupStatus({
      state: 'queued',
      at: date,
      sizeBytes: bundleJson.length,
      limitBytes: MAX_AUTOBACKUP_BODY_BYTES,
      reason: lastFailReason,
    });
    return { sent: false, queued: true, reason: lastFailReason, recipients: recipients.length };
  }

  // Genuine success — mark the day done so we don't re-send.
  localStorage.setItem(LAST_AUTO_BACKUP_KEY, date);
  setAutoBackupStatus({
    state: tooBig ? 'too_big' : 'ok',
    at: date,
    sizeBytes: bundleJson.length,
    limitBytes: MAX_AUTOBACKUP_BODY_BYTES,
  });
  logAudit('backup_emailed', { reason, recipients: recipients.length, sizeBytes: bundleJson.length, byName });
  return { sent: true, tooBig, recipients: recipients.length };
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

  // Streak (drill-pause aware — pass employeeId so missed drill weekends
  // don't reset the streak the same way they don't on the goal card)
  const streak = getCurrentStreak(employeeId);
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
export function getTodayLocationUpdatedAt() {
  const s = getSettings();
  return s.todayLocationUpdatedAt || null;
}
export function setTodayLocation(text) {
  const s = getSettings();
  saveSettings({ ...s, todayLocation: (text || '').trim(), todayLocationUpdatedAt: new Date().toISOString() });
}

// Scheduled location — per-day-of-week pre-fills so the owner doesn't have
// to manually update at every shift open. Shape: { sun, mon, tue, wed, thu, fri, sat }
// Each value is a location string (or empty for "not scheduled this day").
const LOCATION_SCHEDULE_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export function getLocationSchedule() {
  const s = getSettings();
  return s.locationSchedule || {};
}
export function setLocationSchedule(schedule) {
  const s = getSettings();
  saveSettings({ ...s, locationSchedule: schedule || {} });
}
// Returns today's scheduled location string (empty if no schedule entry).
export function getTodayScheduledLocation() {
  const schedule = getLocationSchedule();
  const dayKey = LOCATION_SCHEDULE_DAYS[new Date().getDay()];
  return (schedule[dayKey] || '').trim();
}
// True when a schedule exists for today AND the current location differs.
// The Settings screen surfaces this so the owner can revert with one tap.
export function isLocationOverridden() {
  const scheduled = getTodayScheduledLocation();
  if (!scheduled) return false;
  const current = (getTodayLocation() || '').trim();
  return current !== '' && current !== scheduled;
}
// Called on app boot — applies today's scheduled location IF set and IF the
// current todayLocation doesn't already match (don't clobber a manual override
// during the same day). Returns true if an auto-update fired.
export function maybeApplyScheduledLocation() {
  const schedule = getLocationSchedule();
  const dayKey = LOCATION_SCHEDULE_DAYS[new Date().getDay()];
  const scheduled = (schedule[dayKey] || '').trim();
  if (!scheduled) return false;
  const current = getTodayLocation();
  // Update only when (a) nothing is set yet, or (b) the last-update was
  // before midnight today (so a manual override later in the same day wins).
  const lastIso = getTodayLocationUpdatedAt();
  const lastWasToday = lastIso && new Date(lastIso).toLocaleDateString() === new Date().toLocaleDateString();
  if (current === scheduled) return false;
  if (lastWasToday && current) return false;
  setTodayLocation(scheduled);
  return true;
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
// Drill weekends (per employee.drillDates) don't break the streak — they pause it.
export function getCurrentStreak(employeeId = null) {
  const goal = getDailyGoal();
  if (goal <= 0) return 0;
  let drillDates = new Set();
  if (employeeId) {
    const emp = getEmployees().find((e) => e.id === employeeId);
    drillDates = new Set(emp?.drillDates || []);
  }
  let streak = 0;
  for (let i = 1; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateIso = d.toISOString().slice(0, 10); // YYYY-MM-DD
    // Drill day: skip without breaking the streak
    if (drillDates.has(dateIso)) continue;
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

// ── My last N drinks (for the "Last 5 drinks I made" card) ──
// Reads today's drink log + yesterday's if today is light, filtered by name.
export function getMyRecentDrinks(name, limit = 5) {
  if (!name) return [];
  const out = [];
  for (let i = 0; i < 3 && out.length < limit; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const raw = localStorage.getItem(`quez_drink_log_${dateKeyCompact(d)}`);
    if (!raw) continue;
    try {
      const log = JSON.parse(raw);
      // Most recent first within each day's log
      const mine = log.filter((it) => it.takenBy === name).reverse();
      out.push(...mine);
    } catch {}
  }
  return out.slice(0, limit);
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
  return { drinks };
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
// Optional `endDaysAgo` lets callers compare to the same window one year ago
// (e.g., daysBack=7, endDaysAgo=365 → last week of last year).
export function getDrinkReportRange(daysBack = 7, endDaysAgo = 0) {
  const tally = {};
  let total = 0;
  for (let i = 0; i < daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i - endDaysAgo);
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

// ── My drink count today ──
export function getMyDrinkCountToday(name) {
  if (!name) return 0;
  return getTodayDrinkLog().filter((d) => d.takenBy === name).length;
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
  { id: 'cups_8',      name: '8oz kids cups',      unit: 'box', par: 1, onHand: 1, category: 'Cups & Lids' },
  { id: 'cups_12',     name: '12oz cups',          unit: 'box', par: 2, onHand: 2, category: 'Cups & Lids' },
  { id: 'cups_16',     name: '16oz cups',          unit: 'box', par: 2, onHand: 2, category: 'Cups & Lids' },
  { id: 'lids',        name: 'Lids (both sizes)',  unit: 'box', par: 2, onHand: 2, category: 'Cups & Lids' },
  { id: 'sleeves',     name: 'Hot sleeves',        unit: 'box', par: 1, onHand: 1, category: 'Cups & Lids' },
  { id: 'whip',        name: 'Whipped cream',      unit: 'can', par: 4, onHand: 4, category: 'Toppings' },
];

export function getInventory() {
  // Always return a fresh copy. The DEFAULT array was being mutated in-place
  // by deductInventoryForOrder when no saved inventory existed, polluting
  // subsequent calls and the Inventory screen's "reset to default" path.
  const cloneDefault = () => DEFAULT_INVENTORY_ITEMS.map((i) => ({ ...i }));
  const raw = localStorage.getItem(INVENTORY_KEY);
  if (!raw) return cloneDefault();
  try { return JSON.parse(raw); } catch { return cloneDefault(); }
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

// ─────────────────────────────────────────────────────────────────────────────
// Per-drink ingredient consumption → inventory deduction on Mark Complete.
// Square only tracks units (1 latte sold). Quez App owns the granularity:
// when a drink completes, deduct beans, milk, syrups, cups, lids in the
// appropriate fractional units so par-level alerts fire BEFORE a stockout.
// ─────────────────────────────────────────────────────────────────────────────

// House conversion constants — match the inventory unit definitions above.
const SHOTS_PER_LB     = 50;    // 1 shot ≈ 9g; 5 lb par ≈ 250 shots
const PUMPS_PER_BOTTLE = 100;   // 0.25 oz pump × 25 oz bottle
const OZ_PER_GAL       = 128;
const OZ_PER_QT        = 32;
const CUPS_PER_BOX     = 200;   // typical 200-count case
const LIDS_PER_BOX     = 400;
const WHIPS_PER_CAN    = 50;
const COLD_BREW_OZ_PER_DRINK = { '8oz': 6,  '12oz': 8,  '16oz': 10 };
const MILK_OZ_PER_DRINK      = { '8oz': 6,  '12oz': 8,  '16oz': 10 };
const SHOTS_PER_DRINK        = { '8oz': 1,  '12oz': 2,  '16oz': 3 };
const SYRUP_PUMPS_PER_DRINK  = { '8oz': 1,  '12oz': 2,  '16oz': 3 };
const CUP_INVENTORY_ID       = { '8oz': 'cups_8', '12oz': 'cups_12', '16oz': 'cups_16' };

function _resolveMilkInventoryId(modifiers) {
  if (modifiers.includes('milk_none')) return null;
  if (modifiers.includes('milk_oat'))    return 'milk_oat';
  if (modifiers.includes('milk_almond')) return 'milk_almond';
  if (modifiers.includes('milk_2pct'))   return 'milk_2pct';
  if (modifiers.includes('milk_skim'))   return 'milk_2pct'; // no separate skim line
  return 'milk_whole';
}

// Deduct ingredients for a single completed order. Skips practice orders.
// Imports drinkRecipes lazily so storage.js doesn't pull a UI-side data module
// up the chain (avoids a circular import).
export function deductInventoryForOrder(order) {
  if (!order || order.practice) return null;

  // Lazy import — drinkRecipes is a pure data file, safe to import here
  // eslint-disable-next-line global-require
  const { drinkRecipes } = require('../data/drinkRecipes');

  const inv = getInventory();
  const byId = Object.fromEntries(inv.map((i) => [i.id, i]));
  const deduct = (id, amount) => {
    const item = byId[id];
    if (!item || !amount) return;
    const next = Math.max(0, (item.onHand ?? item.par ?? 0) - amount);
    item.onHand = Math.round(next * 1000) / 1000;
  };

  order.items.forEach((it) => {
    const size = it.size || '12oz';
    const drink = drinkRecipes.find((d) => d.id === it.drinkId);
    if (!drink) return;
    const tags = drink.tags || {};
    const mods = it.modifiers || [];

    // Cup + lid (every drink)
    const cupInvId = CUP_INVENTORY_ID[size] || 'cups_12';
    deduct(cupInvId, 1 / CUPS_PER_BOX);
    deduct('lids', 1 / LIDS_PER_BOX);

    // Espresso shots — base + extras
    if (tags.usesEspresso) {
      let shots = SHOTS_PER_DRINK[size] || 2;
      if (mods.includes('shot_extra'))     shots += 1;
      if (mods.includes('shot_two_extra')) shots += 2;
      deduct('beans', shots / SHOTS_PER_LB);
    }

    // Milk (gallons for dairy, quarts for plant-based)
    if (tags.usesMilk) {
      const milkId = _resolveMilkInventoryId(mods);
      if (milkId) {
        const oz = MILK_OZ_PER_DRINK[size] || 8;
        const divisor = (milkId === 'milk_oat' || milkId === 'milk_almond') ? OZ_PER_QT : OZ_PER_GAL;
        deduct(milkId, oz / divisor);
      }
    }

    // Cold brew (gallons)
    if (tags.usesColdBrew) {
      const oz = COLD_BREW_OZ_PER_DRINK[size] || 8;
      deduct('cold_brew', oz / OZ_PER_GAL);
    }

    // Syrups — base pumps for drinks that contain that ingredient,
    // plus +1 pump for each "extra" modifier (even on non-base drinks).
    const basePumps = SYRUP_PUMPS_PER_DRINK[size] || 2;
    const syrupPairs = [
      { tag: 'containsHoney',     extra: 'extra_honey',     id: 'syrup_honey' },
      { tag: 'containsVanilla',   extra: 'extra_vanilla',   id: 'syrup_van'   },
      { tag: 'containsCaramel',   extra: 'extra_caramel',   id: 'syrup_car'   },
      { tag: 'containsCinnamon',  extra: 'extra_cinnamon',  id: 'syrup_cin'   },
      { tag: 'containsLavender',  extra: 'extra_lavender',  id: 'syrup_lav'   },
    ];
    syrupPairs.forEach(({ tag, extra, id }) => {
      let pumps = tags[tag] ? basePumps : 0;
      if (mods.includes(extra)) pumps += 1;
      if (pumps > 0) deduct(id, pumps / PUMPS_PER_BOTTLE);
    });
    // Mocha sauce — covers white chocolate and chocolate variants
    {
      let pumps = (tags.containsWhiteChocolate || tags.containsChocolate) ? basePumps : 0;
      if (mods.includes('extra_mocha')) pumps += 1;
      if (pumps > 0) deduct('syrup_mocha', pumps / PUMPS_PER_BOTTLE);
    }

    // Whipped cream
    if (tags.containsWhip || mods.includes('whip')) {
      deduct('whip', 1 / WHIPS_PER_CAN);
    }
  });

  saveInventory(inv);
  return inv;
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
// logs, completed-order history, and per-day waste logs grow linearly
// forever — somewhere around month 6–12 the browser starts refusing writes
// silently and drinks stop saving.
//
// Strategy:
//   • Drinks  → keep 90 days of raw daily logs (so reports + waste-detail UI
//                still work), then collapse older days into a per-month rollup
//                that just stores `{drinkId, size, prepType, count}`. Owner
//                still sees "January sold 412 honey mochas" forever.
//   • Waste   → keep 90 days raw, then per-month rollup `{drinkId, reason,
//                count}`. Lets the owner spot patterns over time.
//   • Flagged items, daily checklists, periodic checklists, per-day order
//     seq counters → just delete past retention; nothing of audit value is
//     lost (submitted checklists exist in audit log + email reports).
//
// Runs at most once per calendar day. Fires from AppContext on boot.
// ============================================================

const PRUNE_LAST_KEY = 'quez_last_prune_at';

const RETENTION_DAYS = {
  drinkLog:          90,
  completedOrders:   90,
  cancelledOrders:   90,
  orderSeq:          30,
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
    cancelledOrders:  prunePerDayKey('quez_cancelled_orders_', RETENTION_DAYS.cancelledOrders, now),
    orderSeq:         prunePerDayKey('quez_order_seq_',        RETENTION_DAYS.orderSeq,        now),
    wasteLogs:        pruneWasteLogs(now),
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