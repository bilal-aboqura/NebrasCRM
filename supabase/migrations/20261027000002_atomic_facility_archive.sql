-- Change archive state and record its activity in the same transaction.
-- Keep creation and permissions in one statement for the linked migration runner.
do $migration$
begin
create or replace function public.set_facility_active_atomic(p_company_id uuid, p_facility_id uuid, p_actor_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare actor public.profiles; target public.facilities;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  select * into actor from public.profiles where id = p_actor_id;
  if actor.id is null or actor.status <> 'active' or actor.role not in ('super_admin', 'company_admin', 'supervisor')
    or (actor.role <> 'super_admin' and actor.company_id is distinct from p_company_id)
    or not exists(select 1 from public.companies where id = p_company_id and status = 'active') then
    raise exception 'صلاحية الأرشفة والاستعادة مخصصة للمشرفين والمدراء فقط.' using errcode = '42501';
  end if;
  if p_active is null then raise exception 'invalid archive state' using errcode = '23514'; end if;
  select * into target from public.facilities where id = p_facility_id and company_id = p_company_id for update;
  if target.id is null then raise exception 'المنشأة غير موجودة أو لا تملك صلاحية تعديلها.' using errcode = '42501'; end if;
  if target.is_active = p_active then return; end if;
  update public.facilities set is_active = p_active,
    archived_at = case when p_active then null else now() end,
    archived_by = case when p_active then null else p_actor_id end where id = p_facility_id;
  insert into public.facility_activity(company_id, facility_id, actor_id, event_type, old_value, new_value)
    values(p_company_id, p_facility_id, p_actor_id,
      (case when p_active then 'recovered' else 'archived' end)::public.facility_activity_type,
      target.is_active::text, p_active::text);
end;
$$;

revoke all on function public.set_facility_active_atomic(uuid, uuid, uuid, boolean) from public, anon, authenticated;

grant execute on function public.set_facility_active_atomic(uuid, uuid, uuid, boolean) to service_role;
end;
$migration$;
