// Envia a notificação do sino para os celulares/computadores inscritos do usuário (Web Push).
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)

// Links do sistema começam com /admin ou /minha-area; abrem no app onde a pessoa se inscreveu
const destino = (origem: string, link: string | null) => `${origem}${link || '/minha-area'}`

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 })
  const { id } = await req.json()
  const { data: n } = await db.from('notifications').select('*').eq('id', id).maybeSingle()
  if (!n || n.push_enviado_em) return Response.json({ ok: true, pulado: true })

  const { data: subs } = await db.from('push_subscriptions').select('*').eq('user_id', n.user_id)
  let enviados = 0
  for (const s of subs || []) {
    // Aviso de admin vai para o app do admin; aviso de membro vai para o app dos membros
    const ehAdmin = (n.link || '').startsWith('/admin')
    if (ehAdmin && s.app === 'membros' && (subs || []).some((x) => x.app === 'admin')) continue
    if (!ehAdmin && s.app === 'admin' && (subs || []).some((x) => x.app !== 'admin')) continue
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ titulo: n.titulo, mensagem: n.mensagem || '', url: destino(s.origem, n.link), tag: n.tipo }),
        { TTL: 60 * 60 * 24 },
      )
      enviados++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('id', s.id) // aparelho saiu
    }
  }
  await db.from('notifications').update({ push_enviado_em: new Date().toISOString() }).eq('id', id)
  return Response.json({ ok: true, enviados })
})
