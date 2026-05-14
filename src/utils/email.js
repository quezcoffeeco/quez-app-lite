// src/utils/email.js
// EmailJS integration — all auto-send triggers flow through here
// Settings (Service ID, Template ID, Public Key) are read from localStorage each call
// so the owner can update credentials in Settings without restarting the app

import emailjs from 'emailjs-com';
import { loadFromStorage } from './storage';

export const EMAIL_TYPES = {
  CLOCK_IN: 'clock_in',
  CLOCK_OUT: 'clock_out',
  CHECKLIST_SUBMISSION: 'checklist_submission',
  OUT_OF_RANGE_ALERT: 'out_of_range_alert',
  DRINK_COUNT_SUMMARY: 'drink_count_summary',
  SCHEDULE: 'schedule',
  RECIPE_ISSUE: 'recipe_issue',
  TRAINING_COMPLETE: 'training_complete',
};

function getEmailJSConfig() {
  const settings = loadFromStorage('settings') || {};
  return {
    serviceId: settings.emailjsServiceId || '',
    templateId: settings.emailjsTemplateId || '',
    publicKey: settings.emailjsPublicKey || '',
    ownerEmail: settings.ownerEmail || 'support@quezcoffeeco.com',
  };
}

// Queue for offline support — stores unsent emails in localStorage
const QUEUE_KEY = 'emailQueue';

function enqueueEmail(type, params) {
  const queue = loadFromStorage(QUEUE_KEY) || [];
  queue.push({ type, params, queuedAt: new Date().toISOString(), id: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function dequeueEmail(id) {
  const queue = loadFromStorage(QUEUE_KEY) || [];
  const updated = queue.filter(e => e.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

// Build the template params object for EmailJS
// EmailJS templates use {{variable_name}} syntax
// One template handles all email types — the subject and body are constructed here
function buildTemplateParams(type, data, ownerEmail) {
  const base = {
    to_email: ownerEmail,
    reply_to: ownerEmail,
    location: data.location || 'Council Bluffs',
    operator: data.operator || 'Unknown',
    date: data.date || new Date().toLocaleDateString(),
    time: data.time || new Date().toLocaleTimeString(),
  };

  switch (type) {
    case EMAIL_TYPES.CLOCK_IN:
      return {
        ...base,
        subject: `[Quez] Clock-In — ${data.operator} — ${data.date}`,
        body: [
          'CLOCK-IN RECORD',
          '─────────────────────────',
          `Employee: ${data.operator}`,
          `Role: ${data.role || 'Unknown'}`,
          `Location: ${data.location}`,
          `Date: ${data.date}`,
          `Time: ${data.time}`,
          '─────────────────────────',
          'Quez Coffee Co. Operations Platform',
        ].join('\n'),
      };

    case EMAIL_TYPES.CLOCK_OUT:
      return {
        ...base,
        subject: `[Quez] Clock-Out — ${data.operator} — ${data.date}`,
        body: [
          'CLOCK-OUT RECORD',
          '─────────────────────────',
          `Employee: ${data.operator}`,
          `Location: ${data.location}`,
          `Date: ${data.date}`,
          `Clock-In: ${data.clockInTime}`,
          `Clock-Out: ${data.clockOutTime}`,
          `Shift Duration: ${data.duration}`,
          '─────────────────────────',
          'Quez Coffee Co. Operations Platform',
        ].join('\n'),
      };

    case EMAIL_TYPES.OUT_OF_RANGE_ALERT:
      return {
        ...base,
        subject: `⚠ [Quez] OUT-OF-RANGE ALERT — ${data.item} — ${data.location}`,
        body: [
          '⚠ OUT-OF-RANGE READING ALERT',
          '─────────────────────────',
          `Item: ${data.item}`,
          `Reading: ${data.reading}`,
          `Issue: ${data.reason}`,
          `Reference: ${data.reference || 'See E-02 Operational Checklist'}`,
          '',
          `Operator: ${data.operator}`,
          `Location: ${data.location}`,
          `Date: ${data.date}`,
          `Time: ${data.time}`,
          '─────────────────────────',
          'ACTION REQUIRED: Correct immediately. Note corrective action in checklist.',
          '─────────────────────────',
          'Quez Coffee Co. Operations Platform',
        ].join('\n'),
      };

    case EMAIL_TYPES.CHECKLIST_SUBMISSION:
      return {
        ...base,
        subject: `[Quez] ${data.checklistType} Checklist — ${data.operator} — ${data.date}${data.flaggedCount > 0 ? ` — ⚠ ${data.flaggedCount} FLAG(S)` : ''}`,
        body: [
          data.log || '(No log data)',
          '',
          data.flaggedCount > 0
            ? `⚠ FLAGGED ITEMS: ${data.flaggedItems}`
            : '✓ No flags — all readings within range.',
          '─────────────────────────',
          'Quez Coffee Co. Operations Platform',
        ].join('\n'),
      };

    case EMAIL_TYPES.DRINK_COUNT_SUMMARY:
      return {
        ...base,
        subject: `[Quez] End of Day Drink Count — ${data.location} — ${data.date}`,
        body: [
          'END OF DAY DRINK COUNT',
          '─────────────────────────',
          `Total Cups: ${data.totalCups}`,
          '',
          'Breakdown:',
          ...(data.breakdown || []).map(b => `  ${b.name}: ${b.count}`),
          '',
          `Operator: ${data.operator}`,
          `Location: ${data.location}`,
          `Date: ${data.date}`,
          '─────────────────────────',
          'Quez Coffee Co. Operations Platform',
        ].join('\n'),
      };

    case EMAIL_TYPES.SCHEDULE:
      return {
        to_email: data.recipients || ownerEmail,
        reply_to: ownerEmail,
        subject: `[Quez] Schedule — ${data.weekOf || data.date}`,
        body: data.scheduleText || '(No schedule data)',
      };

    case EMAIL_TYPES.RECIPE_ISSUE:
      return {
        ...base,
        subject: `[Quez] Recipe Issue Report — ${data.drinkName}`,
        body: [
          'RECIPE ISSUE REPORT',
          '─────────────────────────',
          `Drink: ${data.drinkName}`,
          `Issue: ${data.issueText}`,
          `Reporter: ${data.operator}`,
          `Date: ${data.date}`,
          `Time: ${data.time}`,
          '─────────────────────────',
          'Quez Coffee Co. Operations Platform',
        ].join('\n'),
      };

    case EMAIL_TYPES.TRAINING_COMPLETE:
      return {
        ...base,
        subject: `[Quez] Training Complete — ${data.trainee} — Phase ${data.phase}`,
        body: [
          'TRAINING COMPLETION NOTICE',
          '─────────────────────────',
          `Trainee: ${data.trainee}`,
          `Phase Completed: Phase ${data.phase}`,
          `Completed On: ${data.date}`,
          `Trainer/Verifier: ${data.trainer || 'System'}`,
          '─────────────────────────',
          'Review training record and approve role upgrade if all phases complete.',
          '─────────────────────────',
          'Quez Coffee Co. Operations Platform',
        ].join('\n'),
      };

    default:
      return {
        ...base,
        subject: `[Quez] Notification — ${data.date}`,
        body: JSON.stringify(data, null, 2),
      };
  }
}

// Main send function — called throughout the app
// Falls back to queue if offline, flushes queue when back online
export async function sendEmail(type, data) {
  const config = getEmailJSConfig();

  if (!config.serviceId || !config.templateId || !config.publicKey) {
    console.warn('EmailJS not configured. Email queued for when credentials are set.');
    enqueueEmail(type, data);
    return;
  }

  const templateParams = buildTemplateParams(type, data, config.ownerEmail);

  // Check online status
  if (!navigator.onLine) {
    enqueueEmail(type, data);
    return;
  }

  try {
    await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );
  } catch (err) {
    console.error('EmailJS send failed, queuing:', err);
    enqueueEmail(type, data);
    throw err; // re-throw so caller can handle UI feedback
  }
}

// Call this on app load and on 'online' event to flush queued emails
export async function flushEmailQueue() {
  if (!navigator.onLine) return;
  const queue = loadFromStorage(QUEUE_KEY) || [];
  if (queue.length === 0) return;

  const config = getEmailJSConfig();
  if (!config.serviceId || !config.templateId || !config.publicKey) return;

  for (const item of queue) {
    try {
      const templateParams = buildTemplateParams(item.type, item.params, config.ownerEmail);
      await emailjs.send(config.serviceId, config.templateId, templateParams, config.publicKey);
      dequeueEmail(item.id);
    } catch (err) {
      console.error('Queue flush failed for item', item.id, err);
      // Leave in queue, will retry next flush
    }
  }
}

// Register online listener once
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushEmailQueue();
  });
}
