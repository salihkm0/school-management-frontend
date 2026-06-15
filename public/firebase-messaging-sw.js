importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// We need to inject the firebase config here through URL params or keep it hardcoded/empty if we only use the background handler
// For Firebase v9+, the service worker uses compat libraries. 
// A simpler approach is to let the frontend build script inject it or use standard messaging setup.

const firebaseConfig = {
  // These will need to be populated by the user or dynamically
  apiKey: new URL(location).searchParams.get('apiKey') || "REPLACE_WITH_YOUR_API_KEY",
  authDomain: new URL(location).searchParams.get('authDomain') || "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: new URL(location).searchParams.get('projectId') || "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: new URL(location).searchParams.get('storageBucket') || "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: new URL(location).searchParams.get('messagingSenderId') || "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: new URL(location).searchParams.get('appId') || "REPLACE_WITH_YOUR_APP_ID"
};

try {
  // Only initialize if we have the config
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || '',
        icon: '/logo.svg',
        data: payload.data
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.warn("Service worker Firebase config missing, please replace placeholder values.");
  }
} catch (error) {
  console.error("Error in Firebase SW", error);
}

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.', event.notification);
  event.notification.close();

  // Try to get link from notification data
  const targetUrl = event.notification.data?.link || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
