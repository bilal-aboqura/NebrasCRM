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
