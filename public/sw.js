const CACHE_NAME = 'thriveni-troubleshoot-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple fetch handler to pass PWA criteria.
  event.respondWith(
    fetch(event.request).catch(function() {
      return new Response('Offline mode');
    })
  );
});
