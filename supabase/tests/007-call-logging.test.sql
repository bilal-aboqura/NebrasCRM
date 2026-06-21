begin;
select plan(16);

select has_table('public', 'call_logs', 'call_logs table exists');
select has_type('public', 'communication_channel', 'communication channel enum exists');
select has_type('public', 'communication_direction', 'communication direction enum exists');
select has_type('public', 'communication_outcome', 'communication outcome enum exists');
select has_index('public', 'call_logs', 'idx_call_logs_facility_active_occurred', 'active facility history index exists');
select has_trigger('public', 'call_logs', 'trg_validate_call_log', 'scope validation trigger exists');
select has_trigger('public', 'call_logs', 'trg_check_call_log_edit_window', 'edit window trigger exists');
select col_is_fk('public', 'call_logs', 'company_id', 'company foreign key exists');
select col_is_fk('public', 'call_logs', 'facility_id', 'facility foreign key exists');

set local role authenticated;
select throws_ok(
  $$delete from public.call_logs where id = gen_random_uuid()$$,
  '42501', null, 'authenticated users cannot hard-delete call logs'
);
select set_config('request.jwt.claims', '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated","user_role":"sales_user","company_id":"11111111-1111-4111-8111-111111111111"}', true);
select is((select count(*)::integer from public.call_logs where company_id = '22222222-2222-4222-8222-222222222222'), 0, 'other tenant logs are invisible');
reset role;

select throws_ok(
  $$insert into public.call_logs(company_id, facility_id, contact_id, created_by_id, channel, direction, outcome)
    values ('11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000003', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'call', 'outbound', 'answered')$$,
  '23503', null, 'contact must belong to the same facility'
);
select throws_ok(
  $$insert into public.call_logs(company_id, facility_id, created_by_id, channel, direction, occurred_at, outcome)
    values ('11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'call', 'outbound', now() + interval '1 day', 'answered')$$,
  '23514', null, 'future communications are blocked'
);
select throws_ok(
  $$insert into public.call_logs(company_id, facility_id, followup_id, created_by_id, channel, direction, outcome)
    values ('11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000003', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'call', 'outbound', 'answered')$$,
  '23503', null, 'followup must belong to the same facility and tenant'
);
select throws_ok(
  $$update public.call_logs set notes = 'late edit', last_edited_by_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    where id = '70000000-0000-4000-8000-000000000002'$$,
  '23514', null, 'creator edits are blocked after 24 hours'
);
select lives_ok(
  $$select public.archive_call_log_atomic('11111111-1111-4111-8111-111111111111',
    '70000000-0000-4000-8000-000000000002', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')$$,
  'managers can archive old call logs'
);

select * from finish();
rollback;
