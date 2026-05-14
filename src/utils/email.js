// Quez App Lite - EmailJS Utility
import emailjs from '@emailjs/browser';
import { load } from './storage';

const getCredentials = () => {
  const settings = load('quez_settings', {});
  return {
    serviceId: settings.emailjs_service_id || '',
    templateId: settings.emailjs_template_id || '',
    publicKey: settings.emailjs_public_key || '',
  };
};

export const sendEmail = async (templateParams) => {
  const { serviceId, templateId, publicKey } = getCredentials();

  if (!serviceId || !templateId || !publicKey) {
    console.warn('Quez Email: EmailJS not configured yet. Email queued.');
    queueEmail(templateParams);
    return;
  }

  try {
    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Quez Email: Sent successfully', templateParams.subject || '');
  } catch (err) {
    console.error('Quez Email: Send failed, queuing', err);
    queueEmail(templateParams);
  }
};

const queueEmail = (templateParams) => {
  const queue = JSON.parse(localStorage.getItem('quez_email_queue') || '[]');
  queue.push({ params: templateParams, timestamp: new Date().toISOString() });
  localStorage.setItem('quez_email_queue', JSON.stringify(queue));
};

export const flushEmailQueue = async () => {
  const queue = JSON.parse(localStorage.getItem('quez_email_queue') || '[]');
  if (queue.length === 0) return;

  const { serviceId, templateId, publicKey } = getCredentials();
  if (!serviceId || !templateId || !publicKey) return;

  const remaining = [];
  for (const item of queue) {
    try {
      await emailjs.send(serviceId, templateId, item.params, publicKey);
      console.log('Quez Email: Flushed queued email');
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem('quez_email_queue', JSON.stringify(remaining));
};

export const initEmailFlush = () => {
  window.addEventListener('online', flushEmailQueue);
  flushEmailQueue();
};
