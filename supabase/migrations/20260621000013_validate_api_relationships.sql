-- Reconcile legacy cloud columns (`owner_id`) with the current application
-- schema, then expose validated foreign keys to PostgREST.

alter table public.offers
  add column if not exists created_by uuid,
  add column if not exists archived_by uuid,
  add column if not exists updated_at timestamptz not null default now();

update public.offers
set created_by = owner_id
where created_by is null and owner_id is not null;

alter table public.contracts
  add column if not exists contact_id uuid,
  add column if not exists created_by uuid,
  add column if not exists payment_terms text,
  add column if not exists terminated_at date,
  add column if not exists terminated_reason text,
  add column if not exists archived_by uuid,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

update public.contracts
set created_by = owner_id
where created_by is null and owner_id is not null;

update public.contracts
set terminated_reason = termination_reason
where terminated_reason is null and termination_reason is not null;

alter table public.offers drop constraint if exists offers_created_by_fkey;
alter table public.offers drop constraint if exists offers_contact_id_fkey;
alter table public.contracts drop constraint if exists contracts_created_by_fkey;
alter table public.contracts drop constraint if exists contracts_contact_id_fkey;

alter table public.offers
  add constraint offers_created_by_fkey foreign key (created_by) references public.profiles(id) not valid,
  add constraint offers_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete set null not valid;

alter table public.contracts
  add constraint contracts_created_by_fkey foreign key (created_by) references public.profiles(id) not valid,
  add constraint contracts_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete set null not valid;

alter table public.offers validate constraint offers_created_by_fkey;
alter table public.offers validate constraint offers_contact_id_fkey;
alter table public.contracts validate constraint contracts_created_by_fkey;
alter table public.contracts validate constraint contracts_contact_id_fkey;

notify pgrst, 'reload schema';
