// Thenisai Sweets — Service Worker for Web Push Notifications & Offline Capability
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// 1. Listen for Incoming Push Event (Google FCM / Apple APNs / Mozilla)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const title = data.title || '🔔 Thenisai Sweets Alert';
  const targetUrl = data.url || data.data?.url || '/#admin/billing/preorders';

  const options = {
    body: data.body || 'You have an important update regarding customer pre-orders.',
    icon: data.icon || '/images/branding/logo-icon.png',
    badge: data.badge || '/images/branding/logo-icon.png',
    tag: data.tag || 'thenisai-order-alert',
    renotify: true,
    requireInteraction: true, // Keeps banner on desktop until acknowledged
    vibrate: [250, 100, 250, 100, 250], // Haptic vibration on Android/mobile
    data: {
      url: targetUrl,
      ...(data.data || {}),
    },
    actions: [
      { action: 'open_order', title: '👁️ Open Pre-Order' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/#admin/billing/preorders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open on this origin, focus and navigate to target URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new tab/window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

