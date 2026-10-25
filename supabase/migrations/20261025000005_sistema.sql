-- Proteção do perfil: aceita mudanças feitas por funções do próprio sistema (rodam como postgres)
create or replace function public.proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare super boolean := auth.uid() is null or current_setting('ibn.sistema', true) = 'on' or public.has_role('super_admin');
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

create or replace function public.garantir_lider()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('ibn.sistema', 'on', true);
  update public.profiles p set status = 'ativo', roles = array(select distinct unnest(p.roles || array['membro', 'super_admin']))
  where p.id = auth.uid()
    and exists (select 1 from public.admin_emails a where a.email = p.email)
    and (p.status <> 'ativo' or not ('super_admin' = any (p.roles)));
  perform set_config('ibn.sistema', 'off', true);
end $$;
revoke execute on function public.garantir_lider() from public, anon;
