begin;
select plan(7);
select has_table('public', 'companies', 'companies exists');
select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'login_attempts', 'login_attempts exists');
select has_table('public', 'audit_logs', 'audit_logs exists');
select has_function('public', 'jwt_company_id', array[]::text[], 'tenant helper exists');
select has_function('public', 'jwt_role', array[]::text[], 'role helper exists');
select has_function('public', 'custom_access_token_hook', array['jsonb'], 'claims hook exists');
select * from finish();
rollback;

