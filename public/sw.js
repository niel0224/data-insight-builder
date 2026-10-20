const CACHE_NAME = "data-insight-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/static/css/style.css",
  "/static/js/app.js",
  "/static/icons/icon.svg",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
];

// 1. 서비스 워커 설치 시 정적 자원 캐싱
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("일부 외부 리소스 사전 캐싱 건너뜀:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. 구버전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 네트워크 요청 처리 (API는 네트워크 우선, 정적 파일은 캐시 우선)
self.addEventListener("fetch", (event) => {
  // POST 요청 및 API 요청은 캐싱하지 않고 네트워크 직통
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
