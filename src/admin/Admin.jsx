import { useEffect, useMemo, useState } from 'react'
import {
  Building2, CalendarDays, Church, FileCheck2, HandHeart, History, Home, Images, Inbox, LayoutDashboard, Loader2, LogOut, Menu, Radio, Settings, UserCheck, Users, X,
} from 'lucide-react'
import { supabase } from './client'
import { Logo } from '../components/ui'
import { BotaoGoogle } from '../membros/Entrar'
import Crud from './Crud'
import LivePanel from './LivePanel'
import SitePanel from './SitePanel'
import Inbox_ from './Inbox'
import Membros from './Membros'
import PedidosMembros from './PedidosMembros'
import Auditoria from './Auditoria'
import Dashboard from './Dashboard'
import Comprovantes from './Comprovantes'
import EspacoNovoAdmin from './EspacoNovoAdmin'
import { DIAS } from '../lib/defaults'
import { MINISTERIO_ICONES } from '../components/Ministries'

const DIA_OPTS = DIAS.map((d, i) => ({ value: i, label: d }))
const ICON_OPTS = Object.keys(MINISTERIO_ICONES).map((k) => ({ value: k, label: k }))

const TABS = [
  { id: 'painel', grupo: 'Tesouraria', label: 'Visão geral', icon: LayoutDashboard, pode: (p) => p.tesouraria, el: ({ irPara }) => <Dashboard irPara={irPara} /> },
  { id: 'comprovantes', grupo: 'Tesouraria', label: 'Comprovantes', icon: FileCheck2, pode: (p) => p.tesouraria, el: () => <Comprovantes /> },
  { id: 'espaco-novo', grupo: 'Tesouraria', label: 'Espaço Novo', icon: Building2, pode: (p) => p.tesouraria, el: () => <EspacoNovoAdmin /> },
  { id: 'live', grupo: 'Site', label: 'Ao vivo', icon: Radio, el: () => <LivePanel /> },
  {
    id: 'cultos', grupo: 'Site', label: 'Cultos', icon: Church,
    el: () => (
      <Crud table="cultos" titulo="Cultos" campos={[
        { k: 'nome', label: 'Nome do culto', req: true },
        { k: 'dia', label: 'Dia', type: 'select', opts: DIA_OPTS, req: true, def: 0 },
        { k: 'hora', label: 'Horário', type: 'time', req: true },
      ]} resumo={(r) => `${DIAS[r.dia]} · ${r.hora}`} />
    ),
  },
  {
    id: 'eventos', grupo: 'Site', label: 'Eventos', icon: CalendarDays,
    el: () => (
      <Crud table="eventos" titulo="Eventos" campos={[
        { k: 'titulo', label: 'Título', req: true },
        { k: 'descricao', label: 'Descrição', type: 'textarea' },
        { k: 'data', label: 'Data e hora (vazio = "Em breve")', type: 'datetime-local' },
        { k: 'imagem_url', label: 'URL da imagem (ou link de foto do Drive)', type: 'image' },
        { k: 'link_inscricao', label: 'Link de inscrição (vazio = WhatsApp)' },
      ]} resumo={(r) => (r.data ? new Date(r.data).toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' }) : 'Em breve')} />
    ),
  },
  {
    id: 'ministerios', grupo: 'Site', label: 'Ministérios', icon: Users,
    el: () => (
      <Crud table="ministerios" titulo="Ministérios" campos={[
        { k: 'nome', label: 'Nome', req: true },
        { k: 'descricao', label: 'Descrição', type: 'textarea' },
        { k: 'horario', label: 'Dia / horário' },
        { k: 'icone', label: 'Ícone', type: 'select', opts: ICON_OPTS, def: 'heart' },
      ]} resumo={(r) => r.horario} />
    ),
  },
  {
    id: 'albuns', grupo: 'Site', label: 'Álbuns (Drive)', icon: Images,
    el: () => (
      <Crud table="albuns" titulo="Álbuns da galeria" ajuda="Cole o link da pasta do Google Drive (compartilhada como “qualquer pessoa com o link”). Cada pasta vira um álbum." campos={[
        { k: 'nome', label: 'Nome do álbum', req: true },
        { k: 'folder_id', label: 'Link ou ID da pasta do Drive', req: true, type: 'drive' },
      ]} resumo={(r) => r.folder_id} />
    ),
  },
  { id: 'site', grupo: 'Site', label: 'Textos & Pix', icon: Settings, el: () => <SitePanel /> },
  { id: 'membros', grupo: 'Pessoas', label: 'Membros', icon: UserCheck, pode: (p) => p.super, el: () => <Membros /> },
  { id: 'oracoes', grupo: 'Pessoas', label: 'Orações (membros)', icon: HandHeart, pode: (p) => p.intercessao, el: () => <PedidosMembros /> },
  { id: 'mensagens', grupo: 'Pessoas', label: 'Mensagens', icon: Inbox, pode: (p) => p.intercessao, el: () => <Inbox_ table="mensagens" /> },
  { id: 'avisos', grupo: 'Pessoas', label: 'Avisos', icon: HandHeart, pode: (p) => p.staff, el: () => <Inbox_ table="avisos" /> },
  { id: 'auditoria', grupo: 'Segurança', label: 'Auditoria', icon: History, pode: (p) => p.super || p.tesouraria, el: () => <Auditoria /> },
]

// Quem vê o quê: conteúdo do site = Super Admin; orações = Intercessão; membros = Super Admin
function permissoes(row) {
  const roles = row?.status === 'ativo' ? row.roles || [] : []
  const superAdmin = roles.includes('super_admin') || Boolean(row?.admin)
  return {
    admin: Boolean(row?.admin),
    super: superAdmin,
    intercessao: superAdmin || roles.includes('intercessao'),
    tesouraria: superAdmin || roles.includes('tesouraria'),
    staff: superAdmin || roles.some((r) => ['tesouraria', 'intercessao'].includes(r)),
  }
}

function Setup() {
  return (
    <div className="min-h-screen bg-mist px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="font-display text-2xl font-extrabold uppercase">Painel ainda não conectado</h1>
        <p className="mt-3 text-ink/70">
          O site está no ar com o conteúdo padrão. Para editar pelo painel, conecte o Supabase (uma vez só):
        </p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-ink/80">
          <li>Crie um projeto grátis em <a className="text-brand underline" href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
          <li>No SQL Editor, rode o arquivo <code className="rounded bg-mist px-1">supabase/schema.sql</code> do repositório.</li>
          <li>Crie seu usuário em Authentication → Users e rode a linha do final do schema para torná-lo admin.</li>
          <li>No GitHub do site: Settings → Secrets and variables → Actions → Variables, crie <code className="rounded bg-mist px-1">VITE_SUPABASE_URL</code> e <code className="rounded bg-mist px-1">VITE_SUPABASE_ANON_KEY</code>.</li>
          <li>Rode o workflow “Deploy” de novo. Pronto!</li>
        </ol>
        <a href="/" className="btn-red mt-8">Voltar ao site</a>
      </div>
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [load, setLoad] = useState(false)
  async function entrar(e) {
    e.preventDefault()
    setLoad(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setLoad(false)
  }
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-3xl bg-white p-8">
        <div className="mb-6 h-14"><Logo light={false} className="h-full w-auto text-[22px]" /></div>
        <h1 className="font-display text-xl font-extrabold uppercase">Área administrativa</h1>
        <div className="mt-5"><BotaoGoogle volta="/admin" texto="Entrar com Google" /></div>
        <input className="field mt-3" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <input className="field mt-3" type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
        {erro && <p className="mt-3 text-sm text-brand">{erro}</p>}
        <button className="btn-red mt-5 w-full" disabled={load}>{load && <Loader2 size={18} className="animate-spin" />} Entrar</button>
        <a href="/" className="mt-4 block text-center text-sm text-ink/50 hover:text-ink">Voltar ao site</a>
      </form>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(undefined)
  const [admin, setAdmin] = useState(null)
  const [tab, setTab] = useState(() => location.hash.slice(1) || '')
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    document.title = 'Admin | IBN Rondonópolis'
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setAdmin(null)
    // Liderança cadastrada no banco recebe acesso total já no login
    supabase.rpc('garantir_lider').then(() => supabase.rpc('meus_papeis')).then(({ data }) => {
      const p = permissoes(data?.[0])
      setAdmin(p.staff || p.admin ? p : false)
      if (p.staff || p.admin) supabase.rpc('registrar_acesso_admin').then(() => {})
    })
  }, [session])

  useEffect(() => {
    if (tab) history.replaceState(null, '', `#${tab}`)
  }, [tab])

  const abas = useMemo(() => (admin ? TABS.filter((t) => (t.pode ? t.pode(admin) : admin.admin)) : []), [admin])
  const atual = abas.find((t) => t.id === tab) || abas[0]

  if (!supabase) return <Setup />
  if (session === undefined) return <div className="grid min-h-screen place-items-center bg-ink"><Loader2 className="animate-spin text-white" /></div>
  if (!session) return <Login />
  if (admin === null) return <div className="grid min-h-screen place-items-center bg-ink"><Loader2 className="animate-spin text-white" /></div>
  if (!admin)
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-4 text-center text-white">
        <div>
          <p>Sua conta ({session.user.email}) ainda não tem permissão de administrador.</p>
          <button onClick={() => supabase.auth.signOut()} className="btn-ghost-light mt-6">Sair</button>
        </div>
      </div>
    )

  const ir = (id) => {
    setTab(id)
    setMenu(false)
    window.scrollTo({ top: 0 })
  }
  const grupos = [...new Set(abas.map((t) => t.grupo))]
  const Nav = () => (
    <nav className="space-y-5">
      {grupos.map((g) => (
        <div key={g}>
          <p className="mb-1.5 px-4 text-[11px] font-bold uppercase tracking-[.2em] text-white/35">{g}</p>
          {abas.filter((t) => t.grupo === g).map((t) => (
            <button
              key={t.id}
              onClick={() => ir(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition md:py-2.5 md:text-sm ${t.id === atual.id ? 'bg-brand text-white' : 'text-white/75 active:bg-white/10 md:hover:bg-white/10 md:hover:text-white'}`}
            >
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-[100svh] bg-mist md:flex">
      {/* Desktop: barra lateral */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink text-white md:flex">
        <a href="/" className="block h-12 px-6 pt-6"><Logo className="h-full w-auto" /></a>
        <div className="flex-1 overflow-y-auto px-3 py-6"><Nav /></div>
        <div className="border-t border-white/10 p-5 text-xs text-white/40">
          <p className="truncate">{session.user.email}</p>
          <div className="mt-3 flex gap-4">
            <a href="/minha-area" className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white"><Home size={15} /> Minha área</a>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white"><LogOut size={15} /> Sair</button>
          </div>
        </div>
      </aside>

      {/* Celular: cabeçalho fixo + menu em gaveta */}
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-ink px-4 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] text-white md:hidden">
        <button onClick={() => setMenu(true)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Abrir menu"><Menu size={22} /></button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-white/40">{atual.grupo}</p>
          <p className="truncate font-display text-base font-extrabold uppercase">{atual.label}</p>
        </div>
        <a href="/" className="block h-9"><Logo className="h-full w-auto" /></a>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-xs animate-[slideIn_.25s_ease-out] flex-col bg-ink text-white">
            <div className="flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="h-10"><Logo className="h-full w-auto" /></div>
              <button onClick={() => setMenu(false)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Fechar menu"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4"><Nav /></div>
            <div className="border-t border-white/10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm">
              <p className="truncate text-xs text-white/40">{session.user.email}</p>
              <div className="mt-3 flex gap-5">
                <a href="/minha-area" className="flex items-center gap-1.5 text-white/70"><Home size={16} /> Minha área</a>
                <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1.5 text-white/70"><LogOut size={16} /> Sair</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-8 sm:pt-8">
        <div className="mx-auto max-w-4xl">{atual.el({ irPara: ir })}</div>
      </main>
    </div>
  )
}
