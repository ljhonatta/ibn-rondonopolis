// .ics, Pix BR Code e Google Drive.

// ---------- Agenda (.ics) ----------
const ICS_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const pad = (n) => String(n).padStart(2, '0')

export function gerarICS(cultos, endereco) {
  const hoje = new Date()
  const stamp = `${hoje.getUTCFullYear()}${pad(hoje.getUTCMonth() + 1)}${pad(hoje.getUTCDate())}T000000Z`
  const evento = (uid, nome, dia, hora, rrule) => {
    const d = new Date(hoje)
    while (d.getDay() !== dia) d.setDate(d.getDate() + 1)
    const [h, m] = hora.split(':').map(Number)
    const ini = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`
    const fim = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h + 2)}${pad(m)}00`
    return [
      'BEGIN:VEVENT',
      `UID:${uid}@ibnrondonopolis.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/Cuiaba:${ini}`,
      `DTEND;TZID=America/Cuiaba:${fim}`,
      `RRULE:${rrule}`,
      `SUMMARY:${nome} · IBN Rondonópolis`,
      `LOCATION:${endereco.replace(/,/g, '\\,')}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${nome} começa em 1 hora`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n')
  }
  const eventos = cultos.map((c) =>
    evento(`culto-${c.id}`, c.nome, Number(c.dia), c.hora, `FREQ=WEEKLY;BYDAY=${ICS_DAY[Number(c.dia)]}`),
  )
  eventos.push(evento('acao-solidaria', 'Ação Solidária (traga 1kg de alimento)', 0, '18:30', 'FREQ=MONTHLY;BYDAY=1SU'))
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IBN Rondonopolis//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:IBN Rondonópolis',
    'BEGIN:VTIMEZONE',
    'TZID:America/Cuiaba',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0400',
    'TZNAME:-04',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...eventos,
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'agenda-ibn-rondonopolis.ics' })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ---------- Pix (BR Code estático, sem valor) ----------
const tlv = (id, v) => `${id}${pad(v.length)}${v}`
const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()

function crc16(str) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    crc &= 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function pixPayload(chave, titular, cidade = 'RONDONOPOLIS') {
  // CNPJ/CPF/telefone vão só com dígitos; e-mail e chave aleatória ficam como estão.
  const k = /^[\d./-]+$/.test(chave) ? chave.replace(/\D/g, '') : chave.trim()
  const conta = tlv('00', 'br.gov.bcb.pix') + tlv('01', k)
  const body =
    tlv('00', '01') +
    tlv('26', conta) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('58', 'BR') +
    tlv('59', ascii(titular).slice(0, 25)) +
    tlv('60', ascii(cidade).slice(0, 15)) +
    tlv('62', tlv('05', '***')) +
    '6304'
  return body + crc16(body)
}

// ---------- Google Drive ----------
// -rj força JPEG (o Drive entregaria PNG/WebP gigantes); -l = qualidade.
export const driveImg = (id, w = 800) => `https://lh3.googleusercontent.com/d/${id}=w${w}-rj-l${w > 800 ? 82 : 76}`
export const driveFolderUrl = (id) => `https://drive.google.com/drive/folders/${id}`

const DRIVE_CACHE_MS = 60 * 60 * 1000 // 1h

// Lista as fotos de uma pasta pública. Com API key: Drive API (atualiza na hora, cache 1h).
// Sem API key: usa /gallery.json, gerado a cada hora pelo GitHub Actions.
export async function listarFotos(folderId, apiKey) {
  const cacheKey = `ibn-drive-${folderId}`
  try {
    const c = JSON.parse(localStorage.getItem(cacheKey))
    if (c && Date.now() - c.t < DRIVE_CACHE_MS) return c.fotos
  } catch {}

  let fotos = []
  if (apiKey) {
    let pageToken = ''
    do {
      const q = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`)
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&key=${apiKey}&pageSize=1000&orderBy=name&fields=nextPageToken,files(id,name)${pageToken ? `&pageToken=${pageToken}` : ''}`,
      )
      if (!res.ok) throw new Error(`Drive API ${res.status}`)
      const json = await res.json()
      fotos.push(...json.files.map((f) => ({ id: f.id, nome: f.name })))
      pageToken = json.nextPageToken || ''
    } while (pageToken)
  } else {
    const res = await fetch(`/gallery.json?t=${Math.floor(Date.now() / DRIVE_CACHE_MS)}`)
    const json = res.ok ? await res.json() : {}
    fotos = json[folderId] || []
  }
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), fotos }))
  } catch {}
  return fotos
}
