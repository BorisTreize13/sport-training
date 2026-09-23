/* Sport Training — service worker
   v2 : le HTML est toujours récupéré en contournant le cache HTTP du navigateur,
   sinon GitHub Pages (max-age=600) sert une version périmée pendant 10 minutes
   et l'application ne se met jamais à jour sur le téléphone. */
const CACHE = 'sport-training-v2';
const CORE  = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const estPage = req.mode === 'navigate' ||
                  (req.destination === '' && req.url.endsWith('.html')) ||
                  req.destination === 'document';

  // Page et fichiers du site : réseau d'abord, EN IGNORANT le cache HTTP.
  if (estPage || req.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(res => {
          const copie = res.clone();
          caches.open(CACHE).then(c => c.put(req, copie));
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Images Wikimedia : cache d'abord — elles ne changent jamais.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copie = res.clone();
      caches.open(CACHE).then(c => c.put(req, copie));
      return res;
    }))
  );
});
