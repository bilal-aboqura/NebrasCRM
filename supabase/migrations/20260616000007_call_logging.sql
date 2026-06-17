do $$ begin
  create type public.communication_channel as enum ('phone', 'whatsapp', 'email', 'visit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.communication_direction as enum ('outbound', 'inbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.communication_outcome as enum ('answered', 'no_answer', 'callback', 'not_interested');
exception when duplicate_object then null; end $$;

create table if not exists public.call_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  contact_id uuid references public.contacts(id),
  followup_id uuid references public.followups(id),
  channel public.communication_channel not null,
  direction public.communication_direction not null,
  outcome public.communication_outcome not null,
  occurred_at timestamptz not null default now(),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.validate_call_log()
returns trigger language plpgsql as $$
begin
  if new.occurred_at > now() then raise exception 'occurred_at cannot be in the future'; end if;
  if new.contact_id is not null and not exists (select 1 from public.contacts where id = new.contact_id and facility_id = new.facility_id) then
    raise exception 'contact must belong to facility';
  end if;
  if new.followup_id is not null and not exists (select 1 from public.followups where id = new.followup_id and facility_id = new.facility_id) then
    raise exception 'followup must belong to facility';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_call_log on public.call_logs;
create trigger trg_validate_call_log before insert or update on public.call_logs
for each row execute function public.validate_call_log();

create or replace function public.check_call_log_edit_window()
returns trigger language plpgsql as $$
begin
  if old.created_at < now() - interval '24 hours' and public.current_app_role() = 'sales_user' then
    raise exception 'edit window expired';
  end if;
  if old.facility_id is distinct from new.facility_id or old.company_id is distinct from new.company_id then
    raise exception 'immutable call log fields cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_call_log_edit_window on public.call_logs;
create trigger trg_check_call_log_edit_window before update on public.call_logs
for each row execute function public.check_call_log_edit_window();

alter table public.call_logs enable row level security;
