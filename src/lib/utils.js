import { DIAS } from './defaults'

export const TZ = 'America/Cuiaba'

// "Agora" no relógio de Cuiabá, como um Date cujos campos UTC = horário local de Cuiabá.
export function nowCuiaba() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  )
  return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second))
}

const DURACAO_MIN = 120 // culto "acontecendo agora" por até 2h depois do início

// Próximo culto a partir da programação. Retorna { culto, inicio, emAndamento, ms }.
export function proximoCulto(cultos) {
  if (!cultos?.length) return null
  const now = nowCuiaba()
  let best = null
  for (const c of cultos) {
    const [h, m] = c.hora.split(':').map(Number)
    for (let add = 0; add <= 7; add++) {
      const d = new Date(now)
      d.setUTCDate(now.getUTCDate() + add)
      if (d.getUTCDay() !== Number(c.dia)) continue
      d.setUTCHours(h, m, 0, 0)
      const fim = d.getTime() + DURACAO_MIN * 60000
      if (fim <= now.getTime()) continue
      const ms = d.getTime() - now.getTime()
      if (!best || ms < best.ms) best = { culto: c, inicio: d, emAndamento: ms <= 0, ms }
      break
    }
  }
  return best
}

export function formatCountdown(ms) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(t / 86400)
  const h = Math.floor((t % 86400) / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return { d, h, m, s }
}

export const horaBR = (hora) => {
  const [h, m] = hora.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

export const diaNome = (dia) => DIAS[Number(dia)]
export const diaCurto = (dia) => DIAS[Number(dia)].replace('-feira', '').toLowerCase()

export function waLink(numero, texto) {
  const n = String(numero).replace(/\D/g, '')
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
}

// Extrai o ID de um link do YouTube (watch, live, youtu.be, embed, shorts).
export function youtubeId(url = '') {
  const m = url.match(/(?:youtu\.be\/|v=|\/live\/|\/embed\/|\/shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

export function formatDataEvento(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return {
    dia: d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: TZ }),
    mes: d.toLocaleDateString('pt-BR', { month: 'short', timeZone: TZ }).replace('.', ''),
    completo: d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: TZ }),
    hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }),
  }
}
