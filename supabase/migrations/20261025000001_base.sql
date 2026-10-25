-- IBN Rondonópolis — banco de dados do site
-- Cole tudo no Supabase → SQL Editor → Run. Pode rodar de novo sem quebrar nada.

-- ============ Admins ============
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ============ Conteúdo público ============
create table if not exists public.settings (
  key text primary key,          -- 'site' (textos, pix, redes, drive) | 'live'
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.cultos (
  id uuid primary key default gen_random_uuid(),
  dia smallint not null check (dia between 0 and 6),  -- 0 = domingo
  hora text not null,                                  -- 'HH:MM' (Cuiabá)
  nome text not null,
  ordem int not null default 0,
  ativo boolean not null default true
);

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  data timestamptz,               -- vazio = "Em breve"
  imagem_url text,
  link_inscricao text,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ministerios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  horario text,
  icone text default 'heart',
  ordem int not null default 0,
  ativo boolean not null default true
);

create table if not exists public.albuns (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  folder_id text not null,        -- ID da pasta pública do Google Drive
  ordem int not null default 0,
  ativo boolean not null default true
);

-- ============ Dados sensíveis (só admin lê) ============
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null check (char_length(nome) <= 120),
  whatsapp text not null check (char_length(whatsapp) <= 30),
  email text check (char_length(email) <= 160),
  perfil text,
  tipo text,
  mensagem text not null check (char_length(mensagem) <= 5000),
  confidencial boolean not null default false,
  status text not null default 'Novo' check (status in ('Novo', 'Em oração', 'Respondido'))
);

create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  evento_id text,
  evento_titulo text,
  nome text not null check (char_length(nome) <= 120),
  whatsapp text not null check (char_length(whatsapp) <= 30)
);

-- ============ RLS ============
alter table public.admins      enable row level security;
alter table public.settings    enable row level security;
alter table public.cultos      enable row level security;
alter table public.eventos     enable row level security;
alter table public.ministerios enable row level security;
alter table public.albuns      enable row level security;
alter table public.mensagens   enable row level security;
alter table public.avisos      enable row level security;

do $$
declare t text;
begin
  -- Conteúdo: todos leem, só admin escreve
  foreach t in array array['settings','cultos','eventos','ministerios','albuns'] loop
    execute format('drop policy if exists "leitura publica" on public.%I', t);
    execute format('create policy "leitura publica" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin escreve" on public.%I', t);
    execute format('create policy "admin escreve" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  -- Mensagens / pedidos de oração e avisos: qualquer um ENVIA, ninguém além do admin LÊ.
  foreach t in array array['mensagens','avisos'] loop
    execute format('drop policy if exists "envio publico" on public.%I', t);
    execute format('create policy "envio publico" on public.%I for insert to anon, authenticated with check (true)', t);
    execute format('drop policy if exists "admin gerencia" on public.%I', t);
    execute format('create policy "admin gerencia" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "admin ve admins" on public.admins;
create policy "admin ve admins" on public.admins for select to authenticated using (public.is_admin());

-- Mensagens públicas sempre entram como "Novo"
create or replace function public.mensagem_status_inicial()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() then new.status := 'Novo'; end if;
  return new;
end $$;
drop trigger if exists mensagem_status_inicial on public.mensagens;
create trigger mensagem_status_inicial before insert on public.mensagens
  for each row execute function public.mensagem_status_inicial();

-- ============ Conteúdo inicial ============
insert into public.settings (key, value) values
  ('live', '{"url": "https://www.youtube.com/live/3m2OShzPKmU", "ativo": false}'),
  ('site', '{}')
on conflict (key) do nothing;

insert into public.cultos (dia, hora, nome, ordem)
select * from (values (3, '19:30', 'Culto da Vitória', 1), (5, '19:00', 'Culto de Oração', 2), (0, '18:30', 'Culto da Família', 3)) v
where not exists (select 1 from public.cultos);

insert into public.eventos (titulo, descricao, imagem_url, ordem)
select 'Encontro com Deus', 'Um fim de semana para recomeçar. Deixe seu contato e avisaremos assim que as datas forem liberadas.', '/img/louvor.jpg', 1
where not exists (select 1 from public.eventos);

insert into public.ministerios (nome, descricao, horario, icone, ordem)
select * from (values
  ('Inspira Jovens', 'Juventude que vive a fé com intensidade e propósito.', 'Consulte a agenda', 'flame', 1),
  ('Inspira Teens', 'Um espaço seguro para adolescentes crescerem com Deus e com amigos.', 'Consulte a agenda', 'sparkles', 2),
  ('Mulheres', 'Mulheres fortalecidas na Palavra, em comunhão e cuidado umas com as outras.', 'Consulte a agenda', 'flower', 3),
  ('Homens', 'Homens firmes na fé, liderando suas casas com propósito.', 'Consulte a agenda', 'shield', 4),
  ('Ação Solidária', 'Fé que se transforma em gesto. Todo 1º domingo do mês.', '1º domingo do mês · 18h30', 'hand-heart', 5)
) v where not exists (select 1 from public.ministerios);

insert into public.albuns (nome, folder_id, ordem)
select 'Conferência Despertar · 5 anos', '1jp-9SPuzOe9WWswq4-V51BVXo2p7z6d4', 1
where not exists (select 1 from public.albuns);

-- ============ Tornar alguém admin ============
-- 1) Supabase → Authentication → Users → Add user (e-mail + senha)
-- 2) Rode, trocando o e-mail:
-- insert into public.admins (user_id) select id from auth.users where email = 'seu-email@exemplo.com';
