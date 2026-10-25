import { useEffect, useState } from 'react'
import { Loader2, Lock, MessageCircle, Trash2 } from 'lucide-react'
import { supabase } from './client'
import { waLink } from '../lib/utils'
import { Panel } from './Crud'

const STATUS = ['Novo', 'Em oração', 'Respondido']
const COR = { Novo: 'bg-brand text-white', 'Em oração': 'bg-amber-400 text-ink', Respondido: 'bg-emerald-500 text-white' }

export default function Inbox({ table }) {
  const [rows, setRows] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const mensagens = table === 'mensagens'

  const load = () => supabase.from(table).select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, [table])

  async function status(r, s) {
    setRows(rows.map((x) => (x.id === r.id ? { ...x, status: s } : x)))
    await supabase.from(table).update({ status: s }).eq('id', r.id)
  }
  async function remover(r) {
    if (!confirm('Apagar definitivamente?')) return
    await supabase.from(table).delete().eq('id', r.id)
    load()
  }

  const lista = (rows || []).filter((r) => !mensagens || filtro === 'Todos' || (filtro === 'Pedido de oração' ? r.tipo === filtro : r.status === filtro))
  const data = (d) => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Cuiaba', dateStyle: 'short', timeStyle: 'short' })

  return (
    <Panel
      titulo={mensagens ? 'Mensagens e pedidos de oração' : 'Quero ser avisado'}
      ajuda={mensagens ? 'Visível apenas para administradores. Pedidos confidenciais estão marcados com cadeado.' : 'Pessoas que pediram aviso sobre eventos “Em breve”.'}
    >
      {mensagens && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {['Todos', ...STATUS, 'Pedido de oração'].map((f) => (
            <button key={f} onClick={() => setFiltro(f)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${filtro === f ? 'bg-ink text-white' : 'bg-white text-ink/70'}`}>
              {f} {rows && <span className="opacity-60">({rows.filter((r) => f === 'Todos' || (f === 'Pedido de oração' ? r.tipo === f : r.status === f)).length})</span>}
            </button>
          ))}
        </div>
      )}
      {rows === null ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : lista.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-ink/50">Nenhuma mensagem por aqui.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {r.confidencial && <Lock size={15} className="text-brand" />} {r.nome}
                    {r.perfil && <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-medium text-ink/60">{r.perfil}</span>}
                  </p>
                  <p className="text-sm text-ink/55">
                    {data(r.created_at)} · {r.whatsapp}{r.email && ` · ${r.email}`}
                  </p>
                </div>
                {mensagens && (
                  <select value={r.status} onChange={(e) => status(r, e.target.value)} className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold ${COR[r.status]}`}>
                    {STATUS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                )}
              </div>
              {mensagens ? (
                <>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-brand">{r.tipo}</p>
                  <p className="mt-1 whitespace-pre-wrap text-ink/80">{r.mensagem}</p>
                  <textarea
                    rows={2}
                    className="field mt-3 text-sm"
                    placeholder="Anotação interna (só a equipe vê)"
                    defaultValue={r.anotacao_interna || ''}
                    onBlur={(e) => e.target.value !== (r.anotacao_interna || '') && supabase.from(table).update({ anotacao_interna: e.target.value }).eq('id', r.id).then(() => {})}
                  />
                </>
              ) : (
                <p className="mt-2 text-sm">Evento: <strong>{r.evento_titulo}</strong></p>
              )}
              <div className="mt-4 flex gap-2">
                <a href={waLink(r.whatsapp.replace(/\D/g, '').length <= 11 ? `55${r.whatsapp}` : r.whatsapp, `Olá, ${r.nome.split(' ')[0]}! Aqui é da IBN Rondonópolis.`)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">
                  <MessageCircle size={16} /> Responder
                </a>
                <button onClick={() => remover(r)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">
                  <Trash2 size={16} /> Apagar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
