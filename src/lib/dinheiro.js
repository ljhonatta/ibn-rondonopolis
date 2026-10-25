import { supabase } from '../admin/client'

// Sem centavos quando o valor é redondo (R$ 2.000 em vez de R$ 2.000,00)
export const brlCurto = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: Number(v) % 1 ? 2 : 0 })

export const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// "1.234,56" ou "1234.56" → 1234.56
export const paraNumero = (txt) => {
  const s = String(txt).trim().replace(/[R$\s]/g, '')
  const n = s.includes(',') ? Number(s.replace(/\./g, '').replace(',', '.')) : Number(s)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

export const dataBR = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00`).toLocaleDateString('pt-BR') : '')
export const mesAno = (d) => new Date(`${String(d).slice(0, 10)}T12:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

// Hoje no fuso de Cuiabá, em AAAA-MM-DD
export const hojeISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cuiaba' }).format(new Date())

const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }

// Envia o comprovante para a pasta privada do membro e devolve o caminho
export async function enviarComprovante(file, userId, prefixo = 'comprovante') {
  if (!file) throw new Error('Escolha o comprovante.')
  if (!TIPOS[file.type]) throw new Error('Envie uma foto (JPG/PNG) ou PDF.')
  if (file.size > 5 * 1024 * 1024) throw new Error('O arquivo pode ter no máximo 5MB.')
  const path = `${userId}/${prefixo}-${Date.now()}.${TIPOS[file.type]}`
  const { error } = await supabase.storage.from('comprovantes').upload(path, file, { contentType: file.type })
  if (error) throw new Error('Não conseguimos enviar o arquivo. Tente de novo.')
  return path
}

// Link temporário (10 min) para ver um comprovante
export async function linkComprovante(path) {
  const { data } = await supabase.storage.from('comprovantes').createSignedUrl(path, 600)
  return data?.signedUrl
}
