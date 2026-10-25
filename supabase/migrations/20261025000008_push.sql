-- Notificações no celular (Web Push): aparelhos inscritos + disparo imediato a cada aviso do sino.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  origem text not null,           -- ex.: https://membros.ibnrondonopolis.com (para abrir o link no app certo)
  app text not null default 'membros' check (app in ('membros', 'admin', 'site')),
  user_agent text
);
create index if not exists push_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push proprio" on public.push_subscriptions;
create policy "push proprio" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.notifications add column if not exists push_enviado_em timestamptz;

-- Assim que um aviso entra no sino, chama a função "push" (assíncrono, não atrasa nada)
create or replace function public.disparar_push()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if exists (select 1 from public.push_subscriptions where user_id = new.user_id) then
    perform net.http_post(
      url := 'https://zgzgmabttwvaezoffwds.supabase.co/functions/v1/push',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
      body := jsonb_build_object('id', new.id)
    );
  end if;
  return new;
end $$;
drop trigger if exists disparar_push on public.notifications;
create trigger disparar_push after insert on public.notifications for each row execute function public.disparar_push();
