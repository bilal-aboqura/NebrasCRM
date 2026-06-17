begin;
select plan(4);
select has_table('public', 'contacts', 'contacts table exists');
select has_column('public', 'contacts', 'is_primary', 'primary contact flag exists');
select has_index('public', 'contacts', 'contacts_one_primary_per_facility', 'one primary index exists');
select has_trigger('public', 'contacts', 'trg_contacts_before_write', 'contact normalization trigger exists');
select * from finish();
rollback;
