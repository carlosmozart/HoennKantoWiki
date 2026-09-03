const CACHE_NAME = 'pokewiki-v7';
const API_CACHE_NAME = 'pokewiki-api-cache';

// Os <script>/<link> do index usam querystring (?v=1.0.2) para cache busting.
// Por isso todo caches.match precisa usar ignoreSearch, senão nada do precache
// é encontrado e o modo offline não funciona.
const MATCH_OPTS = { ignoreSearch: true };

// Shell do app: o mínimo para abrir e navegar offline.
// Fora daqui, de propósito: gyms.js (172 KB) e translations.js (dicionário em
// inglês). Os dois são baixados sob demanda por loadScript() e ficam no cache
// pelo handler de fetch na primeira vez que forem usados — assim quem nunca
// abre a aba Treinadores nem troca de idioma não paga por eles.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/layout.css',
  './js/translations_pt.js',
  './js/api.js',
  './js/tms.js',
  './js/render.js',
  './js/frontier.js',
  './js/extras.js',
  './js/tutors.js',
  './js/events.js',
  './js/guides.js',
  './js/map.js',
  './js/training.js',
  './js/items.js',
  './js/app.js',
  './images/miss.png',
  './favicons/favicon-16x16.png',
  './favicons/icon-192.png',
  './favicons/icon-512.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // addAll aborta tudo se um único arquivo falhar; cacheamos um a um.
      .then(cache => Promise.all(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

// Interceptando requisições
self.addEventListener('fetch', event => {
  const request = event.request;

  // Só lidamos com GET http(s); POST e esquemas como chrome-extension: quebram cache.put
  if (request.method !== 'GET') return;
  const requestUrl = new URL(request.url);
  if (!requestUrl.protocol.startsWith('http')) return;

  // Dados da PokeAPI e sprites remotos: Cache First (conteúdo estático e imutável)
  const isRemoteData = requestUrl.hostname === 'pokeapi.co' ||
                       requestUrl.hostname === 'raw.githubusercontent.com';

  if (isRemoteData) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then(networkResponse => {
          // Respostas opacas/erro não devem poluir o cache
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }
          const copy = networkResponse.clone();
          caches.open(API_CACHE_NAME).then(cache => cache.put(request, copy));
          return networkResponse;
        });
      })
    );
    return;
  }

  // Assets próprios: Network First com fallback para o cache (offline)
  event.respondWith(
    fetch(request).then(networkResponse => {
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return networkResponse;
    }).catch(() =>
      caches.match(request, MATCH_OPTS).then(cached =>
        // Navegação sem correspondência exata cai no index (app de página única)
        cached || (request.mode === 'navigate'
          ? caches.match('./index.html', MATCH_OPTS)
          : undefined)
      )
    )
  );
});

// Limpando caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cache => cache !== CACHE_NAME && cache !== API_CACHE_NAME)
        .map(cache => caches.delete(cache))
    )).then(() => self.clients.claim())
  );
});
