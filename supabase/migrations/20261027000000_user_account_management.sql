-- Retain CRM ownership/history when an administrator removes an account.
alter table public.profiles add column if not exists deleted_at timestamptz;
alter table public.profiles add constraint profiles_deleted_inactive
  check (deleted_at is null or status <> 'active');

create table public.user_password_resets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.user_password_resets enable row level security;
revoke all on public.user_password_resets from anon, authenticated;
grant all on public.user_password_resets to service_role;

create or replace function public.guard_account_deletion_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.deleted_at is distinct from old.deleted_at and auth.role() is distinct from 'service_role' then
    raise exception 'account deletion requires the administration service' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_account_deletion_fields before update on public.profiles
for each row execute function public.guard_account_deletion_fields();

create or replace function public.manage_user_account(p_actor_id uuid, p_target_id uuid, p_operation text)
returns void language plpgsql security definer set search_path = '' as $$
declare actor public.profiles; target public.profiles;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  select * into actor from public.profiles where id = p_actor_id for update;
  select * into target from public.profiles where id = p_target_id for update;
  if actor.id is null or target.id is null or actor.status <> 'active' or actor.deleted_at is not null
    or actor.role not in ('super_admin', 'company_admin') or actor.id = target.id
    or (actor.role <> 'super_admin' and (actor.company_id is distinct from target.company_id or target.role = 'super_admin'))
    or (actor.role <> 'super_admin' and not exists(select 1 from public.companies where id = actor.company_id and status = 'active')) then
    raise exception 'غير مصرح لك بإدارة هذا المستخدم.' using errcode = '42501';
  end if;
  if p_operation is null or p_operation not in ('delete', 'reactivate', 'deactivate') then
    raise exception 'إجراء غير صالح.' using errcode = '23514';
  end if;
  if p_operation = 'reactivate' then
    if target.role <> 'super_admin' and not exists(select 1 from public.companies where id = target.company_id and status = 'active') then
      raise exception 'يجب تفعيل الشركة أولاً.' using errcode = '23514';
    end if;
    update public.profiles set status = case when status = 'pending' then 'pending' else 'active' end,
      deleted_at = null where id = p_target_id;
  else
    update public.profiles set status = case when status = 'pending' then 'pending' else 'inactive' end,
      deleted_at = case when p_operation = 'delete' then now() else deleted_at end
      where id = p_target_id;
    perform public.revoke_user_sessions(p_target_id);
    update public.user_invitations set used_at = now() where user_id = p_target_id and used_at is null;
    delete from public.user_password_resets where user_id = p_target_id;
  end if;
  insert into public.audit_logs(actor_user_id, actor_company_id, event_type, target_company_id, outcome, details)
  values(p_actor_id, actor.company_id, 'profile_update', target.company_id, 'success',
    jsonb_build_object('action', p_operation, 'target_user_id', p_target_id, 'previous_status', target.status));
end;
$$;
revoke all on function public.manage_user_account(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.manage_user_account(uuid, uuid, text) to service_role;

create or replace function public.issue_user_access_link(p_actor_id uuid, p_target_id uuid, p_token_hash text, p_purpose text)
returns void language plpgsql security definer set search_path = '' as $$
declare actor public.profiles; target public.profiles;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  select * into actor from public.profiles where id = p_actor_id for update;
  select * into target from public.profiles where id = p_target_id for update;
  if actor.id is null or target.id is null or actor.id = target.id or actor.status <> 'active' or actor.deleted_at is not null
    or actor.role not in ('super_admin', 'company_admin') or target.deleted_at is not null
    or (actor.role <> 'super_admin' and (actor.company_id is distinct from target.company_id or target.role = 'super_admin'))
    or (actor.role <> 'super_admin' and not exists(select 1 from public.companies where id = actor.company_id and status = 'active')) then
    raise exception 'غير مصرح لك بإدارة هذا المستخدم.' using errcode = '42501';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid token hash' using errcode = '23514';
  end if;
  if p_purpose = 'invitation' and target.status = 'pending' then
    insert into public.user_invitations(user_id, token_hash, created_by, expires_at)
      values(p_target_id, p_token_hash, p_actor_id, now() + interval '24 hours')
      on conflict(user_id) do update set token_hash = excluded.token_hash, created_by = excluded.created_by,
        expires_at = excluded.expires_at, used_at = null, created_at = now();
  elsif p_purpose = 'password_reset' and target.status = 'active' then
    insert into public.user_password_resets(user_id, token_hash, created_by, expires_at)
      values(p_target_id, p_token_hash, p_actor_id, now() + interval '1 hour')
      on conflict(user_id) do update set token_hash = excluded.token_hash, created_by = excluded.created_by,
        expires_at = excluded.expires_at, used_at = null, created_at = now();
  else
    raise exception 'حالة المستخدم لا تسمح بإنشاء هذا الرابط.' using errcode = '23514';
  end if;
  insert into public.audit_logs(actor_user_id, actor_company_id, event_type, target_company_id, outcome, details)
    values(p_actor_id, actor.company_id, 'profile_update', target.company_id, 'success',
      jsonb_build_object('action', p_purpose || '_link_created', 'target_user_id', p_target_id));
end;
$$;
revoke all on function public.issue_user_access_link(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.issue_user_access_link(uuid, uuid, text, text) to service_role;
