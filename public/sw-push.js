// Custom service worker additions for push notifications
// This file is imported by vite-plugin-pwa's generated service worker

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'نوبهار';
    const options = {
      body: data.body || '',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-96x96.png',
      dir: 'rtl',
      lang: 'fa',
      data: data.data || { url: '/' },
      vibrate: [100, 50, 100],
      tag: 'nawbahar-notification',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // Fallback for text payload
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('نوبهار', {
        body: text,
        icon: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'fa',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});
