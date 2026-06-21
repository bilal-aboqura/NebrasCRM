create type public.facility_type as enum ('medical_complex', 'dental_complex', 'lab', 'radiology', 'hospital');
create type public.lead_source as enum ('manual', 'website_form', 'imported');
create type public.facility_status as enum ('new', 'contacted', 'interested', 'offer', 'negotiation', 'contract', 'lost');
create type public.facility_activity_type as enum ('status_change', 'owner_change', 'archived', 'recovered', 'created', 'edited');

alter table public.companies add column whatsapp_template text not null
  default 'السلام عليكم ورحمة الله وبركاته، نود التواصل معكم بخصوص خدمات اعتماد سباهي من شركة [اسم الشركة]';

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null unique,
  name_en text not null unique,
  created_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id),
  name_ar text not null,
  name_en text not null,
  created_at timestamptz not null default now(),
  unique (region_id, name_ar),
  unique (region_id, name_en)
);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name_ar text not null check (length(trim(name_ar)) between 2 and 200),
  type public.facility_type not null,
  region_id uuid not null references public.regions(id),
  city_id uuid not null references public.cities(id),
  city_custom text,
  primary_phone text not null,
  primary_phone_normalized text not null,
  secondary_phone text,
  lead_source public.lead_source not null default 'manual',
  assigned_to uuid references public.profiles(id),
  status public.facility_status not null default 'new',
  notes text,
  is_active boolean not null default true,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.facility_activity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  event_type public.facility_activity_type not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index idx_facilities_company_id on public.facilities(company_id);
create index idx_facilities_assigned_to on public.facilities(assigned_to);
create index idx_facilities_status on public.facilities(status);
create index idx_facilities_region_city on public.facilities(region_id, city_id);
create index idx_facility_activity_facility_id on public.facility_activity(facility_id);
create index idx_facility_activity_company_id on public.facility_activity(company_id);
create unique index idx_facilities_phone_unique_per_company
  on public.facilities(company_id, primary_phone_normalized)
  where is_active and primary_phone_normalized is not null;

create or replace function public.normalize_saudi_phone(value text)
returns text language plpgsql immutable strict as $$
declare digits text := regexp_replace(value, '[^0-9]', '', 'g');
begin
  if digits like '00%' then digits := substr(digits, 3); end if;
  if digits like '966%' then return digits; end if;
  digits := regexp_replace(digits, '^0+', '');
  if digits = '' then return ''; end if;
  return '966' || digits;
end;
$$;

create or replace function public.prepare_facility()
returns trigger language plpgsql as $$
declare city_region uuid;
declare city_name text;
declare owner_company uuid;
declare owner_role public.app_role;
declare owner_status text;
begin
  new.name_ar := trim(new.name_ar);
  new.primary_phone_normalized := public.normalize_saudi_phone(new.primary_phone);
  if new.primary_phone_normalized = '' then
    raise exception 'invalid phone' using errcode = '23514';
  end if;
  select region_id, name_en into city_region, city_name from public.cities where id = new.city_id;
  if city_region is distinct from new.region_id then
    raise exception 'city does not belong to region' using errcode = '23514';
  end if;
  if city_name = 'Other' and nullif(trim(new.city_custom), '') is null then
    raise exception 'custom city is required' using errcode = '23514';
  end if;
  if new.assigned_to is not null then
    select company_id, role, status into owner_company, owner_role, owner_status from public.profiles where id = new.assigned_to;
    if owner_company is distinct from new.company_id or owner_role <> 'sales_user' or owner_status <> 'active' then
      raise exception 'invalid facility owner' using errcode = '23514';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger prepare_facility before insert or update on public.facilities
for each row execute function public.prepare_facility();

alter table public.regions enable row level security;
alter table public.cities enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_activity enable row level security;

create policy regions_read on public.regions for select to authenticated using (true);
create policy cities_read on public.cities for select to authenticated using (true);

create policy facilities_select on public.facilities for select to authenticated using (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and (public.jwt_role() <> 'sales_user' or assigned_to = auth.uid())
);
create policy facilities_insert on public.facilities for insert to authenticated with check (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and created_by = auth.uid()
  and (public.jwt_role() <> 'sales_user' or assigned_to = auth.uid())
);
create policy facilities_update on public.facilities for update to authenticated using (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and (public.jwt_role() <> 'sales_user' or (assigned_to = auth.uid() and is_active))
) with check (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and (public.jwt_role() <> 'sales_user' or (assigned_to = auth.uid() and is_active))
);

create policy facility_activity_select on public.facility_activity for select to authenticated using (
  company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  ) and exists (select 1 from public.facilities f where f.id = facility_activity.facility_id)
);
create policy facility_activity_insert on public.facility_activity for insert to authenticated with check (
  actor_id = auth.uid()
  and company_id = coalesce(
    case when public.is_super_admin() then nullif(current_setting('request.cookies.active_company_id', true), '')::uuid end,
    public.jwt_company_id()
  )
  and exists (select 1 from public.facilities f where f.id = facility_activity.facility_id and f.company_id = facility_activity.company_id)
);
revoke delete on public.facilities from authenticated, anon;
revoke update, delete on public.facility_activity from authenticated, anon;

insert into public.regions(name_ar, name_en) values
  ('الرياض','Riyadh'),('مكة المكرمة','Makkah'),('المدينة المنورة','Madinah'),
  ('القصيم','Al-Qassim'),('المنطقة الشرقية','Eastern Province'),('عسير','Asir'),
  ('تبوك','Tabuk'),('حائل','Hail'),('الحدود الشمالية','Northern Borders'),
  ('جازان','Jazan'),('نجران','Najran'),('الباحة','Al-Baha'),('الجوف','Al-Jawf');

with city_seed(region_en, name_ar, name_en) as (values
  ('Riyadh','الرياض','Riyadh'),('Makkah','مكة المكرمة','Makkah'),('Makkah','جدة','Jeddah'),
  ('Madinah','المدينة المنورة','Madinah'),('Al-Qassim','بريدة','Buraidah'),
  ('Eastern Province','الدمام','Dammam'),('Eastern Province','الخبر','Khobar'),
  ('Asir','أبها','Abha'),('Tabuk','تبوك','Tabuk'),('Hail','حائل','Hail'),
  ('Northern Borders','عرعر','Arar'),('Jazan','جازان','Jazan'),('Najran','نجران','Najran'),
  ('Al-Baha','الباحة','Al-Baha'),('Al-Jawf','سكاكا','Sakaka')
)
insert into public.cities(region_id, name_ar, name_en)
select r.id, s.name_ar, s.name_en from city_seed s join public.regions r on r.name_en = s.region_en;

insert into public.cities(region_id, name_ar, name_en)
select id, 'أخرى', 'Other' from public.regions;
