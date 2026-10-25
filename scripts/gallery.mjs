// Gera public/gallery.json com as fotos de cada álbum (pasta pública do Google Drive).
// Roda no build e a cada hora no GitHub Actions — assim novas fotos aparecem sozinhas,
// mesmo sem API key do Google. Os álbuns vêm do Supabase (tabela albuns) ou do padrão.
import { readFileSync, writeFileSync } from 'node:fs'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

async function albuns() {
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/albuns?select=folder_id&ativo=eq.true`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      if (res.ok) {
        const rows = await res.json()
        if (rows.length) return rows.map((r) => r.folder_id)
      }
    } catch (e) {
      console.warn('Supabase indisponível:', e.message)
    }
  }
  const src = readFileSync(new URL('../src/lib/defaults.js', import.meta.url), 'utf8')
  return [...src.matchAll(/folder_id: '([\w-]+)'/g)].map((m) => m[1])
}

async function fotos(folderId) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const out = []
  const re = /id="entry-([\w-]+)"[\s\S]*?flip-entry-list-icon"><img src="[^"]*\/type\/([\w/.+-]+)"[\s\S]*?flip-entry-title">([^<]*)</g
  for (const m of html.matchAll(re)) {
    if (m[2].startsWith('image/')) out.push({ id: m[1], nome: m[3] })
  }
  return out.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }))
}

const result = {}
for (const id of await albuns()) {
  try {
    result[id] = await fotos(id)
    console.log(`álbum ${id}: ${result[id].length} fotos`)
  } catch (e) {
    console.warn(`álbum ${id} falhou:`, e.message)
  }
}
writeFileSync(new URL('../public/gallery.json', import.meta.url), JSON.stringify(result))
