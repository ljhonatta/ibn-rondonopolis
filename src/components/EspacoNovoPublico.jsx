import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, Heart, Users } from 'lucide-react'
import { SiteProvider } from '../lib/site'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/api'
import { brlCurto as brl } from '../lib/dinheiro'
import { IconRing, Logo, Reveal } from './ui'
import Footer, { WhatsFab } from './Footer'

async function numeros() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/espaco_novo_publico`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  return r.ok ? (await r.json())[0] : null
}

function Pagina() {
  const [d, setD] = useState(null)
  useEffect(() => {
    document.title = 'Projeto Espaço Novo | IBN Rondonópolis'
    numeros().then(setD).catch(() => setD(null))
  }, [])
  const meta = Number(d?.meta || 0)
  const comp = Number(d?.comprometido || 0)
  const pct = meta ? Math.min(100, Math.round((comp / meta) * 100)) : 0
  const fotos = d?.fotos?.length ? d.fotos : ['/img/hero.jpg', '/img/louvor.jpg']

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="container-site flex items-center justify-between py-4">
          <a href="/" className="block h-11"><Logo className="h-full w-auto" /></a>
          <a href="/" className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"><ArrowLeft size={16} /> Voltar ao site</a>
        </div>
      </header>
      <main>
        <section className="relative isolate overflow-hidden bg-ink pb-20 pt-32 text-white sm:pt-40">
          <img src={fotos[0]} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 grayscale" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/60 via-ink/70 to-ink" />
          <div className="container-site max-w-3xl">
            <p className="font-display text-xs font-bold uppercase tracking-[.3em] text-brand">Projeto Espaço Novo</p>
            <h1 className="mt-4 font-display text-4xl font-black uppercase leading-[1.02] sm:text-6xl">
              Juntos, construímos o <span className="script block text-[1.2em] leading-[1.1]">próximo capítulo</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/80">
              Deus abriu uma nova porta para a IBN Rondonópolis: um novo espaço, logo em frente à igreja. Para mantê-lo, convidamos cada membro a assumir um compromisso mensal de amor. Não é sobre o tamanho da contribuição, é sobre a fidelidade de cada um.
            </p>
            <blockquote className="mt-8 border-l-4 border-brand pl-5">
              <p className="font-display text-lg font-semibold text-white/90">“Se o Senhor não edificar a casa, em vão trabalham os que a edificam.”</p>
              <footer className="mt-1 font-script text-2xl text-brand">Salmos 127:1</footer>
            </blockquote>
          </div>
        </section>

        <section className="relative z-10 -mt-10 px-4 pb-16">
          <Reveal className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,.5)] sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-[.25em] text-ink/45">Já comprometido</p>
                <p className="mt-1 font-display text-3xl font-extrabold">{brl(comp)}</p>
                <p className="text-sm font-semibold text-ink/45">de {brl(meta)} por mês</p>
              </div>
              <p className="font-display text-4xl font-black text-brand">{pct}%</p>
            </div>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-mist p-4">
                <span className="hidden sm:inline-flex"><IconRing icon={Users} size={44} /></span>
                <div className="min-w-0"><p className="font-display text-xl font-extrabold sm:text-2xl">{d?.familias ?? 0}</p><p className="text-xs text-ink/55">famílias participando</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-mist p-4">
                <span className="hidden sm:inline-flex"><IconRing icon={Building2} size={44} /></span>
                <div className="min-w-0"><p className="truncate font-display text-xl font-extrabold sm:text-2xl">{brl(Math.max(0, meta - comp))}</p><p className="text-xs text-ink/55">faltam por mês</p></div>
              </div>
            </div>
            <a href="/minha-area#espaco-novo" className="btn-red mt-6 w-full"><Heart size={18} /> Quero fazer parte</a>
            <p className="mt-3 text-center text-xs text-ink/45">Compromissos a partir de {brl(d?.valor_minimo || 100)} por mês, com vencimento todo dia {d?.dia_vencimento || 15}.</p>
          </Reveal>
        </section>

        <section className="bg-mist py-16">
          <div className="container-site">
            <h2 className="mb-8 text-center font-display text-3xl font-extrabold uppercase">O <span className="script text-[1.3em]">espaço</span></h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
              {fotos.map((f, i) => (
                <Reveal key={f + i} delay={i * 80} className={`overflow-hidden rounded-2xl bg-ink/10 ${i === 0 ? 'col-span-2 aspect-[16/9] sm:col-span-2 sm:row-span-2 sm:aspect-auto' : 'aspect-square'}`}>
                  <img src={f} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsFab />
    </>
  )
}

export default function EspacoNovoPublico() {
  return (
    <SiteProvider>
      <Pagina />
    </SiteProvider>
  )
}
