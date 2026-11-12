// PowerPulse Push Notification Manager

const SW_PATH = '/sw.js';

// Register the service worker
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
    return reg;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

// Get current permission state
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Send a balance check to the service worker (works even when tab is not focused)
export async function checkBalanceAndNotify({ currentKwh, maxKwh, thresholds, daysRemaining }) {
  if (getNotificationPermission() !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;

  const reg = await navigator.serviceWorker.ready;
  if (reg && reg.active) {
    reg.active.postMessage({
      type: 'CHECK_BALANCE',
      payload: { currentKwh, maxKwh, thresholds, daysRemaining },
    });
  }
}

// Show an immediate local notification (fallback, for when SW isn't needed)
export async function showLocalNotification(title, body, url = '/') {
  if (getNotificationPermission() !== 'granted') return;

  if (!('serviceWorker' in navigator)) {
    new Notification(title, { body, icon: '/favicon.ico' });
    return;
  }

  const reg = await navigator.serviceWorker.ready;
  if (reg) {
    reg.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'powerpulse-local',
      requireInteraction: false,
      data: { url },
      actions: [
        { action: 'reload', title: '⚡ Reload Now' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }
}

// Store which thresholds have been notified (so we don't spam)
const NOTIFIED_KEY = 'powerpulse_notified_thresholds';

export function getNotifiedThresholds() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
  } catch {
    return {};
  }
}

export function markThresholdNotified(threshold, cycleId) {
  const notified = getNotifiedThresholds();
  notified[`${cycleId}_${threshold}`] = Date.now();
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
}

export function wasThresholdNotified(threshold, cycleId) {
  const notified = getNotifiedThresholds();
  return !!notified[`${cycleId}_${threshold}`];
}

export function clearNotifiedThresholds(cycleId) {
  const notified = getNotifiedThresholds();
  const cleared = {};
  Object.keys(notified).forEach(key => {
    if (!key.startsWith(`${cycleId}_`)) {
      cleared[key] = notified[key];
    }
  });
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(cleared));
}