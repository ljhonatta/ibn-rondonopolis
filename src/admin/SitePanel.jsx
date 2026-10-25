import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { supabase } from './client'
import { DEFAULT_SITE } from '../lib/defaults'
import { Panel, Toast, useToast } from './Crud'

const GRUPOS = [
  ['Página inicial', [
    ['hero_titulo', 'Título principal'],
    ['hero_subtitulo', 'Subtítulo', 'textarea'],
    ['missao', 'Missão', 'textarea'],
    ['visao', 'Visão', 'textarea'],
    ['valores', 'Valores (separados por vírgula)', 'list'],
    ['selo_anos', 'Selo (ex: 5 anos caminhando juntos)'],
    ['acao_solidaria', 'Faixa da Ação Solidária', 'textarea'],
  ]],
  ['Pix', [
    ['pix_chave', 'Chave Pix'],
    ['pix_titular', 'Titular'],
    ['cnpj', 'CNPJ (rodapé)'],
  ]],
  ['Contato e redes', [
    ['whatsapp', 'WhatsApp (com 55 + DDD, só números)'],
    ['endereco', 'Endereço (como aparece no site)'],
    ['maps_query', 'Endereço para o mapa'],
    ['youtube', 'Canal do YouTube'],
    ['instagram', 'Instagram'],
    ['facebook', 'Facebook'],
  ]],
  ['Galeria', [
    ['drive_api_key', 'Google Drive API key (opcional; sem ela as fotos novas aparecem em até 1h)'],
  ]],
]

export default function SitePanel() {
  const [site, setSite] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [toast, showToast] = useToast()

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'site').maybeSingle().then(({ data }) => setSite({ ...DEFAULT_SITE, ...(data?.value || {}) }))
  }, [])

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    const { error } = await supabase.from('settings').upsert({ key: 'site', value: site, updated_at: new Date().toISOString() })
    setSalvando(false)
    showToast(error ? 'Erro ao salvar' : 'Salvo! Já está no site.')
  }

  if (!site) return <Loader2 className="animate-spin text-ink/40" />
  return (
    <Panel titulo="Textos, Pix e contatos">
      <form onSubmit={salvar} className="space-y-6">
        {GRUPOS.map(([g, campos]) => (
          <fieldset key={g} className="rounded-3xl bg-white p-6 shadow-sm">
            <legend className="float-left mb-4 w-full font-display text-sm font-bold uppercase tracking-[.2em] text-brand">{g}</legend>
            <div className="clear-both space-y-4">
              {campos.map(([k, label, type]) => (
                <label key={k} className="block">
                  <span className="mb-1.5 block text-sm font-semibold">{label}</span>
                  {type === 'textarea' ? (
                    <textarea rows={3} className="field" value={site[k]} onChange={(e) => setSite({ ...site, [k]: e.target.value })} />
                  ) : type === 'list' ? (
                    <input className="field" value={site[k].join(', ')} onChange={(e) => setSite({ ...site, [k]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  ) : (
                    <input className="field" value={site[k]} onChange={(e) => setSite({ ...site, [k]: e.target.value })} />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button className="btn-red sticky bottom-4 w-full shadow-xl sm:w-auto" disabled={salvando}>
          {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar alterações
        </button>
      </form>
      <Toast msg={toast} />
    </Panel>
  )
}
