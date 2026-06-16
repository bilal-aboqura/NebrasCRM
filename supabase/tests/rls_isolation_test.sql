-- T017: pgTAP RLS tests for data isolation policies

BEGIN;
SELECT plan(6);

-- Test: RLS is enabled on companies
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.companies''::regclass',
  ARRAY[true],
  'RLS is enabled on companies'
);

-- Test: RLS is enabled on profiles
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.profiles''::regclass',
  ARRAY[true],
  'RLS is enabled on profiles'
);

-- Test: RLS is enabled on login_attempts
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.login_attempts''::regclass',
  ARRAY[true],
  'RLS is enabled on login_attempts'
);

-- Test: RLS is enabled on audit_logs
SELECT results_eq(
  'SELECT relrowsecurity FROM pg_class WHERE oid = ''public.audit_logs''::regclass',
  ARRAY[true],
  'RLS is enabled on audit_logs'
);

-- Test: companies has SELECT policy
SELECT policies_are(
  'public', 'companies',
  ARRAY['companies_select_policy', 'companies_insert_policy', 'companies_update_policy', 'companies_delete_policy'],
  'companies has correct policies'
);

-- Test: profiles has SELECT policy
SELECT policies_are(
  'public', 'profiles',
  ARRAY['profiles_select_policy'],
  'profiles has correct policies'
);

SELECT * FROM finish();
ROLLBACK;
