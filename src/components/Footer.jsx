import { Facebook, Instagram, MapPin, MessageCircle, Youtube } from 'lucide-react'
import { useSite } from '../lib/site'
import { diaCurto, horaBR, waLink } from '../lib/utils'
import { Logo } from './ui'

export function WhatsFab() {
  const { site } = useSite()
  return (
    <a
      href={waLink(site.whatsapp, 'Olá! Vim pelo site da IBN Rondonópolis.')}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-6px_rgba(37,211,102,.6)] transition hover:scale-110 active:scale-95"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" />
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.4 9.4 0 0 1 9.43 9.44c0 5.2-4.24 9.43-9.44 9.43M20.08 3.92A11.27 11.27 0 0 0 12.05.6C5.8.6.72 5.68.72 11.93c0 2 .52 3.95 1.52 5.66L.62 23.4l5.95-1.56a11.3 11.3 0 0 0 5.47 1.4h.01c6.25 0 11.33-5.09 11.33-11.34 0-3.03-1.18-5.87-3.32-8" />
      </svg>
    </a>
  )
}

export default function Footer() {
  const { site, cultos } = useSite()
  const redes = [
    { href: site.instagram, icon: Instagram, label: 'Instagram @ibnrondonopolis' },
    { href: site.facebook, icon: Facebook, label: 'Facebook IBN Rondonopolis' },
    { href: site.youtube, icon: Youtube, label: 'YouTube' },
    { href: waLink(site.whatsapp), icon: MessageCircle, label: 'WhatsApp' },
  ]
  return (
    <footer className="bg-ink pb-24 pt-16 text-white sm:pb-10">
      <div className="container-site grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="h-16">
            <Logo className="h-full w-auto text-[26px]" />
          </div>
          <p className="mt-5 max-w-xs text-white/60">Uma família para você pertencer, crescer e servir.</p>
          <div className="mt-6 flex gap-3">
            {redes.map(({ href, icon: Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener" aria-label={label} className="icon-ring h-11 w-11 transition hover:bg-brand hover:text-white">
                <Icon size={18} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-[.2em] text-white/50">Endereço</h3>
          <p className="mt-4 flex gap-2 text-white/85">
            <MapPin size={18} className="mt-0.5 shrink-0 text-brand" /> {site.endereco}
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-[.2em] text-white/50">Cultos</h3>
          <ul className="mt-4 space-y-2 text-white/85">
            {cultos.map((c) => (
              <li key={c.id} className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <span className="capitalize">{diaCurto(c.dia)}</span>
                <span className="font-semibold">{horaBR(c.hora)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-site mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between">
        <p>© Igreja Batista Nacional · Rondonópolis/MT · CNPJ {site.cnpj}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <a href="https://vprmt.com.br" target="_blank" rel="noopener" className="hover:text-white/70">
            Site criado pela <strong className="font-semibold text-white/60">Agência VPR</strong>
          </a>
          <a href="/entrar" className="hover:text-white/70">Área do membro</a>
          <a href="/admin" className="hover:text-white/70">Área administrativa</a>
        </div>
      </div>
    </footer>
  )
}
