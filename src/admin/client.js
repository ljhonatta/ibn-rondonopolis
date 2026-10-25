import { createClient } from '@supabase/supabase-js'
import { hasSupabase, SUPABASE_KEY, SUPABASE_URL } from '../lib/api'

export const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

// Aceita link completo ou só o ID da pasta do Drive.
export const folderIdFrom = (v = '') => v.match(/folders\/([\w-]+)/)?.[1] || v.match(/[?&]id=([\w-]+)/)?.[1] || v.trim()

// Converte link de arquivo do Drive em URL de imagem direta.
export const imageFrom = (v = '') => {
  const id = v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([\w-]+)/)?.[1]
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1200` : v.trim()
}
