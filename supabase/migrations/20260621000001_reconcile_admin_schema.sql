-- Reconcile databases where feature 002 was applied before its final schema shape.
create or replace function public.audit_resource_changes()
returns trigger language plpgsql security definer as $$
declare
  old_data jsonb := to_jsonb(old);
  new_data jsonb := to_jsonb(new);
  diff jsonb := '{}'::jsonb;
  field_name text;
  target_company uuid;
begin
  for field_name in select jsonb_object_keys(new_data) loop
    if field_name not in ('password_hash', 'invitation_token', 'updated_at', 'created_at')
       and old_data -> field_name is distinct from new_data -> field_name then
      diff := diff || jsonb_build_object(field_name, jsonb_build_object(
        'old', old_data -> field_name,
        'new', new_data -> field_name
      ));
    end if;
  end loop;

  if diff <> '{}'::jsonb then
    target_company := coalesce(
      nullif(new_data ->> 'company_id', '')::uuid,
      nullif(new_data ->> 'id', '')::uuid
    );
    insert into public.audit_logs (
      actor_user_id, actor_company_id, event_type,
      target_company_id, details, timestamp
    ) values (
      auth.uid(), nullif(auth.jwt() ->> 'company_id', '')::uuid,
      tg_table_name || '_update', target_company, diff, now()
    );
  end if;
  return new;
end;
$$;

alter table public.companies
  add column if not exists name_ar text,
  add column if not exists active boolean;

update public.companies
set name_ar = coalesce(name_ar, name),
    active = coalesce(active, status = 'active');

alter table public.companies alter column name_ar set not null;
alter table public.companies alter column active set default true;
alter table public.companies alter column active set not null;

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists active boolean;

update public.profiles
set full_name = coalesce(full_name, display_name, ''),
    active = coalesce(active, status = 'active');

alter table public.profiles alter column full_name set default '';
alter table public.profiles alter column full_name set not null;
alter table public.profiles alter column active set default true;
alter table public.profiles alter column active set not null;

create or replace function public.sync_admin_fields()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_table_name = 'companies' then
    new.name_ar := coalesce(nullif(new.name_ar, ''), new.name);
    new.name := new.name_ar;
    new.active := new.status = 'active';
  else
    new.display_name := coalesce(nullif(new.display_name, ''), new.full_name, '');
    new.full_name := new.display_name;
    new.active := new.status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists sync_company_admin_fields on public.companies;
create trigger sync_company_admin_fields before insert or update on public.companies
for each row execute function public.sync_admin_fields();

drop trigger if exists sync_profile_admin_fields on public.profiles;
create trigger sync_profile_admin_fields before insert or update on public.profiles
for each row execute function public.sync_admin_fields();
