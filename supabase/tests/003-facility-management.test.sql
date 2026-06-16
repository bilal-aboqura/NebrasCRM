-- T005: pgTAP tests for facility management RLS and triggers

BEGIN;
SELECT plan(10);

-- Tables exist
SELECT has_table('public', 'regions', 'regions table exists');
SELECT has_table('public', 'cities', 'cities table exists');
SELECT has_table('public', 'facilities', 'facilities table exists');
SELECT has_table('public', 'facility_activity', 'facility_activity table exists');

-- Phone normalization trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''tr_normalize_phone''',
  ARRAY[1::bigint],
  'phone normalization trigger exists'
);

-- Updated_at trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''tr_facilities_updated_at''',
  ARRAY[1::bigint],
  'updated_at trigger exists'
);

-- Facility activity trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''tr_facility_activity''',
  ARRAY[1::bigint],
  'facility activity trigger exists'
);

-- RLS enabled on facilities
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.facilities''::regclass',
  ARRAY[true],
  'RLS enabled on facilities'
);

-- RLS enabled on facility_activity
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.facility_activity''::regclass',
  ARRAY[true],
  'RLS enabled on facility_activity'
);

-- Regions seeded
SELECT results_eq(
  'SELECT count(*) FROM public.regions',
  ARRAY[13::bigint],
  '13 Saudi regions seeded'
);

SELECT * FROM finish();
ROLLBACK;
