-- T003 / T008: pgTAP tests for contacts RLS and constraints

BEGIN;
SELECT plan(7);

-- Table exists
SELECT has_table('public', 'contacts', 'contacts table exists');

-- RLS enabled
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.contacts''::regclass',
  ARRAY[true],
  'RLS enabled on contacts'
);

-- Partial unique index exists
SELECT results_eq(
  'SELECT count(*) FROM pg_indexes WHERE indexname = ''contacts_facility_primary_idx''',
  ARRAY[1::bigint],
  'contacts_facility_primary_idx partial unique index exists'
);

-- Indexes exist
SELECT results_eq(
  'SELECT count(*) FROM pg_indexes WHERE indexname = ''idx_contacts_company_id''',
  ARRAY[1::bigint],
  'idx_contacts_company_id exists'
);

SELECT results_eq(
  'SELECT count(*) FROM pg_indexes WHERE indexname = ''idx_contacts_facility_id''',
  ARRAY[1::bigint],
  'idx_contacts_facility_id exists'
);

-- Updated at trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''update_contacts_updated_at''',
  ARRAY[1::bigint],
  'update_contacts_updated_at trigger exists'
);

-- RLS policies
SELECT policies_are(
  'public', 'contacts',
  ARRAY['contacts_select_policy', 'contacts_insert_policy', 'contacts_update_policy', 'contacts_delete_policy'],
  'contacts has correct policies'
);

SELECT * FROM finish();
ROLLBACK;
