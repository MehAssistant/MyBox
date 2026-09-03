// Web Push Notification Helper for MyBox
import { savePushSubscription, deletePushSubscription } from '../services/appwrite';
import { getRealFCMToken, removeFCMToken } from './firebaseMessaging';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Helper: Detect readable device & browser name
export const getDeviceName = (): string => {
  if (typeof navigator === 'undefined') return 'Perangkat Browser';
  const ua = navigator.userAgent;

  let os = 'OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  return `${browser} on ${os}`;
};

// Register push notifications using real FCM Token from Firebase SDK
export const subscribeToNotifications = async (
  userId?: string
): Promise<{ success: boolean; subscription?: any; message: string }> => {
  if (!isNotificationSupported()) {
    return { success: false, message: 'Browser tidak mendukung Push Notification.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Izin notifikasi belum diberikan atau ditolak.' };
    }

    // Get REAL FCM Registration Token via Firebase JS SDK
    const fcmToken = await getRealFCMToken();

    if (!fcmToken) {
      return {
        success: false,
        message: 'Gagal mendapatkan token FCM. Pastikan Firebase config sudah diisi dengan benar.'
      };
    }

    const deviceName = getDeviceName();
    const subscriptionData = {
      endpoint: fcmToken,  // Store raw FCM token directly
      keys: { auth: '', p256dh: '' }
    };

    // Save to Appwrite Database (col_push_subscribers) + Native Push Target
    if (userId) {
      await savePushSubscription(userId, subscriptionData, deviceName);
    }

    // Save local flag
    const key = userId ? `mb_push_enabled_${userId}` : 'mb_push_enabled';
    const wasAlreadyActive = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, 'true');

    // Only show welcome notification the FIRST TIME (not on every app open / re-register)
    if (!wasAlreadyActive) {
      sendNotification(
        '🔔 Notifikasi MyBox Aktif!',
        `Perangkat "${deviceName}" berhasil dipasangkan!`
      );
    }

    return {
      success: true,
      subscription: subscriptionData,
      message: `Notifikasi aktif & siap menerima pesan dari Appwrite!`
    };
  } catch (err: any) {
    console.error('Failed to subscribe notifications:', err);
    return { success: false, message: err?.message || 'Gagal mengaktifkan notifikasi.' };
  }
};

// Unsubscribe and remove from Appwrite Database
export const unsubscribeFromNotifications = async (
  userId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await removeFCMToken();
    if (userId) {
      await deletePushSubscription(userId);
    }
    const key = userId ? `mb_push_enabled_${userId}` : 'mb_push_enabled';
    localStorage.removeItem(key);

    return {
      success: true,
      message: 'Notifikasi dinonaktifkan dan data perangkat dihapus dari database.'
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Gagal menonaktifkan notifikasi.' };
  }
};

// Show local notification immediately via Service Worker
export const sendNotification = async (title: string, body: string) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100]
    } as any);
  } catch (e) {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (err) {
      console.warn('Notification display fallback:', err);
    }
  }
};
