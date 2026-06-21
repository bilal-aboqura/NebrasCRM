begin;
select plan(20);

select has_type('public','contract_status','contract status enum exists');
select has_table('public','contracts','contracts table exists');
select has_table('public','contract_sequence_counters','sequence table exists');
select has_column('public','contracts','reference_number','reference is stored');
select col_is_unique('public','contracts','offer_id','accepted offer can create one contract');
select has_trigger('public','contracts','trg_generate_contract_reference_number','reference trigger exists');
select has_trigger('public','contracts','trg_validate_contract_rules_and_immutability','immutability trigger exists');
select policies_are('public','contracts',array['contracts_insert','contracts_select','contracts_update'],'contracts expose no delete policy');
select is((select public from storage.buckets where id='contracts'),false,'contracts bucket is private');
select is((select file_size_limit from storage.buckets where id='contracts'),10485760::bigint,'bucket limit is 10 MB');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='contract_documents_select'),'storage read policy exists');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='contract_documents_insert'),'storage upload policy exists');
select ok(not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and cmd='DELETE' and policyname like 'contract_documents%'),'storage delete is denied');
select function_returns('public','create_contract_atomic',array['uuid','uuid','jsonb'],'contracts','atomic creator returns a contract');

insert into public.contracts(id,company_id,facility_id,created_by,title,value,start_date,end_date,status,document_path)
values
  ('90000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000001','dddddddd-dddd-4ddd-8ddd-dddddddddddd','عقد نشط للاختبار',1000,current_date-10,current_date+90,'active','company_11111111-1111-4111-8111-111111111111/contracts/90000000-0000-4000-8000-000000000001/signed.pdf'),
  ('90000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000001','dddddddd-dddd-4ddd-8ddd-dddddddddddd','مسودة ثانية',2000,current_date,current_date+120,'draft',null),
  ('90000000-0000-4000-8000-000000000003','22222222-2222-4222-8222-222222222222','30000000-0000-4000-8000-000000000003','ffffffff-ffff-4fff-8fff-ffffffffffff','عقد مستأجر آخر',3000,current_date,current_date+120,'draft',null);

select matches((select reference_number from public.contracts where id='90000000-0000-4000-8000-000000000001'),'^CON-[0-9]{4}-[0-9]{4}$','reference follows CON-YYYY-XXXX');
select isnt((select reference_number from public.contracts where id='90000000-0000-4000-8000-000000000001'),(select reference_number from public.contracts where id='90000000-0000-4000-8000-000000000002'),'same-tenant references are unique under the counter');
select throws_ok($$update public.contracts set value=9999 where id='90000000-0000-4000-8000-000000000001'$$,'23514',null,'active financial fields are immutable');
select throws_ok($$insert into public.contracts(company_id,facility_id,created_by,title,value,start_date,end_date) values('11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000001','dddddddd-dddd-4ddd-8ddd-dddddddddddd','تواريخ خاطئة',100,current_date,current_date)$$,'23514',null,'invalid date boundaries are rejected');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated","user_role":"sales_user","company_id":"11111111-1111-4111-8111-111111111111"}',true);
select is((select count(*)::integer from public.contracts where company_id='22222222-2222-4222-8222-222222222222'),0,'other tenant contracts are invisible');
select throws_ok($$delete from public.contracts where id=gen_random_uuid()$$,'42501',null,'hard contract deletion is denied');
reset role;

select * from finish();
rollback;
