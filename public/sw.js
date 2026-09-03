// Service Worker for MyBox Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications from server / Appwrite Messaging / FCM
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'MyBox Notifikasi', body: event.data.text() };
    }
  }

  // Handle Appwrite Messaging & FCM payload structures
  const notificationData = data.notification || data.data || data;
  const title = notificationData.title || data.title || 'MyBox Notifikasi';
  const body = notificationData.body || data.body || notificationData.message || 'Pesan notifikasi baru dari MyBox.';
  const icon = notificationData.icon || data.icon || '/favicon.ico';

  const options = {
    body: body,
    icon: icon,
    badge: '/favicon.ico',
    data: data.url || '/',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle click on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || '/');
      }
    })
  );
});
