const CACHE_NAME = 'pokewiki-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/layout.css',
  '/js/api.js',
  '/js/app.js',
  '/js/render.js',
  '/js/translations.js',
  '/favicons/favicon-16x16.png',
  '/favicons/pokedex.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Interceptando requisições
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Se a requisição for para a PokeAPI (dados JSON)
  if (requestUrl.hostname === 'pokeapi.co') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          return caches.open('pokewiki-api-cache').then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Comportamento padrão: tenta o cache, senão tenta a rede
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Limpando caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cache => cache !== CACHE_NAME && cache !== 'pokewiki-api-cache')
          .map(cache => caches.delete(cache))
      );
    })
  );
});
