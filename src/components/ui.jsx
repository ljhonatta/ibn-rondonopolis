import { useEffect, useRef, useState } from 'react'

// Revela o conteúdo suavemente quando entra na tela.
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-in')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}

// Título no estilo das artes: palavra forte + palavra cursiva em vermelho.
export function Title({ strong, script, dark = false, center = true, kicker, children }) {
  return (
    <Reveal className={`mb-12 sm:mb-16 ${center ? 'text-center' : ''}`}>
      {kicker && (
        <p className={`mb-3 font-display text-xs font-bold uppercase tracking-[.3em] ${dark ? 'text-white/50' : 'text-ink/45'}`}>
          {kicker}
        </p>
      )}
      <h2
        className={`font-display text-[2.1rem] font-extrabold uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl ${dark ? 'text-white' : 'text-ink'}`}
      >
        {strong} {script && <span className="script ml-1 inline-block text-[1.25em] leading-none">{script}</span>}
      </h2>
      {children && (
        <p className={`mx-auto mt-5 max-w-2xl text-base sm:text-lg ${dark ? 'text-white/70' : 'text-ink/65'} ${center ? '' : 'mx-0'}`}>
          {children}
        </p>
      )}
    </Reveal>
  )
}

export function IconRing({ icon: Icon, size = 56, className = '' }) {
  return (
    <span className={`icon-ring ${className}`} style={{ width: size, height: size }}>
      <Icon size={size * 0.42} strokeWidth={1.5} />
    </span>
  )
}

// Logo oficial (PNG branco, fundo transparente). Em fundo claro, inverte para preto.
export function Logo({ className = '', light = true }) {
  return <img src="/img/logo.png" alt="IBN Rondonópolis" className={`${className} ${light ? '' : 'invert'}`} />
}

export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}
