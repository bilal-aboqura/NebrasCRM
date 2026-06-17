begin;
select plan(4);
select has_column('public', 'companies', 'status', 'companies expose status');
select has_column('public', 'profiles', 'status', 'profiles expose status');
select has_trigger('public', 'profiles', 'trg_prevent_last_admin_lockout', 'lockout trigger exists');
select has_table('public', 'audit_logs', 'audit log table exists');
select * from finish();
rollback;
