-- Reports module prerequisites: corrected follow-up task types and structured
-- facility lifecycle events. The migration is repeatable for local environments.
do $$
begin
  if exists (select 1 from pg_type where typname = 'followup_type')
     and not exists (select 1 from pg_type where typname = 'followup_type_reports_old') then
    alter type public.followup_type rename to followup_type_reports_old;
  end if;
end $$;

do $$ begin
  create type public.followup_type as enum ('call', 'visit', 'send_offer', 'other');
exception when duplicate_object then null; end $$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'followup_type_reports_old') then
    alter table public.followups alter column type drop default;
    alter table public.followups alter column type type public.followup_type
      using (case type::text when 'email' then 'other' when 'whatsapp' then 'other' else type::text end)::public.followup_type;
    drop type public.followup_type_reports_old;
  end if;
end $$;

do $$ begin
  create type public.facility_activity_type as enum
    ('status_change', 'owner_change', 'archived', 'recovered', 'created', 'edited');
exception when duplicate_object then null; end $$;

alter table public.facility_activity
  add column if not exists event_type public.facility_activity_type,
  add column if not exists old_value text,
  add column if not exists new_value text;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'facility_activity' and column_name = 'kind') then
    execute $backfill$
      update public.facility_activity
      set event_type = case
        when kind in ('status_change', 'owner_change', 'archived', 'recovered', 'created', 'edited') then kind::public.facility_activity_type
        when kind = 'facility_created' then 'created'::public.facility_activity_type
        else 'edited'::public.facility_activity_type
      end
      where event_type is null
    $backfill$;
    alter table public.facility_activity alter column kind drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'facility_activity' and column_name = 'message') then
    alter table public.facility_activity alter column message drop not null;
  end if;
end $$;

alter table public.facility_activity alter column event_type set not null;
create index if not exists facility_activity_reports_idx
  on public.facility_activity(company_id, event_type, created_at, facility_id);

create or replace function public.log_facility_status_change()
returns trigger language plpgsql security invoker as $$
begin
  if old.status is distinct from new.status then
    insert into public.facility_activity
      (company_id, facility_id, actor_id, event_type, old_value, new_value)
    values
      (new.company_id, new.id, auth.uid(), 'status_change', old.status::text, new.status::text);
  end if;
  return new;
end;
$$;
