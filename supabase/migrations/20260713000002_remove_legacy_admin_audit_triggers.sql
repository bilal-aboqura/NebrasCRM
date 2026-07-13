-- `audit_resource_changes` writes legacy event names such as
-- `profiles_update` and `companies_update`. The supported admin audit trigger
-- is `audit_admin_resource_change`, which writes `profile_update` and
-- `company_update` instead. Running both triggers rejects otherwise valid
-- profile/company changes under the audit event constraint.
drop trigger if exists audit_profiles_update on public.profiles;
drop trigger if exists audit_companies_update on public.companies;
