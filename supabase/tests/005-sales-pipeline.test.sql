begin;
select plan(3);
select has_column('public', 'facilities', 'lost_reason', 'lost reason is stored');
select has_column('public', 'facilities', 'status_changed_at', 'status timestamp is stored');
select has_trigger('public', 'facilities', 'trg_log_facility_status_change', 'status log trigger exists');
select * from finish();
rollback;
