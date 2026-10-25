import { CalendarPlus, Clock, HeartHandshake } from 'lucide-react'
import { useSite } from '../lib/site'
import { gerarICS } from '../lib/extras'
import { diaNome, horaBR } from '../lib/utils'
import { Reveal } from './ui'

export default function Schedule() {
  const { cultos, site } = useSite()
  return (
    <section id="agenda" className="section relative overflow-hidden bg-ink text-white">
      <img
        src="/img/louvor.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-0 h-full w-full object-cover opacity-[.12] grayscale"
      />
      <div className="container-site relative">
        <Reveal className="mb-14 text-center">
          <p className="mb-4 font-display text-xs font-bold uppercase tracking-[.3em] text-white/50">Venha cultuar com a gente</p>
          <h2 className="font-display text-4xl font-black uppercase leading-none sm:text-6xl">
            <span className="font-script text-[1.15em] font-normal normal-case text-white">Agenda de</span>{' '}
            <span className="slash mt-2 text-white">Cultos</span>
          </h2>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {cultos.map((c, i) => (
            <Reveal key={c.id} delay={i * 120} className="card-dark group relative overflow-hidden p-7 sm:p-8">
              <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/0 blur-2xl transition duration-500 group-hover:bg-brand/40" />
              <p className="font-display text-sm font-bold uppercase tracking-[.2em] text-brand">{diaNome(c.dia)}</p>
              <p className="mt-3 flex items-baseline gap-2 font-display text-5xl font-black tracking-tight">
                {horaBR(c.hora)}
              </p>
              <p className="mt-3 flex items-center gap-2 text-lg font-medium text-white/85">
                <Clock size={16} className="text-white/40" /> {c.nome}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6 flex flex-col items-start gap-4 rounded-3xl bg-brand p-6 sm:flex-row sm:items-center sm:p-7">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/80">
            <HeartHandshake size={24} strokeWidth={1.5} />
          </span>
          <p className="text-[17px] font-medium leading-relaxed">
            <strong className="font-display font-extrabold uppercase">{site.acao_solidaria.split('—')[0]}</strong>
            {site.acao_solidaria.includes('—') && <>— {site.acao_solidaria.split('—').slice(1).join('—')}</>}
          </p>
        </Reveal>

        <Reveal className="mt-10 text-center">
          <button onClick={() => gerarICS(cultos, site.endereco)} className="btn-ghost-light">
            <CalendarPlus size={18} /> Adicionar à minha agenda
          </button>
        </Reveal>
      </div>
    </section>
  )
}
