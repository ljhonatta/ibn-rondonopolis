import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  Bell, Building2, LayoutDashboard, CalendarClock, HandCoins, HandHeart, Home, Loader2, LogOut, PlayCircle, Smartphone, User, X,
} from 'lucide-react'
import { supabase } from '../admin/client'
import { ehLideranca, primeiroNome, useAuth } from '../lib/auth'
import { SiteProvider, useSite } from '../lib/site'
import { versiculoDoDia } from '../lib/versiculos'
import { diaCurto, formatCountdown, horaBR, proximoCulto } from '../lib/utils'
import { IconRing, Logo, useNow } from '../components/ui'
import { Aguardando, Completar, precisaCompletar } from './Entrar'
import Oracoes from './Oracoes'
import Perfil from './Perfil'

const ABAS = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'contribuicoes', label: 'Contribuições', icon: HandCoins, breve: true },
  { id: 'espaco-novo', label: 'Espaço Novo', icon: Building2, breve: true },
  { id: 'oracoes', label: 'Orações', icon: HandHeart },
  { id: 'perfil', label: 'Perfil', icon: User },
]

function Sino({ userId }) {
  const [itens, setItens] = useState([])
  const [aberto, setAberto] = useState(false)
  const load = () =>
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30).then(({ data }) => setItens(data || []))
  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [userId])
  const novas = itens.filter((n) => !n.lida).length

  async function abrir() {
    setAberto(!aberto)
    if (!aberto && novas) {
      await supabase.from('notifications').update({ lida: true }).eq('user_id', userId).eq('lida', false)
      setTimeout(load, 400)
    }
  }

  return (
    <div className="relative">
      <button onClick={abrir} className="relative grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10" aria-label={`Notificações${novas ? ` (${novas} novas)` : ''}`}>
        <Bell size={22} />
        {novas > 0 && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold">{novas}</span>}
      </button>
      {aberto && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl bg-white text-ink shadow-2xl">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <strong className="font-display text-sm uppercase">Notificações</strong>
            <button onClick={() => setAberto(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-mist" aria-label="Fechar"><X size={16} /></button>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {itens.length === 0 && <li className="p-5 text-sm text-ink/50">Nada por aqui ainda.</li>}
            {itens.map((n) => (
              <li key={n.id} className={`border-b border-ink/5 px-4 py-3 ${n.lida ? '' : 'bg-brand-soft/60'}`}>
                <a href={n.link || '#'} onClick={() => setAberto(false)} className="block">
                  <p className="text-sm font-semibold">{n.titulo}</p>
                  {n.mensagem && <p className="mt-0.5 text-sm text-ink/65">{n.mensagem}</p>}
                  <p className="mt-1 text-xs text-ink/40">{new Date(n.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Botão "instalar app" (Android/Chrome) ou instrução para iPhone
function InstalarApp() {
  const [evento, setEvento] = useState(null)
  const [ios, setIos] = useState(false)
  const instalado = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone
  useEffect(() => {
    const h = (e) => (e.preventDefault(), setEvento(e))
    window.addEventListener('beforeinstallprompt', h)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  if (instalado || (!evento && !ios)) return null
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-ink/10 bg-white p-5">
      <img src="/apple-touch-icon.png" alt="" className="h-12 w-12 rounded-xl" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">Tenha a IBN na tela inicial</p>
        <p className="text-ink/60">
          {evento ? 'Acesse sua área como um app, com um toque.' : 'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.'}
        </p>
      </div>
      {evento && (
        <button onClick={() => evento.prompt()} className="btn-red min-h-[40px] px-4 py-2 text-xs"><Smartphone size={16} /> Instalar</button>
      )}
    </div>
  )
}

function Inicio({ irPara }) {
  const { cultos, live } = useSite()
  useNow(1000)
  const prox = proximoCulto(cultos)
  const t = prox ? formatCountdown(prox.ms) : null
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <IconRing icon={CalendarClock} size={52} />
          <div className="flex-1">
            <p className="font-display text-xs font-bold uppercase tracking-[.25em] text-ink/45">Próximo culto</p>
            {prox && (
              <>
                <h2 className="mt-1 font-display text-xl font-extrabold uppercase">{prox.culto.nome}</h2>
                <p className="text-ink/65">
                  <span className="capitalize">{diaCurto(prox.culto.dia)}</span> às {horaBR(prox.culto.hora)} ·{' '}
                  {prox.emAndamento ? <strong className="text-brand">acontecendo agora</strong> : <>começa em <strong className="text-ink">{t.d > 0 && `${t.d}d `}{t.h}h {t.m}min</strong></>}
                </p>
              </>
            )}
          </div>
        </div>
        {live.ativo && (
          <a href="/#ao-vivo" className="btn-red mt-5 w-full">
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-white" /> <PlayCircle size={18} /> Assistir ao vivo
          </a>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => irPara('espaco-novo')} className="rounded-3xl bg-ink p-5 text-left text-white">
          <Building2 className="text-brand" />
          <p className="mt-3 font-display font-extrabold uppercase">Projeto Espaço Novo</p>
          <p className="mt-1 text-sm text-white/60">Em breve você poderá acompanhar suas parcelas por aqui.</p>
        </button>
        <button onClick={() => irPara('contribuicoes')} className="rounded-3xl bg-white p-5 text-left shadow-sm">
          <HandCoins className="text-brand" />
          <p className="mt-3 font-display font-extrabold uppercase">Minhas contribuições</p>
          <p className="mt-1 text-sm text-ink/60">Em breve: registre seu Pix e acompanhe a confirmação.</p>
        </button>
      </div>

      <InstalarApp />
    </div>
  )
}

function EmBreve({ titulo }) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
      <p className="font-display text-xs font-bold uppercase tracking-[.25em] text-brand">Em breve</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold uppercase">{titulo}</h2>
      <p className="mx-auto mt-3 max-w-sm text-ink/60">Estamos preparando esta parte com carinho. Logo ela estará disponível aqui.</p>
    </div>
  )
}

function Area() {
  const { session, profile, loading, signOut, reloadProfile } = useAuth()
  const { hash } = useLocation()
  const [aba, setAba] = useState(() => (ABAS.some((a) => a.id === hash.slice(1)) ? hash.slice(1) : 'inicio'))
  const [verso, ref] = versiculoDoDia()

  useEffect(() => {
    document.title = 'Minha área | IBN Rondonópolis'
  }, [])
  useEffect(() => {
    const id = hash.slice(1)
    if (ABAS.some((a) => a.id === id)) setAba(id)
  }, [hash])
  const irPara = (id) => {
    setAba(id)
    history.replaceState(null, '', `#${id}`)
    window.scrollTo({ top: 0 })
  }

  if (!supabase) return <Navigate to="/" replace />
  if (loading) return <div className="grid min-h-screen place-items-center bg-ink"><Loader2 className="animate-spin text-white" /></div>
  if (!session) return <Navigate to={`/entrar?volta=${encodeURIComponent('/minha-area')}`} replace />
  if (precisaCompletar(profile)) return <Completar profile={profile} onPronto={reloadProfile} onSair={signOut} />
  if (!profile || profile.status !== 'ativo') return <Aguardando profile={profile} onSair={signOut} />

  return (
    <div className="min-h-[100svh] bg-mist pb-28 md:pb-10">
      <header className="bg-ink pb-16 pt-4 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
          <a href="/" className="block h-10"><Logo className="h-full w-auto" /></a>
          <div className="flex items-center gap-1">
            {ehLideranca(profile) && (
              <a href="/admin" className="mr-1 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-brand-dark">
                <LayoutDashboard size={16} /> <span className="hidden sm:inline">Painel admin</span><span className="sm:hidden">Admin</span>
              </a>
            )}
            <Sino userId={session.user.id} />
            <button onClick={signOut} className="grid h-11 w-11 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Sair"><LogOut size={20} /></button>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-3xl px-4">
          <h1 className="font-display text-2xl font-extrabold uppercase leading-tight sm:text-3xl">
            Olá, {primeiroNome(profile.nome)}! <span className="script block text-[1.2em] normal-case sm:inline">Que bom ter você aqui.</span>
          </h1>
          <p className="mt-4 max-w-xl text-white/70">“{verso}” <span className="whitespace-nowrap font-semibold text-brand">{ref}</span></p>
        </div>
      </header>

      <div className="mx-auto -mt-10 max-w-3xl px-4">
        <nav className="mb-5 hidden gap-1 rounded-full bg-white p-1 shadow-sm md:flex">
          {ABAS.map((a) => (
            <button key={a.id} onClick={() => irPara(a.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition ${aba === a.id ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'}`}>
              <a.icon size={16} /> {a.label}
            </button>
          ))}
        </nav>

        {aba === 'inicio' && <Inicio irPara={irPara} />}
        {aba === 'contribuicoes' && <EmBreve titulo="Minhas contribuições" />}
        {aba === 'espaco-novo' && <EmBreve titulo="Projeto Espaço Novo" />}
        {aba === 'oracoes' && <Oracoes />}
        {aba === 'perfil' && <Perfil />}
      </div>

      {/* Menu inferior no celular: tudo a um toque */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => irPara(a.id)} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${aba === a.id ? 'text-brand' : 'text-ink/50'}`}>
            <a.icon size={22} strokeWidth={aba === a.id ? 2.2 : 1.6} />
            {a.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function MinhaArea() {
  return (
    <SiteProvider>
      <Area />
    </SiteProvider>
  )
}
