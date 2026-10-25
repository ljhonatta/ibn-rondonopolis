import { useEffect, useState } from 'react'
import { Check, Loader2, Lock, PartyPopper, Send } from 'lucide-react'
import { supabase } from '../admin/client'

const COR = { Recebido: 'bg-mist text-ink/70', 'Em oração': 'bg-amber-100 text-amber-800', Respondido: 'bg-emerald-100 text-emerald-800' }

function Testemunho({ p, onSalvo }) {
  const [texto, setTexto] = useState(p.testemunho || '')
  const [publicar, setPublicar] = useState(p.autoriza_publicar)
  const [salvando, setSalvando] = useState(false)
  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    await supabase.from('prayer_requests').update({ respondido_pelo_membro: true, testemunho: texto.trim() || null, autoriza_publicar: publicar }).eq('id', p.id)
    setSalvando(false)
    onSalvo()
  }
  return (
    <form onSubmit={salvar} className="mt-4 space-y-3 rounded-2xl bg-emerald-50 p-4">
      <p className="flex items-center gap-2 font-semibold text-emerald-800"><PartyPopper size={18} /> Deus respondeu! Glória a Deus!</p>
      <textarea rows={3} className="field" placeholder="Quer contar como Deus agiu? (opcional)" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} className="mt-0.5 h-5 w-5 accent-brand" />
        Autorizo a igreja a compartilhar este testemunho (só depois da aprovação da liderança).
      </label>
      <button className="btn-red w-full sm:w-auto" disabled={salvando}>{salvando ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Salvar</button>
    </form>
  )
}

export default function Oracoes() {
  const [lista, setLista] = useState(null)
  const [pedido, setPedido] = useState('')
  const [confidencial, setConfidencial] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)
  const [abrir, setAbrir] = useState(null)

  const load = () => supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setLista(data || []))
  useEffect(() => { load() }, [])

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    const { error } = await supabase.from('prayer_requests').insert({ pedido: pedido.trim(), confidencial })
    setEnviando(false)
    if (error) return alert('Não conseguimos enviar agora. Tente de novo.')
    setPedido('')
    setConfidencial(false)
    setOk(true)
    setTimeout(() => setOk(false), 4000)
    load()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={enviar} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-extrabold uppercase">Novo pedido de <span className="script text-[1.3em]">oração</span></h2>
        <textarea required rows={4} className="field mt-4" placeholder="Compartilhe seu pedido. Vamos orar com você." value={pedido} onChange={(e) => setPedido(e.target.value)} />
        <label className="mt-3 flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={confidencial} onChange={(e) => setConfidencial(e.target.checked)} className="h-5 w-5 accent-brand" />
          <span className="flex items-center gap-1.5 text-sm font-medium"><Lock size={14} className="text-brand" /> Meu pedido é confidencial</span>
        </label>
        {ok && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Recebemos seu pedido. Já estamos intercedendo por você.</p>}
        <button className="btn-red mt-4 w-full sm:w-auto" disabled={enviando}>{enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Enviar pedido</button>
      </form>

      <h3 className="px-1 pt-2 font-display text-sm font-bold uppercase tracking-[.2em] text-ink/50">Meus pedidos</h3>
      {lista === null ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : lista.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-ink/50">Você ainda não enviou pedidos por aqui.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => (
            <li key={p.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-ink/45">{new Date(p.created_at).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
                <span className="flex items-center gap-2">
                  {p.confidencial && <Lock size={14} className="text-brand" />}
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${COR[p.status]}`}>{p.status}</span>
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-ink/80">{p.pedido}</p>
              {p.respondido_pelo_membro && abrir !== p.id ? (
                <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  <strong>Deus respondeu!</strong> {p.testemunho && <span className="block whitespace-pre-wrap text-emerald-900/80">{p.testemunho}</span>}
                  <button onClick={() => setAbrir(p.id)} className="mt-1 text-xs font-semibold underline">Editar testemunho</button>
                </div>
              ) : abrir === p.id ? (
                <Testemunho p={p} onSalvo={() => (setAbrir(null), load())} />
              ) : (
                <button onClick={() => setAbrir(p.id)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-600/30 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                  <PartyPopper size={16} /> Deus respondeu!
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
