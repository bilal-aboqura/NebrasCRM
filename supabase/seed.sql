-- T004: Pre-seeded tenant data with status fields

INSERT INTO public.companies (id, name, status, contact_email, contact_phone) VALUES
  ('c1f7b8a9-4567-48f8-b88a-d9be64ad931a', 'نبراس الجودة', 'active', 'info@nebras.com', '+966500000001'),
  ('c2f8b8a9-4567-48f8-b88a-d9be64ad931b', 'تقنية الارتقاء', 'active', 'info@tqnia.com', '+966500000002')
ON CONFLICT (id) DO NOTHING;

-- Note: Auth users must be created via Supabase Auth API or dashboard.
-- The trigger on_auth_user_created will create profiles automatically.
-- For manual seeding of test accounts, use the Supabase Auth admin API.
-- Example: supabase.auth.admin.createUser({ email, password, email_confirm: true })
