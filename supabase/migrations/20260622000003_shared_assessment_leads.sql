create table public.shared_assessment_leads (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null check (length(trim(facility_name)) between 2 and 200),
  contact_name text not null check (length(trim(contact_name)) between 2 and 120),
  city text not null check (length(trim(city)) between 2 and 100),
  phone text not null,
  phone_normalized text not null,
  email text,
  facility_type_assessed text not null check (facility_type_assessed in ('general', 'dental')),
  overall_score integer not null check (overall_score between 0 and 100),
  readiness_tier text not null check (readiness_tier in ('high', 'medium', 'low')),
  answered_count integer not null check (answered_count >= 0),
  counts jsonb not null,
  answers jsonb not null,
  top_gaps jsonb not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index idx_shared_assessment_leads_created_at
  on public.shared_assessment_leads(created_at desc);
create index idx_shared_assessment_leads_phone
  on public.shared_assessment_leads(phone_normalized);
create index idx_shared_assessment_leads_status
  on public.shared_assessment_leads(status, created_at desc);

alter table public.shared_assessment_leads enable row level security;

create policy shared_assessment_leads_read_all_companies
on public.shared_assessment_leads
for select to authenticated
using (true);

revoke insert, update, delete on public.shared_assessment_leads from anon, authenticated;
