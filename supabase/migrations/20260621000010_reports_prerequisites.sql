-- Reconcile older installations with the structured activity and follow-up
-- schemas required by reports. Fresh installations already have these fields.
do $$
begin
  if exists (select 1 from pg_type where typname = 'followup_type')
     and exists (
       select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
       where t.typname = 'followup_type' and e.enumlabel in ('email', 'whatsapp')
     ) then
    alter type public.followup_type rename to followup_type_legacy;
    create type public.followup_type as enum ('call', 'visit', 'send_offer', 'other');
    alter table public.followups alter column type drop default;
    alter table public.followups alter column type type public.followup_type using (
      case type::text when 'call' then 'call' when 'visit' then 'visit' else 'other' end
    )::public.followup_type;
    drop type public.followup_type_legacy;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'facility_activity_type') then
    create type public.facility_activity_type as enum
      ('status_change', 'owner_change', 'archived', 'recovered', 'created', 'edited');
  end if;
end $$;

alter table if exists public.facility_activity
  add column if not exists event_type public.facility_activity_type,
  add column if not exists old_value text,
  add column if not exists new_value text;

create index if not exists idx_facility_activity_report_transitions
  on public.facility_activity(company_id, event_type, created_at, facility_id);
create index if not exists idx_followups_report_period
  on public.followups(company_id, created_at, assigned_to);
create index if not exists idx_call_logs_report_period
  on public.call_logs(company_id, occurred_at, created_by_id) where not is_archived;
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'offers' and column_name = 'created_by'
  ) then
    execute 'create index if not exists idx_offers_report_period
      on public.offers(company_id, sent_at, created_by) where is_active and not is_superseded';
  else
    execute 'create index if not exists idx_offers_report_period
      on public.offers(company_id, sent_at) where is_active and not is_superseded';
  end if;
end $$;
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'created_by'
  ) then
    execute 'create index if not exists idx_contracts_report_period
      on public.contracts(company_id, start_date, created_by) where is_active and not is_superseded';
  else
    execute 'create index if not exists idx_contracts_report_period
      on public.contracts(company_id, start_date) where is_active and not is_superseded';
  end if;
end $$;
