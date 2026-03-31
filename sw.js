/**
 * FinChronicleLedger — Service Worker
 * 
 * Cache-first strategy for offline-first PWA.
 * Precaches all app assets on install, serves from cache on fetch,
 * falls back to network, and cleans old caches on activate.
 */

const CACHE_NAME = 'finchronicle-ledger-v1.2.0';
const CDN_CACHE_NAME = 'finchronicle-cdn-v1.2.0';
const CDN_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const CACHED_URLS = [
    './',
    './index.html',
    './manifest.json',
    './css/tokens.css',
    './css/styles.css',
    './css/dark-mode.css',
    './js/app.js',
    './js/domain/types.js',
    './js/domain/validators.js',
    './js/domain/accounting.js',
    './js/domain/ledger.js',
    './js/domain/chart-of-accounts.js',
    './js/domain/reports.js',
    './js/domain/recurring.js',
    './js/domain/budget.js',
    './js/infrastructure/db.js',
    './js/infrastructure/storage.js',
    './js/infrastructure/file-io.js',
    './js/application/state.js',
    './js/application/transaction-service.js',
    './js/application/account-service.js',
    './js/application/report-service.js',
    './js/application/migration-service.js',
    './js/application/import-export-service.js',
    './js/application/backup-service.js',
    './js/application/settings-service.js',
    './js/application/search-service.js',
    './js/application/recurring-service.js',
    './js/application/budget-service.js',
    './js/application/tag-service.js',
    './js/application/csv-import-service.js',
    './js/ui/renderer.js',
    './js/ui/forms.js',
    './js/ui/list.js',
    './js/ui/summary.js',
    './js/ui/groups.js',
    './js/ui/reports-ui.js',
    './js/ui/modals.js',
    './js/ui/navigation.js',
    './js/ui/settings-ui.js'
];

/**
 * Install: precache all static assets
 */
self.addEventListener('install', function (event) {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('[SW] Precaching app shell');
                return cache.addAll(CACHED_URLS);
            })
            .then(function () {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
    );
});

/**
 * Activate: clean up old caches
 */
self.addEventListener('activate', function (event) {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then(function (cacheNames) {
                return Promise.all(
                    cacheNames
                        .filter(function (name) {
                            return name !== CACHE_NAME && name !== CDN_CACHE_NAME;
                        })
                        .map(function (name) {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(function () {
                // Claim all open clients immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch: cache-first strategy
 * 1. Try cache
 * 2. Fall back to network
 * 3. Cache the network response for next time
 */
self.addEventListener('fetch', function (event) {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // CDN requests (Remix Icons) — network-first with separate cache
    // Use network-first so that stale/compromised CDN responses are replaced on next online fetch
    if (event.request.url.includes('cdn.jsdelivr.net')) {
        event.respondWith(
            fetch(event.request)
                .then(function (response) {
                    if (response.ok) {
                        var responseClone = response.clone();
                        caches.open(CDN_CACHE_NAME).then(function (cache) {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(function () {
                    // Network unavailable, fall back to cached CDN resource
                    return caches.match(event.request);
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(function (cachedResponse) {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(function (networkResponse) {
                    // Only cache same-origin requests
                    if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
                        var responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(function () {
                // Both cache and network failed
                // For navigation requests, try to return the cached index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});
