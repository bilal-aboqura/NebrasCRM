-- T006: pgTAP tests for followup RLS, constraints, triggers

BEGIN;
SELECT plan(9);

-- Table exists
SELECT has_table('public', 'followups', 'followups table exists');

-- Enums exist
SELECT results_eq(
  'SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''followup_type'')',
  ARRAY[true::boolean],
  'followup_type enum exists'
);

SELECT results_eq(
  'SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''followup_status'')',
  ARRAY[true::boolean],
  'followup_status enum exists'
);

SELECT results_eq(
  'SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''followup_outcome'')',
  ARRAY[true::boolean],
  'followup_outcome enum exists'
);

-- RLS enabled
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.followups''::regclass',
  ARRAY[true::boolean],
  'RLS enabled on followups'
);

-- Contact composite FK exists
SELECT results_eq(
  'SELECT count(*) FROM pg_constraint WHERE conname = ''fk_followups_facility_contact''',
  ARRAY[1::bigint],
  'fk_followups_facility_contact foreign key exists'
);

-- Updated at trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''trg_followups_updated_at''',
  ARRAY[1::bigint],
  'trg_followups_updated_at trigger exists'
);

-- Facility owner cascade trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''trg_facility_owner_cascade''',
  ARRAY[1::bigint],
  'trg_facility_owner_cascade trigger exists'
);

-- RLS policies
SELECT policies_are(
  'public', 'followups',
  ARRAY['followups_select_policy', 'followups_insert_policy', 'followups_update_policy', 'followups_delete_policy'],
  'followups has correct policies'
);

SELECT * FROM finish();
ROLLBACK;
