// Service worker da IBN: deixa o site instalável e abre a última versão vista quando estiver sem internet.
// Sempre busca da rede primeiro, então nunca mostra conteúdo velho quando há conexão.
const CACHE = 'ibn-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (req.mode === 'navigate' || /\.(js|css|png|jpg|svg|webmanifest)$/.test(new URL(req.url).pathname))) {
          const copia = res.clone()
          caches.open(CACHE).then((c) => c.put(req.mode === 'navigate' ? '/' : req, copia))
        }
        return res
      })
      .catch(() => caches.match(req.mode === 'navigate' ? '/' : req)),
  )
})
