import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from './client'
import { Panel } from './Crud'

const ACOES = {
  acesso_painel: 'Acessou o painel',
  perfil_status: 'Mudou status de cadastro',
  perfil_papeis: 'Mudou papéis',
  exclusao_solicitada: 'Membro pediu exclusão',
  exclusao_concluida: 'Excluiu dados de membro',
}

function detalhe(r) {
  const d = r.detalhes || {}
  if (r.acao === 'perfil_status') return `${d.membro}: ${d.de} → ${d.para}`
  if (r.acao === 'perfil_papeis') return `${d.membro}: ${(d.de || []).join(', ')} → ${(d.para || []).join(', ')}`
  return d.membro || ''
}

// Registro permanente: ninguém consegue editar ou apagar (garantido no banco)
export default function Auditoria() {
  const [rows, setRows] = useState(null)
  const [acessos, setAcessos] = useState(false)
  useEffect(() => {
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(300).then(({ data }) => setRows(data || []))
  }, [])
  const lista = (rows || []).filter((r) => acessos || r.acao !== 'acesso_painel')

  return (
    <Panel titulo="Auditoria" ajuda="Quem fez o quê e quando. Este registro não pode ser alterado nem apagado.">
      <label className="mb-4 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={acessos} onChange={(e) => setAcessos(e.target.checked)} className="h-5 w-5 accent-brand" /> Mostrar acessos ao painel
      </label>
      {rows === null ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-wider text-ink/50">
              <tr><th className="p-3">Quando</th><th className="p-3">Quem</th><th className="p-3">O quê</th></tr>
            </thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={3} className="p-5 text-ink/50">Nada registrado ainda.</td></tr>}
              {lista.map((r) => (
                <tr key={r.id} className="border-t border-ink/5 align-top">
                  <td className="whitespace-nowrap p-3 text-ink/55">{new Date(r.created_at).toLocaleString('pt-BR', { timeZone: 'America/Cuiaba', dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-3 font-medium">{r.actor_nome || 'Sistema'}</td>
                  <td className="p-3"><span className="font-semibold">{ACOES[r.acao] || r.acao}</span> <span className="block text-ink/60">{detalhe(r)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
