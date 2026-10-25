import { MapPin, PlayCircle } from 'lucide-react'
import { useSite } from '../lib/site'
import { Logo } from './ui'

export default function Hero() {
  const { site, live } = useSite()
  const [antes, ...resto] = site.hero_titulo.split(' ')
  const ultima = resto.pop()

  return (
    <section id="inicio" className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink text-white">
      <picture className="absolute inset-0 -z-20">
        <source media="(min-width: 768px)" srcSet="/img/hero.jpg" />
        <img
          src="/img/hero-sm.jpg"
          alt="Igreja reunida em oração"
          className="h-full w-full scale-105 object-cover object-[35%_center] opacity-60 grayscale"
          fetchpriority="high"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_80%,rgba(227,38,46,.25),transparent_55%)]" />

      <div className="container-site pb-28 pt-28 sm:pt-32">
        <div className="max-w-3xl">
          <div className="mb-8 h-28 animate-[fadeUp_.9s_ease-out_both] sm:h-36">
            <Logo className="h-full w-auto text-[26px] sm:text-[32px]" />
          </div>
          <h1 className="animate-[fadeUp_.9s_.1s_ease-out_both] font-display text-[2.6rem] font-black uppercase leading-[.98] tracking-tight sm:text-6xl lg:text-[5.2rem]">
            {antes} {resto.join(' ')}{' '}
            <span className="script block text-[1.3em] leading-[1.05] sm:inline">{ultima}</span>
          </h1>
          <p className="mt-6 max-w-xl animate-[fadeUp_.9s_.2s_ease-out_both] text-lg text-white/80 sm:text-xl">
            {site.hero_subtitulo}
          </p>
          <div className="mt-10 flex animate-[fadeUp_.9s_.3s_ease-out_both] flex-col gap-3 sm:flex-row">
            <a href="#visite" className="btn-red">
              <MapPin size={18} /> Planeje sua visita
            </a>
            <a href="#ao-vivo" className="btn-ghost-light">
              {live.ativo && <span className="live-dot h-2.5 w-2.5 rounded-full bg-brand" />}
              <PlayCircle size={18} /> Assista ao vivo
            </a>
          </div>
        </div>
      </div>

    </section>
  )
}
