import { useState } from 'react'
import { Check, Loader2, Lock, Send } from 'lucide-react'
import { useSite } from '../lib/site'
import { hasSupabase, insert } from '../lib/api'
import { waLink } from '../lib/utils'
import { Reveal, Title } from './ui'

const PERFIS = ['Visitante', 'Membro', 'Primeira vez']
const TIPOS = ['Quero conhecer a igreja', 'Tenho uma dúvida', 'Pedido de oração', 'Quero conversar com um pastor', 'Outro']
const VAZIO = { nome: '', whatsapp: '', email: '', perfil: 'Visitante', tipo: TIPOS[0], mensagem: '', confidencial: false }

export default function Contact() {
  const { site } = useSite()
  const [form, setForm] = useState(VAZIO)
  const [estado, setEstado] = useState('form') // form | enviando | ok | erro
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function enviar(e) {
    e.preventDefault()
    if (form.website) return // honeypot anti-spam
    if (!hasSupabase) {
      // Sem banco conectado ainda: a mensagem segue pelo WhatsApp da igreja.
      window.open(waLink(site.whatsapp, textoWhats), '_blank')
      return setEstado('ok')
    }
    setEstado('enviando')
    try {
      const { website, ...row } = form
      await insert('mensagens', row)
      setEstado('ok')
      setForm(VAZIO)
    } catch {
      setEstado('erro')
    }
  }

  const textoWhats = `Olá! Meu nome é ${form.nome || '…'}. (${form.tipo})\n${form.mensagem}`

  return (
    <section id="contato" className="section bg-white">
      <div className="container-site">
        <Title kicker="Fale conosco · Pedido de oração" strong="Como podemos" script="caminhar com você?" />

        <Reveal className="mx-auto max-w-3xl rounded-[2rem] bg-mist p-5 sm:p-10">
          {estado === 'ok' ? (
            <div className="py-10 text-center">
              <span className="mx-auto grid h-20 w-20 animate-[fadeUp_.5s_ease-out_both] place-items-center rounded-full bg-brand text-white">
                <Check size={36} />
              </span>
              <p className="mx-auto mt-6 max-w-lg text-lg font-medium leading-relaxed">
                Recebemos sua mensagem. Nossa equipe vai entrar em contato — e, se for um pedido de oração, já estamos intercedendo por você.
              </p>
              <button onClick={() => setEstado('form')} className="btn-ghost-dark mt-8">
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" onChange={set('website')} />
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold">Nome</span>
                <input required className="field" value={form.nome} onChange={set('nome')} autoComplete="name" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold">WhatsApp</span>
                <input required type="tel" inputMode="tel" className="field" placeholder="(66) 9 0000-0000" value={form.whatsapp} onChange={set('whatsapp')} autoComplete="tel" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold">E-mail <span className="font-normal text-ink/45">(opcional)</span></span>
                <input type="email" className="field" value={form.email} onChange={set('email')} autoComplete="email" />
              </label>

              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-sm font-semibold">Você é:</legend>
                <div className="flex flex-wrap gap-2">
                  {PERFIS.map((p) => (
                    <label key={p} className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition ${form.perfil === p ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white hover:border-ink/40'}`}>
                      <input type="radio" name="perfil" value={p} checked={form.perfil === p} onChange={set('perfil')} className="sr-only" />
                      {p}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold">Assunto</span>
                <select className="field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 fill=%22none%22 stroke=%22%230A0A0A%22 stroke-width=%222%22><path d=%22m5 8 5 5 5-5%22/></svg>')] bg-[right_1rem_center] bg-no-repeat pr-10" value={form.tipo} onChange={set('tipo')}>
                  {TIPOS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold">Mensagem</span>
                <textarea required rows={5} className="field resize-y" value={form.mensagem} onChange={set('mensagem')} placeholder={form.tipo === 'Pedido de oração' ? 'Compartilhe seu pedido. Vamos orar com você.' : 'Escreva sua mensagem'} />
              </label>

              <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
                <input type="checkbox" checked={form.confidencial} onChange={set('confidencial')} className="h-5 w-5 rounded accent-brand" />
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Lock size={14} className="text-brand" /> Meu pedido é confidencial
                </span>
              </label>

              {estado === 'erro' && (
                <p className="rounded-xl bg-brand-soft p-4 text-sm text-brand-dark sm:col-span-2">
                  Não conseguimos enviar agora.{' '}
                  <a className="font-bold underline" href={waLink(site.whatsapp, textoWhats)} target="_blank" rel="noopener">
                    Envie pelo WhatsApp
                  </a>
                  .
                </p>
              )}

              <div className="sm:col-span-2">
                <button disabled={estado === 'enviando'} className="btn-red w-full sm:w-auto">
                  {estado === 'enviando' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Enviar mensagem
                </button>
                <p className="mt-3 text-xs text-ink/45">
                  {hasSupabase ? 'Suas informações são vistas apenas pela equipe pastoral.' : 'Suas informações são tratadas com carinho e sigilo.'}
                </p>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
