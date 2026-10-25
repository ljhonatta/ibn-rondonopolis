import { useState } from 'react'
import { BellRing, CalendarDays, Check, Loader2, PartyPopper, X } from 'lucide-react'
import { useSite } from '../lib/site'
import { hasSupabase, insert } from '../lib/api'
import { formatDataEvento, waLink } from '../lib/utils'
import { Reveal, Title } from './ui'

function AvisoModal({ evento, onClose }) {
  const { site } = useSite()
  const [estado, setEstado] = useState('form') // form | enviando | ok
  const [form, setForm] = useState({ nome: '', whatsapp: '' })

  async function enviar(e) {
    e.preventDefault()
    if (!hasSupabase) {
      window.open(waLink(site.whatsapp, `Olá! Sou ${form.nome} e quero ser avisado(a) quando abrir o ${evento.titulo}.`), '_blank')
      return onClose()
    }
    setEstado('enviando')
    try {
      await insert('avisos', { evento_id: String(evento.id), evento_titulo: evento.titulo, ...form })
      setEstado('ok')
    } catch {
      window.open(waLink(site.whatsapp, `Olá! Sou ${form.nome} e quero ser avisado(a) quando abrir o ${evento.titulo}.`), '_blank')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-ink/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" onClick={onClose}>
      <div
        className="w-full max-w-md animate-[fadeUp_.35s_ease-out_both] rounded-t-3xl bg-white p-7 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Quero ser avisado: ${evento.titulo}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[.25em] text-brand">Em breve</p>
            <h3 className="mt-1 font-display text-2xl font-extrabold uppercase">{evento.titulo}</h3>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {estado === 'ok' ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand text-white">
              <Check size={30} />
            </span>
            <p className="mt-4 text-lg font-medium">Pronto! Avisaremos você assim que as datas forem liberadas.</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-6 space-y-3">
            <input required className="field" placeholder="Seu nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <input
              required
              type="tel"
              inputMode="tel"
              className="field"
              placeholder="WhatsApp com DDD"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
            <button disabled={estado === 'enviando'} className="btn-red w-full">
              {estado === 'enviando' ? <Loader2 className="animate-spin" size={18} /> : <BellRing size={18} />} Quero ser avisado
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Events() {
  const { eventos, site } = useSite()
  const [aviso, setAviso] = useState(null)

  return (
    <section id="eventos" className="section bg-white">
      <div className="container-site">
        <Title kicker="Eventos" strong="O que está" script="acontecendo" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((ev, i) => {
            const d = formatDataEvento(ev.data)
            return (
              <Reveal key={ev.id} delay={i * 100} className="card-light group flex flex-col overflow-hidden p-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                  {ev.imagem_url && (
                    <img
                      src={ev.imagem_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute left-4 top-4 rounded-2xl bg-white px-3 py-2 text-center shadow-lg">
                    {d ? (
                      <>
                        <div className="font-display text-2xl font-black leading-none">{d.dia}</div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-brand">{d.mes}</div>
                      </>
                    ) : (
                      <div className="px-1 font-display text-xs font-extrabold uppercase tracking-wider text-brand">Em breve</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-extrabold uppercase">{ev.titulo}</h3>
                  {d && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium capitalize text-ink/55">
                      <CalendarDays size={15} /> {d.completo} · {d.hora}
                    </p>
                  )}
                  <p className="mt-3 flex-1 text-ink/70">{ev.descricao}</p>
                  <div className="mt-6">
                    {!d ? (
                      <button onClick={() => setAviso(ev)} className="btn-red w-full">
                        <BellRing size={18} /> Quero ser avisado
                      </button>
                    ) : (
                      <a
                        href={ev.link_inscricao || waLink(site.whatsapp, `Olá! Vi no site e quero me inscrever no ${ev.titulo}.`)}
                        target="_blank"
                        rel="noopener"
                        className="btn-red w-full"
                      >
                        Quero me inscrever
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            )
          })}

          <Reveal delay={eventos.length * 100} className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-3xl bg-ink p-7 text-white">
            <img src="/img/hero-sm.jpg" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50 grayscale transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
            <div className="relative">
              <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[.25em] text-brand">
                <PartyPopper size={16} /> Momentos marcantes
              </p>
              <h3 className="mt-3 font-display text-2xl font-extrabold uppercase leading-tight">
                Aniversário de <span className="script whitespace-nowrap text-[1.4em]">5 anos</span> da IBN Rondonópolis
              </h3>
              <p className="mt-2 text-white/70">Conferência Despertar: cinco anos de fidelidade de Deus.</p>
              <a href="#galeria" className="btn-ghost-light mt-6">Ver fotos</a>
            </div>
          </Reveal>
        </div>
      </div>
      {aviso && <AvisoModal evento={aviso} onClose={() => setAviso(null)} />}
    </section>
  )
}
