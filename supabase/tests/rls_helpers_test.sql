-- T010: Base database pgTAP configuration tests

BEGIN;
SELECT plan(3);

-- Test: companies table exists
SELECT has_table('public', 'companies', 'companies table exists');

-- Test: profiles table exists
SELECT has_table('public', 'profiles', 'profiles table exists');

-- Test: get_active_company_id function exists
SELECT has_function('public', 'get_active_company_id', 'get_active_company_id function exists');

SELECT * FROM finish();
ROLLBACK;
