-- Rebuild the audit event constraint instead of preserving an existing one.
--
-- Some deployed projects already have `audit_logs_event_type_all` with an
-- older, restrictive definition. The earlier reconciliation migration kept
-- that constraint by name, which means profile/user administration events can
-- still be rejected even though the application supports them.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid
      and att.attnum = any(con.conkey)
    where nsp.nspname = 'public'
      and rel.relname = 'audit_logs'
      and con.contype = 'c'
      and att.attname = 'event_type'
  loop
    execute format('alter table public.audit_logs drop constraint %I', constraint_name);
  end loop;
end;
$$;

-- Only text-backed installations need a CHECK constraint. Enum-backed
-- installations are governed by public.audit_event.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'audit_logs'
      and column_name = 'event_type'
      and data_type <> 'USER-DEFINED'
  ) then
    alter table public.audit_logs
      add constraint audit_logs_event_type_all check (
        event_type in (
          'login', 'logout', 'failed_login', 'company_switch',
          'company_create', 'company_update', 'user_invite',
          'profile_update', 'unauthorized_admin_attempt'
        )
      ) not valid;
  end if;
end;
$$;
