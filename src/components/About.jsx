import { BookOpen, Eye, Feather, Gem, HandHeart, Scale, Target, Users } from 'lucide-react'
import { useSite } from '../lib/site'
import { IconRing, Reveal, Title } from './ui'

const VALOR_ICON = [Feather, HandHeart, Scale, Users, BookOpen]

export default function About() {
  const { site } = useSite()
  return (
    <section id="quem-somos" className="section bg-mist pt-28">
      <div className="container-site">
        <Title kicker="Quem somos" strong="Nossa missão," script="visão e valores" />

        <div className="grid gap-6 md:grid-cols-2">
          {[
            { icon: Target, t: 'Missão', d: site.missao },
            { icon: Eye, t: 'Visão', d: site.visao },
          ].map((b, i) => (
            <Reveal key={b.t} delay={i * 120} className="card-light flex gap-5 p-7 sm:p-9">
              <IconRing icon={b.icon} size={60} />
              <div>
                <h3 className="font-display text-xl font-extrabold uppercase tracking-wide">{b.t}</h3>
                <p className="mt-3 text-[17px] leading-relaxed text-ink/70">{b.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mb-6 mt-14 flex items-center gap-4">
          <IconRing icon={Gem} size={52} />
          <h3 className="font-display text-xl font-extrabold uppercase tracking-wide">Valores</h3>
          <span className="h-px flex-1 bg-ink/10" />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {site.valores.map((v, i) => {
            const Icon = VALOR_ICON[i % VALOR_ICON.length]
            return (
              <Reveal
                key={v}
                delay={i * 80}
                className={`card-light group flex flex-col items-center gap-3 px-3 py-7 text-center ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <span className="icon-ring h-12 w-12 transition duration-300 group-hover:bg-brand group-hover:text-white">
                  <Icon size={20} strokeWidth={1.5} />
                </span>
                <span className="font-display text-[13px] font-bold uppercase tracking-wider sm:text-sm">{v}</span>
              </Reveal>
            )
          })}
        </div>

        <Reveal className="mt-14 flex justify-center">
          <div className="flex items-center gap-4 rounded-full border-2 border-brand bg-white py-2 pl-2 pr-7 shadow-sm">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand font-display text-2xl font-black text-white">
              {site.selo_anos.match(/\d+/)?.[0] || '5'}
            </span>
            <span className="font-script text-3xl leading-none text-ink sm:text-4xl">
              {site.selo_anos.replace(/^\d+\s*/, '')}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
