// Petit Empire : fonctionne hors ligne, se met à jour quand internet est là
const CACHE = 'petit-empire-v19';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'privacy.html'];
// Seuls ces fichiers externes sont gardés pour le hors ligne (polices et bibliothèque Firebase)
const EXTERNAL = [/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, /^https:\/\/www\.gstatic\.com\/firebasejs\//];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // Nos fichiers : réseau d'abord, cache si pas d'internet
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(h => h || caches.match('index.html'))));
  } else if (EXTERNAL.some(rx => rx.test(e.request.url))) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    })));
  }
  // Tout le reste (connexion Google, base de données) passe directement par internet
});
