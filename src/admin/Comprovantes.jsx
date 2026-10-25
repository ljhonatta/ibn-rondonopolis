import { useEffect, useMemo, useState } from 'react'
import { Check, ExternalLink, FileText, Loader2, Plus, X } from 'lucide-react'
import { supabase } from './client'
import { brl, dataBR, hojeISO, linkComprovante, mesAno, paraNumero } from '../lib/dinheiro'
import { Panel, Toast, useToast } from './Crud'
import { Folha } from '../membros/Contribuicoes'

// Junta contribuições e parcelas (um comprovante pode pagar várias parcelas) numa fila só
function montarFila(contribs, parcelas, nomes) {
  const itens = contribs.map((c) => ({
    chave: `c-${c.id}`, tipo: c.tipo, valor: Number(c.valor), data: c.data_pix, enviado: c.created_at, path: c.comprovante_path,
    membro: nomes[c.member_id], obs: c.observacao, contrib: [c.id], parcelas: [],
  }))
  const grupos = {}
  for (const p of parcelas) {
    const g = (grupos[p.pagamento_grupo || p.id] ||= { chave: `p-${p.pagamento_grupo || p.id}`, tipo: 'Espaço Novo', valor: 0, data: p.enviado_em, enviado: p.enviado_em, path: p.comprovante_path, membro: nomes[p.member_id], contrib: [], parcelas: [], meses: [] })
    g.valor += Number(p.valor)
    g.parcelas.push(p.id)
    g.meses.push(p.competencia)
  }
  return [...itens, ...Object.values(grupos)].sort((a, b) => new Date(a.enviado) - new Date(b.enviado))
}

function Visualizar({ item, onClose, onRevisado }) {
  const [url, setUrl] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [recusar, setRecusar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const pdf = item.path?.endsWith('.pdf')
  useEffect(() => { linkComprovante(item.path).then(setUrl) }, [item.path])

  async function revisar(aprovar) {
    setSalvando(true)
    const { error } = await supabase.rpc('revisar_comprovantes', { p_contrib: item.contrib, p_parcelas: item.parcelas, p_aprovar: aprovar, p_motivo: aprovar ? null : motivo })
    setSalvando(false)
    if (error) return alert(error.message.replace(/^.*?: /, ''))
    onRevisado(aprovar ? 'Baixa confirmada. O membro foi avisado.' : 'Comprovante recusado. O membro foi avisado.')
  }

  return (
    <Folha titulo={`${item.tipo} · ${brl(item.valor)}`} onClose={onClose}>
      <p className="text-sm text-ink/60">{item.membro?.nome} · enviado em {new Date(item.enviado).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
      {item.meses && <p className="mt-1 text-sm capitalize text-ink/60">Parcelas: {item.meses.map(mesAno).join(', ')}</p>}
      {item.obs && <p className="mt-2 rounded-xl bg-mist p-3 text-sm">“{item.obs}”</p>}
      <div className="mt-4 overflow-hidden rounded-2xl bg-mist">
        {!url ? (
          <div className="grid h-64 place-items-center"><Loader2 className="animate-spin text-ink/40" /></div>
        ) : pdf ? (
          <iframe src={url} title="Comprovante" className="h-[60svh] w-full bg-white" />
        ) : (
          <img src={url} alt="Comprovante" className="max-h-[60svh] w-full object-contain" />
        )}
      </div>
      {url && <a href={url} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60"><ExternalLink size={14} /> Abrir em tela cheia (link vale 10 min)</a>}

      {recusar ? (
        <div className="mt-4 space-y-3">
          <textarea autoFocus rows={2} className="field" placeholder="Motivo (o membro vai ver). Ex.: valor diferente do comprovante" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setRecusar(false)} className="btn-ghost-dark">Voltar</button>
            <button onClick={() => revisar(false)} disabled={!motivo.trim() || salvando} className="btn bg-brand text-white disabled:opacity-40">Recusar</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => setRecusar(true)} className="btn border border-brand text-brand"><X size={18} /> Recusar</button>
          <button onClick={() => revisar(true)} disabled={salvando} className="btn bg-emerald-600 text-white">{salvando ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Confirmar baixa</button>
        </div>
      )}
    </Folha>
  )
}

function Manual({ membros, onClose, onPronto }) {
  const [f, setF] = useState({ member_id: '', nome_avulso: '', tipo: 'Oferta', valor: '', data: hojeISO(), forma: 'Dinheiro', obs: '' })
  const [salvando, setSalvando] = useState(false)
  async function salvar(e) {
    e.preventDefault()
    const valor = paraNumero(f.valor)
    if (!(valor > 0)) return alert('Informe o valor.')
    setSalvando(true)
    const { error } = await supabase.from('contributions').insert({
      member_id: f.member_id || null, nome_avulso: f.member_id ? null : f.nome_avulso || 'Oferta no culto',
      tipo: f.tipo, valor, data_pix: f.data, forma: f.forma, observacao: f.obs || null, manual: true,
    })
    setSalvando(false)
    if (error) return alert('Erro: ' + error.message)
    onPronto()
  }
  return (
    <Folha titulo="Registrar contribuição manual" onClose={onClose}>
      <form onSubmit={salvar} className="space-y-3">
        <select className="field" value={f.member_id} onChange={(e) => setF({ ...f, member_id: e.target.value })}>
          <option value="">Sem identificação (ex.: gazofilácio)</option>
          {membros.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        {!f.member_id && <input className="field" placeholder="Descrição (ex.: Oferta culto de domingo)" value={f.nome_avulso} onChange={(e) => setF({ ...f, nome_avulso: e.target.value })} />}
        <div className="grid grid-cols-2 gap-2">
          <select className="field" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>{['Dízimo', 'Oferta', 'Doação'].map((t) => <option key={t}>{t}</option>)}</select>
          <select className="field" value={f.forma} onChange={(e) => setF({ ...f, forma: e.target.value })}>{['Dinheiro', 'Pix', 'Cartão', 'Transferência'].map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="field" inputMode="decimal" placeholder="Valor R$" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} required />
          <input type="date" className="field" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} required />
        </div>
        <input className="field" placeholder="Observação (opcional)" value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} />
        <button className="btn-red w-full" disabled={salvando}>{salvando && <Loader2 size={18} className="animate-spin" />} Registrar (já confirmado)</button>
      </form>
    </Folha>
  )
}

export default function Comprovantes() {
  const [fila, setFila] = useState(null)
  const [membros, setMembros] = useState([])
  const [aberto, setAberto] = useState(null)
  const [sel, setSel] = useState([])
  const [manual, setManual] = useState(false)
  const [historico, setHistorico] = useState([])
  const [toast, showToast] = useToast()

  const load = async () => {
    const [{ data: c }, { data: p }, { data: m }, { data: h }] = await Promise.all([
      supabase.from('contributions').select('*').eq('status', 'Aguardando confirmação'),
      supabase.from('campaign_installments').select('*').eq('status', 'Aguardando confirmação'),
      supabase.from('profiles').select('id,nome').eq('status', 'ativo').order('nome'),
      supabase.from('contributions').select('*').neq('status', 'Aguardando confirmação').order('revisado_em', { ascending: false }).limit(15),
    ])
    const nomes = Object.fromEntries((m || []).map((x) => [x.id, x]))
    setMembros(m || [])
    setFila(montarFila(c || [], p || [], nomes))
    setHistorico((h || []).map((x) => ({ ...x, membro: nomes[x.member_id] })))
    setSel([])
  }
  useEffect(() => { load() }, [])

  const selecionados = useMemo(() => (fila || []).filter((i) => sel.includes(i.chave)), [fila, sel])
  async function lote() {
    if (!confirm(`Confirmar baixa de ${selecionados.length} comprovante(s)? Confira antes de confirmar.`)) return
    const { error } = await supabase.rpc('revisar_comprovantes', { p_contrib: selecionados.flatMap((i) => i.contrib), p_parcelas: selecionados.flatMap((i) => i.parcelas), p_aprovar: true })
    showToast(error ? 'Erro: ' + error.message : 'Baixas confirmadas!')
    load()
  }

  return (
    <Panel titulo="Comprovantes" ajuda="Confira cada comprovante antes de dar baixa. O membro é avisado na hora." acao={<button onClick={() => setManual(true)} className="btn-red"><Plus size={18} /> Lançamento manual</button>}>
      {fila === null ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : fila.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-ink/50">Nenhum comprovante aguardando. Tudo em dia! 🙌</p>
      ) : (
        <ul className="space-y-2">
          {fila.map((i) => (
            <li key={i.chave} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
              <input type="checkbox" checked={sel.includes(i.chave)} onChange={() => setSel(sel.includes(i.chave) ? sel.filter((x) => x !== i.chave) : [...sel, i.chave])} className="h-6 w-6 shrink-0 accent-brand" aria-label="Selecionar" />
              <button onClick={() => setAberto(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${i.tipo === 'Espaço Novo' ? 'bg-brand text-white' : 'bg-ink text-white'}`}><FileText size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{i.membro?.nome || 'Membro'}</span>
                  <span className="block truncate text-sm text-ink/55">{i.tipo}{i.meses ? ` · ${i.meses.length} parcela(s)` : ''} · {dataBR(i.data)}</span>
                </span>
                <span className="shrink-0 font-display text-lg font-extrabold">{brl(i.valor)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {historico.length > 0 && (
        <>
          <h3 className="mb-2 mt-8 font-display text-sm font-bold uppercase tracking-[.2em] text-ink/45">Últimas revisões e lançamentos</h3>
          <ul className="divide-y divide-ink/5 rounded-2xl bg-white shadow-sm">
            {historico.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="min-w-0 truncate">{h.membro?.nome || h.nome_avulso} · {h.tipo}{h.manual ? ` (${h.forma})` : ''}</span>
                <span className={`shrink-0 font-semibold ${h.status === 'Confirmado' ? 'text-emerald-700' : 'text-brand'}`}>{brl(h.valor)} · {h.status}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {selecionados.length > 0 && (
        <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 px-4">
          <button onClick={lote} className="btn mx-auto w-full max-w-md bg-emerald-600 text-white shadow-2xl"><Check size={18} /> Confirmar {selecionados.length} · {brl(selecionados.reduce((s, i) => s + i.valor, 0))}</button>
        </div>
      )}
      {aberto && <Visualizar item={aberto} onClose={() => setAberto(null)} onRevisado={(m) => (setAberto(null), showToast(m), load())} />}
      {manual && <Manual membros={membros} onClose={() => setManual(false)} onPronto={() => (setManual(false), showToast('Lançamento registrado'), load())} />}
      <Toast msg={toast} />
    </Panel>
  )
}
