import { useEffect, useState } from 'react'
import { Building2, FileCheck2, HandHeart, Loader2, UserCheck, Users } from 'lucide-react'
import { supabase } from './client'
import { brl } from '../lib/dinheiro'
import { Panel } from './Crud'

function Barras({ meses }) {
  const max = Math.max(1, ...meses.map((m) => Number(m.contrib) + Number(m.espaco)))
  return (
    <div className="flex h-44 items-end gap-1.5 sm:gap-2">
      {meses.map((m) => {
        const c = Number(m.contrib), e = Number(m.espaco)
        const [ano, mes] = m.mes.split('-')
        return (
          <div key={m.mes} className="group flex h-full flex-1 flex-col justify-end" title={`${mes}/${ano}: ${brl(c + e)}`}>
            <div className="flex flex-col justify-end overflow-hidden rounded-t-md" style={{ height: `${((c + e) / max) * 100}%` }}>
              <div className="bg-brand" style={{ height: `${(e / (c + e || 1)) * 100}%` }} />
              <div className="flex-1 bg-ink" />
            </div>
            <span className="mt-1 text-center text-[10px] font-semibold text-ink/40">{new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', { month: 'narrow' })}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard({ irPara }) {
  const [d, setD] = useState(null)
  const [erro, setErro] = useState(false)
  useEffect(() => {
    supabase.rpc('painel_financeiro').then(({ data, error }) => (error ? setErro(true) : setD(data)))
  }, [])
  if (erro) return <p className="rounded-2xl bg-white p-6 text-ink/60">O painel financeiro é exclusivo da tesouraria.</p>
  if (!d) return <Loader2 className="animate-spin text-ink/40" />

  const mes = d.mes || {}
  const e = d.espaco || {}
  const meta = Number(e.meta || 0)
  const pctComp = meta ? Math.min(100, (Number(e.comprometido) / meta) * 100) : 0
  const pctRec = meta ? Math.min(100, (Number(e.recebido_mes) / meta) * 100) : 0
  const totalMes = Object.values(mes).reduce((s, v) => s + Number(v || 0), 0)

  const Card = ({ icon: Icon, label, valor, alvo, destaque }) => (
    <button onClick={() => alvo && irPara(alvo)} className={`rounded-2xl p-4 text-left shadow-sm transition active:scale-[.98] ${destaque ? 'bg-brand text-white' : 'bg-white'}`}>
      <Icon size={20} className={destaque ? 'text-white' : 'text-brand'} />
      <p className="mt-2 font-display text-2xl font-extrabold">{valor}</p>
      <p className={`text-xs font-semibold ${destaque ? 'text-white/80' : 'text-ink/50'}`}>{label}</p>
    </button>
  )

  return (
    <Panel titulo="Visão geral" ajuda={`Arrecadação confirmada de ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.`}>
      <div className="rounded-3xl bg-ink p-5 text-white sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/50">Arrecadado no mês</p>
        <p className="mt-1 font-display text-4xl font-extrabold">{brl(totalMes)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {['Dízimo', 'Oferta', 'Doação', 'Espaço Novo'].map((t) => (
            <div key={t} className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-white/50">{t}</p>
              <p className="font-display font-extrabold">{brl(mes[t])}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card icon={FileCheck2} label="Comprovantes pendentes" valor={d.pendentes} alvo="comprovantes" destaque={d.pendentes > 0} />
        <Card icon={Users} label="Membros ativos" valor={d.membros_ativos} alvo="membros" />
        <Card icon={UserCheck} label="Cadastros pendentes" valor={d.cadastros_pendentes} alvo="membros" />
        <Card icon={HandHeart} label="Orações novas" valor={d.oracoes_novas} alvo="oracoes" />
      </div>

      <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display font-extrabold uppercase"><Building2 size={18} className="text-brand" /> Espaço Novo</h2>
          <button onClick={() => irPara('espaco-novo')} className="text-sm font-semibold text-brand">Ver detalhes</button>
        </div>
        <p className="mt-1 text-sm text-ink/55">{e.familias || 0} famílias · aluguel {brl(meta)} · {d.vencidas} parcela(s) vencida(s)</p>
        {[['Comprometido por mês', e.comprometido, pctComp, 'bg-ink'], ['Recebido este mês', e.recebido_mes, pctRec, 'bg-brand']].map(([l, v, p, cor]) => (
          <div key={l} className="mt-4">
            <div className="flex justify-between text-sm"><span className="font-semibold">{l}</span><span>{brl(v)} <span className="text-ink/40">({Math.round(p)}%)</span></span></div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-mist"><div className={`h-full rounded-full ${cor}`} style={{ width: `${p}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-extrabold uppercase">Últimos 12 meses</h2>
          <div className="flex gap-3 text-xs font-semibold text-ink/60">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-ink" /> Dízimos, ofertas, doações</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand" /> Espaço Novo</span>
          </div>
        </div>
        <Barras meses={d.meses || []} />
      </div>
    </Panel>
  )
}
