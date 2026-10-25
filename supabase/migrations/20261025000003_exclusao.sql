-- Pedido de exclusão de conta (LGPD) avisa a liderança e fica na auditoria.
create or replace function public.avisar_exclusao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.exclusao_solicitada_em is not null and old.exclusao_solicitada_em is null then
    perform public.notificar_papel('super_admin', 'cadastro', 'Pedido de exclusão de conta',
      new.nome || ' pediu a exclusão dos seus dados (LGPD).', '/admin#membros');
    perform public.auditar('exclusao_solicitada', 'profiles', new.id::text, jsonb_build_object('membro', new.nome));
  end if;
  return new;
end $$;
drop trigger if exists avisar_exclusao on public.profiles;
create trigger avisar_exclusao after update on public.profiles for each row execute function public.avisar_exclusao();

-- Lista de staff para o painel saber quais abas mostrar
create or replace function public.meus_papeis()
returns table (status text, roles text[], admin boolean) language sql stable security definer set search_path = public as $$
  select p.status, p.roles, public.is_admin() from public.profiles p where p.id = auth.uid()
  union all
  select 'ativo', array['super_admin'], true where not exists (select 1 from public.profiles where id = auth.uid())
    and exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Exclusão definitiva (LGPD): apaga a conta de login e, em cascata, perfil, pedidos e notificações.
create or replace function public.excluir_membro(p_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_nome text;
begin
  if not public.has_role('super_admin') then raise exception 'sem permissão'; end if;
  if p_id = auth.uid() then raise exception 'não é possível excluir a própria conta'; end if;
  select nome into v_nome from public.profiles where id = p_id;
  perform public.auditar('exclusao_concluida', 'profiles', p_id::text, jsonb_build_object('membro', v_nome));
  delete from auth.users where id = p_id;
end $$;
revoke execute on function public.excluir_membro(uuid) from public, anon;
