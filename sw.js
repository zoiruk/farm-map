// Service Worker for UK Farms Map PWA
const CACHE_VERSION = '1.0.0';
const STATIC_CACHE = `uk-farms-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `uk-farms-dynamic-v${CACHE_VERSION}`;
const OFFLINE_CACHE = `uk-farms-offline-v${CACHE_VERSION}`;

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/config.js',
    '/manifest.json',
    '/debug.html',
    '/test-postcode.html',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/,
    /^https:\/\/api\.postcodes\.io\/postcodes/
];

// Offline fallback page
const OFFLINE_PAGE = '/index.html';
const OFFLINE_DATA = {
    farms: [],
    message: 'Вы находитесь в офлайн режиме. Показаны кэшированные данные.'
};

// Install event
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            }),
            // Initialize offline storage
            initializeOfflineStorage()
        ]).catch(error => {
            console.error('Service Worker: Installation failed', error);
        })
    );
    self.skipWaiting();
});

// Initialize offline storage
async function initializeOfflineStorage() {
    try {
        const db = await openDB();
        console.log('Service Worker: Offline storage initialized');
        
        // Store offline fallback data
        const tx = db.transaction(['offline-data'], 'readwrite');
        const store = tx.objectStore('offline-data');
        await store.put({
            id: 'farms',
            data: OFFLINE_DATA.farms,
            timestamp: Date.now()
        });
        
        return tx.complete;
    } catch (error) {
        console.error('Service Worker: Failed to initialize offline storage', error);
    }
}

// Activate event
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (!cacheName.includes(CACHE_VERSION)) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Clean old IndexedDB data
            cleanOldOfflineData()
        ])
    );
    self.clients.claim();
});

// Clean old offline data
async function cleanOldOfflineData() {
    try {
        const db = await openDB();
        const tx = db.transaction(['pending-farms', 'pending-reviews'], 'readwrite');
        
        // Clean old pending data (older than 7 days)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const farmStore = tx.objectStore('pending-farms');
        const reviewStore = tx.objectStore('pending-reviews');
        
        const farms = await farmStore.getAll();
        const reviews = await reviewStore.getAll();
        
        farms.forEach(farm => {
            if (farm.timestamp < weekAgo) {
                farmStore.delete(farm.id);
            }
        });
        
        reviews.forEach(review => {
            if (review.timestamp < weekAgo) {
                reviewStore.delete(review.id);
            }
        });
        
        return tx.complete;
    } catch (error) {
        console.error('Service Worker: Failed to clean old data', error);
    }
}

// Fetch event with advanced caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests with network-first strategy
    if (isAPIRequest(url)) {
        event.respondWith(handleAPIRequest(request));
        return;
    }

    // Handle static files with cache-first strategy
    if (isStaticFile(url)) {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Default handling for other requests
    event.respondWith(handleDefaultRequest(request));
});

// Check if request is to API
function isAPIRequest(url) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url.href));
}

// Check if request is for static file
function isStaticFile(url) {
    return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/);
}

// Handle API requests (network-first with offline fallback)
async function handleAPIRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request.clone(), networkResponse.clone());
            
            // Store data in IndexedDB for offline access
            if (request.url.includes('GET_FARMS')) {
                const data = await networkResponse.clone().json();
                await storeOfflineData('farms', data);
            }
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache', error);
        
        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline data for farms request
        if (request.url.includes('GET_FARMS')) {
            const offlineData = await getOfflineData('farms');
            return new Response(JSON.stringify({
                success: true,
                data: offlineData || [],
                offline: true,
                message: 'Данные загружены из кэша (офлайн режим)'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Return error response
        return new Response(JSON.stringify({
            success: false,
            error: 'Нет подключения к интернету',
            offline: true
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle static files (cache-first)
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request.clone(), networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Failed to fetch static file', error);
        throw error;
    }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Navigation failed, returning offline page');
        const cachedResponse = await caches.match(OFFLINE_PAGE);
        return cachedResponse || new Response('Офлайн режим', {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Handle default requests
async function handleDefaultRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request.clone(), networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Ресурс недоступен в офлайн режиме', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Background sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync-farm') {
        event.waitUntil(syncFarmData());
    }
    if (event.tag === 'background-sync-review') {
        event.waitUntil(syncReviewData());
    }
});

// Sync farm data when back online
async function syncFarmData() {
    try {
        const db = await openDB();
        const tx = db.transaction(['pending-farms'], 'readonly');
        const store = tx.objectStore('pending-farms');
        const pendingFarms = await store.getAll();

        for (const farm of pendingFarms) {
            try {
                const response = await fetch(farm.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(farm.data)
                });

                if (response.ok) {
                    // Remove from pending queue
                    const deleteTx = db.transaction(['pending-farms'], 'readwrite');
                    const deleteStore = deleteTx.objectStore('pending-farms');
                    await deleteStore.delete(farm.id);
                    
                    // Notify user
                    self.registration.showNotification('Ферма добавлена!', {
                        body: `${farm.data.farmName} успешно добавлена в базу данных`,
                        icon: '/icon-192.png',
                        badge: '/icon-72.png'
                    });
                }
            } catch (error) {
                console.error('Failed to sync farm:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Sync review data when back online
async function syncReviewData() {
    // Similar implementation for reviews
    console.log('Syncing review data...');
}

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Новое уведомление от UK Farms Map',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Открыть карту',
                icon: '/icon-72.png'
            },
            {
                action: 'close',
                title: 'Закрыть',
                icon: '/icon-72.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('UK Farms Map', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync for data updates
self.addEventListener('periodicsync', event => {
    if (event.tag === 'farms-update') {
        event.waitUntil(updateFarmsData());
    }
});

// Update farms data in background
async function updateFarmsData() {
    try {
        const response = await fetch(`${self.location.origin}/api/farms`);
        if (response.ok) {
            const data = await response.json();
            await storeOfflineData('farms', data);
            
            // Notify all clients about data update
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'DATA_UPDATED',
                    data: 'farms'
                });
            });
        }
    } catch (error) {
        console.error('Background farms update failed:', error);
    }
}

// Enhanced IndexedDB helper
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('uk-farms-db', 2);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = request.result;
            const oldVersion = event.oldVersion;
            
            // Create object stores
            if (!db.objectStoreNames.contains('pending-farms')) {
                const farmStore = db.createObjectStore('pending-farms', { keyPath: 'id', autoIncrement: true });
                farmStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('pending-reviews')) {
                const reviewStore = db.createObjectStore('pending-reviews', { keyPath: 'id', autoIncrement: true });
                reviewStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('offline-data')) {
                const offlineStore = db.createObjectStore('offline-data', { keyPath: 'id' });
                offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('user-preferences')) {
                db.createObjectStore('user-preferences', { keyPath: 'key' });
            }
        };
    });
}

// Store data for offline access
async function storeOfflineData(key, data) {
    try {
        const db = await openDB();
        const tx = db.transaction(['offline-data'], 'readwrite');
        const store = tx.objectStore('offline-data');
        
        await store.put({
            id: key,
            data: data,
            timestamp: Date.now()
        });
        
        return tx.complete;
    } catch (error) {
        console.error('Service Worker: Failed to store offline data', error);
    }
}

// Get offline data
async function getOfflineData(key) {
    try {
        const db = await openDB();
        const tx = db.transaction(['offline-data'], 'readonly');
        const store = tx.objectStore('offline-data');
        const result = await store.get(key);
        
        return result ? result.data : null;
    } catch (error) {
        console.error('Service Worker: Failed to get offline data', error);
        return null;
    }
}

// Store pending request for later sync
async function storePendingRequest(type, data) {
    try {
        const db = await openDB();
        const storeName = type === 'farm' ? 'pending-farms' : 'pending-reviews';
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        
        await store.add({
            data: data,
            timestamp: Date.now(),
            retryCount: 0
        });
        
        return tx.complete;
    } catch (error) {
        console.error('Service Worker: Failed to store pending request', error);
    }
}