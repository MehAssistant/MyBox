// Firebase Messaging Service Worker
// MUST be named firebase-messaging-sw.js and served from root (public/)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDwQUBZaSWle5rT8QQ-50VtNfGB87M-neQ",
  authDomain: "apk-skripsi.firebaseapp.com",
  projectId: "apk-skripsi",
  storageBucket: "apk-skripsi.appspot.com",
  messagingSenderId: "963264768111",
  appId: "1:963264768111:web:6ceab55be9f5d9929f459a"
});

const messaging = firebase.messaging();

// Handle background push messages from FCM
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'MyBox Notifikasi', {
    body: body || 'Ada pesan baru dari MyBox.',
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: payload.data
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
