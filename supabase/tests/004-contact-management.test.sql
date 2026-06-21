begin;
select plan(19);

select has_table('public', 'contacts', 'contacts table exists');
select has_column('public', 'contacts', 'company_id', 'contact carries tenant id');
select has_column('public', 'contacts', 'facility_id', 'contact belongs to a facility');
select has_column('public', 'contacts', 'is_primary', 'primary flag exists');
select has_column('public', 'contacts', 'is_archived', 'archive flag exists');
select has_index('public', 'contacts', 'contacts_facility_primary_idx', 'single-primary partial index exists');
select has_function('public', 'create_contact_atomic', array['uuid','uuid','uuid','jsonb'], 'atomic create RPC exists');
select has_function('public', 'update_contact_atomic', array['uuid','uuid','uuid','jsonb'], 'atomic update RPC exists');
select has_function('public', 'archive_contact_atomic', array['uuid','uuid','uuid'], 'atomic archive RPC exists');
select has_function('public', 'recover_contact_atomic', array['uuid','uuid','uuid'], 'atomic recovery RPC exists');

select lives_ok($$
  select public.create_contact_atomic(
    '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '{"name_ar":"أحمد الغامدي","job_title":"مدير المشتريات","primary_phone":"0501234567","is_primary":true}'::jsonb
  )
$$, 'Sales User can add a contact to an assigned active facility');

select lives_ok($$
  select public.create_contact_atomic(
    '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '{"name_ar":"سارة علي","job_title":"مسؤولة الجودة","primary_phone":"0507654321","is_primary":true}'::jsonb
  )
$$, 'setting a new primary atomically clears the old primary');

select is((select count(*)::integer from public.contacts where facility_id = '30000000-0000-4000-8000-000000000001' and is_primary and not is_archived), 1, 'facility has exactly one active primary');
select is((select count(*)::integer from public.facility_activity where facility_id = '30000000-0000-4000-8000-000000000001' and event_type = 'contact_added'), 2, 'contact creation is logged');

select throws_ok($$
  select public.create_contact_atomic(
    '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000001',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '{"name_ar":"اختبار","job_title":"مدير","primary_phone":"0500000000"}'::jsonb
  )
$$, '42501', 'contact access denied', 'cross-tenant contact creation is denied');

select lives_ok($$
  select public.archive_contact_atomic(
    '11111111-1111-4111-8111-111111111111',
    (select id from public.contacts where name_ar = 'سارة علي'),
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  )
$$, 'contact archival succeeds on an assigned facility');
select is((select count(*)::integer from public.contacts where name_ar = 'سارة علي' and is_archived and not is_primary), 1, 'archival clears primary status');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated","user_role":"sales_user","company_id":"11111111-1111-4111-8111-111111111111"}', true);
select is((select count(*)::integer from public.contacts where is_archived), 0, 'Sales Users cannot view archived contacts');
select throws_ok($$delete from public.contacts where name_ar = 'أحمد الغامدي'$$, '42501', null, 'hard deletion is denied');

select * from finish();
rollback;
