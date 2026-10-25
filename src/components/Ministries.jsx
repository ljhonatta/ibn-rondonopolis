import { ArrowRight, Clock, Flame, Flower2, HandHeart, Heart, Shield, Sparkles, Users } from 'lucide-react'
import { useSite } from '../lib/site'
import { waLink } from '../lib/utils'
import { Reveal, Title } from './ui'

export const MINISTERIO_ICONES = {
  flame: Flame,
  sparkles: Sparkles,
  flower: Flower2,
  shield: Shield,
  'hand-heart': HandHeart,
  heart: Heart,
  users: Users,
}

export default function Ministries() {
  const { ministerios, site } = useSite()
  return (
    <section id="ministerios" className="section bg-ink text-white">
      <div className="container-site">
        <Title dark kicker="Ministérios" strong="Tem um lugar" script="pra você" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ministerios.map((m, i) => {
            const Icon = MINISTERIO_ICONES[m.icone] || Heart
            return (
              <Reveal key={m.id} delay={(i % 3) * 100} className="card-dark group flex flex-col p-7">
                <span className="icon-ring h-14 w-14 transition duration-300 group-hover:bg-brand group-hover:text-white">
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 font-display text-xl font-extrabold uppercase">{m.nome}</h3>
                <p className="mt-2 flex-1 text-white/70">{m.descricao}</p>
                {m.horario && (
                  <p className="mt-4 flex items-center gap-2 text-sm font-medium text-white/55">
                    <Clock size={15} /> {m.horario}
                  </p>
                )}
                <a
                  href={waLink(site.whatsapp, `Olá! Vi no site e quero saber mais sobre o ${m.nome}.`)}
                  target="_blank"
                  rel="noopener"
                  className="btn-ghost-light mt-6 self-start group-hover:border-brand group-hover:bg-brand group-hover:text-white"
                >
                  Quero participar <ArrowRight size={16} />
                </a>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
