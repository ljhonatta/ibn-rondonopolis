// Envia os avisos da fila (tabela outbox): e-mail pelo Resend e POST para o webhook do n8n (WhatsApp).
// Roda a cada 5 minutos pelo pg_cron. Sem RESEND_API_KEY / WEBHOOK_URL configurados, aquele canal é pulado.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const SITE = 'https://ibnrondonopolis.com'
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const RESEND = Deno.env.get('RESEND_API_KEY')
const REMETENTE = Deno.env.get('EMAIL_REMETENTE') || 'IBN Rondonópolis <avisos@ibnrondonopolis.com>'
const WEBHOOK = Deno.env.get('WEBHOOK_URL')

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function email(titulo: string, mensagem: string, link: string) {
  return `<div style="background:#0A0A0A;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden">
    <div style="background:#0A0A0A;padding:24px;text-align:center"><img src="${SITE}/img/logo.png" alt="IBN Rondonópolis" width="130"></div>
    <div style="padding:28px;color:#0A0A0A">
      <h1 style="margin:0 0 12px;font-size:20px;text-transform:uppercase">${esc(titulo)}</h1>
      <p style="margin:0 0 24px;color:#444;line-height:1.6;font-size:15px">${esc(mensagem)}</p>
      <p style="text-align:center;margin:0"><a href="${link}" style="display:inline-block;background:#E3262E;color:#fff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px;text-transform:uppercase;font-size:13px">Abrir minha área</a></p>
    </div>
  </div>
  <p style="text-align:center;color:#777;font-size:12px;margin-top:16px">Igreja Batista Nacional · Rondonópolis/MT<br>Para parar de receber e-mails, ajuste em Meu perfil.</p>
</div>`
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 })

  const { data: fila } = await db.from('outbox').select('*')
    .or('enviado_email_em.is.null,enviado_webhook_em.is.null').lt('tentativas', 5).order('id').limit(50)
  let enviados = 0
  for (const a of fila || []) {
    const { data: p } = await db.from('profiles').select('nome,email,whatsapp,notif_email,notif_whatsapp').eq('id', a.user_id).maybeSingle()
    const link = `${SITE}${a.link || '/minha-area'}`
    const upd: Record<string, unknown> = { tentativas: a.tentativas + 1 }
    const erros: string[] = []

    if (!a.enviado_email_em) {
      if (RESEND && p?.email && p.notif_email) {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: REMETENTE, to: p.email, subject: a.titulo, html: email(a.titulo, a.mensagem, link) }),
        })
        if (r.ok) upd.enviado_email_em = new Date().toISOString()
        else erros.push(`email ${r.status}: ${(await r.text()).slice(0, 200)}`)
      } else upd.enviado_email_em = new Date().toISOString() // canal desligado ou membro não quer e-mail
    }

    if (!a.enviado_webhook_em) {
      if (WEBHOOK && p?.whatsapp && p.notif_whatsapp) {
        const r = await fetch(WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: p.nome, whatsapp: p.whatsapp, mensagem: `${a.mensagem}\n${link}`, tipo: a.tipo, titulo: a.titulo, link }),
        })
        if (r.ok) upd.enviado_webhook_em = new Date().toISOString()
        else erros.push(`webhook ${r.status}`)
      } else upd.enviado_webhook_em = new Date().toISOString()
    }

    upd.erro = erros.join(' | ') || null
    await db.from('outbox').update(upd).eq('id', a.id)
    if (!erros.length) enviados++
  }
  return Response.json({ processados: fila?.length || 0, enviados })
})
