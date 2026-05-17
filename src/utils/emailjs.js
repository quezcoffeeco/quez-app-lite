import { getSettings, storageGet, storageSet } from './storage';

const QUEUE_KEY = 'emailQueue';
function getQueue() { return storageGet(QUEUE_KEY) || []; }
function enqueue(payload) {
  const queue = getQueue();
  queue.push({ ...payload, queuedAt: new Date().toISOString() });
  storageSet(QUEUE_KEY, queue);
}

// Returns { sent, remaining }. Sent is the count drained successfully. Remaining
// is the count that still failed (still in the queue afterwards).
async function drainQueue(serviceId, templateId, publicKey) {
  const queue = getQueue();
  if (!queue.length) return { sent: 0, remaining: 0 };
  const stillQueued = [];
  let sent = 0;
  for (const item of queue) {
    try {
      await window.emailjs.send(serviceId, templateId, item.templateParams, publicKey);
      sent += 1;
    } catch {
      stillQueued.push(item);
    }
  }
  storageSet(QUEUE_KEY, stillQueued);
  return { sent, remaining: stillQueued.length };
}

// Public read of the queue — for surfacing "N emails queued" on dashboards.
// Returns the queued items minus the message body (bodies can be tens of KB
// for backup emails; the listing only needs subject + timestamp).
export function getEmailQueue() {
  return getQueue().map(({ subject, queuedAt }) => ({ subject, queuedAt }));
}

// Drop a single queued email by index. Returns the dropped item subject, or
// null if the index was out of range.
export function deleteQueuedEmail(index) {
  const queue = getQueue();
  if (index < 0 || index >= queue.length) return null;
  const [dropped] = queue.splice(index, 1);
  storageSet(QUEUE_KEY, queue);
  return dropped?.subject || '';
}

// Wipe the entire queue. Returns the count removed.
export function clearEmailQueue() {
  const queue = getQueue();
  const count = queue.length;
  storageSet(QUEUE_KEY, []);
  return count;
}

// Manual retry — owner-triggered drain. Accepts an optional onProgress
// callback invoked after each send attempt with { sent, remaining, total }
// so the UI can show "Sending 5 of 23" during long batch retries.
export async function retryEmailQueue(onProgress) {
  const queue = getQueue();
  if (!queue.length) return { ok: true, sent: 0, remaining: 0, total: 0, reason: 'empty' };
  const total = queue.length;
  const settings = getSettings();
  const { serviceId, templateId, publicKey } = settings.emailjs || {};
  if (!serviceId || !templateId || !publicKey) {
    return { ok: false, sent: 0, remaining: total, total, reason: 'no-credentials' };
  }
  if (!navigator.onLine) {
    return { ok: false, sent: 0, remaining: total, total, reason: 'offline' };
  }
  if (!window.emailjs || typeof window.emailjs.send !== 'function') {
    return { ok: false, sent: 0, remaining: total, total, reason: 'sdk-missing' };
  }
  // Manual loop so we can emit progress (the shared drainQueue helper doesn't).
  const stillQueued = [];
  let sent = 0;
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      await window.emailjs.send(serviceId, templateId, item.templateParams, publicKey);
      sent += 1;
    } catch {
      stillQueued.push(item);
    }
    if (typeof onProgress === 'function') {
      onProgress({ sent, remaining: total - (i + 1), total, index: i + 1 });
    }
  }
  storageSet(QUEUE_KEY, stillQueued);
  const remaining = stillQueued.length;
  return { ok: remaining === 0, sent, remaining, total, reason: remaining === 0 ? 'all-sent' : 'partial' };
}

export async function sendQuezEmail({ subject, templateParams }) {
  const settings = getSettings();
  const { serviceId, templateId, publicKey } = settings.emailjs || {};
  const params = {
    to_email: settings.ownerEmail || 'support@quezcoffeeco.com',
    subject,
    ...templateParams,
  };
  if (!serviceId || !templateId || !publicKey) {
    enqueue({ subject, templateParams: params });
    return { ok: false, reason: 'no-credentials' };
  }
  if (!navigator.onLine) {
    enqueue({ subject, templateParams: params });
    return { ok: false, reason: 'offline' };
  }
  if (!window.emailjs || typeof window.emailjs.send !== 'function') {
    enqueue({ subject, templateParams: params });
    return { ok: false, reason: 'sdk-missing' };
  }
  try {
    await drainQueue(serviceId, templateId, publicKey);
    await window.emailjs.send(serviceId, templateId, params, publicKey);
    return { ok: true };
  } catch (err) {
    enqueue({ subject, templateParams: params });
    return { ok: false, reason: 'send-error', err };
  }
}

// Maps a sendQuezEmail() result to a user-facing message + variant.
// Variants: 'sent' (success) | 'queued' (deferred — credentials missing or
// offline) | 'error' (network or SDK failure — also queued for retry).
export function sendStatusMessage(result, lang = 'en') {
  if (result && result.ok) {
    return {
      variant: 'sent',
      text: lang === 'es' ? '✓ Enviado' : '✓ Sent',
    };
  }
  const reason = result?.reason;
  if (reason === 'no-credentials' || reason === 'sdk-missing') {
    return {
      variant: 'queued',
      text: lang === 'es'
        ? 'EmailJS no configurado — en cola para reintentar'
        : 'EmailJS not configured — queued for retry',
    };
  }
  if (reason === 'offline') {
    return {
      variant: 'queued',
      text: lang === 'es'
        ? 'Sin conexión — en cola para reintentar'
        : 'Offline — queued for retry',
    };
  }
  return {
    variant: 'error',
    text: lang === 'es'
      ? 'Falló el envío — en cola para reintentar'
      : 'Send failed — queued for retry',
  };
}
