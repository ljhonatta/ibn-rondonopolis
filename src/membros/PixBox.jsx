import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import QRCode from 'qrcode'
import { pixPayload, RECEBEDOR_PIX } from '../lib/extras'
import { useSite } from '../lib/site'
import { brl } from '../lib/dinheiro'

export function useCopiar() {
  const [copiado, setCopiado] = useState('')
  async function copiar(texto, qual = 'ok') {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const t = Object.assign(document.createElement('textarea'), { value: texto })
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopiado(qual)
    setTimeout(() => setCopiado(''), 2200)
  }
  return [copiado, copiar]
}

// QR Code + Pix Copia e Cola já com o valor (e txid, quando houver)
export default function PixBox({ valor, txid }) {
  const { site } = useSite()
  const [qr, setQr] = useState('')
  const [copiado, copiar] = useCopiar()
  const payload = pixPayload(site.pix_chave, RECEBEDOR_PIX, 'RONDONOPOLIS', valor > 0 ? valor : null, txid)
  const chave = site.pix_chave.replace(/\D/g, '').length === 14 ? site.pix_chave.replace(/\D/g, '') : site.pix_chave

  useEffect(() => {
    QRCode.toDataURL(payload, { margin: 1, width: 360 }).then(setQr)
  }, [payload])

  return (
    <div className="rounded-2xl bg-mist p-4">
      <div className="flex items-center gap-4">
        <div className="w-32 shrink-0 rounded-xl border-2 border-brand bg-white p-1.5">
          {qr ? <img src={qr} alt="QR Code Pix" className="w-full" /> : <div className="aspect-square" />}
        </div>
        <div className="min-w-0 text-sm">
          {valor > 0 && <p className="font-display text-2xl font-extrabold">{brl(valor)}</p>}
          <p className="mt-1 text-ink/60">Pix CNPJ</p>
          <p className="break-all font-semibold">{site.pix_chave}</p>
          <p className="text-xs text-ink/50">{site.pix_titular}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => copiar(payload, 'cola')} className={`btn min-h-[44px] px-3 py-2 text-xs ${copiado === 'cola' ? 'bg-ink text-white' : 'bg-brand text-white'}`}>
          {copiado === 'cola' ? <Check size={16} /> : <Copy size={16} />} {copiado === 'cola' ? 'Copiado!' : 'Copia e cola'}
        </button>
        <button type="button" onClick={() => copiar(chave, 'chave')} className="btn min-h-[44px] border border-ink/15 bg-white px-3 py-2 text-xs text-ink">
          {copiado === 'chave' ? <Check size={16} /> : <Copy size={16} />} {copiado === 'chave' ? 'Chave copiada!' : 'Copiar chave'}
        </button>
      </div>
    </div>
  )
}

// Campo de arquivo grande, fácil no celular (abre câmera/galeria/arquivos)
export function CampoComprovante({ file, onChange }) {
  return (
    <label className={`flex min-h-[64px] cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 text-center text-sm font-semibold transition ${file ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-ink/20 bg-white text-ink/70 active:bg-mist'}`}>
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      {file ? <>✓ {file.name.length > 28 ? file.name.slice(0, 25) + '…' : file.name}</> : <>📎 Anexar comprovante (foto ou PDF)</>}
    </label>
  )
}
