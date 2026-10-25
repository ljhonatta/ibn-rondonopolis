import { useEffect, useState } from 'react'
import { Check, Copy, HandCoins } from 'lucide-react'
import QRCode from 'qrcode'
import { useSite } from '../lib/site'
import { pixPayload } from '../lib/extras'
import { Reveal, Title } from './ui'

export default function Give() {
  const { site } = useSite()
  const [copiado, setCopiado] = useState(false)
  const [qr, setQr] = useState('')
  const payload = pixPayload(site.pix_chave, site.pix_titular)

  useEffect(() => {
    QRCode.toDataURL(payload, { margin: 1, width: 440, color: { dark: '#0A0A0A', light: '#FFFFFF' } }).then(setQr)
  }, [payload])

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const t = Object.assign(document.createElement('textarea'), { value: texto })
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <section id="contribua" className="section relative overflow-hidden bg-ink text-white">
      <div className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="container-site relative">
        <Title dark kicker="Contribua" strong="Generosidade que" script="multiplica" />

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <blockquote className="border-l-4 border-brand pl-6">
              <p className="font-display text-xl font-semibold leading-snug text-white/90 sm:text-2xl">
                “Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria.”
              </p>
              <footer className="mt-4 font-script text-3xl text-brand">2 Coríntios 9:7</footer>
            </blockquote>
            <div className="mt-8 flex flex-wrap gap-2">
              {['Dízimo', 'Oferta', 'Doação'].map((t) => (
                <span key={t} className="rounded-full border border-white/20 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-white/80">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150} className="rounded-[2rem] bg-white p-6 text-ink sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="w-48 shrink-0 rounded-2xl border-2 border-brand p-2 sm:w-44">
                {qr ? <img src={qr} alt="QR Code Pix da igreja" className="w-full" /> : <div className="aspect-square" />}
              </div>
              <div className="w-full min-w-0 text-center sm:text-left">
                <p className="flex items-center justify-center gap-2 font-display text-xs font-bold uppercase tracking-[.25em] text-brand sm:justify-start">
                  <HandCoins size={16} /> Pix · CNPJ
                </p>
                <p className="mt-2 break-all font-display text-2xl font-extrabold tabular-nums">{site.pix_chave}</p>
                <p className="mt-1 text-sm text-ink/60">{site.pix_titular}</p>
                <button onClick={() => copiar(site.pix_chave.replace(/\D/g, '').length === 14 ? site.pix_chave.replace(/\D/g, '') : site.pix_chave)} className={`btn-red mt-5 w-full ${copiado ? '!bg-ink' : ''}`}>
                  {copiado ? <Check size={18} /> : <Copy size={18} />} {copiado ? 'Chave copiada!' : 'Copiar chave Pix'}
                </button>
                <button onClick={() => copiar(payload)} className="mt-3 text-sm font-medium text-ink/55 underline-offset-4 hover:text-ink hover:underline">
                  Copiar Pix copia e cola
                </button>
              </div>
            </div>
            <div className="mt-6 border-t border-ink/10 pt-5 text-center">
              <span className="text-sm text-ink/50">
                Registrar minha contribuição <span className="ml-1 rounded-full bg-mist px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider">em breve · área do membro</span>
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
