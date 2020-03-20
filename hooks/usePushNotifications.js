import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  isPushSupported,
  subscribePush,
  unsubscribePush,
  ensureRegistration,
  getExistingSubscription,
} from '../lib/push';

export function usePushNotifications() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ok = isPushSupported();
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!supported || !user) return;
    let cancelled = false;

    (async () => {
      try {
        if (Notification.permission === 'granted') {
          await ensureRegistration();
          const sub = await getExistingSubscription();
          if (!cancelled) setSubscribed(Boolean(sub));
        }
      } catch (err) {
        if (!cancelled) setError(err);
      }
    })();

    return () => { cancelled = true; };
  }, [supported, user]);

  const enable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return;
      await subscribePush();
      setSubscribed(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await unsubscribePush();
      setSubscribed(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }, []);

  return { supported, permission, subscribed, busy, error, enable, disable };
}
