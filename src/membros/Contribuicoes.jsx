import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, Plus, Send, X } from 'lucide-react'
import { supabase } from '../admin/client'
import { useAuth } from '../lib/auth'
import { brl, dataBR, enviarComprovante, hojeISO, paraNumero } from '../lib/dinheiro'
import PixBox, { CampoComprovante } from './PixBox'

const TIPOS = ['Dízimo', 'Oferta', 'Doação']
const COR = {
  'Aguardando confirmação': 'bg-sky-100 text-sky-800',
  Confirmado: 'bg-emerald-100 text-emerald-800',
  Recusado: 'bg-brand-soft text-brand-dark',
}

export function Folha({ titulo, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-ink/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[94svh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-w-lg sm:rounded-3xl" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
          <h2 className="font-display text-lg font-extrabold uppercase">{titulo}</h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist" aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">{children}</div>
      </div>
    </div>
  )
}

function Registrar({ onClose, onPronto }) {
  const { session } = useAuth()
  const [f, setF] = useState({ tipo: 'Dízimo', valor: '', data: hojeISO(), obs: '' })
  const [file, setFile] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const valor = paraNumero(f.valor)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    if (!(valor > 0)) return setErro('Informe o valor.')
    if (!file) return setErro('Anexe o comprovante do Pix.')
    setEnviando(true)
    try {
      const path = await enviarComprovante(file, session.user.id, f.tipo.toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''))
      const { error } = await supabase.from('contributions').insert({ tipo: f.tipo, valor, data_pix: f.data, comprovante_path: path, observacao: f.obs.trim() || null })
      if (error) throw new Error('Não conseguimos registrar agora. Tente de novo.')
      onPronto()
    } catch (err) {
      setErro(err.message)
    }
    setEnviando(false)
  }

  return (
    <Folha titulo="Registrar contribuição" onClose={onClose}>
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {TIPOS.map((t) => (
            <button key={t} type="button" onClick={() => setF({ ...f, tipo: t })} className={`min-h-[48px] rounded-2xl text-sm font-bold ${f.tipo === t ? 'bg-ink text-white' : 'bg-mist text-ink/70'}`}>{t}</button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Valor</span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink/40">R$</span>
            <input className="field pl-11 text-lg font-semibold" inputMode="decimal" placeholder="0,00" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} required />
          </div>
        </label>
        <PixBox valor={valor > 0 ? valor : null} />
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Data do Pix</span>
          <input type="date" className="field" value={f.data} max={hojeISO()} onChange={(e) => setF({ ...f, data: e.target.value })} required />
        </label>
        <CampoComprovante file={file} onChange={setFile} />
        <input className="field" placeholder="Observação (opcional)" value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} maxLength={500} />
        {erro && <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{erro}</p>}
        <button className="btn-red w-full" disabled={enviando}>{enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Enviar para a tesouraria</button>
        <p className="text-center text-xs text-ink/45">Deus ama quem dá com alegria. Obrigado pela sua generosidade.</p>
      </form>
    </Folha>
  )
}

async function baixarExtrato(lista, ano, nome) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const conf = lista.filter((c) => c.status === 'Confirmado' && c.data_pix.startsWith(String(ano)))
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, 210, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('IGREJA BATISTA NACIONAL', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Rondonópolis/MT · CNPJ 51.854.887/0001-16', 14, 24)
  doc.setTextColor(10, 10, 10)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`Extrato de contribuições ${ano}`, 14, 48)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(nome, 14, 56)
  let y = 70
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text('DATA', 14, y)
  doc.text('TIPO', 50, y)
  doc.text('VALOR', 196, y, { align: 'right' })
  doc.setTextColor(10)
  doc.setFontSize(11)
  y += 7
  for (const c of conf) {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text(dataBR(c.data_pix), 14, y)
    doc.text(c.tipo, 50, y)
    doc.text(brl(c.valor), 196, y, { align: 'right' })
    y += 7
  }
  const total = conf.reduce((s, c) => s + Number(c.valor), 0)
  doc.setDrawColor(227, 38, 46)
  doc.line(14, y, 196, y)
  doc.setFont('helvetica', 'bold')
  doc.text('Total confirmado', 14, y + 8)
  doc.text(brl(total), 196, y + 8, { align: 'right' })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text('"Cada um dê conforme determinou em seu coração... Deus ama quem dá com alegria." 2 Coríntios 9:7', 14, 285)
  doc.save(`extrato-ibn-${ano}.pdf`)
}

export default function Contribuicoes() {
  const { profile } = useAuth()
  const [lista, setLista] = useState(null)
  const [novo, setNovo] = useState(false)
  const [ok, setOk] = useState(false)
  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)
  const [mes, setMes] = useState('todos')
  const [status, setStatus] = useState('todos')

  const load = () => supabase.from('contributions').select('*').order('data_pix', { ascending: false }).then(({ data }) => setLista(data || []))
  useEffect(() => { load() }, [])

  const anos = useMemo(() => [...new Set([anoAtual, ...(lista || []).map((c) => Number(c.data_pix.slice(0, 4)))])].sort((a, b) => b - a), [lista, anoAtual])
  const filtrada = (lista || []).filter((c) => c.data_pix.startsWith(String(ano)) && (mes === 'todos' || Number(c.data_pix.slice(5, 7)) === Number(mes)) && (status === 'todos' || c.status === status))
  const totalAno = (lista || []).filter((c) => c.status === 'Confirmado' && c.data_pix.startsWith(String(ano))).reduce((s, c) => s + Number(c.valor), 0)

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-ink p-5 text-white sm:p-6">
        <p className="font-display text-xs font-bold uppercase tracking-[.25em] text-white/50">Confirmado em {ano}</p>
        <p className="mt-1 font-display text-3xl font-extrabold">{brl(totalAno)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => setNovo(true)} className="btn-red min-h-[48px] px-3 text-xs"><Plus size={18} /> Registrar</button>
          <button onClick={() => baixarExtrato(lista || [], ano, profile.nome)} className="btn min-h-[48px] border border-white/25 px-3 text-xs text-white"><Download size={18} /> Extrato {ano}</button>
        </div>
      </div>
      {ok && <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">Recebemos seu comprovante! A tesouraria vai conferir e você será avisado.</p>}

      <div className="grid grid-cols-3 gap-2">
        <select className="field px-3 text-sm" value={ano} onChange={(e) => setAno(Number(e.target.value))} aria-label="Ano">{anos.map((a) => <option key={a}>{a}</option>)}</select>
        <select className="field px-3 text-sm" value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mês">
          <option value="todos">Todos os meses</option>
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'long' })}</option>)}
        </select>
        <select className="field px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="todos">Todos</option>
          {Object.keys(COR).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {lista === null ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : filtrada.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-center text-ink/50">Nenhuma contribuição neste período.</p>
      ) : (
        <ul className="space-y-2">
          {filtrada.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{c.tipo} <span className="font-normal text-ink/50">· {dataBR(c.data_pix)}</span></p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${COR[c.status]}`}>{c.status}</span>
                </div>
                <p className="shrink-0 font-display text-lg font-extrabold">{brl(c.valor)}</p>
              </div>
              {c.status === 'Recusado' && c.motivo_recusa && <p className="mt-2 rounded-xl bg-brand-soft p-2.5 text-sm text-brand-dark">Motivo: {c.motivo_recusa}</p>}
            </li>
          ))}
        </ul>
      )}
      {novo && <Registrar onClose={() => setNovo(false)} onPronto={() => (setNovo(false), setOk(true), load(), setTimeout(() => setOk(false), 6000))} />}
    </div>
  )
}
