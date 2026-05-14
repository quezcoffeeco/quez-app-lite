export const DEFAULT_SETTINGS = {
  ownerEmail: 'support@quezcoffeeco.com',
  emailjs: { serviceId: '', templateId: '', publicKey: '' },
  locations: ['Council Bluffs – Trailer'],
  timeLocks: {
    openingUnlockTime: '05:30',
    closingUnlockTime: '18:00',
    openingLockEnabled: true,
    closingLockEnabled: true,
  },
  language: 'en',
  trainingBypass: {},
};

export const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-owner-001',
    name: 'Ryan Rodriquez',
    role: 'owner',
    pin: '1943',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_MENU = [];
