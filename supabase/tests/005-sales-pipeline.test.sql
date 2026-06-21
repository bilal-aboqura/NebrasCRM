begin;
select plan(18);

select has_type('public', 'lost_reason_type', 'lost reason enum exists');
select has_column('public', 'facilities', 'lost_reason', 'facilities have a lost reason');
select has_column('public', 'facilities', 'status_changed_at', 'facilities track status changes');
select col_not_null('public', 'facilities', 'status_changed_at', 'status change timestamp is required');
select has_index('public', 'facilities', 'idx_facilities_pipeline', 'pipeline lookup index exists');
select has_trigger('public', 'facilities', 'set_facility_status_changed_at', 'status timestamp trigger exists');
select has_function(
  'public',
  'transition_facility_status',
  array['uuid', 'uuid', 'uuid', 'facility_status', 'facility_status', 'lost_reason_type'],
  'atomic transition function exists'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated","user_role":"sales_user","company_id":"11111111-1111-4111-8111-111111111111"}', true);
select is(
  (select count(*)::integer from public.facilities where company_id = '22222222-2222-4222-8222-222222222222'),
  0,
  'pipeline reads cannot cross tenant boundaries'
);
select is(
  (select count(*)::integer from public.facilities where assigned_to <> auth.uid() or assigned_to is null),
  0,
  'Sales Users only see assigned pipeline cards'
);
select is(
  (select count(*)::integer from public.facilities where not is_active),
  0,
  'archived facilities are absent from a Sales User pipeline'
);
select is(
  (with moved as (
    update public.facilities set status = 'interested'
     where id = '30000000-0000-4000-8000-000000000002'
    returning id
  ) select count(*)::integer from moved),
  0,
  'Sales Users cannot update unowned facilities'
);
reset role;
select set_config('request.jwt.claims', '', true);

update public.facilities
   set status_changed_at = '2000-01-01 00:00:00+00', status = 'contacted'
 where id = '30000000-0000-4000-8000-000000000001';
select isnt(
  (select status_changed_at from public.facilities where id = '30000000-0000-4000-8000-000000000001'),
  '2000-01-01 00:00:00+00'::timestamptz,
  'changing status refreshes status_changed_at'
);

select lives_ok(
  $$select * from public.transition_facility_status(
    '30000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'contacted', 'interested', null
  )$$,
  'an owned in-tenant facility can transition'
);
select is(
  (select status from public.facilities where id = '30000000-0000-4000-8000-000000000001'),
  'interested'::public.facility_status,
  'transition persists the new status'
);
select is(
  (select count(*)::integer from public.facility_activity
    where facility_id = '30000000-0000-4000-8000-000000000001'
      and event_type = 'status_change'
      and old_value = 'contacted'
      and new_value = 'interested'),
  1,
  'transition writes one matching activity event'
);
select throws_ok(
  $$select * from public.transition_facility_status(
    '30000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'contacted', 'offer', null
  )$$,
  '40001',
  'facility status changed concurrently',
  'stale transitions are rejected'
);
select throws_ok(
  $$select * from public.transition_facility_status(
    '30000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'interested', 'lost', null
  )$$,
  '22023',
  'lost reason is required',
  'lost transitions require a reason'
);
select throws_ok(
  $$select * from public.transition_facility_status(
    '30000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'new', 'contacted', null
  )$$,
  'P0002',
  'facility not found or archived',
  'transition cannot cross tenant boundaries'
);

select * from finish();
rollback;
