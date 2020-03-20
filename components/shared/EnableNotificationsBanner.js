import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const DISMISS_KEY = 'push-banner-dismissed';

export default function EnableNotificationsBanner() {
  const { user } = useAuth();
  const { supported, permission, subscribed, busy, enable } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (!user || !supported) return null;
  if (permission !== 'default') return null;
  if (subscribed) return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (_) { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 360,
        background: '#0f172a',
        color: '#e2e8f0',
        border: '1px solid #1e293b',
        borderRadius: 10,
        padding: '12px 14px',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Get notified about new messages</div>
        <div style={{ color: '#94a3b8' }}>
          Enable browser notifications so you don’t miss messages when this tab is closed.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          style={{
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Enabling…' : 'Enable'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: '#94a3b8',
            border: 'none',
            padding: '4px 8px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
