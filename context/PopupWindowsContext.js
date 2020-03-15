import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

export const PopupWindowsContext = createContext(null);

const MAX_WINDOWS = 4;
const storageKey = (userId) => `popupWindows:${userId}`;

export function PopupWindowsProvider({ children }) {
  const { user } = useAuth();
  const [windows, setWindows] = useState([]);
  const hydratedFor = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user) {
      setWindows([]);
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === user._id) return;
    try {
      const raw = window.localStorage.getItem(storageKey(user._id));
      const now = Date.now();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWindows(
            parsed
              .filter((w) => w && typeof w.roomId === 'string')
              .slice(-MAX_WINDOWS)
              .map((w, i) => ({
                roomId: w.roomId,
                collapsed: !!w.collapsed,
                openedAt: now + i,
              }))
          );
        } else {
          setWindows([]);
        }
      } else {
        setWindows([]);
      }
    } catch (err) {
      console.error('Failed to hydrate popup windows:', err);
      setWindows([]);
    }
    hydratedFor.current = user._id;
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user || hydratedFor.current !== user._id) return;
    try {
      const minimal = windows.map((w) => ({ roomId: w.roomId, collapsed: w.collapsed }));
      window.localStorage.setItem(storageKey(user._id), JSON.stringify(minimal));
    } catch (err) {
      console.error('Failed to persist popup windows:', err);
    }
  }, [windows, user]);

  const openPopup = useCallback((roomId) => {
    if (!roomId) return;
    setWindows((prev) => {
      const existing = prev.find((w) => w.roomId === roomId);
      if (existing) {
        return [
          ...prev.filter((w) => w.roomId !== roomId),
          { ...existing, collapsed: false, openedAt: Date.now() },
        ];
      }
      const next = [...prev, { roomId, collapsed: false, openedAt: Date.now() }];
      if (next.length > MAX_WINDOWS) {
        const oldest = next.reduce((a, b) => (a.openedAt < b.openedAt ? a : b));
        return next.filter((w) => w.roomId !== oldest.roomId);
      }
      return next;
    });
  }, []);

  const closePopup = useCallback((roomId) => {
    setWindows((prev) => prev.filter((w) => w.roomId !== roomId));
  }, []);

  const toggleCollapsed = useCallback((roomId) => {
    setWindows((prev) =>
      prev.map((w) => (w.roomId === roomId ? { ...w, collapsed: !w.collapsed } : w))
    );
  }, []);

  const isOpen = useCallback(
    (roomId) => windows.some((w) => w.roomId === roomId),
    [windows]
  );

  return (
    <PopupWindowsContext.Provider
      value={{ windows, openPopup, closePopup, toggleCollapsed, isOpen }}
    >
      {children}
    </PopupWindowsContext.Provider>
  );
}
