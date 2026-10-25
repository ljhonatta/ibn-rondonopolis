// Service worker da IBN: deixa o site instalável e abre a última versão vista quando estiver sem internet.
// Sempre busca da rede primeiro, então nunca mostra conteúdo velho quando há conexão.
const CACHE = 'ibn-v2'

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

// Notificações no celular (Web Push)
self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data.json() } catch { d = { titulo: 'IBN Rondonópolis', mensagem: e.data?.text() || '' } }
  e.waitUntil(
    self.registration.showNotification(d.titulo || 'IBN Rondonópolis', {
      body: d.mensagem,
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      tag: d.tag,
      renotify: Boolean(d.tag),
      data: { url: d.url || '/' },
      vibrate: [80, 40, 80],
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abertas) => {
      const mesma = abertas.find((c) => new URL(c.url).origin === new URL(url, location.origin).origin)
      if (mesma) return mesma.focus().then(() => mesma.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})
