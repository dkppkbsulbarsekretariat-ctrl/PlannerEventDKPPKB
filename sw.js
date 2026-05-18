const CACHE_NAME = "planner-event-v1";

// 1. Hanya masukkan file LOKAL agar proses install Service Worker dijamin berhasil
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// install service worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
  );
});

// activate
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});

// 2. Dynamic Caching di Fetch Event (Mengatasi CDN)
self.addEventListener("fetch", event => {
  // Hindari caching request ke API Google Apps Script (harus selalu fresh)
  if (event.request.url.includes("script.google.com")) {
      return; 
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika ada di cache, gunakan yang di cache
        if (response) {
          return response;
        }
        
        // Jika tidak ada di cache, ambil dari internet (network)
        return fetch(event.request).then(networkResponse => {
            // Cek apakah response valid sebelum disimpan ke cache
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }

            // Simpan otomatis ke cache (untuk link CDN yang baru pertama kali diakses)
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
        }).catch(() => {
            // Bisa tambahkan fallback halaman offline di sini jika mau
            console.log("Network error and no cache available.");
        });
      })
  );
});