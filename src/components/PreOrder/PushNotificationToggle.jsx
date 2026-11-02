import { useState, useEffect } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  getExistingSubscription,
  registerPushNotification,
  unsubscribePushNotification,
  sendTestPushNotification,
  triggerCronCheck,
} from '../../utils/webPush';

export default function PushNotificationToggle({
  role = 'biller',
  staffId = '',
  staffName = '',
  compact = false,
}) {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const isSup = isPushSupported();
    setSupported(isSup);
    if (!isSup) return;

    setPermission(getNotificationPermission());

    getExistingSubscription().then((sub) => {
      setIsSubscribed(Boolean(sub));
    });
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await registerPushNotification({
        role,
        staffId,
        staffName,
      });

      if (res.success) {
        setIsSubscribed(true);
        setPermission('granted');
        setStatusMsg('✅ Push notifications enabled! You will receive incoming pre-orders instantly.');
        setTimeout(() => setStatusMsg(''), 4000);
      } else if (res.reason === 'denied') {
        setPermission('denied');
        setStatusMsg('⚠️ Permission was blocked in browser settings. Please allow notifications.');
      }
    } catch (err) {
      setStatusMsg('❌ Failed to subscribe: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await unsubscribePushNotification(staffId);
      setIsSubscribed(false);
      setStatusMsg('Unsubscribed from push notifications.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPush = async () => {
    setLoading(true);
    try {
      setStatusMsg('Sending test alert...');
      const res = await sendTestPushNotification(
        '🔔 Thenisai Pre-Order Alert Test',
        'Web push is working! Incoming customer pre-orders will pop up right here.'
      );
      if (res.success) {
        setStatusMsg('✅ Notification dispatched! Check your desktop / screen banner.');
      } else {
        setStatusMsg('⚠️ Error sending test: ' + (res.error || 'Server error'));
      }
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      setStatusMsg('❌ Test failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCronCheck = async () => {
    setLoading(true);
    try {
      setStatusMsg('Running cron pre-order check on server...');
      const res = await triggerCronCheck();
      if (res.success) {
        if (res.count > 0 && res.notified) {
          setStatusMsg(`⏰ Cron check complete: Found ${res.count} pending pre-orders. Reminder push dispatched!`);
        } else if (res.count > 0 && res.throttled) {
          setStatusMsg(`⏰ Cron check: ${res.count} pending pre-orders (already notified recently).`);
        } else {
          setStatusMsg('⏰ Cron check complete: 0 pending pre-orders at this moment.');
        }
      } else {
        setStatusMsg('⚠️ Cron check error: ' + (res.message || 'Server error'));
      }
      setTimeout(() => setStatusMsg(''), 6000);
    } catch (err) {
      setStatusMsg('❌ Cron trigger failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', padding: '4px 8px' }}>
        Web Push not supported on this browser (requires HTTPS or localhost).
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        {isSubscribed ? (
          <>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                borderRadius: '999px',
                fontSize: '11.5px',
                fontWeight: 600,
              }}
              title="Push notifications active for pre-orders"
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Push Alerts Active
            </span>
            <button
              type="button"
              onClick={handleTestPush}
              disabled={loading}
              style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Test
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔔 Enable Pre-Order Push
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#FAF7F2',
        border: '1px solid #EFE8DE',
        borderRadius: '12px',
        padding: '14px 18px',
        margin: '12px 0 18px 0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: isSubscribed ? '#dcfce7' : '#fef3c7',
            color: isSubscribed ? '#15803d' : '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
          }}
        >
          {isSubscribed ? '🔔' : '🔕'}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '13.5px', color: '#1C0F08' }}>
              {isSubscribed ? 'Pre-Order Push Notifications: Active' : 'Enable Web Push for Customer Pre-Orders'}
            </strong>
            <span
              style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 700,
                background: isSubscribed ? '#ecfdf5' : '#fffbeb',
                color: isSubscribed ? '#065f46' : '#92400e',
                border: isSubscribed ? '1px solid #6ee7b7' : '1px solid #fde68a',
              }}
            >
              {isSubscribed ? 'LIVE' : 'ACTION REQUIRED'}
            </span>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#7A6658', maxWidth: '620px' }}>
            {isSubscribed
              ? 'This device will receive instant sound & vibration alerts when customers place online pre-orders. Background cron monitor also sweeps every 2 minutes for unacknowledged orders.'
              : 'Never miss an order! Get real-time heads-up notification banners on this device the moment a customer submits a zero-wait pickup order.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {!isSubscribed ? (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#1C0F08',
              color: '#FAF7F2',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(28, 15, 8, 0.15)',
            }}
          >
            🔔 Enable Notifications on This Device
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleTestPush}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: '#FAF7F2',
                color: '#1C0F08',
                border: '1px solid #D5C7B7',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔔 Test Alert
            </button>

            <button
              type="button"
              onClick={handleRunCronCheck}
              disabled={loading}
              title="Trigger background cron job to sweep for unacknowledged orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: '#FAF7F2',
                color: '#8C6218',
                border: '1px solid #EFE8DE',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⏰ Run Cron Check
            </button>

            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={loading}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                color: '#9ca3af',
                border: 'none',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Disable
            </button>
          </>
        )}
      </div>

      {statusMsg && (
        <div
          style={{
            width: '100%',
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '6px',
            background: statusMsg.startsWith('✅') ? '#ecfdf5' : '#fffbeb',
            color: statusMsg.startsWith('✅') ? '#065f46' : '#92400e',
            border: statusMsg.startsWith('✅') ? '1px solid #a7f3d0' : '1px solid #fde68a',
          }}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
}

