import { useEffect, useState } from 'react'
import { Check, Loader2, Lock, PartyPopper } from 'lucide-react'
import { supabase } from './client'
import { Panel } from './Crud'

const STATUS = ['Recebido', 'Em oração', 'Respondido']
const COR = { Recebido: 'bg-brand text-white', 'Em oração': 'bg-amber-400 text-ink', Respondido: 'bg-emerald-500 text-white' }

function Nota({ r, onSalvo }) {
  const [v, setV] = useState(r.anotacao_interna || '')
  const [ok, setOk] = useState(false)
  async function salvar() {
    await supabase.from('prayer_requests').update({ anotacao_interna: v }).eq('id', r.id)
    setOk(true)
    setTimeout(() => setOk(false), 1500)
    onSalvo?.()
  }
  return (
    <div className="mt-3">
      <textarea rows={2} className="field text-sm" placeholder="Anotação interna (só a equipe vê)" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== (r.anotacao_interna || '') && salvar()} />
      {ok && <p className="mt-1 text-xs text-emerald-700">Anotação salva</p>}
    </div>
  )
}

// Pedidos de oração enviados pela área do membro (só Intercessão/Pastoral e Super Admin)
export default function PedidosMembros() {
  const [rows, setRows] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const load = async () => {
    const { data } = await supabase.from('prayer_requests').select('*').order('created_at', { ascending: false })
    const ids = [...new Set((data || []).map((r) => r.member_id))]
    const { data: perfis } = ids.length ? await supabase.from('profiles').select('id,nome,whatsapp').in('id', ids) : { data: [] }
    const nomes = Object.fromEntries((perfis || []).map((p) => [p.id, p]))
    setRows((data || []).map((r) => ({ ...r, membro: nomes[r.member_id] })))
  }
  useEffect(() => { load() }, [])

  async function status(r, s) {
    setRows(rows.map((x) => (x.id === r.id ? { ...x, status: s } : x)))
    await supabase.from('prayer_requests').update({ status: s }).eq('id', r.id)
  }
  async function aprovarTestemunho(r) {
    await supabase.from('prayer_requests').update({ testemunho_aprovado: !r.testemunho_aprovado }).eq('id', r.id)
    load()
  }

  const filtros = ['Todos', ...STATUS, 'Confidenciais', 'Testemunhos']
  const passa = (r, f) => f === 'Todos' || r.status === f || (f === 'Confidenciais' && r.confidencial) || (f === 'Testemunhos' && r.testemunho)
  const lista = (rows || []).filter((r) => passa(r, filtro))

  return (
    <Panel titulo="Pedidos de oração dos membros" ajuda="Visível apenas para a equipe de Intercessão/Pastoral. O membro é avisado quando o status muda.">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filtros.map((f) => (
          <button key={f} onClick={() => setFiltro(f)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${filtro === f ? 'bg-ink text-white' : 'bg-white text-ink/70'}`}>
            {f} {rows && <span className="opacity-60">({rows.filter((r) => passa(r, f)).length})</span>}
          </button>
        ))}
      </div>
      {rows === null ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : lista.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-ink/50">Nenhum pedido por aqui.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold">{r.confidencial && <Lock size={15} className="text-brand" />} {r.membro?.nome || 'Membro'}</p>
                  <p className="text-sm text-ink/55">{new Date(r.created_at).toLocaleString('pt-BR', { timeZone: 'America/Cuiaba', dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
                <select value={r.status} onChange={(e) => status(r, e.target.value)} className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold ${COR[r.status]}`}>
                  {STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-ink/80">{r.pedido}</p>
              {r.respondido_pelo_membro && (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-emerald-800"><PartyPopper size={16} /> O membro marcou: Deus respondeu!</p>
                  {r.testemunho && <p className="mt-1 whitespace-pre-wrap text-emerald-900/80">{r.testemunho}</p>}
                  {r.testemunho && (
                    r.autoriza_publicar ? (
                      <button onClick={() => aprovarTestemunho(r)} className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${r.testemunho_aprovado ? 'bg-emerald-600 text-white' : 'border border-emerald-600 text-emerald-700'}`}>
                        <Check size={14} /> {r.testemunho_aprovado ? 'Testemunho aprovado para publicar' : 'Aprovar testemunho para publicar'}
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-ink/50">O membro não autorizou publicar.</p>
                    )
                  )}
                </div>
              )}
              <Nota r={r} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
