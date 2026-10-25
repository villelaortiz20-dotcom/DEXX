const CACHE = 'registro-gym-v6';
const PRECARGA = ['./', './index.html', './manifest.webmanifest', './icon.svg',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const mismoOrigen = url.origin === self.location.origin;

  // La app (HTML) va primero a la red: así una actualización se ve al instante.
  // Si no hay red, usa la copia guardada.
  if(mismoOrigen && (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname))){
    e.respondWith(
      fetch(req).then(res => {
        caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto (iconos, manifiesto, fuentes): caché primero, y se guarda lo que se descargue.
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if(res && (res.ok || res.type === 'opaque')){
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
      }
      return res;
    }))
  );
});
