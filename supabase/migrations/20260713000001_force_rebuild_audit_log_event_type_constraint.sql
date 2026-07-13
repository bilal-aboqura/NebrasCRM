-- `pg_constraint.conkey` is empty for some expression-based CHECK
-- constraints, so the previous reconciliation could miss this existing
-- constraint. Drop it by its known name before rebuilding it.
alter table public.audit_logs
  drop constraint if exists audit_logs_event_type_all;

alter table public.audit_logs
  drop constraint if exists audit_logs_event_type_check;

alter table public.audit_logs
  add constraint audit_logs_event_type_all check (
    event_type::text in (
      'login', 'logout', 'failed_login', 'company_switch',
      'company_create', 'company_update', 'user_invite',
      'profile_update', 'unauthorized_admin_attempt'
    )
  ) not valid;
