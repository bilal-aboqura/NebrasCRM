begin;
select plan(14);

select has_column('public', 'companies', 'status', 'company status exists');
select has_column('public', 'profiles', 'status', 'profile status exists');
select has_column('public', 'audit_logs', 'details', 'audit details exists');
select has_table('public', 'user_invitations', 'invitation store exists');
select has_function('public', 'revoke_user_sessions', array['uuid'], 'session revocation exists');

select throws_ok(
  $$update public.profiles set status = 'inactive' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '23514', 'يجب أن يكون هناك مشرف عام نشط واحد على الأقل في النظام',
  'last active Super Admin cannot be deactivated'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated","user_role":"company_admin","company_id":"11111111-1111-4111-8111-111111111111"}', true);
select is((select count(*)::integer from public.profiles), 3, 'company admin sees only own tenant');
select is((select count(*)::integer from public.profiles where company_id = '22222222-2222-4222-8222-222222222222'), 0, 'other tenant users are hidden');
select throws_ok(
  $$update public.profiles set role = 'super_admin' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,
  '42501', null, 'company admin cannot assign super admin'
);
select is((select count(*)::integer from public.companies), 1, 'company admin sees one company');

reset role;
select set_config('request.jwt.claims', '', true);
update public.companies set contact_email = 'audit@example.com' where id = '11111111-1111-4111-8111-111111111111';
select ok((select details ? 'contact_email' from public.audit_logs where event_type = 'company_update' order by timestamp desc limit 1), 'company update records field diff');
update public.profiles set display_name = 'Updated Admin' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select ok((select details ? 'display_name' from public.audit_logs where event_type = 'profile_update' order by timestamp desc limit 1), 'profile update records field diff');
select is((select status from public.companies where id = '11111111-1111-4111-8111-111111111111'), 'active', 'company remains active');
select is((select count(*)::integer from public.profiles where role = 'super_admin' and status = 'active'), 1, 'one active super admin remains');

select * from finish();
rollback;

