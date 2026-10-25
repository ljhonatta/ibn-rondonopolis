import { X } from 'lucide-react'

export default function Termo({ onClose }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-ink/70 backdrop-blur-sm sm:place-items-center sm:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl sm:p-8" role="dialog" aria-modal="true" aria-label="Termo de uso dos dados">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-extrabold uppercase">Termo de uso dos dados</h2>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-mist" aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="space-y-3 text-[15px] leading-relaxed text-ink/75">
          <p>A Igreja Batista Nacional de Rondonópolis (CNPJ 51.854.887/0001-16) cuida dos seus dados com o mesmo carinho com que cuida de você, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
          <p><strong>Quais dados:</strong> nome, WhatsApp, e-mail, data de nascimento, ministério, foto (se você enviar), pedidos de oração e, quando você usar, registros de contribuição e comprovantes.</p>
          <p><strong>Para que usamos:</strong> identificar você na área do membro, manter contato pastoral, celebrar aniversários, acompanhar pedidos de oração e registrar suas contribuições com transparência.</p>
          <p><strong>Quem vê:</strong> só você e a equipe responsável por cada área: a tesouraria vê apenas o financeiro, a equipe de intercessão vê apenas os pedidos de oração. Nenhum dado seu é visível para outros membros. Não vendemos nem compartilhamos seus dados.</p>
          <p><strong>Onde ficam:</strong> em servidores seguros, com acesso protegido. Comprovantes ficam em área privada.</p>
          <p><strong>Seus direitos:</strong> você pode ver e corrigir seus dados em “Meu perfil” a qualquer momento e pedir a exclusão da sua conta por lá.</p>
        </div>
        <button onClick={onClose} className="btn-red mt-6 w-full">Entendi</button>
      </div>
    </div>
  )
}
