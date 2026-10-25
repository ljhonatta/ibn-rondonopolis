import { useEffect, useMemo, useState } from 'react'
import { BellRing, Check, Download, Loader2, Save, X } from 'lucide-react'
import { supabase, imageFrom } from './client'
import { brl, dataBR, hojeISO, paraNumero } from '../lib/dinheiro'
import { Panel, Toast, useToast } from './Crud'

function Config({ onSalvo }) {
  const [c, setC] = useState(null)
  const [salvando, setSalvando] = useState(false)
  useEffect(() => {
    supabase.from('campaign_settings').select('*').eq('id', 1).single().then(({ data }) =>
      setC({ ...data, meta: String(data.meta_aluguel).replace('.', ','), minimo: String(data.valor_minimo).replace('.', ','), sugeridos: data.valores_sugeridos.join(', '), fotosTxt: data.fotos.join('\n') }))
  }, [])
  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    const { error } = await supabase.from('campaign_settings').update({
      meta_aluguel: paraNumero(c.meta),
      valor_minimo: paraNumero(c.minimo),
      valores_sugeridos: c.sugeridos.split(/[;,\s]+/).map(paraNumero).filter((n) => n > 0),
      dia_vencimento: Number(c.dia_vencimento),
      fotos: c.fotosTxt.split('\n').map((l) => imageFrom(l.trim())).filter(Boolean),
    }).eq('id', 1)
    setSalvando(false)
    onSalvo(error ? 'Erro: ' + error.message : 'Configuração salva (registrada na auditoria)')
  }
  if (!c) return <Loader2 className="animate-spin text-ink/40" />
  return (
    <form onSubmit={salvar} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display font-extrabold uppercase">Configuração</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label><span className="mb-1 block text-sm font-semibold">Valor do aluguel (meta mensal)</span><input className="field" inputMode="decimal" value={c.meta} onChange={(e) => setC({ ...c, meta: e.target.value })} /></label>
        <label><span className="mb-1 block text-sm font-semibold">Valor mínimo por membro</span><input className="field" inputMode="decimal" value={c.minimo} onChange={(e) => setC({ ...c, minimo: e.target.value })} /></label>
        <label><span className="mb-1 block text-sm font-semibold">Valores sugeridos (separados por vírgula)</span><input className="field" value={c.sugeridos} onChange={(e) => setC({ ...c, sugeridos: e.target.value })} /></label>
        <label><span className="mb-1 block text-sm font-semibold">Dia de vencimento</span><input className="field" type="number" min={1} max={28} value={c.dia_vencimento} onChange={(e) => setC({ ...c, dia_vencimento: e.target.value })} /></label>
        <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Fotos do espaço (um link por linha, pode ser link de foto do Google Drive)</span><textarea rows={3} className="field" value={c.fotosTxt} onChange={(e) => setC({ ...c, fotosTxt: e.target.value })} /></label>
      </div>
      <p className="mt-2 text-xs text-ink/50">Mudar o vencimento vale para novas adesões. Valores e meta mudam na hora na página pública.</p>
      <button className="btn-red mt-4 w-full sm:w-auto" disabled={salvando}>{salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar</button>
    </form>
  )
}

function csv(linhas) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const txt = '﻿' + linhas.map((l) => l.map(esc).join(';')).join('\r\n')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })), download: `espaco-novo-${hojeISO()}.csv` })
  a.click()
}

export default function EspacoNovoAdmin() {
  const [dados, setDados] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [sel, setSel] = useState([])
  const [toast, showToast] = useToast()
  const hoje = hojeISO()

  const load = async () => {
    const [{ data: a }, { data: p }, { data: r }, { data: perfis }] = await Promise.all([
      supabase.from('campaign_memberships').select('*').eq('status', 'ativa'),
      supabase.from('campaign_installments').select('membership_id,status,vencimento,valor'),
      supabase.from('campaign_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,nome,whatsapp'),
    ])
    const nomes = Object.fromEntries((perfis || []).map((x) => [x.id, x]))
    const part = (a || []).map((m) => {
      const ps = (p || []).filter((x) => x.membership_id === m.id)
      return {
        ...m, membro: nomes[m.member_id],
        pagas: ps.filter((x) => x.status === 'Pago').length,
        aguardando: ps.filter((x) => x.status === 'Aguardando confirmação').length,
        abertas: ps.filter((x) => x.status === 'Em aberto').length,
        vencidas: ps.filter((x) => x.status === 'Em aberto' && x.vencimento < hoje).length,
        emAtraso: ps.filter((x) => x.status === 'Em aberto' && x.vencimento < hoje).reduce((s, x) => s + Number(x.valor), 0),
      }
    }).sort((x, y) => y.vencidas - x.vencidas || (x.membro?.nome || '').localeCompare(y.membro?.nome || ''))
    setDados({ part, pedidos: (r || []).map((x) => ({ ...x, membro: nomes[x.member_id] })) })
    setSel([])
  }
  useEffect(() => { load() }, [])

  const lista = useMemo(() => (dados?.part || []).filter((m) => filtro === 'todos' || m.vencidas > 0), [dados, filtro])

  async function lembrar(ids) {
    const { data, error } = await supabase.rpc('lembrete_manual', { p_members: ids })
    showToast(error ? 'Erro: ' + error.message : `Lembrete gentil enviado para ${data} membro(s)`)
  }
  async function resolver(id, aprovar) {
    const { error } = await supabase.rpc('resolver_pedido_campanha', { p_id: id, p_aprovar: aprovar })
    showToast(error ? 'Erro: ' + error.message : aprovar ? 'Pedido aprovado' : 'Pedido recusado')
    load()
  }
  function exportar() {
    csv([
      ['Membro', 'WhatsApp', 'Valor mensal', 'Período (meses)', 'Início', 'Pagas', 'Aguardando', 'Em aberto', 'Vencidas', 'Em atraso (R$)'],
      ...(dados?.part || []).map((m) => [m.membro?.nome, m.membro?.whatsapp, String(m.valor).replace('.', ','), m.meses, dataBR(m.inicio), m.pagas, m.aguardando, m.abertas, m.vencidas, m.emAtraso.toFixed(2).replace('.', ',')]),
    ])
  }

  const pendentes = (dados?.pedidos || []).filter((p) => p.status === 'Pendente')

  return (
    <Panel titulo="Projeto Espaço Novo" ajuda="Participantes, parcelas em atraso, pedidos e configuração da campanha." acao={<button onClick={exportar} className="btn-ghost-dark"><Download size={18} /> Exportar planilha</button>}>
      {!dados ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : (
        <div className="space-y-6">
          {pendentes.length > 0 && (
            <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5">
              <h2 className="font-display font-extrabold uppercase">Pedidos para aprovar</h2>
              <ul className="mt-3 space-y-2">
                {pendentes.map((p) => (
                  <li key={p.id} className="rounded-2xl bg-white p-4">
                    <p className="font-semibold">{p.membro?.nome}: {p.tipo} {p.novo_valor && `para ${brl(p.novo_valor)}`} {p.meses_pausa && `por ${p.meses_pausa} mês(es)`}</p>
                    {p.motivo && <p className="mt-1 text-sm text-ink/60">“{p.motivo}”</p>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => resolver(p.id, true)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><Check size={16} /> Aprovar</button>
                      <button onClick={() => resolver(p.id, false)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"><X size={16} /> Recusar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                {[['todos', `Todos (${dados.part.length})`], ['atraso', `Em atraso (${dados.part.filter((m) => m.vencidas).length})`]].map(([k, l]) => (
                  <button key={k} onClick={() => (setFiltro(k), setSel([]))} className={`rounded-full px-4 py-2 text-sm font-semibold ${filtro === k ? 'bg-ink text-white' : 'bg-white text-ink/70'}`}>{l}</button>
                ))}
              </div>
              {filtro === 'atraso' && lista.length > 0 && (
                <button onClick={() => lembrar(sel.length ? sel : lista.map((m) => m.member_id))} className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
                  <BellRing size={16} /> Lembrete {sel.length ? `(${sel.length})` : 'para todos'}
                </button>
              )}
            </div>
            {lista.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-ink/50">{filtro === 'atraso' ? 'Ninguém em atraso. Glória a Deus!' : 'Ainda não há participantes.'}</p>
            ) : (
              <ul className="space-y-2">
                {lista.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    {filtro === 'atraso' && <input type="checkbox" checked={sel.includes(m.member_id)} onChange={() => setSel(sel.includes(m.member_id) ? sel.filter((x) => x !== m.member_id) : [...sel, m.member_id])} className="h-6 w-6 shrink-0 accent-brand" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.membro?.nome}</p>
                      <p className="text-sm text-ink/55">{brl(m.valor)}/mês · {m.meses / 12} ano(s) · desde {dataBR(m.inicio)}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">{m.pagas} pagas</span>
                        {m.aguardando > 0 && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">{m.aguardando} aguardando</span>}
                        <span className="rounded-full bg-mist px-2 py-0.5 text-ink/60">{m.abertas} em aberto</span>
                        {m.vencidas > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-white">{m.vencidas} vencida(s) · {brl(m.emAtraso)}</span>}
                      </div>
                    </div>
                    {m.vencidas > 0 && <button onClick={() => lembrar([m.member_id])} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-brand hover:bg-brand-soft" aria-label="Enviar lembrete"><BellRing size={20} /></button>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Config onSalvo={(m) => showToast(m)} />
        </div>
      )}
      <Toast msg={toast} />
    </Panel>
  )
}
