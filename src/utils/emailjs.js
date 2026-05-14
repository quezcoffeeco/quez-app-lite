import { getSettings, storageGet, storageSet } from './storage';

const QUEUE_KEY = 'emailQueue';
function getQueue() { return storageGet(QUEUE_KEY) || []; }
function enqueue(payload) {
  const queue = getQueue();
  queue.push({ ...payload, queuedAt: new Date().toISOString() });
  storageSet(QUEUE_KEY, queue);
}

async function drainQueue(serviceId, templateId, publicKey) {
  const queue = getQueue();
  if (!queue.length) return;
  const remaining = [];
  for (const item of queue) {
    try {
      await window.emailjs.send(serviceId, templateId, item.templateParams, publicKey);
    } catch { remaining.push(item); }
  }
  storageSet(QUEUE_KEY, remaining);
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
  try {
    await drainQueue(serviceId, templateId, publicKey);
    await window.emailjs.send(serviceId, templateId, params, publicKey);
    return { ok: true };
  } catch (err) {
    enqueue({ subject, templateParams: params });
    return { ok: false, reason: 'send-error', err };
  }
}

export async function sendClockInEmail({ name, role, location, clockInTime }) {
  const date = new Date(clockInTime);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return sendQuezEmail({
    subject: `Clock-In: ${name} – ${dateStr}`,
    templateParams: {
      event_type: 'Clock-In',
      employee_name: name,
      employee_role: role,
      location,
      date: dateStr,
      time: timeStr,
      message: `${name} (${role}) clocked in at ${timeStr} on ${dateStr} at ${location}.`,
    },
  });
}

export async function sendClockOutEmail({ name, role, location, clockInTime, clockOutTime }) {
  const inDate = new Date(clockInTime);
  const outDate = new Date(clockOutTime);
  const durationMs = outDate - inDate;
  const hours = Math.floor(durationMs / 3_600_000);
  const minutes = Math.floor((durationMs % 3_600_000) / 60_000);
  const dateStr = outDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const inTimeStr = inDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const outTimeStr = outDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return sendQuezEmail({
    subject: `Clock-Out: ${name} – ${dateStr}`,
    templateParams: {
      event_type: 'Clock-Out',
      employee_name: name,
      employee_role: role,
      location,
      date: dateStr,
      clock_in_time: inTimeStr,
      clock_out_time: outTimeStr,
      shift_duration: `${hours}h ${minutes}m`,
      message: `${name} (${role}) clocked out at ${outTimeStr}. Shift: ${hours}h ${minutes}m.`,
    },
  });
}
