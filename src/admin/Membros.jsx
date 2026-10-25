import { useEffect, useMemo, useState } from 'react'
import { Cake, Check, Loader2, MessageCircle, Search, Trash2, UserX, X } from 'lucide-react'
import { supabase } from './client'
import { waLink } from '../lib/utils'
import { Panel, Toast, useToast } from './Crud'

const STATUS = [
  ['pendente', 'Pendentes'],
  ['ativo', 'Ativos'],
  ['inativo', 'Inativos'],
  ['recusado', 'Recusados'],
]
const PAPEIS = [
  ['tesouraria', 'Tesouraria'],
  ['intercessao', 'Intercessão / Pastoral'],
  ['super_admin', 'Super Admin'],
]
const MINISTERIOS = ['Todos', 'Inspira Jovens', 'Inspira Teens', 'Mulheres', 'Homens', 'Ação Solidária', 'Nenhum ainda']

const idade = (d) => (d ? Math.floor((Date.now() - new Date(d)) / 31557600000) : null)
const fone = (w = '') => (w.replace(/\D/g, '').length <= 11 ? `55${w}` : w)

function Editar({ m, onClose, onSalvo }) {
  const [f, setF] = useState({ nome: m.nome, whatsapp: m.whatsapp || '', nascimento: m.nascimento || '', ministerio: m.ministerio || 'Nenhum ainda', roles: m.roles })
  const [salvando, setSalvando] = useState(false)
  const toggle = (r) => setF({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] })
  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    const { error } = await supabase.from('profiles').update({ ...f, nascimento: f.nascimento || null }).eq('id', m.id)
    setSalvando(false)
    if (error) return alert('Erro: ' + error.message)
    onSalvo()
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/60 backdrop-blur-sm sm:place-items-center sm:p-6" onClick={onClose}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold uppercase">Editar membro</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <label className="block"><span className="mb-1 block text-sm font-semibold">Nome</span><input className="field" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">WhatsApp</span><input className="field" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Nascimento</span><input type="date" className="field" value={f.nascimento} onChange={(e) => setF({ ...f, nascimento: e.target.value })} /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Ministério</span>
            <select className="field" value={f.ministerio} onChange={(e) => setF({ ...f, ministerio: e.target.value })}>{MINISTERIOS.slice(1).map((x) => <option key={x}>{x}</option>)}</select>
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Papéis na equipe</legend>
            <div className="space-y-2">
              {PAPEIS.map(([id, label]) => (
                <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 p-3">
                  <input type="checkbox" checked={f.roles.includes(id)} onChange={() => toggle(id)} className="h-5 w-5 accent-brand" />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/50">Todo cadastro aprovado já é Membro. Mudanças de papel ficam na auditoria.</p>
          </fieldset>
        </div>
        <button className="btn-red mt-6 w-full" disabled={salvando}>{salvando && <Loader2 size={18} className="animate-spin" />} Salvar</button>
      </form>
    </div>
  )
}

export default function Membros() {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('pendente')
  const [busca, setBusca] = useState('')
  const [ministerio, setMinisterio] = useState('Todos')
  const [aniversario, setAniversario] = useState(false)
  const [editar, setEditar] = useState(null)
  const [toast, showToast] = useToast()

  const load = () => supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, [])

  const mes = new Date().getMonth()
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return (rows || [])
      .filter((r) => r.status === status)
      .filter((r) => ministerio === 'Todos' || r.ministerio === ministerio)
      .filter((r) => !aniversario || (r.nascimento && new Date(r.nascimento + 'T12:00').getMonth() === mes))
      .filter((r) => !q || [r.nome, r.email, r.whatsapp].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => (aniversario ? new Date(a.nascimento).getDate() - new Date(b.nascimento).getDate() : 0))
  }, [rows, status, busca, ministerio, aniversario, mes])

  async function mudar(r, novo, msg) {
    const { error } = await supabase.from('profiles').update({ status: novo }).eq('id', r.id)
    showToast(error ? 'Erro: ' + error.message : msg)
    load()
  }

  async function excluir(r) {
    if (!confirm(`Excluir definitivamente o cadastro de ${r.nome}? Isso apaga a conta e os dados dele.`)) return
    const { error } = await supabase.rpc('excluir_membro', { p_id: r.id })
    showToast(error ? 'Erro: ' + error.message : 'Cadastro excluído')
    load()
  }

  const conta = (s) => (rows || []).filter((r) => r.status === s).length

  return (
    <Panel titulo="Membros" ajuda="Aprove novos cadastros, edite dados e defina quem faz parte da equipe.">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {STATUS.map(([id, label]) => (
          <button key={id} onClick={() => setStatus(id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${status === id ? 'bg-ink text-white' : 'bg-white text-ink/70'}`}>
            {label} <span className="opacity-60">({conta(id)})</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <input className="field pl-11" placeholder="Buscar por nome, e-mail ou WhatsApp" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <select className="field sm:w-48" value={ministerio} onChange={(e) => setMinisterio(e.target.value)}>{MINISTERIOS.map((m) => <option key={m}>{m}</option>)}</select>
        <button onClick={() => setAniversario(!aniversario)} className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${aniversario ? 'bg-brand text-white' : 'bg-white text-ink/70'}`}>
          <Cake size={16} /> Aniversariantes do mês
        </button>
      </div>

      {rows === null ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : lista.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-ink/50">Ninguém por aqui.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-mist">
                  {r.foto_url ? <img src={r.foto_url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-display font-black text-ink/30">{r.nome?.[0]}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.nome || '(sem nome)'}</p>
                  <p className="text-sm text-ink/55">
                    {r.email} · {r.whatsapp}
                    {r.nascimento && ` · ${new Date(r.nascimento + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} (${idade(r.nascimento)} anos)`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.ministerio && <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-medium">{r.ministerio}</span>}
                    {r.roles.filter((x) => x !== 'membro').map((x) => <span key={x} className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">{PAPEIS.find((p) => p[0] === x)?.[1] || x}</span>)}
                    {r.exclusao_solicitada_em && <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">Pediu exclusão</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status === 'pendente' && (
                  <>
                    <button onClick={() => mudar(r, 'ativo', 'Cadastro aprovado. O membro foi avisado')} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><Check size={16} /> Aprovar</button>
                    <button onClick={() => mudar(r, 'recusado', 'Cadastro recusado')} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"><X size={16} /> Recusar</button>
                  </>
                )}
                {r.status === 'ativo' && <button onClick={() => mudar(r, 'inativo', 'Membro desativado')} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-mist"><UserX size={16} /> Desativar</button>}
                {(r.status === 'inativo' || r.status === 'recusado') && <button onClick={() => mudar(r, 'ativo', 'Membro ativado')} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><Check size={16} /> Ativar</button>}
                <button onClick={() => setEditar(r)} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-mist">Editar / papéis</button>
                {r.whatsapp && (
                  <a href={waLink(fone(r.whatsapp), `Olá, ${r.nome.split(' ')[0]}! Aqui é da IBN Rondonópolis.`)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"><MessageCircle size={16} /> WhatsApp</a>
                )}
                {r.exclusao_solicitada_em && <button onClick={() => excluir(r)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"><Trash2 size={16} /> Excluir dados</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {editar && <Editar m={editar} onClose={() => setEditar(null)} onSalvo={() => (setEditar(null), showToast('Salvo!'), load())} />}
      <Toast msg={toast} />
    </Panel>
  )
}
