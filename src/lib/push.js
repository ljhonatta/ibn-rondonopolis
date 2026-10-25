import { useEffect, useState } from 'react'
import { supabase } from '../admin/client'
import { APP } from './modo'

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY

const chave = (b64) => {
  const p = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export const pushSuportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && Boolean(VAPID)
export const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const instalado = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

// Estado e ação do botão "Ativar notificações"
export function usePush(app) {
  const [estado, setEstado] = useState('carregando') // carregando | indisponivel | ios-instalar | negado | desligado | ligado
  useEffect(() => {
    if (!pushSuportado()) return setEstado(ehIOS() && !instalado() ? 'ios-instalar' : 'indisponivel')
    if (Notification.permission === 'denied') return setEstado('negado')
    navigator.serviceWorker.ready
      .then((r) => r.pushManager.getSubscription())
      .then((s) => setEstado(s ? 'ligado' : 'desligado'))
      .catch(() => setEstado('desligado'))
  }, [])

  async function ativar() {
    try {
      if (!navigator.serviceWorker.controller) await navigator.serviceWorker.register('/sw.js')
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return setEstado(perm === 'denied' ? 'negado' : 'desligado')
      const reg = await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave(VAPID) }))
      const j = sub.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert(
        { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, origem: location.origin, app: app || APP, user_agent: navigator.userAgent.slice(0, 200) },
        { onConflict: 'endpoint' },
      )
      setEstado(error ? 'desligado' : 'ligado')
      if (!error) reg.showNotification('Notificações ativadas! 🙌', { body: 'Você vai receber os avisos da IBN Rondonópolis aqui.', icon: '/icon-192.png' })
    } catch {
      setEstado('desligado')
    }
  }

  async function desativar() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
    }
    setEstado('desligado')
  }
  return { estado, ativar, desativar }
}
