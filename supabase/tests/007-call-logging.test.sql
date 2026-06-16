-- T006: pgTAP tests for call logging RLS, constraints, triggers

BEGIN;
SELECT plan(9);

-- Table exists
SELECT has_table('public', 'call_logs', 'call_logs table exists');

-- Enums exist
SELECT results_eq(
  'SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''communication_channel'')',
  ARRAY[true::boolean],
  'communication_channel enum exists'
);

SELECT results_eq(
  'SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''communication_direction'')',
  ARRAY[true::boolean],
  'communication_direction enum exists'
);

SELECT results_eq(
  'SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''communication_outcome'')',
  ARRAY[true::boolean],
  'communication_outcome enum exists'
);

-- RLS enabled
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.call_logs''::regclass',
  ARRAY[true::boolean],
  'RLS enabled on call_logs'
);

-- Validation trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''trg_validate_call_log''',
  ARRAY[1::bigint],
  'trg_validate_call_log trigger exists'
);

-- Edit window trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''trg_call_log_edit_window''',
  ARRAY[1::bigint],
  'trg_call_log_edit_window trigger exists'
);

-- Updated at trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''trg_call_logs_updated_at''',
  ARRAY[1::bigint],
  'trg_call_logs_updated_at trigger exists'
);

-- RLS policies
SELECT policies_are(
  'public', 'call_logs',
  ARRAY['call_logs_select_policy', 'call_logs_insert_policy', 'call_logs_update_policy', 'call_logs_delete_policy'],
  'call_logs has correct policies'
);

SELECT * FROM finish();
ROLLBACK;
