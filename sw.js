// Service Worker - ネットワーク優先（常に最新版を表示）
const CACHE_NAME = 'bento-order-v1';

// インストール時：即座に有効化
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 有効化時：古いキャッシュを削除して即座にコントロール取得
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// フェッチ時：HTMLページは常にネットワーク優先（キャッシュなし）
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Supabase APIへのリクエストはそのまま通す
  if (url.hostname.includes('supabase')) return;

  // HTMLページ（ナビゲーション）は常にネットワークから取得
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // その他のリソース（CSS/JS等）もネットワーク優先
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
