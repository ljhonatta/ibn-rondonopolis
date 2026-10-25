import { useEffect, useState } from 'react'
import { Loader2, Radio } from 'lucide-react'
import { supabase } from './client'
import { youtubeId } from '../lib/utils'
import { DEFAULT_LIVE } from '../lib/defaults'
import { Panel, Toast, useToast } from './Crud'

export default function LivePanel() {
  const [live, setLive] = useState(null)
  const [toast, showToast] = useToast()

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'live').maybeSingle().then(({ data }) => setLive({ ...DEFAULT_LIVE, ...(data?.value || {}) }))
  }, [])

  async function salvar(next) {
    setLive(next)
    const { error } = await supabase.from('settings').upsert({ key: 'live', value: next, updated_at: new Date().toISOString() })
    showToast(error ? 'Erro ao salvar' : next.ativo ? 'AO VIVO ativado no site!' : 'Salvo')
  }

  if (!live) return <Loader2 className="animate-spin text-ink/40" />
  const id = youtubeId(live.url)

  return (
    <Panel titulo="Transmissão ao vivo" ajuda="Cole o link da live do YouTube e ative com um clique. O site mostra o selo AO VIVO e o player na hora.">
      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Link da live / vídeo do YouTube</span>
          <input className="field" value={live.url} onChange={(e) => setLive({ ...live, url: e.target.value })} onBlur={() => salvar(live)} placeholder="https://www.youtube.com/live/…" />
        </label>
        {live.url && !id && <p className="mt-2 text-sm text-brand">Não reconheci esse link do YouTube.</p>}
        {id && <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" className="mt-4 w-64 rounded-xl" />}

        <button
          onClick={() => salvar({ ...live, ativo: !live.ativo })}
          disabled={!id}
          className={`mt-6 flex w-full items-center justify-between rounded-2xl border-2 p-5 text-left transition ${live.ativo ? 'border-brand bg-brand text-white' : 'border-ink/10 hover:border-ink/30'}`}
        >
          <span className="flex items-center gap-3">
            <Radio className={live.ativo ? 'live-dot rounded-full' : ''} />
            <span>
              <strong className="block font-display uppercase">{live.ativo ? 'Estamos AO VIVO' : 'Fora do ar'}</strong>
              <span className="text-sm opacity-75">{live.ativo ? 'Toque para encerrar a transmissão no site' : 'Toque para ativar o AO VIVO no site'}</span>
            </span>
          </span>
          <span className={`relative h-8 w-14 rounded-full transition ${live.ativo ? 'bg-white/30' : 'bg-ink/15'}`}>
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${live.ativo ? 'left-7' : 'left-1'}`} />
          </span>
        </button>
      </div>
      <Toast msg={toast} />
    </Panel>
  )
}
