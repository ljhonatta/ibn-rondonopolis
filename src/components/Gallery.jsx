import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Images, Loader2, X } from 'lucide-react'
import { useSite } from '../lib/site'
import { driveFolderUrl, driveImg, listarFotos } from '../lib/extras'
import { Reveal, Title } from './ui'

const PASSO = 12

// Fila de carregamento: o Google recusa rajadas de muitas imagens ao mesmo tempo,
// então carregamos poucas por vez, só quando estão perto da tela, com novas tentativas.
const MAX_SIMULTANEAS = 4
let ativas = 0
const fila = []
const liberar = () => {
  ativas--
  fila.shift()?.()
}
const pedirVaga = (fn) => (ativas < MAX_SIMULTANEAS ? (ativas++, fn()) : fila.push(() => (ativas++, fn())))

function Thumb({ id, w, className }) {
  const ref = useRef(null)
  const [src, setSrc] = useState('')
  const [tent, setTent] = useState(0)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        pedirVaga(() => setSrc(driveImg(id, w)))
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [id, w])

  function erro() {
    liberar()
    if (tent >= 3) return
    setTimeout(() => {
      setTent((t) => t + 1)
      // Última tentativa pelo endereço alternativo de miniaturas do Drive.
      pedirVaga(() => setSrc(tent === 2 ? `https://drive.google.com/thumbnail?id=${id}&sz=w${w}` : `${driveImg(id, w)}?t=${tent}`))
    }, 1200 * (tent + 1))
  }

  return (
    <img
      ref={ref}
      src={src || undefined}
      alt=""
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => (liberar(), setOk(true))}
      onError={src ? erro : undefined}
      className={`${className} ${ok ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: 'opacity .5s, transform .5s' }}
    />
  )
}

export default function Gallery() {
  const { albuns, site } = useSite()
  const [ativo, setAtivo] = useState(0)
  const [fotos, setFotos] = useState(null)
  const [erro, setErro] = useState(false)
  const [mostrar, setMostrar] = useState(PASSO)
  const [aberta, setAberta] = useState(null)
  const album = albuns[ativo] || albuns[0]

  useEffect(() => {
    if (!album) return
    let vivo = true
    setFotos(null)
    setErro(false)
    setMostrar(PASSO)
    listarFotos(album.folder_id, site.drive_api_key)
      .then((f) => vivo && setFotos(f))
      .catch(() => vivo && (setErro(true), setFotos([])))
    return () => {
      vivo = false
    }
  }, [album?.folder_id, site.drive_api_key])

  // Faixa do carrossel: até 24 fotos espalhadas pelo álbum, duplicadas para o loop contínuo.
  const faixa = useMemo(() => {
    if (!fotos?.length) return []
    const passo = Math.max(1, Math.floor(fotos.length / 24))
    const sel = fotos.filter((_, i) => i % passo === 0).slice(0, 24)
    return sel.map((f) => ({ f, i: fotos.indexOf(f) }))
  }, [fotos])

  return (
    <section id="galeria" className="section overflow-hidden bg-mist">
      <div className="container-site">
        <Title kicker="Galeria" strong="Nossos" script="momentos" />

        {albuns.length > 1 && (
          <Reveal className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:justify-center">
            {albuns.map((a, i) => (
              <button
                key={a.id}
                onClick={() => setAtivo(i)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition ${
                  i === ativo ? 'bg-ink text-white' : 'bg-white text-ink/70 hover:text-ink'
                }`}
              >
                {a.nome}
              </button>
            ))}
          </Reveal>
        )}
      </div>

      {fotos === null ? (
        <div className="grid h-64 place-items-center text-ink/40">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : fotos.length === 0 ? (
        <div className="container-site text-center text-ink/60">
          <Images className="mx-auto mb-3 text-brand" size={32} strokeWidth={1.5} />
          {erro ? 'Não foi possível carregar as fotos agora.' : 'As fotos deste álbum aparecem aqui em até 1 hora.'}
        </div>
      ) : (
        <>
          <div className="marquee-wrap relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-mist to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-mist to-transparent sm:w-24" />
            <div className="marquee flex w-max gap-3 sm:gap-4" style={{ '--dur': `${faixa.length * 4}s` }}>
              {[...faixa, ...faixa].map(({ f, i }, k) => (
                <button
                  key={k}
                  onClick={() => setAberta(i)}
                  className="h-56 w-40 shrink-0 overflow-hidden rounded-2xl bg-ink/10 sm:h-72 sm:w-52"
                  aria-label={`Abrir foto ${i + 1}`}
                  tabIndex={k >= faixa.length ? -1 : 0}
                >
                  <Thumb id={f.id} w={420} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                </button>
              ))}
            </div>
          </div>

          <div className="container-site mt-10">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
              {fotos.slice(0, mostrar).map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setAberta(i)}
                  className="group aspect-square overflow-hidden rounded-lg bg-ink/10 sm:rounded-xl"
                  aria-label={`Abrir foto ${i + 1}`}
                >
                  <Thumb id={f.id} w={360} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                </button>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {mostrar < fotos.length && (
                <button onClick={() => setMostrar((m) => m + PASSO * 2)} className="btn-ghost-dark">
                  Ver mais fotos ({fotos.length - mostrar})
                </button>
              )}
              <a href={driveFolderUrl(album.folder_id)} target="_blank" rel="noopener" className="btn-red">
                <ExternalLink size={18} /> Ver álbum completo no Drive
              </a>
            </div>
          </div>
        </>
      )}

      {aberta !== null && fotos?.length > 0 && (
        <Lightbox fotos={fotos} index={aberta} onClose={() => setAberta(null)} onGo={setAberta} />
      )}
    </section>
  )
}
