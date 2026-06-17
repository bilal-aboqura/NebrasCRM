alter table public.companies add column if not exists deactivated_at timestamptz;
alter table public.profiles add column if not exists invitation_token text;

create or replace function public.prevent_last_company_admin_lockout()
returns trigger language plpgsql as $$
begin
  if old.role in ('company_admin', 'super_admin') and new.status <> 'active' then
    if not exists (
      select 1 from public.profiles
      where id <> old.id
        and status = 'active'
        and role = old.role
        and coalesce(company_id, '00000000-0000-0000-0000-000000000000') = coalesce(old.company_id, '00000000-0000-0000-0000-000000000000')
    ) then
      raise exception 'Cannot deactivate the last active administrator';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_last_admin_lockout on public.profiles;
create trigger trg_prevent_last_admin_lockout before update on public.profiles
for each row execute function public.prevent_last_company_admin_lockout();
