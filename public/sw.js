self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: 'New message', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (data.roomId) {
      const focused = clientsList.find((c) => {
        try {
          const url = new URL(c.url);
          return c.focused && c.visibilityState === 'visible' && url.pathname === `/chat/${data.roomId}`;
        } catch (_) {
          return false;
        }
      });
      if (focused) return;
    }

    const title = data.title || 'New message';
    await self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.roomId || 'chat',
      renotify: false,
      data: {
        url: data.url || '/',
        roomId: data.roomId,
        messageId: data.messageId,
      },
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      try {
        const url = new URL(client.url);
        if (url.pathname === target) {
          await client.focus();
          return;
        }
      } catch (_) { /* ignore */ }
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(target);
    }
  })());
});
