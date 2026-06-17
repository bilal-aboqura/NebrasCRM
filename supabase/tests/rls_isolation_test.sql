begin;
select plan(2);
select has_table('public', 'companies', 'companies table exists');
select has_table('public', 'profiles', 'profiles table exists');
select * from finish();
rollback;
