-- Fases 2B e 2C: contribuições com comprovante, Projeto Espaço Novo, fila da tesouraria e lembretes.

-- ============ Comprovantes (bucket privado, só URL assinada) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprovantes', 'comprovantes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5242880;

drop policy if exists "comprovante envia" on storage.objects;
create policy "comprovante envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_member());
drop policy if exists "comprovante le" on storage.objects;
create policy "comprovante le" on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role('tesouraria')));

-- ============ Saída de avisos (e-mail Resend + webhook n8n) ============
create table if not exists public.outbox (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  link text,
  enviado_email_em timestamptz,
  enviado_webhook_em timestamptz,
  erro text,
  tentativas int not null default 0
);
alter table public.outbox enable row level security; -- só o sistema (service role) mexe

-- Avisa o membro no sino + fila de e-mail/WhatsApp
create or replace function public.avisar(p_user uuid, p_tipo text, p_titulo text, p_msg text, p_link text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar(p_user, p_tipo, p_titulo, p_msg, p_link);
  insert into public.outbox (user_id, tipo, titulo, mensagem, link) values (p_user, p_tipo, p_titulo, p_msg, p_link);
end $$;
revoke execute on function public.avisar(uuid, text, text, text, text) from public, anon, authenticated;

create or replace function public.brl(v numeric) returns text language sql immutable as $$
  select 'R$' || replace(replace(replace(to_char(v, 'FM999G999G990D00'), ',', '#'), '.', ','), '#', '.');
$$;

create or replace function public.hoje_cuiaba() returns date language sql stable as $$
  select (now() at time zone 'America/Cuiaba')::date;
$$;

-- ============ Contribuições (dízimo, oferta, doação) ============
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  member_id uuid references auth.users (id) on delete set null default auth.uid(),
  nome_avulso text,
  tipo text not null check (tipo in ('Dízimo', 'Oferta', 'Doação')),
  valor numeric(10, 2) not null check (valor > 0 and valor < 1000000),
  data_pix date not null,
  forma text not null default 'Pix' check (forma in ('Pix', 'Dinheiro', 'Cartão', 'Transferência')),
  comprovante_path text,
  observacao text check (char_length(observacao) <= 500),
  status text not null default 'Aguardando confirmação' check (status in ('Aguardando confirmação', 'Confirmado', 'Recusado')),
  motivo_recusa text,
  manual boolean not null default false,
  revisado_por uuid references auth.users (id),
  revisado_em timestamptz
);
create index if not exists contributions_member_idx on public.contributions (member_id, data_pix desc);
create index if not exists contributions_status_idx on public.contributions (status);

create or replace function public.proteger_contribuicao()
returns trigger language plpgsql security definer set search_path = public as $$
declare tes boolean := public.has_role('tesouraria');
begin
  if tg_op = 'INSERT' then
    if tes and new.manual then
      -- Lançamento manual da tesouraria (dinheiro no culto): já entra confirmado
      new.status := 'Confirmado';
      new.revisado_por := auth.uid();
      new.revisado_em := now();
      perform public.auditar('contribuicao_manual', 'contributions', new.id::text,
        jsonb_build_object('valor', new.valor, 'tipo', new.tipo, 'membro', coalesce((select nome from profiles where id = new.member_id), new.nome_avulso)));
    else
      new.member_id := auth.uid();
      new.manual := false;
      new.status := 'Aguardando confirmação';
      new.revisado_por := null;
      new.revisado_em := null;
      new.motivo_recusa := null;
      if new.comprovante_path is null or (storage.foldername(new.comprovante_path))[1] <> auth.uid()::text then
        raise exception 'Anexe o comprovante.';
      end if;
      perform public.notificar_papel('tesouraria', 'financeiro', 'Novo comprovante para conferir',
        (select nome from profiles where id = auth.uid()) || ' · ' || new.tipo || ' · ' || public.brl(new.valor), '/admin#comprovantes');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists proteger_contribuicao on public.contributions;
create trigger proteger_contribuicao before insert on public.contributions for each row execute function public.proteger_contribuicao();

alter table public.contributions enable row level security;
drop policy if exists "contrib le" on public.contributions;
create policy "contrib le" on public.contributions for select to authenticated using (member_id = auth.uid() or public.has_role('tesouraria'));
drop policy if exists "contrib cria" on public.contributions;
create policy "contrib cria" on public.contributions for insert to authenticated with check (public.is_active_member());
-- Alterações só pelas funções de revisão (auditadas)

-- ============ Projeto Espaço Novo ============
create table if not exists public.campaign_settings (
  id int primary key default 1 check (id = 1),
  meta_aluguel numeric(10, 2) not null default 2000,
  valor_minimo numeric(10, 2) not null default 100,
  valores_sugeridos numeric[] not null default '{100,200}',
  dia_vencimento int not null default 15 check (dia_vencimento between 1 and 28),
  fotos text[] not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.campaign_settings (id) values (1) on conflict do nothing;

create table if not exists public.campaign_memberships (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  member_id uuid not null references auth.users (id) on delete cascade,
  valor numeric(10, 2) not null check (valor > 0),
  meses int not null check (meses in (12, 24, 36)),
  inicio date not null,
  status text not null default 'ativa' check (status in ('ativa', 'encerrada')),
  aceite_em timestamptz not null default now()
);
create unique index if not exists uma_adesao_ativa on public.campaign_memberships (member_id) where status = 'ativa';

create table if not exists public.campaign_installments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.campaign_memberships (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  numero int not null,
  competencia date not null,
  vencimento date not null,
  valor numeric(10, 2) not null check (valor > 0),
  status text not null default 'Em aberto' check (status in ('Em aberto', 'Aguardando confirmação', 'Pago', 'Dispensada')),
  comprovante_path text,
  pagamento_grupo uuid,
  enviado_em timestamptz,
  motivo_recusa text,
  revisado_por uuid references auth.users (id),
  revisado_em timestamptz,
  lembretes text[] not null default '{}'
);
create index if not exists inst_member_idx on public.campaign_installments (member_id, vencimento);
create index if not exists inst_status_idx on public.campaign_installments (status, vencimento);

create table if not exists public.campaign_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  membership_id uuid not null references public.campaign_memberships (id) on delete cascade,
  member_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('Alterar valor', 'Pausar')),
  novo_valor numeric(10, 2),
  meses_pausa int check (meses_pausa between 1 and 6),
  motivo text check (char_length(motivo) <= 1000),
  status text not null default 'Pendente' check (status in ('Pendente', 'Aprovada', 'Recusada')),
  resolvido_por uuid references auth.users (id),
  resolvido_em timestamptz
);

alter table public.campaign_settings enable row level security;
alter table public.campaign_memberships enable row level security;
alter table public.campaign_installments enable row level security;
alter table public.campaign_requests enable row level security;

drop policy if exists "config le" on public.campaign_settings;
create policy "config le" on public.campaign_settings for select using (true);
drop policy if exists "config edita" on public.campaign_settings;
create policy "config edita" on public.campaign_settings for update to authenticated using (public.has_role('tesouraria')) with check (public.has_role('tesouraria'));

drop policy if exists "adesao le" on public.campaign_memberships;
create policy "adesao le" on public.campaign_memberships for select to authenticated using (member_id = auth.uid() or public.has_role('tesouraria'));
drop policy if exists "parcela le" on public.campaign_installments;
create policy "parcela le" on public.campaign_installments for select to authenticated using (member_id = auth.uid() or public.has_role('tesouraria'));
drop policy if exists "pedido campanha le" on public.campaign_requests;
create policy "pedido campanha le" on public.campaign_requests for select to authenticated using (member_id = auth.uid() or public.has_role('tesouraria'));
drop policy if exists "pedido campanha cria" on public.campaign_requests;
create policy "pedido campanha cria" on public.campaign_requests for insert to authenticated
  with check (member_id = auth.uid() and exists (select 1 from public.campaign_memberships m where m.id = membership_id and m.member_id = auth.uid() and m.status = 'ativa'));

-- Auditoria de mudanças de configuração (meta, mínimo, vencimento)
create or replace function public.auditar_config()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if (new.meta_aluguel, new.valor_minimo, new.valores_sugeridos, new.dia_vencimento) is distinct from (old.meta_aluguel, old.valor_minimo, old.valores_sugeridos, old.dia_vencimento) then
    perform public.auditar('espaco_novo_config', 'campaign_settings', '1', jsonb_build_object(
      'meta', jsonb_build_array(old.meta_aluguel, new.meta_aluguel),
      'minimo', jsonb_build_array(old.valor_minimo, new.valor_minimo),
      'sugeridos', jsonb_build_array(old.valores_sugeridos, new.valores_sugeridos),
      'vencimento', jsonb_build_array(old.dia_vencimento, new.dia_vencimento)));
  end if;
  return new;
end $$;
drop trigger if exists auditar_config on public.campaign_settings;
create trigger auditar_config before update on public.campaign_settings for each row execute function public.auditar_config();

-- Adesão: gera todas as parcelas. 1ª vence no dia de vencimento do mês seguinte.
create or replace function public.aderir_espaco_novo(p_valor numeric, p_meses int)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  cfg public.campaign_settings;
  v_id uuid;
  v_inicio date;
  i int;
begin
  if not public.is_active_member() then raise exception 'Cadastro ainda não aprovado.'; end if;
  select * into cfg from public.campaign_settings where id = 1;
  if p_meses not in (12, 24, 36) then raise exception 'Período inválido.'; end if;
  if p_valor < cfg.valor_minimo then raise exception 'O valor mínimo é %.', public.brl(cfg.valor_minimo); end if;
  if exists (select 1 from public.campaign_memberships where member_id = auth.uid() and status = 'ativa') then
    raise exception 'Você já faz parte do Espaço Novo.';
  end if;
  v_inicio := (date_trunc('month', public.hoje_cuiaba()) + interval '1 month')::date + (cfg.dia_vencimento - 1);
  insert into public.campaign_memberships (member_id, valor, meses, inicio) values (auth.uid(), round(p_valor, 2), p_meses, v_inicio) returning id into v_id;
  for i in 0 .. p_meses - 1 loop
    insert into public.campaign_installments (membership_id, member_id, numero, competencia, vencimento, valor)
    values (v_id, auth.uid(), i + 1, (date_trunc('month', v_inicio) + make_interval(months => i))::date,
            (date_trunc('month', v_inicio) + make_interval(months => i))::date + (cfg.dia_vencimento - 1), round(p_valor, 2));
  end loop;
  perform public.auditar('espaco_novo_adesao', 'campaign_memberships', v_id::text,
    jsonb_build_object('membro', (select nome from profiles where id = auth.uid()), 'valor', p_valor, 'meses', p_meses));
  perform public.notificar_papel('tesouraria', 'financeiro', 'Nova adesão ao Espaço Novo',
    (select nome from profiles where id = auth.uid()) || ' · ' || p_meses || 'x de ' || public.brl(p_valor), '/admin#espaco-novo');
  return v_id;
end $$;
revoke execute on function public.aderir_espaco_novo(numeric, int) from public, anon;

-- Membro envia um comprovante para uma ou mais parcelas (pagamento somado)
create or replace function public.enviar_comprovante_parcelas(p_ids uuid[], p_path text)
returns void language plpgsql security definer set search_path = public as $$
declare n int; total numeric; g uuid := gen_random_uuid();
begin
  if p_path is null or (storage.foldername(p_path))[1] <> auth.uid()::text then raise exception 'Comprovante inválido.'; end if;
  update public.campaign_installments set status = 'Aguardando confirmação', comprovante_path = p_path,
    pagamento_grupo = g, enviado_em = now(), motivo_recusa = null
  where id = any (p_ids) and member_id = auth.uid() and status = 'Em aberto';
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Nenhuma parcela em aberto selecionada.'; end if;
  select sum(valor) into total from public.campaign_installments where pagamento_grupo = g;
  perform public.notificar_papel('tesouraria', 'financeiro', 'Novo comprovante do Espaço Novo',
    (select nome from profiles where id = auth.uid()) || ' · ' || n || ' parcela(s) · ' || public.brl(total), '/admin#comprovantes');
end $$;
revoke execute on function public.enviar_comprovante_parcelas(uuid[], text) from public, anon;

-- Tesouraria confirma ou recusa (contribuições e parcelas), em lote
create or replace function public.revisar_comprovantes(p_contrib uuid[], p_parcelas uuid[], p_aprovar boolean, p_motivo text default null)
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  if not public.has_role('tesouraria') then raise exception 'Sem permissão.'; end if;
  if not p_aprovar and coalesce(trim(p_motivo), '') = '' then raise exception 'Informe o motivo da recusa.'; end if;

  for r in update public.contributions set
      status = case when p_aprovar then 'Confirmado' else 'Recusado' end,
      motivo_recusa = case when p_aprovar then null else p_motivo end,
      revisado_por = auth.uid(), revisado_em = now()
    where id = any (coalesce(p_contrib, '{}')) and status = 'Aguardando confirmação'
    returning id, member_id, tipo, valor
  loop
    n := n + 1;
    perform public.auditar(case when p_aprovar then 'baixa_confirmada' else 'comprovante_recusado' end, 'contributions', r.id::text,
      jsonb_build_object('membro', (select nome from profiles where id = r.member_id), 'tipo', r.tipo, 'valor', r.valor, 'motivo', p_motivo));
    if p_aprovar then
      perform public.avisar(r.member_id, 'financeiro', 'Contribuição confirmada! 🙏', r.tipo || ' de ' || public.brl(r.valor) || ' confirmado. Obrigado pela fidelidade.', '/minha-area#contribuicoes');
    else
      perform public.avisar(r.member_id, 'financeiro', 'Precisamos rever um comprovante', r.tipo || ' de ' || public.brl(r.valor) || ': ' || p_motivo, '/minha-area#contribuicoes');
    end if;
  end loop;

  for r in update public.campaign_installments set
      status = case when p_aprovar then 'Pago' else 'Em aberto' end,
      motivo_recusa = case when p_aprovar then null else p_motivo end,
      comprovante_path = case when p_aprovar then comprovante_path else null end,
      revisado_por = auth.uid(), revisado_em = now()
    where id = any (coalesce(p_parcelas, '{}')) and status = 'Aguardando confirmação'
    returning id, member_id, valor, competencia
  loop
    n := n + 1;
    perform public.auditar(case when p_aprovar then 'baixa_confirmada' else 'comprovante_recusado' end, 'campaign_installments', r.id::text,
      jsonb_build_object('membro', (select nome from profiles where id = r.member_id), 'tipo', 'Espaço Novo', 'valor', r.valor,
        'competencia', to_char(r.competencia, 'MM/YYYY'), 'motivo', p_motivo));
    if p_aprovar then
      perform public.avisar(r.member_id, 'espaco_novo', 'Pagamento confirmado! Obrigado pela fidelidade. 🙏',
        'Parcela de ' || to_char(r.competencia, 'MM/YYYY') || ' do Espaço Novo (' || public.brl(r.valor) || ').', '/minha-area#espaco-novo');
    else
      perform public.avisar(r.member_id, 'espaco_novo', 'Precisamos rever um comprovante',
        'Parcela de ' || to_char(r.competencia, 'MM/YYYY') || ': ' || p_motivo, '/minha-area#espaco-novo');
    end if;
  end loop;
  return n;
end $$;
revoke execute on function public.revisar_comprovantes(uuid[], uuid[], boolean, text) from public, anon;

-- Tesouraria aprova/recusa pedido de alteração de valor ou pausa
create or replace function public.resolver_pedido_campanha(p_id uuid, p_aprovar boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r public.campaign_requests;
begin
  if not public.has_role('tesouraria') then raise exception 'Sem permissão.'; end if;
  select * into r from public.campaign_requests where id = p_id and status = 'Pendente' for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;
  update public.campaign_requests set status = case when p_aprovar then 'Aprovada' else 'Recusada' end, resolvido_por = auth.uid(), resolvido_em = now() where id = p_id;
  if p_aprovar and r.tipo = 'Alterar valor' and r.novo_valor > 0 then
    update public.campaign_installments set valor = r.novo_valor where membership_id = r.membership_id and status = 'Em aberto';
    update public.campaign_memberships set valor = r.novo_valor where id = r.membership_id;
  elsif p_aprovar and r.tipo = 'Pausar' then
    update public.campaign_installments set status = 'Dispensada'
    where id in (select id from public.campaign_installments where membership_id = r.membership_id and status = 'Em aberto' order by vencimento limit r.meses_pausa);
  end if;
  perform public.auditar('espaco_novo_pedido', 'campaign_requests', p_id::text, jsonb_build_object(
    'membro', (select nome from profiles where id = r.member_id), 'tipo', r.tipo, 'novo_valor', r.novo_valor, 'meses', r.meses_pausa, 'aprovado', p_aprovar));
  perform public.avisar(r.member_id, 'espaco_novo', case when p_aprovar then 'Seu pedido foi aprovado' else 'Sobre o seu pedido no Espaço Novo' end,
    case when p_aprovar then r.tipo || ': aprovado pela liderança. Obrigado por conversar com a gente.'
         else 'A liderança quer conversar com você sobre o pedido (' || r.tipo || '). Estamos aqui.' end, '/minha-area#espaco-novo');
end $$;
revoke execute on function public.resolver_pedido_campanha(uuid, boolean) from public, anon;

create or replace function public.avisar_pedido_campanha()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.status := 'Pendente';
  perform public.notificar_papel('tesouraria', 'espaco_novo', 'Pedido no Espaço Novo',
    (select nome from profiles where id = new.member_id) || ' pediu: ' || new.tipo, '/admin#espaco-novo');
  return new;
end $$;
drop trigger if exists avisar_pedido_campanha on public.campaign_requests;
create trigger avisar_pedido_campanha before insert on public.campaign_requests for each row execute function public.avisar_pedido_campanha();

-- Números públicos da barra de progresso (sem dados pessoais)
create or replace function public.espaco_novo_publico()
returns table (meta numeric, comprometido numeric, familias int, recebido_mes numeric, valor_minimo numeric, valores_sugeridos numeric[], dia_vencimento int, fotos text[])
language sql stable security definer set search_path = public as $$
  select s.meta_aluguel,
    coalesce((select sum(valor) from public.campaign_memberships where status = 'ativa'), 0),
    (select count(distinct member_id)::int from public.campaign_memberships where status = 'ativa'),
    coalesce((select sum(valor) from public.campaign_installments where status = 'Pago' and competencia = date_trunc('month', public.hoje_cuiaba())::date), 0),
    s.valor_minimo, s.valores_sugeridos, s.dia_vencimento, s.fotos
  from public.campaign_settings s where s.id = 1;
$$;
grant execute on function public.espaco_novo_publico() to anon, authenticated;

-- ============ Lembretes diários (8h Cuiabá) ============
create or replace function public.lembretes_espaco_novo()
returns int language plpgsql security definer set search_path = public as $$
declare r record; hoje date := public.hoje_cuiaba(); n int := 0; tipo text; msg text; nome text;
begin
  for r in
    select i.*, p.nome from public.campaign_installments i join public.profiles p on p.id = i.member_id
    where i.status = 'Em aberto' and p.status = 'ativo'
      and i.vencimento in (hoje + 3, hoje, hoje - 3)
  loop
    nome := split_part(r.nome, ' ', 1);
    if r.vencimento = hoje + 3 then
      tipo := 'antes';
      msg := 'Olá, ' || nome || '! Sua parcela do Projeto Espaço Novo de ' || public.brl(r.valor) || ' vence dia ' || to_char(r.vencimento, 'DD') || '. Toque aqui para pagar.';
    elsif r.vencimento = hoje then
      tipo := 'dia';
      msg := 'Olá, ' || nome || '! Hoje é o dia da sua parcela do Espaço Novo (' || public.brl(r.valor) || '). Toque aqui para pagar.';
    else
      tipo := 'depois';
      msg := 'Olá, ' || nome || '! Sua parcela de ' || to_char(r.competencia, 'MM/YYYY') || ' do Espaço Novo ainda está em aberto. Sabemos que a vida tem imprevistos. Se precisar conversar, estamos aqui.';
    end if;
    continue when tipo = any (r.lembretes);
    update public.campaign_installments set lembretes = lembretes || tipo where id = r.id;
    perform public.avisar(r.member_id, 'lembrete', 'Projeto Espaço Novo', msg, '/minha-area#espaco-novo');
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.lembretes_espaco_novo() from public, anon, authenticated;

-- Lembrete manual (individual ou em massa) pelo painel
create or replace function public.lembrete_manual(p_members uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  if not public.has_role('tesouraria') then raise exception 'Sem permissão.'; end if;
  for r in
    select p.id, p.nome, count(*) qtd, sum(i.valor) total
    from public.campaign_installments i join public.profiles p on p.id = i.member_id
    where i.member_id = any (p_members) and i.status = 'Em aberto' and i.vencimento < public.hoje_cuiaba()
    group by p.id, p.nome
  loop
    perform public.avisar(r.id, 'lembrete', 'Projeto Espaço Novo',
      'Olá, ' || split_part(r.nome, ' ', 1) || '! Passando com carinho para lembrar que há ' || r.qtd || ' parcela(s) do Espaço Novo em aberto (' || public.brl(r.total) || '). Sabemos que a vida tem imprevistos. Se precisar conversar, estamos aqui.',
      '/minha-area#espaco-novo');
    n := n + 1;
  end loop;
  perform public.auditar('lembrete_manual', 'campaign_installments', null, jsonb_build_object('membros', n));
  return n;
end $$;
revoke execute on function public.lembrete_manual(uuid[]) from public, anon;

-- Painel: números do mês e dos últimos 12 meses (só tesouraria)
create or replace function public.painel_financeiro()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare mes date := date_trunc('month', public.hoje_cuiaba())::date;
begin
  if not public.has_role('tesouraria') then raise exception 'Sem permissão.'; end if;
  return jsonb_build_object(
    'mes', (select jsonb_object_agg(tipo, total) from (
        select tipo, sum(valor) total from public.contributions where status = 'Confirmado' and date_trunc('month', data_pix) = mes group by tipo
        union all
        select 'Espaço Novo', coalesce(sum(valor), 0) from public.campaign_installments where status = 'Pago' and competencia = mes) t),
    'meses', (select jsonb_agg(jsonb_build_object('mes', to_char(m, 'YYYY-MM'),
        'contrib', coalesce((select sum(valor) from public.contributions where status = 'Confirmado' and date_trunc('month', data_pix) = m), 0),
        'espaco', coalesce((select sum(valor) from public.campaign_installments where status = 'Pago' and competencia = m), 0)) order by m)
      from generate_series(mes - interval '11 months', mes, interval '1 month') m),
    'pendentes', (select count(*) from public.contributions where status = 'Aguardando confirmação')
               + (select count(distinct coalesce(pagamento_grupo, id)) from public.campaign_installments where status = 'Aguardando confirmação'),
    'membros_ativos', (select count(*) from public.profiles where status = 'ativo'),
    'cadastros_pendentes', (select count(*) from public.profiles where status = 'pendente'),
    'oracoes_novas', (select count(*) from public.prayer_requests where status = 'Recebido') + (select count(*) from public.mensagens where status = 'Novo'),
    'espaco', (select to_jsonb(e) from public.espaco_novo_publico() e),
    'vencidas', (select count(*) from public.campaign_installments where status = 'Em aberto' and vencimento < public.hoje_cuiaba()),
    'pedidos_campanha', (select count(*) from public.campaign_requests where status = 'Pendente')
  );
end $$;
revoke execute on function public.painel_financeiro() from public, anon;
