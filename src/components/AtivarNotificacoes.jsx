import { BellOff, BellRing, Loader2, Share } from 'lucide-react'
import { usePush } from '../lib/push'

// Cartão para ligar as notificações no celular (membros e admin)
export default function AtivarNotificacoes({ app, escuro = false, compacto = false }) {
  const { estado, ativar, desativar } = usePush(app)
  if (estado === 'carregando' || estado === 'indisponivel') return null
  if (compacto && estado === 'ligado') return null

  const caixa = `flex items-center gap-4 rounded-3xl p-5 ${escuro ? 'bg-white/5 text-white' : 'border border-ink/10 bg-white'}`
  if (estado === 'ios-instalar')
    return (
      <div className={caixa}>
        <Share className="shrink-0 text-brand" />
        <p className="text-sm">
          <strong className="block">Quer receber avisos no iPhone?</strong>
          <span className={escuro ? 'text-white/60' : 'text-ink/60'}>Toque em Compartilhar e em “Adicionar à Tela de Início”. Abra pelo ícone e ative aqui.</span>
        </p>
      </div>
    )
  if (estado === 'negado')
    return (
      <div className={caixa}>
        <BellOff className="shrink-0 text-ink/40" />
        <p className={`text-sm ${escuro ? 'text-white/70' : 'text-ink/60'}`}>As notificações estão bloqueadas neste aparelho. Libere nas configurações do navegador para receber os avisos.</p>
      </div>
    )
  if (estado === 'ligado')
    return (
      <div className={caixa}>
        <BellRing className="shrink-0 text-emerald-500" />
        <p className="flex-1 text-sm font-semibold">Notificações ativadas neste aparelho</p>
        <button onClick={desativar} className={`text-xs font-semibold underline ${escuro ? 'text-white/50' : 'text-ink/50'}`}>Desativar</button>
      </div>
    )
  return (
    <div className={caixa}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-white"><BellRing size={22} /></span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{app === 'admin' ? 'Avisos de novos cadastros e comprovantes' : 'Receba os avisos no celular'}</p>
        <p className={escuro ? 'text-white/60' : 'text-ink/60'}>{app === 'admin' ? 'Saiba na hora quando alguém precisar de você.' : 'Lembretes, confirmações e respostas da liderança.'}</p>
      </div>
      <button onClick={ativar} className="btn-red min-h-[40px] shrink-0 px-4 py-2 text-xs">{estado === 'carregando' ? <Loader2 size={16} className="animate-spin" /> : 'Ativar'}</button>
    </div>
  )
}
