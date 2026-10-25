-- Fase 2A — membros, papéis, pedidos de oração do membro, notificações e auditoria.

-- ============ Papéis ============
create table if not exists public.roles (
  id text primary key,
  nome text not null,
  descricao text
);
insert into public.roles (id, nome, descricao) values
  ('membro', 'Membro', 'Acessa apenas a própria área'),
  ('tesouraria', 'Tesouraria', 'Confere comprovantes, dá baixa e vê relatórios financeiros'),
  ('intercessao', 'Intercessão / Pastoral', 'Acompanha pedidos de oração, inclusive confidenciais'),
  ('super_admin', 'Super Admin', 'Acesso total: aprova membros e define papéis')
on conflict (id) do nothing;

-- ============ Perfis ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '' check (char_length(nome) <= 120),
  email text,
  whatsapp text check (char_length(whatsapp) <= 30),
  nascimento date,
  ministerio text,
  foto_url text,
  notif_email boolean not null default true,
  notif_whatsapp boolean not null default true,
  status text not null default 'pendente' check (status in ('pendente', 'ativo', 'recusado', 'inativo')),
  roles text[] not null default '{membro}',
  lgpd_aceite_em timestamptz,
  exclusao_solicitada_em timestamptz,
  aprovado_por uuid references auth.users (id),
  aprovado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.has_role(r text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'ativo' and (r = any (roles) or 'super_admin' = any (roles))
  );
$$;

-- Equipe = qualquer papel além de membro
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'ativo' and roles && array['tesouraria', 'intercessao', 'super_admin']
  );
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'ativo');
$$;

-- is_admin (conteúdo do site) passa a valer também para Super Admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
      or exists (select 1 from public.profiles where id = auth.uid() and status = 'ativo' and 'super_admin' = any (roles));
$$;

-- ============ Notificações (sino) ============
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null default 'geral',
  titulo text not null,
  mensagem text,
  link text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.notificar(p_user uuid, p_tipo text, p_titulo text, p_msg text, p_link text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, tipo, titulo, mensagem, link) values (p_user, p_tipo, p_titulo, p_msg, p_link);
$$;
revoke execute on function public.notificar(uuid, text, text, text, text) from public, anon, authenticated;

create or replace function public.notificar_papel(p_role text, p_tipo text, p_titulo text, p_msg text, p_link text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, tipo, titulo, mensagem, link)
  select id, p_tipo, p_titulo, p_msg, p_link from public.profiles
  where status = 'ativo' and (p_role = any (roles) or 'super_admin' = any (roles));
$$;
revoke execute on function public.notificar_papel(text, text, text, text, text) from public, anon, authenticated;

-- ============ Auditoria (somente inserção) ============
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor uuid default auth.uid(),
  actor_nome text,
  acao text not null,
  tabela text,
  registro_id text,
  detalhes jsonb
);

create or replace function public.auditar(p_acao text, p_tabela text, p_registro text, p_detalhes jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor, actor_nome, acao, tabela, registro_id, detalhes)
  values (auth.uid(), (select nome from public.profiles where id = auth.uid()), p_acao, p_tabela, p_registro, p_detalhes);
$$;
revoke execute on function public.auditar(text, text, text, jsonb) from public, anon, authenticated;

-- Registro de acesso ao painel admin (chamado pelo próprio painel)
create or replace function public.registrar_acesso_admin()
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff() or public.is_admin() then
    perform public.auditar('acesso_painel', null, null, null);
  end if;
end $$;

-- ============ Pedidos de oração dos membros ============
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  member_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pedido text not null check (char_length(pedido) <= 5000),
  confidencial boolean not null default false,
  status text not null default 'Recebido' check (status in ('Recebido', 'Em oração', 'Respondido')),
  respondido_pelo_membro boolean not null default false,
  testemunho text check (char_length(testemunho) <= 5000),
  autoriza_publicar boolean not null default false,
  testemunho_aprovado boolean not null default false,
  anotacao_interna text,
  updated_at timestamptz not null default now()
);

-- Anotação interna nas mensagens do formulário público
alter table public.mensagens add column if not exists anotacao_interna text;

-- ============ Gatilhos ============

-- Novo usuário → perfil pendente (dados vêm do formulário de cadastro)
create or replace function public.novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, nome, email, whatsapp, nascimento, ministerio, lgpd_aceite_em)
  values (
    new.id,
    left(coalesce(m->>'nome', ''), 120),
    new.email,
    left(m->>'whatsapp', 30),
    nullif(m->>'nascimento', '')::date,
    m->>'ministerio',
    case when (m->>'lgpd')::boolean then now() end
  )
  on conflict (id) do nothing;
  perform public.notificar_papel('super_admin', 'cadastro', 'Novo cadastro aguardando aprovação',
    coalesce(m->>'nome', new.email) || ' pediu acesso à área do membro.', '/admin#membros');
  return new;
end $$;
drop trigger if exists novo_usuario on auth.users;
create trigger novo_usuario after insert on auth.users for each row execute function public.novo_usuario();

-- Proteções no perfil: só Super Admin muda status/papéis; registra auditoria e avisa o membro
create or replace function public.proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
-- auth.uid() nulo = SQL Editor/serviço (usado para cadastrar o primeiro Super Admin)
declare super boolean := auth.uid() is null or public.has_role('super_admin');
begin
  new.updated_at := now();
  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;
  if not super then
    new.status := old.status;
    new.roles := old.roles;
    new.aprovado_por := old.aprovado_por;
    new.aprovado_em := old.aprovado_em;
  else
    if new.status is distinct from old.status then
      if new.status = 'ativo' and old.status = 'pendente' then
        new.aprovado_por := auth.uid();
        new.aprovado_em := now();
        perform public.notificar(new.id, 'cadastro', 'Cadastro aprovado!',
          'Seja bem-vindo à família IBN. Sua área do membro já está liberada.', '/minha-area');
      end if;
      perform public.auditar('perfil_status', 'profiles', new.id::text,
        jsonb_build_object('de', old.status, 'para', new.status, 'membro', new.nome));
    end if;
    if new.roles is distinct from old.roles then
      if not ('membro' = any (new.roles)) then new.roles := array_prepend('membro', new.roles); end if;
      perform public.auditar('perfil_papeis', 'profiles', new.id::text,
        jsonb_build_object('de', old.roles, 'para', new.roles, 'membro', new.nome));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists proteger_perfil on public.profiles;
create trigger proteger_perfil before update on public.profiles for each row execute function public.proteger_perfil();

-- Pedido de oração: membro só mexe no texto/testemunho; equipe só no status/anotação/aprovação
create or replace function public.proteger_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
declare equipe boolean := public.has_role('intercessao');
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if not equipe or new.member_id is null then new.member_id := auth.uid(); end if;
    new.status := 'Recebido';
    new.testemunho_aprovado := false;
    new.anotacao_interna := null;
    perform public.notificar_papel('intercessao', 'oracao', 'Novo pedido de oração',
      case when new.confidencial then 'Pedido confidencial de um membro.' else left(new.pedido, 120) end, '/admin#oracoes');
    return new;
  end if;
  new.member_id := old.member_id;
  new.created_at := old.created_at;
  if auth.uid() = old.member_id and not equipe then
    new.status := old.status;
    new.anotacao_interna := old.anotacao_interna;
    new.testemunho_aprovado := case when new.testemunho is distinct from old.testemunho then false else old.testemunho_aprovado end;
  elsif equipe then
    new.pedido := old.pedido;
    new.confidencial := old.confidencial;
    new.respondido_pelo_membro := old.respondido_pelo_membro;
    new.testemunho := old.testemunho;
    new.autoriza_publicar := old.autoriza_publicar;
    if new.status is distinct from old.status then
      perform public.notificar(old.member_id, 'oracao', 'Atualização no seu pedido de oração',
        'Status: ' || new.status || '. Seguimos com você.', '/minha-area#oracoes');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists proteger_pedido on public.prayer_requests;
create trigger proteger_pedido before insert or update on public.prayer_requests for each row execute function public.proteger_pedido();

-- Notificação: o membro só pode marcar como lida
create or replace function public.proteger_notificacao()
returns trigger language plpgsql as $$
declare lida boolean := new.lida;
begin
  new := old;
  new.lida := lida;
  return new;
end $$;
drop trigger if exists proteger_notificacao on public.notifications;
create trigger proteger_notificacao before update on public.notifications for each row execute function public.proteger_notificacao();

-- ============ RLS ============
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.prayer_requests enable row level security;

drop policy if exists "papeis leitura" on public.roles;
create policy "papeis leitura" on public.roles for select to authenticated using (true);

drop policy if exists "perfil proprio" on public.profiles;
create policy "perfil proprio" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
drop policy if exists "perfil edita" on public.profiles;
create policy "perfil edita" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role('super_admin')) with check (id = auth.uid() or public.has_role('super_admin'));
drop policy if exists "perfil remove" on public.profiles;
create policy "perfil remove" on public.profiles for delete to authenticated using (public.has_role('super_admin'));

drop policy if exists "notif propria" on public.notifications;
create policy "notif propria" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notif lida" on public.notifications;
create policy "notif lida" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Auditoria: só leitura (Super Admin e tesouraria); ninguém altera nem apaga
drop policy if exists "auditoria leitura" on public.audit_log;
create policy "auditoria leitura" on public.audit_log for select to authenticated using (public.has_role('super_admin') or public.has_role('tesouraria'));
revoke update, delete, truncate on public.audit_log from anon, authenticated;

-- Pedidos de oração: membro ativo vê/edita os próprios; intercessão vê todos
drop policy if exists "pedido membro le" on public.prayer_requests;
create policy "pedido membro le" on public.prayer_requests for select to authenticated
  using (member_id = auth.uid() or public.has_role('intercessao'));
drop policy if exists "pedido membro cria" on public.prayer_requests;
create policy "pedido membro cria" on public.prayer_requests for insert to authenticated
  with check (public.is_active_member());
drop policy if exists "pedido edita" on public.prayer_requests;
create policy "pedido edita" on public.prayer_requests for update to authenticated
  using (member_id = auth.uid() or public.has_role('intercessao'))
  with check (member_id = auth.uid() or public.has_role('intercessao'));
drop policy if exists "pedido remove" on public.prayer_requests;
create policy "pedido remove" on public.prayer_requests for delete to authenticated using (public.has_role('super_admin'));

-- Mensagens do formulário público: só Intercessão/Pastoral (e Super Admin) leem
drop policy if exists "admin gerencia" on public.mensagens;
create policy "admin gerencia" on public.mensagens for all to authenticated
  using (public.is_admin() or public.has_role('intercessao'))
  with check (public.is_admin() or public.has_role('intercessao'));

-- Avisos de evento: equipe
drop policy if exists "admin gerencia" on public.avisos;
create policy "admin gerencia" on public.avisos for all to authenticated
  using (public.is_admin() or public.is_staff()) with check (public.is_admin() or public.is_staff());

-- ============ Fotos de perfil ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatar proprio envia" on storage.objects;
create policy "avatar proprio envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar proprio troca" on storage.objects;
create policy "avatar proprio troca" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar proprio apaga" on storage.objects;
create policy "avatar proprio apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
