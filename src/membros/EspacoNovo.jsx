import { useEffect, useMemo, useState } from 'react'
import { Building2, Check, ChevronLeft, Heart, Loader2, MessageCircle, Send } from 'lucide-react'
import { supabase } from '../admin/client'
import { useAuth } from '../lib/auth'
import { brl, dataBR, enviarComprovante, hojeISO, mesAno, paraNumero } from '../lib/dinheiro'
import PixBox, { CampoComprovante } from './PixBox'
import { Folha } from './Contribuicoes'

// Status visual da parcela (cinza, amarelo, vermelho, azul, verde)
export function statusParcela(p, hoje = hojeISO()) {
  if (p.status === 'Pago') return { label: 'Pago', cor: 'bg-emerald-500 text-white', ponto: 'bg-emerald-500' }
  if (p.status === 'Aguardando confirmação') return { label: 'Aguardando confirmação', cor: 'bg-sky-500 text-white', ponto: 'bg-sky-500' }
  if (p.status === 'Dispensada') return { label: 'Pausada', cor: 'bg-ink/10 text-ink/50', ponto: 'bg-ink/20' }
  const dias = Math.round((new Date(p.vencimento) - new Date(hoje)) / 86400000)
  if (dias < 0) return { label: 'Vencida', cor: 'bg-brand text-white', ponto: 'bg-brand', aberta: true }
  if (dias <= 3) return { label: dias === 0 ? 'Vence hoje' : 'Vence em breve', cor: 'bg-amber-400 text-ink', ponto: 'bg-amber-400', aberta: true }
  return { label: 'Em aberto', cor: 'bg-mist text-ink/60', ponto: 'bg-ink/25', aberta: true }
}

const txidDe = (memberId, parcelas) => {
  const p = [...parcelas].sort((a, b) => a.competencia.localeCompare(b.competencia))[0]
  return `ESPNOVO${memberId.replace(/-/g, '').slice(0, 6).toUpperCase()}${p.competencia.slice(0, 7).replace('-', '')}`
}

function Adesao({ cfg, onPronto }) {
  const [passo, setPasso] = useState(1)
  const [meses, setMeses] = useState(12)
  const [valorSel, setValorSel] = useState(cfg.valores_sugeridos?.[0] || 100)
  const [outro, setOutro] = useState('')
  const [aceite, setAceite] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const valor = valorSel === 'outro' ? paraNumero(outro) : Number(valorSel)
  const hoje = new Date(hojeISO() + 'T12:00')
  const primeira = new Date(hoje.getFullYear(), hoje.getMonth() + 1, cfg.dia_vencimento)

  async function confirmar() {
    setEnviando(true)
    setErro('')
    const { error } = await supabase.rpc('aderir_espaco_novo', { p_valor: valor, p_meses: meses })
    setEnviando(false)
    if (error) return setErro(error.message.replace(/^.*?: /, ''))
    onPronto()
  }

  const Passos = () => (
    <div className="mb-5 flex items-center gap-2">
      {[1, 2, 3].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= passo ? 'bg-brand' : 'bg-ink/10'}`} />)}
    </div>
  )

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <Passos />
      {passo > 1 && <button onClick={() => setPasso(passo - 1)} className="mb-3 flex items-center gap-1 text-sm font-semibold text-ink/50"><ChevronLeft size={16} /> Voltar</button>}

      {passo === 1 && (
        <>
          <h2 className="font-display text-xl font-extrabold uppercase">Por quanto tempo?</h2>
          <p className="mt-1 text-sm text-ink/60">Escolha o período do seu compromisso.</p>
          <div className="mt-5 space-y-2">
            {[[12, '1 ano', 'mínimo'], [24, '2 anos', ''], [36, '3 anos', '']].map(([m, l, d]) => (
              <button key={m} onClick={() => setMeses(m)} className={`flex min-h-[60px] w-full items-center justify-between rounded-2xl border-2 px-5 text-left ${meses === m ? 'border-brand bg-brand-soft' : 'border-ink/10'}`}>
                <span className="font-display text-lg font-extrabold uppercase">{l}</span>
                <span className="text-sm text-ink/50">{m} parcelas {d && `· ${d}`}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setPasso(2)} className="btn-red mt-6 w-full">Continuar</button>
        </>
      )}

      {passo === 2 && (
        <>
          <h2 className="font-display text-xl font-extrabold uppercase">Valor mensal</h2>
          <p className="mt-1 text-sm text-ink/60">Não é sobre o tamanho da contribuição, é sobre a fidelidade de cada um.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(cfg.valores_sugeridos || [100, 200]).map((v) => (
              <button key={v} onClick={() => setValorSel(Number(v))} className={`min-h-[64px] rounded-2xl border-2 font-display text-xl font-extrabold ${valorSel === Number(v) ? 'border-brand bg-brand-soft' : 'border-ink/10'}`}>{brl(v)}</button>
            ))}
            <button onClick={() => setValorSel('outro')} className={`col-span-2 min-h-[56px] rounded-2xl border-2 font-semibold ${valorSel === 'outro' ? 'border-brand bg-brand-soft' : 'border-ink/10'}`}>Outro valor</button>
          </div>
          {valorSel === 'outro' && (
            <div className="relative mt-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink/40">R$</span>
              <input autoFocus className="field pl-11 text-lg font-semibold" inputMode="decimal" placeholder={`mínimo ${brl(cfg.valor_minimo)}`} value={outro} onChange={(e) => setOutro(e.target.value)} />
            </div>
          )}
          {valorSel === 'outro' && valor > 0 && valor < cfg.valor_minimo && <p className="mt-2 text-sm text-brand">O valor mínimo é {brl(cfg.valor_minimo)}.</p>}
          <button onClick={() => setPasso(3)} disabled={!(valor >= cfg.valor_minimo)} className="btn-red mt-6 w-full disabled:opacity-40">Continuar</button>
        </>
      )}

      {passo === 3 && (
        <>
          <h2 className="font-display text-xl font-extrabold uppercase">Confirme seu compromisso</h2>
          <div className="mt-4 rounded-2xl bg-ink p-5 text-white">
            <p className="font-display text-3xl font-extrabold">{meses}x {brl(valor)}</p>
            <p className="mt-2 text-white/70">Vencimento todo dia {cfg.dia_vencimento}, primeira parcela em {primeira.toLocaleDateString('pt-BR')}.</p>
            <p className="mt-1 text-white/50">Total do compromisso: {brl(valor * meses)}</p>
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-mist p-4">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-brand" />
            <span className="text-sm leading-relaxed">Firmo este compromisso com alegria e posso conversar com a liderança caso precise rever.</span>
          </label>
          {erro && <p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{erro}</p>}
          <button onClick={confirmar} disabled={!aceite || enviando} className="btn-red mt-5 w-full disabled:opacity-40">{enviando ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />} Quero fazer parte</button>
        </>
      )}
    </div>
  )
}

function Pagar({ parcelas, onClose, onPronto }) {
  const { session } = useAuth()
  const [file, setFile] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const total = parcelas.reduce((s, p) => s + Number(p.valor), 0)
  async function enviar() {
    setErro('')
    if (!file) return setErro('Anexe o comprovante do Pix.')
    setEnviando(true)
    try {
      const path = await enviarComprovante(file, session.user.id, 'espaco-novo')
      const { error } = await supabase.rpc('enviar_comprovante_parcelas', { p_ids: parcelas.map((p) => p.id), p_path: path })
      if (error) throw new Error(error.message.replace(/^.*?: /, ''))
      onPronto()
    } catch (e) {
      setErro(e.message)
    }
    setEnviando(false)
  }
  return (
    <Folha titulo={parcelas.length > 1 ? `Pagar ${parcelas.length} parcelas` : 'Pagar parcela'} onClose={onClose}>
      <p className="mb-3 text-sm text-ink/60">{parcelas.map((p) => mesAno(p.competencia)).join(' · ')}</p>
      <PixBox valor={total} txid={txidDe(session.user.id, parcelas)} />
      <ol className="mt-4 space-y-1 text-sm text-ink/60">
        <li>1. Toque em <strong>Copia e cola</strong> e pague no app do seu banco.</li>
        <li>2. Volte aqui e anexe o comprovante.</li>
      </ol>
      <div className="mt-4"><CampoComprovante file={file} onChange={setFile} /></div>
      {erro && <p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{erro}</p>}
      <button onClick={enviar} disabled={enviando} className="btn-red mt-4 w-full">{enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Enviar comprovante</button>
    </Folha>
  )
}

function Pedido({ adesao, onClose, onPronto }) {
  const [tipo, setTipo] = useState('Alterar valor')
  const [valor, setValor] = useState('')
  const [meses, setMeses] = useState(1)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    const { error } = await supabase.from('campaign_requests').insert({
      membership_id: adesao.id, tipo, motivo: motivo.trim() || null,
      novo_valor: tipo === 'Alterar valor' ? paraNumero(valor) : null,
      meses_pausa: tipo === 'Pausar' ? meses : null,
    })
    setEnviando(false)
    if (error) return alert('Não conseguimos enviar agora.')
    onPronto()
  }
  return (
    <Folha titulo="Conversar sobre meu compromisso" onClose={onClose}>
      <form onSubmit={enviar} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {['Alterar valor', 'Pausar'].map((t) => <button key={t} type="button" onClick={() => setTipo(t)} className={`min-h-[48px] rounded-2xl text-sm font-bold ${tipo === t ? 'bg-ink text-white' : 'bg-mist text-ink/70'}`}>{t}</button>)}
        </div>
        {tipo === 'Alterar valor' ? (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink/40">R$</span>
            <input className="field pl-11" inputMode="decimal" placeholder="Novo valor mensal" value={valor} onChange={(e) => setValor(e.target.value)} required />
          </div>
        ) : (
          <select className="field" value={meses} onChange={(e) => setMeses(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((m) => <option key={m} value={m}>Pausar {m} {m === 1 ? 'mês' : 'meses'}</option>)}
          </select>
        )}
        <textarea rows={3} className="field" placeholder="Quer contar um pouco? (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <button className="btn-red w-full" disabled={enviando}>{enviando && <Loader2 size={18} className="animate-spin" />} Enviar para a liderança</button>
      </form>
    </Folha>
  )
}

export default function EspacoNovo() {
  const { session } = useAuth()
  const [cfg, setCfg] = useState(null)
  const [adesao, setAdesao] = useState(undefined)
  const [parcelas, setParcelas] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [sel, setSel] = useState([])
  const [pagar, setPagar] = useState(null)
  const [pedido, setPedido] = useState(false)
  const [aviso, setAviso] = useState('')

  const load = async () => {
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.rpc('espaco_novo_publico'),
      supabase.from('campaign_memberships').select('*').eq('member_id', session.user.id).eq('status', 'ativa').maybeSingle(),
    ])
    setCfg(c?.[0])
    setAdesao(a || null)
    if (a) {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from('campaign_installments').select('*').eq('membership_id', a.id).order('numero'),
        supabase.from('campaign_requests').select('*').eq('membership_id', a.id).order('created_at', { ascending: false }),
      ])
      setParcelas(p || [])
      setPedidos(r || [])
    }
    setSel([])
  }
  useEffect(() => { load() }, [])

  const hoje = hojeISO()
  const resumo = useMemo(() => {
    const total = parcelas.filter((p) => p.status !== 'Dispensada').reduce((s, p) => s + Number(p.valor), 0)
    const pago = parcelas.filter((p) => p.status === 'Pago').reduce((s, p) => s + Number(p.valor), 0)
    const prox = parcelas.find((p) => p.status === 'Em aberto')
    return { total, pago, falta: total - pago, prox }
  }, [parcelas])

  if (adesao === undefined || !cfg) return <Loader2 className="animate-spin text-ink/40" />

  if (!adesao)
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl bg-ink text-white">
          <div className="p-5 sm:p-6">
            <Building2 className="text-brand" />
            <h2 className="mt-3 font-display text-2xl font-extrabold uppercase leading-tight">Projeto Espaço Novo</h2>
            <p className="mt-2 text-white/70">Deus abriu uma nova porta: um novo espaço, logo em frente à igreja. Assuma um compromisso mensal de amor.</p>
            <a href="/projeto-espaco-novo" className="mt-3 inline-block text-sm font-semibold text-brand underline">Conhecer o projeto</a>
          </div>
        </div>
        <Adesao cfg={cfg} onPronto={() => (setAviso('sucesso'), load())} />
      </div>
    )

  const abertas = parcelas.filter((p) => p.status === 'Em aberto')
  const selecionadas = parcelas.filter((p) => sel.includes(p.id))

  return (
    <div className="space-y-4">
      {aviso === 'sucesso' && (
        <div className="rounded-3xl bg-emerald-600 p-5 text-white">
          <p className="font-display text-lg font-extrabold uppercase">Obrigado por fazer parte!</p>
          <p className="mt-1 text-white/85">Você agora é parte da história deste espaço.</p>
        </div>
      )}
      {aviso === 'pago' && <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">Comprovante enviado! A tesouraria vai conferir e você será avisado.</p>}
      {aviso === 'pedido' && <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">Pedido enviado. A liderança vai conversar com você.</p>}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[['Comprometido', brl(resumo.total)], ['Já pago', brl(resumo.pago)], ['Falta pagar', brl(resumo.falta)], ['Próximo vencimento', resumo.prox ? dataBR(resumo.prox.vencimento) : 'Tudo em dia']].map(([l, v], i) => (
          <div key={l} className={`rounded-2xl p-4 ${i === 0 ? 'bg-ink text-white' : 'bg-white shadow-sm'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${i === 0 ? 'text-white/50' : 'text-ink/45'}`}>{l}</p>
            <p className="mt-1 font-display text-lg font-extrabold">{v}</p>
          </div>
        ))}
      </div>

      {resumo.prox && (
        <button onClick={() => setPagar([resumo.prox])} className="btn-red w-full">
          Pagar {mesAno(resumo.prox.competencia)} · {brl(resumo.prox.valor)}
        </button>
      )}

      <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display font-extrabold uppercase">Minhas parcelas</h3>
          <span className="text-xs text-ink/45">{adesao.meses}x {brl(adesao.valor)}</span>
        </div>
        {abertas.length > 1 && <p className="mb-3 text-xs text-ink/50">Quer adiantar? Marque várias e pague tudo com um Pix só.</p>}
        <ul className="divide-y divide-ink/5">
          {parcelas.map((p) => {
            const s = statusParcela(p, hoje)
            const podeSel = p.status === 'Em aberto'
            return (
              <li key={p.id} className="flex items-center gap-3 py-3">
                {podeSel ? (
                  <input type="checkbox" checked={sel.includes(p.id)} onChange={() => setSel(sel.includes(p.id) ? sel.filter((x) => x !== p.id) : [...sel, p.id])} className="h-6 w-6 shrink-0 accent-brand" aria-label={`Selecionar ${mesAno(p.competencia)}`} />
                ) : (
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.ponto}`}>{p.status === 'Pago' && <Check size={14} className="text-white" />}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold capitalize">{mesAno(p.competencia)}</p>
                  <p className="text-xs text-ink/50">Vence {dataBR(p.vencimento)} · {brl(p.valor)}</p>
                  {p.motivo_recusa && p.status === 'Em aberto' && <p className="mt-1 text-xs text-brand">Comprovante recusado: {p.motivo_recusa}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.cor}`}>{s.label}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <button onClick={() => setPedido(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-semibold text-ink/70 shadow-sm">
        <MessageCircle size={18} /> Preciso alterar o valor ou pausar
      </button>
      {pedidos.length > 0 && (
        <ul className="space-y-2">
          {pedidos.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
              <strong>{r.tipo}</strong> {r.novo_valor && `para ${brl(r.novo_valor)}`} {r.meses_pausa && `por ${r.meses_pausa} mês(es)`} · <span className="text-ink/60">{r.status}</span>
            </li>
          ))}
        </ul>
      )}

      {selecionadas.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 px-4 md:bottom-6">
          <button onClick={() => setPagar(selecionadas)} className="btn-red mx-auto w-full max-w-md shadow-2xl">
            Pagar {selecionadas.length} parcela(s) · {brl(selecionadas.reduce((s, p) => s + Number(p.valor), 0))}
          </button>
        </div>
      )}

      {pagar && <Pagar parcelas={pagar} onClose={() => setPagar(null)} onPronto={() => (setPagar(null), setAviso('pago'), load())} />}
      {pedido && <Pedido adesao={adesao} onClose={() => setPedido(false)} onPronto={() => (setPedido(false), setAviso('pedido'), load())} />}
    </div>
  )
}
