-- Public leads are created by the service role without an authenticated profile.
alter table public.facilities alter column region_id drop not null;
alter table public.facilities alter column city_id drop not null;
alter table public.facilities alter column created_by drop not null;
alter table public.facility_activity alter column actor_id drop not null;

create index if not exists idx_facilities_phone_global_lookup
  on public.facilities(primary_phone_normalized, is_active desc);
