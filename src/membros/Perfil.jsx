import { useRef, useState } from 'react'
import { Camera, Check, KeyRound, Loader2, Save, Trash2 } from 'lucide-react'
import { supabase } from '../admin/client'
import { useAuth } from '../lib/auth'
import Termo from './Termo'
import AtivarNotificacoes from '../components/AtivarNotificacoes'

const MINISTERIOS = ['Inspira Jovens', 'Inspira Teens', 'Mulheres', 'Homens', 'Ação Solidária', 'Nenhum ainda']

export default function Perfil() {
  const { profile, reloadProfile, session } = useAuth()
  const [f, setF] = useState({
    nome: profile.nome || '',
    whatsapp: profile.whatsapp || '',
    nascimento: profile.nascimento || '',
    ministerio: profile.ministerio || 'Nenhum ainda',
    notif_email: profile.notif_email,
    notif_whatsapp: profile.notif_whatsapp,
  })
  const [estado, setEstado] = useState('')
  const [foto, setFoto] = useState(false)
  const [senha, setSenha] = useState('')
  const [senhaMsg, setSenhaMsg] = useState('')
  const [termo, setTermo] = useState(false)
  const input = useRef(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function salvar(e) {
    e.preventDefault()
    setEstado('salvando')
    const { error } = await supabase.from('profiles').update({ ...f, nascimento: f.nascimento || null }).eq('id', profile.id)
    setEstado(error ? 'erro' : 'ok')
    if (!error) reloadProfile()
    setTimeout(() => setEstado(''), 2500)
  }

  async function trocarFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('A foto pode ter no máximo 2MB.')
    setFoto(true)
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${profile.id}/foto-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
    if (!error) {
      const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      await supabase.from('profiles').update({ foto_url: url }).eq('id', profile.id)
      reloadProfile()
    } else alert('Não foi possível enviar a foto.')
    setFoto(false)
  }

  async function novaSenha(e) {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSenhaMsg(error ? 'A senha precisa ter pelo menos 8 caracteres.' : 'Senha alterada!')
    if (!error) setSenha('')
  }

  async function pedirExclusao() {
    if (!confirm('Tem certeza? A liderança vai receber seu pedido de exclusão dos dados e entrará em contato para concluir.')) return
    await supabase.from('profiles').update({ exclusao_solicitada_em: new Date().toISOString() }).eq('id', profile.id)
    reloadProfile()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={salvar} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => input.current?.click()} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-brand bg-mist" aria-label="Trocar foto">
            {profile.foto_url ? <img src={profile.foto_url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center font-display text-2xl font-black text-ink/30">{profile.nome?.[0]}</span>}
            <span className="absolute inset-0 grid place-items-center bg-ink/50 text-white opacity-0 transition group-hover:opacity-100">{foto ? <Loader2 className="animate-spin" /> : <Camera />}</span>
          </button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={trocarFoto} />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold uppercase">{profile.nome}</p>
            <p className="truncate text-sm text-ink/55">{session.user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Nome completo</span><input className="field" value={f.nome} onChange={set('nome')} required /></label>
          <label><span className="mb-1 block text-sm font-semibold">WhatsApp</span><input className="field" type="tel" value={f.whatsapp} onChange={set('whatsapp')} /></label>
          <label><span className="mb-1 block text-sm font-semibold">Nascimento</span><input className="field" type="date" value={f.nascimento} onChange={set('nascimento')} /></label>
          <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Ministério</span>
            <select className="field" value={f.ministerio} onChange={set('ministerio')}>{MINISTERIOS.map((m) => <option key={m}>{m}</option>)}</select>
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold">Quero receber avisos por</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.notif_email} onChange={set('notif_email')} className="h-5 w-5 accent-brand" /> E-mail</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.notif_whatsapp} onChange={set('notif_whatsapp')} className="h-5 w-5 accent-brand" /> WhatsApp</label>
          </div>
        </fieldset>

        <button className="btn-red mt-6 w-full sm:w-auto" disabled={estado === 'salvando'}>
          {estado === 'salvando' ? <Loader2 size={18} className="animate-spin" /> : estado === 'ok' ? <Check size={18} /> : <Save size={18} />}
          {estado === 'ok' ? 'Salvo!' : estado === 'erro' ? 'Tente de novo' : 'Salvar'}
        </button>
      </form>

      <AtivarNotificacoes app="membros" />

      <form onSubmit={novaSenha} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <h3 className="flex items-center gap-2 font-display font-extrabold uppercase"><KeyRound size={18} className="text-brand" /> Trocar senha</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input className="field" type="password" minLength={8} required placeholder="Nova senha (mín. 8)" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
          <button className="btn-ghost-dark shrink-0">Alterar</button>
        </div>
        {senhaMsg && <p className="mt-2 text-sm text-ink/70">{senhaMsg}</p>}
      </form>

      <div className="rounded-3xl bg-white p-5 text-sm shadow-sm sm:p-6">
        <h3 className="font-display font-extrabold uppercase">Seus dados</h3>
        <p className="mt-2 text-ink/60">Seus dados são usados apenas pela igreja, conforme o <button onClick={() => setTermo(true)} className="font-semibold text-brand underline">termo de uso</button>.</p>
        {profile.exclusao_solicitada_em ? (
          <p className="mt-4 rounded-xl bg-mist p-3">Pedido de exclusão enviado em {new Date(profile.exclusao_solicitada_em).toLocaleDateString('pt-BR')}. A liderança vai entrar em contato.</p>
        ) : (
          <button onClick={pedirExclusao} className="mt-4 inline-flex items-center gap-2 font-semibold text-brand"><Trash2 size={16} /> Solicitar exclusão da minha conta</button>
        )}
      </div>
      {termo && <Termo onClose={() => setTermo(false)} />}
    </div>
  )
}
