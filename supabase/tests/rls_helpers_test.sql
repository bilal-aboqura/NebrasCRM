begin;
select plan(3);
select has_function('public', 'current_app_role', 'current_app_role helper exists');
select has_function('public', 'current_company_id', 'current_company_id helper exists');
select has_function('public', 'is_super_admin', 'is_super_admin helper exists');
select * from finish();
rollback;
