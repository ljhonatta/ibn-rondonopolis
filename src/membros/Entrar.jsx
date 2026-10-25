import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Eye, EyeOff, Hourglass, Loader2, LogOut } from 'lucide-react'
import { supabase } from '../admin/client'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/api'
import { entrarComGoogle, useAuth } from '../lib/auth'
import { Logo } from '../components/ui'
import Termo from './Termo'

const MINISTERIOS = ['Inspira Jovens', 'Inspira Teens', 'Mulheres', 'Homens', 'Ação Solidária', 'Nenhum ainda']

const MSG_ERRO = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já tem cadastro. Tente entrar ou recuperar a senha.',
  'Email rate limit exceeded': 'Muitas tentativas agora. Aguarde alguns minutos e tente de novo.',
}
const traduz = (e) => MSG_ERRO[e?.message] || (e?.message?.includes('Password') ? 'A senha precisa ter pelo menos 8 caracteres.' : 'Não deu certo agora. Tente novamente.')

// Só aceita destinos internos (evita redirecionar para outro site)
const destinoSeguro = (v) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/minha-area')

function Senha({ value, onChange, placeholder = 'Senha', autoComplete }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input className="field pr-12" type={ver ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required minLength={8} autoComplete={autoComplete} />
      <button type="button" onClick={() => setVer(!ver)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-ink/40 hover:text-ink" aria-label={ver ? 'Esconder senha' : 'Mostrar senha'}>
        {ver ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

// O botão só aparece quando o login do Google estiver ligado no Supabase
let googleAtivo = null
function useGoogleAtivo() {
  const [ativo, setAtivo] = useState(googleAtivo)
  useEffect(() => {
    if (googleAtivo !== null) return
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } })
      .then((r) => r.json())
      .then((d) => setAtivo((googleAtivo = Boolean(d?.external?.google))))
      .catch(() => setAtivo((googleAtivo = false)))
  }, [])
  return ativo
}

export function BotaoGoogle({ volta, texto = 'Continuar com Google', separador = false }) {
  const [indo, setIndo] = useState(false)
  if (!useGoogleAtivo()) return null
  return (
    <>
    <button
      type="button"
      onClick={() => (setIndo(true), entrarComGoogle(volta).then(({ error }) => error && (setIndo(false), alert('Não foi possível abrir o Google agora.'))))}
      className="btn w-full border border-ink/15 bg-white normal-case tracking-normal text-ink hover:-translate-y-0.5 hover:border-ink/40"
    >
      {indo ? <Loader2 size={18} className="animate-spin" /> : (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
      )}
      <span className="font-sans text-[15px] font-semibold">{texto}</span>
    </button>
    {separador && <Ou />}
    </>
  )
}

const Ou = () => (
  <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-ink/35">
    <span className="h-px flex-1 bg-ink/10" /> ou <span className="h-px flex-1 bg-ink/10" />
  </div>
)

// Quem entrou pelo Google (ou cadastro antigo) completa WhatsApp, nascimento, ministério e LGPD
export function Completar({ profile, onPronto, onSair }) {
  const [f, setF] = useState({ nome: profile.nome || '', whatsapp: profile.whatsapp || '', nascimento: profile.nascimento || '', ministerio: profile.ministerio || 'Nenhum ainda', lgpd: false })
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')
  const [verTermo, setVerTermo] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  async function salvar(e) {
    e.preventDefault()
    if (!f.lgpd) return setMsg('Para continuar, aceite o termo de uso dos dados.')
    setEnviando(true)
    const { error } = await supabase.rpc('completar_cadastro', { p_whatsapp: f.whatsapp.trim(), p_nascimento: f.nascimento, p_ministerio: f.ministerio, p_nome: f.nome.trim() })
    setEnviando(false)
    if (error) return setMsg('Não deu certo agora. Tente novamente.')
    onPronto()
  }
  return (
    <Casca voltar={false}>
      <h1 className="font-display text-2xl font-extrabold uppercase">Falta <span className="script text-[1.3em]">pouco</span></h1>
      <p className="mt-1 text-sm text-ink/60">Complete seus dados para a liderança te conhecer melhor.</p>
      <form onSubmit={salvar} className="mt-5 space-y-3">
        <input className="field" placeholder="Nome completo" value={f.nome} onChange={set('nome')} required autoComplete="name" />
        <input className="field" type="tel" inputMode="tel" placeholder="WhatsApp com DDD" value={f.whatsapp} onChange={set('whatsapp')} required autoComplete="tel" />
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Data de nascimento</span>
          <input className="field" type="date" value={f.nascimento} onChange={set('nascimento')} required max={new Date().toISOString().slice(0, 10)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Ministério que participa</span>
          <select className="field" value={f.ministerio} onChange={set('ministerio')}>{MINISTERIOS.map((m) => <option key={m}>{m}</option>)}</select>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-mist p-3">
          <input type="checkbox" checked={f.lgpd} onChange={set('lgpd')} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
          <span className="text-sm leading-relaxed">Li e aceito o <button type="button" onClick={() => setVerTermo(true)} className="font-semibold text-brand underline">termo de uso dos meus dados</button> (LGPD).</span>
        </label>
        {msg && <p className="text-sm text-brand">{msg}</p>}
        <button className="btn-red w-full" disabled={enviando}>{enviando && <Loader2 size={18} className="animate-spin" />} Continuar</button>
        <button type="button" onClick={onSair} className="w-full py-2 text-sm font-medium text-ink/50 hover:text-ink">Sair</button>
      </form>
      {verTermo && <Termo onClose={() => setVerTermo(false)} />}
    </Casca>
  )
}

export const precisaCompletar = (p) => p && (!p.lgpd_aceite_em || !p.whatsapp || !p.nascimento)

export function Casca({ children, voltar = true }) {
  return (
    <div className="min-h-[100svh] bg-ink px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="block h-12"><Logo className="h-full w-auto" /></a>
          {voltar && (
            <a href="/" className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
              <ArrowLeft size={16} /> Site
            </a>
          )}
        </div>
        <div className="animate-[fadeUp_.5s_ease-out_both] rounded-[2rem] bg-white p-6 sm:p-8">{children}</div>
      </div>
    </div>
  )
}

export function Aguardando({ profile, onSair }) {
  const recusado = profile?.status === 'recusado' || profile?.status === 'inativo'
  return (
    <Casca>
      <div className="py-4 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-brand text-brand">
          <Hourglass size={28} strokeWidth={1.5} />
        </span>
        {recusado ? (
          <p className="mt-6 text-lg font-medium leading-relaxed">
            Seu acesso à área do membro não está ativo no momento. Se quiser conversar, fale com a liderança pelo WhatsApp da igreja.
          </p>
        ) : (
          <p className="mt-6 text-lg font-medium leading-relaxed">
            Seu cadastro foi recebido! Assim que a liderança aprovar, você terá acesso completo. Seja bem-vindo à família IBN.
          </p>
        )}
        <button onClick={onSair} className="btn-ghost-dark mt-8"><LogOut size={18} /> Sair</button>
      </div>
    </Casca>
  )
}

function NovaSenha({ onPronto }) {
  const [senha, setSenha] = useState('')
  const [estado, setEstado] = useState('')
  async function salvar(e) {
    e.preventDefault()
    setEstado('salvando')
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) return setEstado(traduz(error))
    setEstado('ok')
    setTimeout(onPronto, 1200)
  }
  return (
    <Casca voltar={false}>
      <h1 className="font-display text-xl font-extrabold uppercase">Criar nova senha</h1>
      <form onSubmit={salvar} className="mt-5 space-y-3">
        <Senha value={senha} onChange={setSenha} placeholder="Nova senha (mín. 8 caracteres)" autoComplete="new-password" />
        {estado && !['salvando', 'ok'].includes(estado) && <p className="text-sm text-brand">{estado}</p>}
        <button className="btn-red w-full" disabled={estado === 'salvando' || estado === 'ok'}>
          {estado === 'salvando' ? <Loader2 size={18} className="animate-spin" /> : estado === 'ok' ? <Check size={18} /> : null}
          {estado === 'ok' ? 'Senha alterada!' : 'Salvar nova senha'}
        </button>
      </form>
    </Casca>
  )
}

export default function Entrar() {
  const { session, profile, loading, recovery, setRecovery, signOut, reloadProfile } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const volta = destinoSeguro(params.get('volta'))
  const [aba, setAba] = useState(params.get('aba') === 'criar' ? 'criar' : 'entrar')
  const [esqueci, setEsqueci] = useState(false)
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [verTermo, setVerTermo] = useState(false)
  const [f, setF] = useState({ nome: '', whatsapp: '', email: '', nascimento: '', ministerio: 'Nenhum ainda', senha: '', lgpd: false })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => {
    document.title = 'Entrar | IBN Rondonópolis'
  }, [])

  if (!supabase) return <Navigate to="/" replace />
  if (recovery) return <NovaSenha onPronto={() => (setRecovery(false), navigate('/minha-area'))} />
  if (loading) return <div className="grid min-h-screen place-items-center bg-ink"><Loader2 className="animate-spin text-white" /></div>
  if (session && precisaCompletar(profile)) return <Completar profile={profile} onPronto={reloadProfile} onSair={signOut} />
  if (session && profile?.status === 'ativo') return <Navigate to={volta} replace />
  if (session && profile) return <Aguardando profile={profile} onSair={signOut} />

  async function entrar(e) {
    e.preventDefault()
    setEnviando(true)
    setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.senha })
    setEnviando(false)
    if (error) setMsg(traduz(error))
  }

  async function criar(e) {
    e.preventDefault()
    if (!f.lgpd) return setMsg('Para continuar, aceite o termo de uso dos dados.')
    setEnviando(true)
    setMsg('')
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.senha,
      options: {
        data: { nome: f.nome.trim(), whatsapp: f.whatsapp.trim(), nascimento: f.nascimento, ministerio: f.ministerio, lgpd: true },
        emailRedirectTo: `${location.origin}/entrar`,
      },
    })
    setEnviando(false)
    if (error) setMsg(traduz(error))
  }

  async function recuperar(e) {
    e.preventDefault()
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: `${location.origin}/entrar` })
    setEnviando(false)
    setMsg(error ? traduz(error) : 'Pronto! Se este e-mail tiver cadastro, você vai receber um link para criar uma nova senha.')
  }

  if (esqueci)
    return (
      <Casca>
        <h1 className="font-display text-xl font-extrabold uppercase">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-ink/60">Digite seu e-mail e enviaremos um link para criar uma nova senha.</p>
        <form onSubmit={recuperar} className="mt-5 space-y-3">
          <input className="field" type="email" placeholder="E-mail" value={f.email} onChange={set('email')} required autoComplete="email" />
          {msg && <p className="rounded-xl bg-mist p-3 text-sm">{msg}</p>}
          <button className="btn-red w-full" disabled={enviando}>{enviando && <Loader2 size={18} className="animate-spin" />} Enviar link</button>
          <button type="button" onClick={() => (setEsqueci(false), setMsg(''))} className="w-full py-2 text-sm font-medium text-ink/60 hover:text-ink">Voltar para entrar</button>
        </form>
      </Casca>
    )

  return (
    <Casca>
      <div className="mb-6 grid grid-cols-2 rounded-full bg-mist p-1">
        {[['entrar', 'Entrar'], ['criar', 'Criar conta']].map(([k, l]) => (
          <button key={k} onClick={() => (setAba(k), setMsg(''))} className={`rounded-full py-2.5 font-display text-sm font-bold uppercase tracking-wider transition ${aba === k ? 'bg-ink text-white' : 'text-ink/60'}`}>
            {l}
          </button>
        ))}
      </div>

      {aba === 'entrar' ? (
        <form onSubmit={entrar} className="space-y-3">
          <h1 className="font-display text-2xl font-extrabold uppercase">Área do <span className="script text-[1.3em]">membro</span></h1>
          <BotaoGoogle volta={volta} texto="Entrar com Google" separador />
          <input className="field" type="email" placeholder="E-mail" value={f.email} onChange={set('email')} required autoComplete="email" />
          <Senha value={f.senha} onChange={(v) => setF({ ...f, senha: v })} autoComplete="current-password" />
          {msg && <p className="text-sm text-brand">{msg}</p>}
          <button className="btn-red w-full" disabled={enviando}>{enviando && <Loader2 size={18} className="animate-spin" />} Entrar</button>
          <button type="button" onClick={() => (setEsqueci(true), setMsg(''))} className="w-full py-2 text-sm font-medium text-ink/60 hover:text-ink">Esqueci minha senha</button>
        </form>
      ) : (
        <form onSubmit={criar} className="space-y-3">
          <h1 className="font-display text-2xl font-extrabold uppercase">Faça parte da <span className="script text-[1.3em]">família</span></h1>
          <BotaoGoogle volta={volta} texto="Criar conta com Google" separador />
          <input className="field" placeholder="Nome completo" value={f.nome} onChange={set('nome')} required autoComplete="name" />
          <input className="field" type="tel" inputMode="tel" placeholder="WhatsApp com DDD" value={f.whatsapp} onChange={set('whatsapp')} required autoComplete="tel" />
          <input className="field" type="email" placeholder="E-mail" value={f.email} onChange={set('email')} required autoComplete="email" />
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Data de nascimento</span>
            <input className="field" type="date" value={f.nascimento} onChange={set('nascimento')} required max={new Date().toISOString().slice(0, 10)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Ministério que participa</span>
            <select className="field" value={f.ministerio} onChange={set('ministerio')}>
              {MINISTERIOS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
          <Senha value={f.senha} onChange={(v) => setF({ ...f, senha: v })} placeholder="Crie uma senha (mín. 8)" autoComplete="new-password" />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-mist p-3">
            <input type="checkbox" checked={f.lgpd} onChange={set('lgpd')} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
            <span className="text-sm leading-relaxed">
              Li e aceito o{' '}
              <button type="button" onClick={() => setVerTermo(true)} className="font-semibold text-brand underline">termo de uso dos meus dados</button>{' '}
              (LGPD).
            </span>
          </label>
          {msg && <p className="text-sm text-brand">{msg}</p>}
          <button className="btn-red w-full" disabled={enviando}>{enviando && <Loader2 size={18} className="animate-spin" />} Criar minha conta</button>
        </form>
      )}
      {verTermo && <Termo onClose={() => setVerTermo(false)} />}
    </Casca>
  )
}
