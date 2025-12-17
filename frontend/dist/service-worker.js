/**
 * Service Worker for Push Notifications
 * يدير إشعارات المتصفح (Push Notifications)
 */

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(clients.claim());
});

// Handle Push Events
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'إشعار جديد',
      body: event.data ? event.data.text() : 'لديك إشعار جديد'
    };
  }

  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/badge.png',
    image: data.image,
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'notification-' + Date.now(),
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
    dir: 'rtl',
    lang: 'ar'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Plan', options)
  );
});

// Handle Notification Click
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // إذا كان التطبيق مفتوح، ركز عليه
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // إذا كان أي نافذة من التطبيق مفتوحة
      if (clientList.length > 0) {
        const client = clientList[0];
        if ('focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }

      // وإلا افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle Notification Close
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification.tag);

  // يمكن إرسال تحليلات هنا
  event.waitUntil(
    fetch('/api/notifications/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'close',
        tag: event.notification.tag,
        timestamp: Date.now()
      })
    }).catch(err => console.error('Failed to send analytics:', err))
  );
});

// Handle Background Sync (اختياري)
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/unread');
    const data = await response.json();

    if (data.count > 0) {
      await self.registration.showNotification('إشعارات جديدة', {
        body: `لديك ${data.count} إشعار جديد`,
        icon: '/logo192.png',
        badge: '/badge.png',
        tag: 'sync-notification',
        data: { url: '/notifications' }
      });
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Handle Background Fetch (اختياري - للمستقبل)
self.addEventListener('backgroundfetchsuccess', (event) => {
  console.log('Background fetch success:', event);
});

self.addEventListener('backgroundfetchfail', (event) => {
  console.log('Background fetch failed:', event);
});

// Handle Messages from Main Thread
self.addEventListener('message', (event) => {
  console.log('Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
