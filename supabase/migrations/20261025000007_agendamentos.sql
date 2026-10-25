-- Agendamentos: lembretes do Espaço Novo às 8h de Cuiabá (12h UTC) e envio da fila de avisos a cada 5 min.
-- O segredo do cron fica no Vault (nome 'cron_secret'), criado fora do repositório.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobname) from cron.job where jobname in ('ibn-lembretes-espaco-novo', 'ibn-enviar-avisos');

select cron.schedule('ibn-lembretes-espaco-novo', '0 12 * * *', $$select public.lembretes_espaco_novo()$$);

select cron.schedule('ibn-enviar-avisos', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://zgzgmabttwvaezoffwds.supabase.co/functions/v1/enviar-avisos',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb
  ) where exists (select 1 from public.outbox where (enviado_email_em is null or enviado_webhook_em is null) and tentativas < 5)
$$);
