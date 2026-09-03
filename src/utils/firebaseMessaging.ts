// Firebase Cloud Messaging helper — generates REAL FCM Registration Token
// that Appwrite Messaging can send push notifications to.

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDwQUBZaSWle5rT8QQ-50VtNfGB87M-neQ",
  authDomain: "apk-skripsi.firebaseapp.com",
  projectId: "apk-skripsi",
  storageBucket: "apk-skripsi.appspot.com",
  messagingSenderId: "963264768111",
  appId: "1:963264768111:web:6ceab55be9f5d9929f459a"
};

// VAPID Key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const FIREBASE_VAPID_KEY = 'BMBeQxA8l_c1aYUUcR0wKetQ8qnvpPIEJ3fFc2oylwGMSbGlK96vUz384MLShlG_cfh-2MbjA7JZ6_UfXRTqF7E';

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

// Get a real FCM Registration Token via Firebase JS SDK
export async function getRealFCMToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging not supported in this browser.');
      return null;
    }

    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    // Register firebase-messaging-sw.js as service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ Real FCM Token obtained:', token.slice(0, 30) + '...');
      return token;
    }

    console.warn('No FCM token received. Check Firebase config and VAPID key.');
    return null;
  } catch (err: any) {
    console.error('getRealFCMToken error:', err?.message || err);
    return null;
  }
}

// Remove FCM token from browser (for unsubscribe)
export async function removeFCMToken(): Promise<void> {
  try {
    const supported = await isSupported();
    if (!supported) return;
    const app = getFirebaseApp();
    const messaging = getMessaging(app);
    await deleteToken(messaging);
    console.log('✅ FCM token removed from browser.');
  } catch (err) {
    console.warn('removeFCMToken notice:', err);
  }
}
