begin;
select plan(15);

select has_table('public', 'followups', 'followups table exists');
select has_type('public', 'followup_type', 'followup type enum exists');
select has_type('public', 'followup_status', 'followup status enum exists');
select has_type('public', 'followup_outcome', 'followup outcome enum exists');
select has_index('public', 'followups', 'idx_followups_status_due_at', 'status and due date index exists');
select has_trigger('public', 'followups', 'trg_followups_updated_at', 'updated-at trigger exists');
select has_trigger('public', 'facilities', 'trg_facility_owner_cascade', 'facility owner cascade trigger exists');
select col_is_fk('public', 'followups', 'company_id', 'company foreign key exists');
select col_is_fk('public', 'followups', 'facility_id', 'facility foreign key exists');
set local role authenticated;
select throws_ok(
  $$delete from public.followups where id = '60000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'authenticated users cannot hard-delete followups'
);
select set_config('request.jwt.claims', '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated","user_role":"sales_user","company_id":"11111111-1111-4111-8111-111111111111"}', true);
select is(
  (select count(*)::integer from public.followups where company_id = '22222222-2222-4222-8222-222222222222'),
  0, 'other tenant followups are invisible'
);
select is(
  (select count(*)::integer from public.followups where assigned_to <> auth.uid()),
  0, 'sales users only see their accessible followups'
);
reset role;
select set_config('request.jwt.claims', '', true);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', 'abababab-abab-4bab-8bab-abababababab',
  'authenticated', 'authenticated', 'followup-owner@example.com', crypt('password123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"مالك متابعة","company_id":"11111111-1111-4111-8111-111111111111","role":"sales_user"}',
  now(), now()
);
update public.profiles set status = 'active', display_name = 'مالك متابعة'
  where id = 'abababab-abab-4bab-8bab-abababababab';
update public.facilities set assigned_to = 'abababab-abab-4bab-8bab-abababababab'
  where id = '30000000-0000-4000-8000-000000000001';
select is(
  (select assigned_to from public.followups where id = '60000000-0000-4000-8000-000000000001'),
  'abababab-abab-4bab-8bab-abababababab'::uuid,
  'pending followups cascade to the new facility owner'
);
select is(
  (select assigned_to from public.followups where id = '60000000-0000-4000-8000-000000000002'),
  'abababab-abab-4bab-8bab-abababababab'::uuid,
  'all matching pending followups cascade'
);
select throws_ok(
  $$insert into public.followups (company_id, facility_id, contact_id, assigned_to, type, due_at, created_by)
    values ('11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000003', 'abababab-abab-4bab-8bab-abababababab', 'call', now() + interval '1 day',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc')$$,
  '23503', null, 'contact must belong to the same facility'
);

select * from finish();
rollback;
