begin;
select plan(28);

select has_type('public', 'offer_status', 'offer_status enum exists');
select has_type('public', 'discount_type', 'discount_type enum exists');
select has_table('public', 'offers', 'offers table exists');
select has_table('public', 'offer_line_items', 'offer_line_items table exists');
select col_is_pk('public', 'offers', 'id', 'offers uses id primary key');
select col_is_fk('public', 'offers', 'company_id', 'offers company is referenced');
select col_is_fk('public', 'offers', 'facility_id', 'offers facility is referenced');
select col_is_fk('public', 'offers', 'contact_id', 'offers contact is referenced');
select col_is_fk('public', 'offer_line_items', 'offer_id', 'line items reference offers');
select has_index('public', 'offers', 'idx_offers_company_id', 'company index exists');
select has_index('public', 'offers', 'idx_offers_facility_id', 'facility index exists');
select has_trigger('public', 'offers', 'trg_calculate_offer_totals', 'totals trigger exists');
select has_trigger('public', 'offers', 'trg_validate_offer_and_immutability', 'immutability trigger exists');
select has_trigger('public', 'offer_line_items', 'trg_update_offer_subtotal', 'subtotal trigger exists');
select has_trigger('public', 'offer_line_items', 'trg_guard_offer_line_items', 'line item immutability trigger exists');
select has_function('public', 'create_offer_atomic', array['uuid','uuid','uuid','jsonb'], 'atomic create function exists');
select has_function('public', 'revise_offer_atomic', array['uuid','uuid','uuid'], 'atomic revision function exists');
select has_function('public', 'decide_offer_atomic', array['uuid','uuid','uuid','offer_status','text'], 'atomic decision function exists');
select is((select relrowsecurity from pg_class where oid = 'public.offers'::regclass), true, 'offers RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.offer_line_items'::regclass), true, 'line item RLS enabled');

select is((select subtotal from public.offers where id = '80000000-0000-4000-8000-000000000001'), 25000.00::numeric, 'subtotal is synchronized from line items');
select is((select discount_amount from public.offers where id = '80000000-0000-4000-8000-000000000001'), 1250.00::numeric, 'percentage discount is calculated server-side');
select is((select tax_amount from public.offers where id = '80000000-0000-4000-8000-000000000001'), 3562.50::numeric, 'VAT is calculated after discount');
select is((select grand_total from public.offers where id = '80000000-0000-4000-8000-000000000001'), 27312.50::numeric, 'grand total is calculated server-side');
select throws_ok(
  $$update public.offers set title = 'tampered' where id = '80000000-0000-4000-8000-000000000002'$$,
  '23514', null, 'sent offer metadata is immutable'
);
select throws_ok(
  $$insert into public.offer_line_items(offer_id, description, amount) values ('80000000-0000-4000-8000-000000000002', 'tampered item', 1)$$,
  '23514', null, 'sent offer line items are immutable'
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated","user_role":"sales_user","company_id":"11111111-1111-4111-8111-111111111111"}', true);
select is((select count(*)::integer from public.offers where company_id = '22222222-2222-4222-8222-222222222222'), 0, 'other tenant offers are invisible');
select throws_ok($$delete from public.offers where id = gen_random_uuid()$$, '42501', null, 'hard deletion is denied');
reset role;

select * from finish();
rollback;
