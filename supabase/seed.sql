insert into public.companies (id, name) values
  ('11111111-1111-4111-8111-111111111111', 'نبراس الجودة'),
  ('22222222-2222-4222-8222-222222222222', 'تقنية الارتقاء')
on conflict (id) do nothing;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'superadmin@nebrasgoo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"مدير النظام","role":"super_admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'admin_a@nebrasgoo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"مدير شركة أ","company_id":"11111111-1111-4111-8111-111111111111","role":"company_admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'supervisor_a@nebrasgoo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"مشرف شركة أ","company_id":"11111111-1111-4111-8111-111111111111","role":"supervisor"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'authenticated', 'authenticated', 'sales_a@nebrasgoo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"مبيعات شركة أ","company_id":"11111111-1111-4111-8111-111111111111","role":"sales_user"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'authenticated', 'authenticated', 'admin_b@nebrasgoo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"مدير شركة ب","company_id":"22222222-2222-4222-8222-222222222222","role":"company_admin"}', now(), now())
on conflict (id) do nothing;

-- GoTrue scans these legacy token fields as strings during password login.
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where email like '%@nebrasgoo.com';

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id, id, email, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where email like '%@nebrasgoo.com'
on conflict (provider_id, provider) do nothing;

update public.companies set status = 'active';
update public.profiles set status = 'active', display_name = full_name;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'authenticated', 'authenticated', 'sales_b@nebrasgoo.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"مبيعات شركة ب","company_id":"22222222-2222-4222-8222-222222222222","role":"sales_user"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'sales_b@nebrasgoo.com', '{"sub":"ffffffff-ffff-4fff-8fff-ffffffffffff","email":"sales_b@nebrasgoo.com"}', 'email', now(), now(), now())
on conflict (provider_id, provider) do nothing;
update public.profiles set status = 'active', display_name = full_name where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

insert into public.facilities (id, company_id, name_ar, type, region_id, city_id, primary_phone, primary_phone_normalized, lead_source, assigned_to, status, created_by)
select '30000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'مجمع الشفاء الطبي', 'medical_complex', r.id, c.id, '0501000001', '966501000001', 'manual', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'new', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
from public.regions r join public.cities c on c.region_id = r.id and c.name_en = 'Riyadh' where r.name_en = 'Riyadh'
on conflict (id) do nothing;
insert into public.facilities (id, company_id, name_ar, type, region_id, city_id, primary_phone, primary_phone_normalized, lead_source, assigned_to, status, created_by)
select '30000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'مركز نبراس الطبي', 'hospital', r.id, c.id, '0501000002', '966501000002', 'manual', null, 'contacted', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
from public.regions r join public.cities c on c.region_id = r.id and c.name_en = 'Riyadh' where r.name_en = 'Riyadh'
on conflict (id) do nothing;
insert into public.facilities (id, company_id, name_ar, type, region_id, city_id, primary_phone, primary_phone_normalized, lead_source, assigned_to, status, created_by)
select '30000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'مختبر الارتقاء', 'lab', r.id, c.id, '0501000003', '966501000003', 'manual', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'new', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
from public.regions r join public.cities c on c.region_id = r.id and c.name_en = 'Dammam' where r.name_en = 'Eastern Province'
on conflict (id) do nothing;

insert into public.contacts (id, company_id, facility_id, name_ar, job_title, primary_phone, primary_phone_normalized, email, is_primary, notes, created_by)
values
  ('40000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', 'أحمد الغامدي', 'مدير المشتريات', '0501234567', '966501234567', 'ahmed@example.com', true, 'يفضل التواصل بعد العصر', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('40000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', 'سارة العتيبي', 'مسؤولة الجودة', '0557654321', '966557654321', null, false, null, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('40000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000003', 'خالد الدوسري', 'مدير المختبر', '0530000003', '966530000003', null, true, null, 'ffffffff-ffff-4fff-8fff-ffffffffffff')
on conflict (id) do nothing;

insert into public.followups (
  id, company_id, facility_id, contact_id, assigned_to, type, due_at, status, notes, created_by
) values
  ('60000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'call', now() + interval '1 day', 'pending', 'متابعة طلب عرض السعر', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('60000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', null, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'visit', now() - interval '1 day', 'pending', 'زيارة المنشأة', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('60000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000003', null, 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'call', now() - interval '1 day', 'pending', 'متابعة شركة ب', 'ffffffff-ffff-4fff-8fff-ffffffffffff')
on conflict (id) do nothing;

insert into public.call_logs (
  id, company_id, facility_id, contact_id, created_by_id, channel, direction,
  occurred_at, outcome, duration_seconds, notes, created_at
) values
  ('70000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'call', 'outbound', now() - interval '2 hours', 'answered', 300, 'تمت مناقشة متطلبات المنشأة', now() - interval '2 hours'),
  ('70000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', null, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'whatsapp', 'outbound', now() - interval '3 days', 'callback_requested', null, 'طلب التواصل لاحقاً', now() - interval '3 days'),
  ('70000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'call', 'inbound', now() - interval '1 hour', 'answered', 120, 'اتصال تابع للشركة ب', now() - interval '1 hour')
on conflict (id) do nothing;

insert into public.offers (
  id, company_id, facility_id, contact_id, created_by, root_offer_id, parent_offer_id,
  title, status, discount_type, discount_value, tax_rate, valid_until, version, is_superseded, notes
) values
  ('80000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', null, null, 'خطة اعتماد سباهي - أولية', 'draft', 'fixed', 0, 15, current_date + 30, 1, false, 'يشمل العرض التقييم والتجهيز.'),
  ('80000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', null, null, 'برنامج التأهيل الشامل', 'draft', 'fixed', 0, 15, current_date + 21, 1, true, null),
  ('80000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '80000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000002', 'برنامج التأهيل الشامل', 'draft', 'fixed', 0, 15, current_date + 30, 2, false, 'نسخة تفاوضية محدثة.'),
  ('80000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', null, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', null, null, 'تقييم الفجوات', 'draft', 'fixed', 0, 15, current_date - 5, 1, false, null),
  ('80000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'ffffffff-ffff-4fff-8fff-ffffffffffff', null, null, 'تأهيل المختبر', 'draft', 'fixed', 0, 15, current_date + 30, 1, false, null)
on conflict (id) do nothing;

insert into public.offer_line_items(id, offer_id, description, amount, ordering) values
  ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 'تقييم فجوات الاعتماد', 10000, 0),
  ('81000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000001', 'إعداد السياسات والإجراءات', 15000, 1),
  ('81000000-0000-4000-8000-000000000003', '80000000-0000-4000-8000-000000000002', 'برنامج التأهيل الشامل', 30000, 0),
  ('81000000-0000-4000-8000-000000000004', '80000000-0000-4000-8000-000000000003', 'برنامج التأهيل الشامل - محدث', 32000, 0),
  ('81000000-0000-4000-8000-000000000005', '80000000-0000-4000-8000-000000000004', 'تقييم فجوات مختصر', 7000, 0),
  ('81000000-0000-4000-8000-000000000006', '80000000-0000-4000-8000-000000000005', 'تأهيل متطلبات المختبر', 18000, 0)
on conflict (id) do nothing;

update public.offers set discount_type = 'percentage', discount_value = 5 where id = '80000000-0000-4000-8000-000000000001' and status = 'draft';
update public.offers set discount_type = 'fixed', discount_value = 2500 where id = '80000000-0000-4000-8000-000000000002' and status = 'draft';
update public.offers set discount_type = 'fixed', discount_value = 3000 where id = '80000000-0000-4000-8000-000000000003' and status = 'draft';

update public.offers set status = 'sent', sent_at = coalesce(sent_at, now() - interval '2 days')
where id in ('80000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000004') and status = 'draft';
