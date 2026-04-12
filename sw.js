/**
 * Service Worker — Семейный бюджет
 * Стратегия: Cache First → обновление в фоне
 * Работает офлайн; при появлении интернета обновляет кэш.
 */

const CACHE = 'budget-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg'
];

// Установка: кэшируем все файлы приложения
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активация: удаляем старые кэши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Запросы: сначала кэш, потом сеть
self.addEventListener('fetch', e => {
  // Запросы к Google Apps Script — только через сеть (не кэшировать)
  if (e.request.url.includes('script.google.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Возвращаем кэш немедленно
      const fromNetwork = fetch(e.request)
        .then(response => {
          // Обновляем кэш в фоне
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => {});
      return cached || fromNetwork;
    })
  );
});
