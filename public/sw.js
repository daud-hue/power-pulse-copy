// PowerPulse Service Worker - Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push events (from server-sent pushes)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PowerPulse Alert';
  const options = {
    body: data.body || 'Check your electricity balance.',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'powerpulse-alert',
    requireInteraction: data.requireInteraction || false,
    data: { url: data.url || '/' },
    actions: [
      { action: 'reload', title: '⚡ Reload Now' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If app is already open, focus it and post a message to open reload
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({ type: 'OPEN_RELOAD' });
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl + '?action=reload');
    })
  );
});

// Background sync / periodic check via postMessage from page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_BALANCE') {
    const { currentKwh, maxKwh, thresholds, daysRemaining } = event.data.payload;
    const percent = maxKwh > 0 ? (currentKwh / maxKwh) * 100 : 100;

    const sortedThresholds = [...(thresholds || [20, 10, 5])].sort((a, b) => b - a);
    const triggered = sortedThresholds.find(t => percent <= t);

    if (triggered) {
      const isUrgent = triggered <= 5;
      const title = isUrgent
        ? '🔴 CRITICAL: Electricity Almost Gone!'
        : triggered <= 10
        ? '🟡 Low Electricity Balance Warning'
        : '⚡ PowerPulse Low Balance Alert';

      const body = `Only ${percent.toFixed(0)}% remaining (${currentKwh.toFixed(1)} kWh) — approx ${Math.floor(daysRemaining)} day${Math.floor(daysRemaining) !== 1 ? 's' : ''} left. Tap to reload now.`;

      self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `threshold-${triggered}`,
        requireInteraction: isUrgent,
        data: { url: '/?action=reload' },
        actions: [
          { action: 'reload', title: '⚡ Reload Now' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });
    }
  }
});
