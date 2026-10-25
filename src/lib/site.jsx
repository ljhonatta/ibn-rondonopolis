import { createContext, useContext, useEffect, useState } from 'react'
import { select } from './api'
import {
  DEFAULT_ALBUNS,
  DEFAULT_CULTOS,
  DEFAULT_EVENTOS,
  DEFAULT_LIVE,
  DEFAULT_MINISTERIOS,
  DEFAULT_SITE,
} from './defaults'

const initial = {
  site: DEFAULT_SITE,
  live: DEFAULT_LIVE,
  cultos: DEFAULT_CULTOS,
  eventos: DEFAULT_EVENTOS,
  ministerios: DEFAULT_MINISTERIOS,
  albuns: DEFAULT_ALBUNS,
}

const SiteContext = createContext(initial)
export const useSite = () => useContext(SiteContext)

const CACHE = 'ibn-site-v1'

export function SiteProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE))
      return c ? { ...initial, ...c } : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    const ord = 'order=ordem.asc'
    Promise.all([
      select('settings'),
      select('cultos', `select=*&ativo=eq.true&${ord}`),
      select('eventos', `select=*&ativo=eq.true&${ord}`),
      select('ministerios', `select=*&ativo=eq.true&${ord}`),
      select('albuns', `select=*&ativo=eq.true&${ord}`),
    ])
      .then(([settings, cultos, eventos, ministerios, albuns]) => {
        if (!settings) return // Supabase não configurado: fica com os padrões
        const kv = Object.fromEntries(settings.map((r) => [r.key, r.value]))
        const next = {
          site: { ...DEFAULT_SITE, ...(kv.site || {}) },
          live: { ...DEFAULT_LIVE, ...(kv.live || {}) },
          cultos: cultos?.length ? cultos : DEFAULT_CULTOS,
          eventos: eventos || [],
          ministerios: ministerios?.length ? ministerios : DEFAULT_MINISTERIOS,
          albuns: albuns?.length ? albuns : DEFAULT_ALBUNS,
        }
        setData(next)
        try {
          localStorage.setItem(CACHE, JSON.stringify(next))
        } catch {}
      })
      .catch((e) => console.warn('Supabase indisponível, usando conteúdo padrão.', e))
  }, [])

  // ?aovivo=teste força o modo AO VIVO (para testar o player sem mexer no admin)
  const forceLive = typeof location !== 'undefined' && new URLSearchParams(location.search).get('aovivo') === 'teste'
  const value = forceLive ? { ...data, live: { ...data.live, ativo: true } } : data

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
