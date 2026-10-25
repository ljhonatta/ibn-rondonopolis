// Acesso leve ao Supabase via REST (PostgREST) para o site público — sem carregar o supabase-js.
// O painel /admin usa o supabase-js completo (carregado só lá).

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY)

const headers = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
})

export async function select(table, query = 'select=*') {
  if (!hasSupabase) return null
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: headers() })
  if (!res.ok) throw new Error(`${table}: ${res.status}`)
  return res.json()
}

// Inserção pública (formulários). RLS só permite insert — nunca leitura.
export async function insert(table, row) {
  if (!hasSupabase) throw new Error('offline')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`${table}: ${res.status}`)
}
