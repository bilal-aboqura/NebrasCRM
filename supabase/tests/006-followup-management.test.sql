begin;
select plan(5);
select has_table('public', 'followups', 'followups table exists');
select has_column('public', 'followups', 'due_at', 'due date exists');
select has_index('public', 'followups', 'followups_one_pending_per_facility_type', 'pending uniqueness exists');
select has_trigger('public', 'followups', 'trg_followups_updated_at', 'updated_at trigger exists');
select has_trigger('public', 'facilities', 'trg_facility_owner_cascade', 'owner cascade trigger exists');
select * from finish();
rollback;
