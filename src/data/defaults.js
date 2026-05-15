// ============================================================
// QUEZ APP LITE — Default Seed Data
// Applied on first launch if localStorage is empty.
// ============================================================

export const DEFAULT_SETTINGS = {
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  ownerEmail: 'support@quezcoffeeco.com',
  locations: ['Council Bluffs — Main'],
  employees: [
    {
      id: 'emp_ryan',
      name: 'Ryan Rodriguez',
      role: 'owner',
      pin: '1943',       // Owner PIN — change in Settings after first login
      active: true,
      trainingBypass: true,
    },
  ],
  openingUnlockTime: '05:30',  // 5:30 AM
  closingUnlockTime: '13:00',  // 1:00 PM
  timeLockEnabled: true,
  language: 'en',
};

// ── Apply defaults on first launch ───────────────────────
// Call this once at app startup (e.g. in index.js or App.jsx useEffect).
export const applyDefaultsIfNeeded = () => {
  const existing = localStorage.getItem('quez_settings');
  if (!existing) {
    localStorage.setItem('quez_settings', JSON.stringify(DEFAULT_SETTINGS));
    console.log('[Quez] Default settings applied.');
  }
};
