import { useEffect } from 'react'

// Marca a página como "app" (área do membro/admin) e troca o manifesto para instalar o app certo
export function useAppShell(app) {
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('app')
    const link = document.querySelector('link[rel="manifest"]')
    const antes = link?.getAttribute('href')
    if (link) link.setAttribute('href', `/manifest-${app}.webmanifest`)
    const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    const tituloAntes = meta?.getAttribute('content')
    meta?.setAttribute('content', app === 'admin' ? 'IBN Admin' : 'IBN Membros')
    const touch = document.querySelector('link[rel="apple-touch-icon"]')
    if (touch && app === 'admin') touch.setAttribute('href', '/apple-touch-icon-admin.png')
    return () => {
      html.classList.remove('app')
      if (link && antes) link.setAttribute('href', antes)
      if (meta && tituloAntes) meta.setAttribute('content', tituloAntes)
      if (touch) touch.setAttribute('href', '/apple-touch-icon.png')
    }
  }, [app])
}
