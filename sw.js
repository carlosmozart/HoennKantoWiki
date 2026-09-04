const CACHE_NAME = 'pokewiki-v20';
const API_CACHE_NAME = 'pokewiki-api-cache';

// Os <script>/<link> do index usam querystring (?v=1.0.2) para cache busting.
// Por isso todo caches.match precisa usar ignoreSearch, senão nada do precache
// é encontrado e o modo offline não funciona.
const MATCH_OPTS = { ignoreSearch: true };

// Shell do app: modulos, estilos e os dados de uso comum.
// A lista e gerada por tools/update_sw_precache.py a partir dos arquivos reais.
// Fora dela, de proposito:
//   data/pokemon/<id>.json  386 arquivos, 2,3 MB. Cada ficha entra no cache na
//                           primeira visita, entao o offline vai ficando
//                           completo conforme o uso.
//   data/i18n/en.json       so baixado se o usuario trocar de idioma.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/layout.css',
  './css/custom-pages.css',
  './js/app/events.js',
  './js/app/lifecycle.js',
  './js/core/dataset.js',
  './js/core/editorial.js',
  './js/core/i18n.js',
  './js/core/router.js',
  './js/core/sprites.js',
  './js/core/state.js',
  './js/core/storage.js',
  './js/core/types.js',
  './js/main.js',
  './js/ui/cries.js',
  './js/ui/dom.js',
  './js/ui/interface.js',
  './js/ui/layout.js',
  './js/ui/sound.js',
  './js/ui/theme.js',
  './js/views/custom-pages.js',
  './js/views/extras.js',
  './js/views/frontier.js',
  './js/views/guides.js',
  './js/views/items.js',
  './js/views/machines.js',
  './js/views/map.js',
  './js/views/pokedex.js',
  './js/views/pokemon-render.js',
  './js/views/pokemon.js',
  './js/views/settings.js',
  './js/views/team.js',
  './js/views/trainers.js',
  './js/widgets/live-events.js',
  './js/widgets/training-modal.js',
  './data/pokedex.json',
  './data/moves.json',
  './data/abilities.json',
  './data/i18n/pt.json',
  './data/gyms.json',
  './data/tutors.json',
  './data/guides.json',
  './data/machines.json',
  './data/key-items.json',
  './data/extras.json',
  './data/frontier.json',
  './data/pages.json',
  './data/interface.json',
  './data/pokemon-overrides.json',
  './data/map-encounters.json',
  './fonts/Oxanium.ttf',
  './vendor/html2canvas/html2canvas.min.js',
  './images/miss.png',
  './favicons/favicon-16x16.png',
  './favicons/icon-192.png',
  './favicons/icon-512.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // O shell precisa estar completo: uma falha mantém o worker anterior ativo.
      // cache: 'reload' ignora o cache HTTP do navegador. Sem isso, uma
      // versao nova do Service Worker podia reaproveitar arquivos velhos que
      // ainda estivessem validos ali (o GitHub Pages serve com max-age=600) —
      // e como os imports ES nao carregam o ?v= do index, davam modulos de
      // versoes diferentes convivendo na mesma pagina.
      .then(cache => Promise.all(
        ASSETS_TO_CACHE.map(url =>
          cache.add(new Request(url, { cache: 'reload' })))
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
          event.waitUntil(caches.open(API_CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {}));
          return networkResponse;
        });
      })
    );
    return;
  }

  // Assets próprios: Network First com fallback para o cache (offline).
  // 'no-cache' revalida com o servidor (resposta 304 quando nada mudou), em
  // vez de aceitar o que estiver no cache HTTP sem perguntar.
  event.respondWith(
    fetch(request, { cache: 'no-cache' }).then(networkResponse => {
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const copy = networkResponse.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {}));
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
        .filter(cache => cache.startsWith('pokewiki-') && cache !== CACHE_NAME && cache !== API_CACHE_NAME)
        .map(cache => caches.delete(cache))
    )).then(() => self.clients.claim())
  );
});
