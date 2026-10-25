import { useState } from 'react'
import { CalendarClock, Play, Youtube } from 'lucide-react'
import { useSite } from '../lib/site'
import { diaCurto, formatCountdown, horaBR, proximoCulto, youtubeId } from '../lib/utils'
import { IconRing, useNow } from './ui'

function Unit({ v, l }) {
  return (
    <div className="min-w-[64px] rounded-2xl bg-ink px-3 py-3 text-center text-white sm:min-w-[76px]">
      <div className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl">{String(v).padStart(2, '0')}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">{l}</div>
    </div>
  )
}

function LivePlayer({ id }) {
  const [play, setPlay] = useState(false)
  // Carrega o iframe só ao clicar: o site continua leve e rápido.
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-ink">
      {play ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title="Transmissão ao vivo da IBN Rondonópolis"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setPlay(true)} className="group absolute inset-0" aria-label="Assistir à transmissão">
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
          />
          <span className="absolute inset-0 grid place-items-center bg-gradient-to-t from-ink/70 to-transparent">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-white shadow-2xl transition group-hover:scale-110 sm:h-20 sm:w-20">
              <Play size={30} fill="currentColor" className="ml-1" />
            </span>
          </span>
        </button>
      )}
    </div>
  )
}

export default function NextService() {
  const { live, cultos, site } = useSite()
  useNow(1000)
  const prox = proximoCulto(cultos)
  const vid = youtubeId(live.url)
  const aoVivo = live.ativo && vid
  const t = prox ? formatCountdown(prox.ms) : null

  return (
    <section id="ao-vivo" className="relative z-10 -mt-24 px-4 pb-14 sm:-mt-28 sm:px-6 sm:pb-20">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(0,0,0,.8)] ring-1 ring-white/10 sm:p-8">
        {aoVivo ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <LivePlayer id={vid} />
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-[.2em] text-white">
                <span className="live-dot h-2.5 w-2.5 rounded-full bg-white" /> Ao vivo
              </span>
              <h3 className="mt-4 font-display text-2xl font-extrabold uppercase leading-tight sm:text-3xl">
                {prox?.emAndamento ? prox.culto.nome : 'Estamos ao vivo'}
              </h3>
              <p className="mt-2 text-ink/65">Assista de onde estiver e esteja com a gente. Compartilhe com quem precisa ouvir.</p>
              <a href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener" className="btn-red mt-6 w-full sm:w-auto">
                <Youtube size={18} /> Assistir no YouTube
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 lg:shrink-0">
              <IconRing icon={CalendarClock} size={56} />
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-[.25em] text-ink/45">Próximo culto</p>
                {prox && (
                  <>
                    <h3 className="mt-1 font-display text-xl font-extrabold uppercase leading-tight sm:text-2xl">
                      {prox.culto.nome}
                    </h3>
                    <p className="mt-1 text-ink/65">
                      {diaCurto(prox.culto.dia)} às {horaBR(prox.culto.hora)} ·{' '}
                      {prox.emAndamento ? (
                        <strong className="text-brand">acontecendo agora</strong>
                      ) : (
                        <>
                          começa em{' '}
                          <strong className="text-ink">
                            {t.d > 0 && `${t.d}d `}
                            {t.h}h {t.m}min
                          </strong>
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {prox && !prox.emAndamento && (
                <div className="flex gap-2" aria-hidden>
                  <Unit v={t.d} l="dias" />
                  <Unit v={t.h} l="horas" />
                  <Unit v={t.m} l="min" />
                  <Unit v={t.s} l="seg" />
                </div>
              )}
              <a href={site.youtube} target="_blank" rel="noopener" className="btn-ghost-dark whitespace-nowrap">
                <Youtube size={18} className="text-brand" /> Ver canal no YouTube
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
