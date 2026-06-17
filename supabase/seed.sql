insert into public.companies (id, name, status, city) values
  ('00000000-0000-0000-0000-0000000000a1', 'Nebras Quality', 'active', 'Riyadh'),
  ('00000000-0000-0000-0000-0000000000b1', 'Ertiqaa Tech', 'active', 'Jeddah')
on conflict (id) do nothing;

insert into public.profiles (id, company_id, email, display_name, role, status) values
  ('00000000-0000-0000-0000-000000000001', null, 'super@nebras.local', 'Super Admin', 'super_admin', 'active'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'admin@nebras.local', 'Company Admin', 'company_admin', 'active'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'supervisor@nebras.local', 'Sales Supervisor', 'supervisor', 'active'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', 'sales@nebras.local', 'Sales User', 'sales_user', 'active'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000b1', 'sales-b@nebras.local', 'Jeddah Sales User', 'sales_user', 'active')
on conflict (id) do nothing;
