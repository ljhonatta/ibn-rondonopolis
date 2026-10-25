import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from './ui'

const LINKS = [
  ['#quem-somos', 'Quem somos'],
  ['#agenda', 'Agenda'],
  ['#eventos', 'Eventos'],
  ['#ministerios', 'Ministérios'],
  ['#galeria', 'Galeria'],
  ['#contribua', 'Contribua'],
  ['#contato', 'Contato'],
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open ? 'bg-ink/90 py-2 shadow-lg shadow-black/20 backdrop-blur-md' : 'bg-transparent py-4'
      }`}
    >
      <div className="container-site flex items-center justify-between gap-4">
        <a href="#inicio" className="h-11 sm:h-12" onClick={() => setOpen(false)}>
          <Logo className="h-full w-auto text-[17px] sm:text-[19px]" />
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="group relative px-3 py-2 font-display text-[13px] font-semibold uppercase tracking-wider text-white/80 transition hover:text-white"
            >
              {label}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded bg-brand transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
          <a href="#visite" className="btn-red ml-3 min-h-[40px] px-5 py-2 text-xs">
            Planeje sua visita
          </a>
        </nav>

        <button
          className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <div
        className={`grid transition-all duration-500 lg:hidden ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <nav className="overflow-hidden" aria-label="Menu móvel">
          <div className="container-site flex h-[calc(100dvh-64px)] flex-col gap-1 overflow-y-auto pb-8 pt-4">
            {LINKS.map(([href, label], i) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 py-4 font-display text-xl font-extrabold uppercase text-white transition hover:pl-2 hover:text-brand"
                style={{ transitionDelay: open ? `${i * 30}ms` : '0ms' }}
              >
                {label}
              </a>
            ))}
            <a href="#visite" onClick={() => setOpen(false)} className="btn-red mt-6">
              Planeje sua visita
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
