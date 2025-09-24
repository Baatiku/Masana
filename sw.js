const CACHE_NAME = 'kwararru-cache-v4'; // Incremented version

// Core app shell, main entry points, and manifest are precached.
// Other assets will be cached on the fly by the fetch handler.
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  // Key Screens for Offline Access
  '/screens/HomeScreen.tsx',
  '/screens/ChatScreen.tsx',
  '/screens/LearnScreen.tsx',
  '/screens/NigeriaScreen.tsx',
  '/screens/tools/ToolsScreen.tsx',
  '/screens/FavoritesScreen.tsx',
  // Default locale files
  '/locales/en.json',
  '/locales/ha.json',
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
  // External Dependencies
  'https://cdn.tailwindcss.com'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      console.log('[Service Worker] Deleting old caches:', cachesToDelete);
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves assets from cache using a "stale-while-revalidate" strategy.
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return; // Let the browser handle non-GET requests.
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // Fetch from the network in the background.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If the request is successful, update the cache.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.warn(`[Service Worker] Network request for ${event.request.url} failed. Serving from cache if available.`, err);
            // If the network fails, we don't have anything new to return.
            // The logic below will have already returned the cachedResponse if it existed.
        });

        // Return the cached response if it exists, otherwise wait for the network.
        return cachedResponse || fetchPromise;
      });
    })
  );
});