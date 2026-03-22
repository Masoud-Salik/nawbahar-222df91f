// Custom service worker additions for push notifications, Background Sync & Periodic Sync
// This file is imported by vite-plugin-pwa's generated service worker

// ─── Update Handler ───
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Push Notifications ───
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'نوبهار';
    const notificationId = data.id || data.tag || `nawbahar-notification-${Date.now()}`;
    const options = {
      body: data.body || '',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-96x96.png',
      dir: 'rtl',
      lang: 'fa',
      data: data.data || { url: '/' },
      vibrate: [100, 50, 100],
      tag: notificationId,
      renotify: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
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
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ─── Background Sync ───
// Retries failed requests (e.g. comments, reactions posted offline) when connectivity returns
const SYNC_QUEUE_KEY = 'nawbahar-sync-queue';

self.addEventListener('sync', (event) => {
  if (event.tag === 'nawbahar-offline-actions') {
    event.waitUntil(replayOfflineActions());
  }
});

async function replayOfflineActions() {
  try {
    const cache = await caches.open(SYNC_QUEUE_KEY);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) continue;

      const body = await response.text();
      const headers = {};
      response.headers.forEach((v, k) => { headers[k] = v; });

      try {
        await fetch(request.url, {
          method: request.method || 'POST',
          headers,
          body: body || undefined,
        });
        await cache.delete(request);
      } catch (err) {
        // Will retry on next sync event
        console.warn('[SW] Background sync retry failed for:', request.url);
      }
    }
  } catch (err) {
    console.error('[SW] Background sync error:', err);
  }
}

// ─── Periodic Background Sync ───
// Fetches latest articles in the background so content is fresh when user opens app
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'nawbahar-sync-articles') {
    event.waitUntil(refreshArticlesCache());
  }
});

async function refreshArticlesCache() {
  try {
    // Fetch latest published articles from Supabase REST API
    const supabaseUrl = self.location.origin.includes('localhost')
      ? 'https://rubspbitfypqaeuxhvco.supabase.co'
      : 'https://rubspbitfypqaeuxhvco.supabase.co';

    const apiUrl = `${supabaseUrl}/rest/v1/articles?status=eq.published&order=created_at.desc&limit=20&select=id,title,content,cover_image_url,created_at,author_id,reaction_count,comment_count,view_count,tags`;

    const response = await fetch(apiUrl, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YnNwYml0ZnlwcWFldXhodmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODc5MjAsImV4cCI6MjA4MjU2MzkyMH0.lngmDeQqDHFROJ8_9Yre6yjw1axMzE5EonlGIcT3-fc',
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const articlesCache = await caches.open('articles-cache');
      await articlesCache.put(new Request(apiUrl), response.clone());
    }
  } catch (err) {
    console.warn('[SW] Periodic sync failed:', err);
  }
}
