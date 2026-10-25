-- E-mails da liderança com acesso total: viram Super Admin ativos automaticamente ao se cadastrar/entrar.
create table if not exists public.admin_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admin_emails enable row level security;
drop policy if exists "super admin gerencia" on public.admin_emails;
create policy "super admin gerencia" on public.admin_emails for all to authenticated
  using (public.has_role('super_admin')) with check (public.has_role('super_admin'));

insert into public.admin_emails (email) values
  ('ibnrondonopolis1@gmail.com'),
  ('jhonatta258@gmail.com')
on conflict do nothing;

-- Novo usuário (e-mail/senha ou Google) → perfil. Google traz nome e foto, mas não WhatsApp/nascimento/LGPD:
-- esses o membro completa na primeira entrada.
create or replace function public.novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  lider boolean := exists (select 1 from public.admin_emails where email = lower(new.email));
  v_nome text := left(coalesce(nullif(m->>'nome', ''), m->>'full_name', m->>'name', ''), 120);
begin
  insert into public.profiles (id, nome, email, whatsapp, nascimento, ministerio, foto_url, lgpd_aceite_em, status, roles, aprovado_em)
  values (
    new.id,
    v_nome,
    lower(new.email),
    left(m->>'whatsapp', 30),
    nullif(m->>'nascimento', '')::date,
    m->>'ministerio',
    coalesce(m->>'avatar_url', m->>'picture'),
    case when (m->>'lgpd')::boolean then now() end,
    case when lider then 'ativo' else 'pendente' end,
    case when lider then array['membro', 'super_admin'] else array['membro'] end,
    case when lider then now() end
  )
  on conflict (id) do nothing;

  if lider then
    perform public.auditar('super_admin_automatico', 'profiles', new.id::text, jsonb_build_object('membro', v_nome, 'email', lower(new.email)));
  else
    perform public.notificar_papel('super_admin', 'cadastro', 'Novo cadastro aguardando aprovação',
      coalesce(nullif(v_nome, ''), new.email) || ' pediu acesso à área do membro.', '/admin#membros');
  end if;
  return new;
end $$;

-- Garante o acesso total também no login (ex.: se alguém tirar o papel por engano)
create or replace function public.garantir_lider()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p set status = 'ativo', roles = array(select distinct unnest(p.roles || array['membro', 'super_admin']))
  where p.id = auth.uid()
    and exists (select 1 from public.admin_emails a where a.email = p.email)
    and (p.status <> 'ativo' or not ('super_admin' = any (p.roles)));
end $$;
revoke execute on function public.garantir_lider() from public, anon;

-- Quem entrou pelo Google completa o cadastro: WhatsApp, nascimento, ministério e aceite LGPD
create or replace function public.completar_cadastro(p_whatsapp text, p_nascimento date, p_ministerio text, p_nome text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set
    whatsapp = left(p_whatsapp, 30),
    nascimento = p_nascimento,
    ministerio = p_ministerio,
    nome = coalesce(nullif(left(p_nome, 120), ''), nome),
    lgpd_aceite_em = coalesce(lgpd_aceite_em, now())
  where id = auth.uid();
end $$;
revoke execute on function public.completar_cadastro(text, date, text, text) from public, anon;

-- Perfil guarda e-mail em minúsculas para casar com a lista
update public.profiles set email = lower(email) where email <> lower(email);
