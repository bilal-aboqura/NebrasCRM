begin;
select plan(5);
select has_table('public', 'facilities', 'facilities table exists');
select has_table('public', 'facility_activity', 'facility activity exists');
select has_function('public', 'normalize_saudi_phone', 'phone normalization function exists');
select has_trigger('public', 'facilities', 'trg_facilities_before_write', 'facility write trigger exists');
select col_is_unique('public', 'facilities', array['company_id', 'primary_phone'], 'tenant phone uniqueness exists');
select * from finish();
rollback;
