/* AVS Manager — service worker
   - network-first para os ficheiros do próprio site (traz atualizações quando há net)
   - fallback à cache quando offline
   - NÃO intercepta pedidos externos (Supabase, fontes) — deixa-os passar intactos
*/
const CACHE = 'avs-manager-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './favicon.svg', './favicon.ico', './favicon-32.png', './favicon-16.png',
  './apple-touch-icon.png', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // só tratamos pedidos do próprio site; externos (Supabase, Google Fonts) passam sem interferência
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});
