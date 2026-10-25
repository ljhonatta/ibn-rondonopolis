import { MapPin, Navigation } from 'lucide-react'
import { useSite } from '../lib/site'
import { IconRing, Reveal } from './ui'

export default function Location() {
  const { site } = useSite()
  const q = encodeURIComponent(site.maps_query)
  return (
    <section id="visite" className="section bg-mist">
      <div className="container-site">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <h2 className="font-display text-5xl font-black uppercase leading-none tracking-tight sm:text-6xl">
              Nosso <span className="script block text-[1.35em] leading-[.9]">endereço</span>
            </h2>
            <div className="mt-8 flex gap-4">
              <IconRing icon={MapPin} size={52} />
              <p className="text-lg font-medium leading-relaxed">{site.endereco}</p>
            </div>
            <p className="mt-6 text-lg text-ink/65">Chegue um pouquinho antes — vamos te receber na porta.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener" className="btn-red">
                <MapPin size={18} /> Abrir no Google Maps
              </a>
              <a href={`https://waze.com/ul?q=${q}&navigate=yes`} target="_blank" rel="noopener" className="btn-ghost-dark">
                <Navigation size={18} /> Abrir no Waze
              </a>
            </div>
          </Reveal>
          <Reveal delay={150} className="overflow-hidden rounded-[2rem] border-4 border-brand bg-white shadow-xl">
            <iframe
              title="Mapa — IBN Rondonópolis"
              src={`https://www.google.com/maps?q=${q}&output=embed&z=16`}
              className="block h-[340px] w-full sm:h-[440px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
