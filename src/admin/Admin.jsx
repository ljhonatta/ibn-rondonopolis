import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays, Church, HandHeart, History, Images, Inbox, Loader2, LogOut, Radio, Settings, UserCheck, Users,
} from 'lucide-react'
import { supabase } from './client'
import { Logo } from '../components/ui'
import Crud from './Crud'
import LivePanel from './LivePanel'
import SitePanel from './SitePanel'
import Inbox_ from './Inbox'
import Membros from './Membros'
import PedidosMembros from './PedidosMembros'
import Auditoria from './Auditoria'
import { DIAS } from '../lib/defaults'
import { MINISTERIO_ICONES } from '../components/Ministries'

const DIA_OPTS = DIAS.map((d, i) => ({ value: i, label: d }))
const ICON_OPTS = Object.keys(MINISTERIO_ICONES).map((k) => ({ value: k, label: k }))

const TABS = [
  { id: 'live', label: 'Ao vivo', icon: Radio, el: () => <LivePanel /> },
  {
    id: 'cultos', label: 'Cultos', icon: Church,
    el: () => (
      <Crud table="cultos" titulo="Cultos" campos={[
        { k: 'nome', label: 'Nome do culto', req: true },
        { k: 'dia', label: 'Dia', type: 'select', opts: DIA_OPTS, req: true, def: 0 },
        { k: 'hora', label: 'Horário', type: 'time', req: true },
      ]} resumo={(r) => `${DIAS[r.dia]} · ${r.hora}`} />
    ),
  },
  {
    id: 'eventos', label: 'Eventos', icon: CalendarDays,
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
    id: 'ministerios', label: 'Ministérios', icon: Users,
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
    id: 'albuns', label: 'Álbuns (Drive)', icon: Images,
    el: () => (
      <Crud table="albuns" titulo="Álbuns da galeria" ajuda="Cole o link da pasta do Google Drive (compartilhada como “qualquer pessoa com o link”). Cada pasta vira um álbum." campos={[
        { k: 'nome', label: 'Nome do álbum', req: true },
        { k: 'folder_id', label: 'Link ou ID da pasta do Drive', req: true, type: 'drive' },
      ]} resumo={(r) => r.folder_id} />
    ),
  },
  { id: 'site', label: 'Textos & Pix', icon: Settings, el: () => <SitePanel /> },
  { id: 'membros', label: 'Membros', icon: UserCheck, pode: (p) => p.super, el: () => <Membros /> },
  { id: 'oracoes', label: 'Orações (membros)', icon: HandHeart, pode: (p) => p.intercessao, el: () => <PedidosMembros /> },
  { id: 'mensagens', label: 'Mensagens', icon: Inbox, pode: (p) => p.intercessao, el: () => <Inbox_ table="mensagens" /> },
  { id: 'avisos', label: 'Avisos', icon: HandHeart, pode: (p) => p.staff, el: () => <Inbox_ table="avisos" /> },
  { id: 'auditoria', label: 'Auditoria', icon: History, pode: (p) => p.super || p.tesouraria, el: () => <Auditoria /> },
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
        <input className="field mt-5" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
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
  const [tab, setTab] = useState(() => location.hash.slice(1) || 'live')

  useEffect(() => {
    document.title = 'Admin | IBN Rondonópolis'
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setAdmin(null)
    supabase.rpc('meus_papeis').then(({ data }) => {
      const p = permissoes(data?.[0])
      setAdmin(p.staff || p.admin ? p : false)
      if (p.staff || p.admin) supabase.rpc('registrar_acesso_admin').then(() => {})
    })
  }, [session])

  useEffect(() => {
    history.replaceState(null, '', `#${tab}`)
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

  return (
    <div className="min-h-screen bg-mist md:flex">
      <aside className="sticky top-0 z-20 bg-ink text-white md:h-screen md:w-64 md:shrink-0">
        <div className="flex items-center justify-between p-4 md:block md:p-6">
          <a href="/" className="block h-10 md:h-12"><Logo className="h-full w-auto text-[17px]" /></a>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-sm text-white/60 hover:text-white md:hidden"><LogOut size={16} /> Sair</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-4">
          {abas.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${t.id === atual.id ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 hidden text-xs text-white/40 md:block">
          {session.user.email}
          <button onClick={() => supabase.auth.signOut()} className="mt-2 flex items-center gap-2 text-sm text-white/60 hover:text-white"><LogOut size={16} /> Sair</button>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">{atual.el()}</div>
      </main>
    </div>
  )
}

