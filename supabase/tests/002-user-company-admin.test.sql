-- T006, T009, T012, T021: pgTAP tests for companies, profiles RLS, lockout, audit

BEGIN;
SELECT plan(12);

-- T006: Companies RLS policies
SELECT policies_are(
  'public', 'companies',
  ARRAY['companies_select_policy', 'companies_insert_policy', 'companies_update_policy', 'companies_delete_policy'],
  'companies has correct policies'
);

SELECT results_eq(
  'SELECT count(*) FROM pg_policies WHERE schemaname = ''public'' AND tablename = ''companies'' AND cmd = ''INSERT''',
  ARRAY[1::bigint],
  'companies has INSERT policy'
);

SELECT results_eq(
  'SELECT count(*) FROM pg_policies WHERE schemaname = ''public'' AND tablename = ''companies'' AND cmd = ''UPDATE''',
  ARRAY[1::bigint],
  'companies has UPDATE policy'
);

-- T009: Profiles RLS policies
SELECT policies_are(
  'public', 'profiles',
  ARRAY['profiles_select_policy', 'profiles_insert_policy', 'profiles_update_policy'],
  'profiles has correct policies'
);

-- T009: Lockout prevention trigger exists
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''tr_prevent_super_admin_lockout''',
  ARRAY[1::bigint],
  'lockout prevention trigger exists'
);

-- T012: Company Admin RLS boundaries (verify permissive policies exist)
SELECT results_eq(
  'SELECT count(*) FROM pg_policies WHERE schemaname = ''public'' AND tablename = ''profiles'' AND cmd = ''SELECT'' AND qual IS NOT NULL',
  ARRAY[1::bigint],
  'profiles has SELECT policy with qualifier'
);

-- T021: Audit triggers exist
SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''audit_profiles_update''',
  ARRAY[1::bigint],
  'audit_profiles_update trigger exists'
);

SELECT results_eq(
  'SELECT count(*) FROM pg_trigger WHERE tgname = ''audit_companies_update''',
  ARRAY[1::bigint],
  'audit_companies_update trigger exists'
);

-- Verify audit_logs has details column
SELECT results_eq(
  'SELECT data_type FROM information_schema.columns WHERE table_name = ''audit_logs'' AND column_name = ''details''',
  ARRAY['jsonb'::text],
  'audit_logs.details column is jsonb'
);

-- Verify companies has new columns
SELECT results_eq(
  'SELECT count(*) FROM information_schema.columns WHERE table_name = ''companies'' AND column_name IN (''status'', ''contact_email'', ''contact_phone'', ''updated_at'')',
  ARRAY[4::bigint],
  'companies has status, contact_email, contact_phone, updated_at columns'
);

-- Verify profiles has new columns
SELECT results_eq(
  'SELECT count(*) FROM information_schema.columns WHERE table_name = ''profiles'' AND column_name IN (''display_name'', ''status'', ''updated_at'')',
  ARRAY[3::bigint],
  'profiles has display_name, status, updated_at columns'
);

-- Verify status check constraints
SELECT results_eq(
  'SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = ''public.companies''::regclass AND conname LIKE ''%status%''',
  ARRAY['CHECK ((status = ANY (ARRAY[''active''::text, ''inactive''::text])))'::text],
  'companies status CHECK constraint exists'
);

SELECT * FROM finish();
ROLLBACK;
