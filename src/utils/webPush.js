import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('[WebPush] Error checking existing subscription:', err);
    return null;
  }
}

/**
 * Register device for Web Push notifications
 * Prompts user, registers /sw.js, subscribes with VAPID key and posts subscription to backend
 */
export async function registerPushNotification({ role = 'all', staffId = '', staffName = '' } = {}) {
  if (!isPushSupported()) {
    console.warn('[WebPush] Push messaging is not supported in this browser.');
    return { success: false, reason: 'unsupported' };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[WebPush] Permission denied by user:', permission);
      return { success: false, reason: permission };
    }

    // 2. Register Service Worker at root scope
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 3. Fetch public VAPID key from backend
    const res = await api.get('/api/notifications/vapid-public-key');
    if (!res || !res.publicKey) {
      throw new Error('Failed to retrieve VAPID public key from backend server.');
    }
    const publicKey = res.publicKey;

    // 4. Subscribe with the browser's PushManager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    // 5. Send subscription to backend
    await api.post('/api/notifications/subscribe', {
      subscription,
      role,
      staffId,
      staffName,
    });

    console.log('✅ [WebPush] Successfully subscribed to Web Push alerts!');
    return { success: true, subscription };
  } catch (err) {
    console.error('[WebPush] Registration failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Unsubscribe device
 */
export async function unsubscribePushNotification(staffId = '') {
  if (!isPushSupported()) return { success: false };
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await api.post('/api/notifications/unsubscribe', { endpoint, staffId });
      }
    }
    return { success: true };
  } catch (err) {
    console.error('[WebPush] Unsubscribe error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send an immediate test notification to this device
 */
export async function sendTestPushNotification(title, body) {
  try {
    const sub = await getExistingSubscription();
    return await api.post('/api/notifications/test', {
      subscription: sub,
      title: title || '🔔 Thenisai Push Alert Test',
      body: body || 'Real-time pre-order notifications are working on this device!',
    });
  } catch (err) {
    console.error('[WebPush] Test push error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Manually trigger backend cron job check
 */
export async function triggerCronCheck() {
  return await api.post('/api/notifications/trigger-cron-check');
}
