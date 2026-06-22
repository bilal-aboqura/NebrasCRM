-- Directly fix the audit_logs_event_type_check constraint that blocks profile updates.
-- The constraint is missing values like 'profile_update' that the code needs.

-- 1. Drop the old restrictive check constraint
alter table public.audit_logs drop constraint if exists audit_logs_event_type_check;

-- 2. Also drop any other check on event_type that might exist under a different name
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
    where nsp.nspname = 'public'
      and rel.relname = 'audit_logs'
      and con.contype = 'c'
      and att.attname = 'event_type'
      and con.conname <> 'audit_logs_event_type_all'
  loop
    execute format('alter table public.audit_logs drop constraint %I', c.conname);
  end loop;
end;
$$;

-- 3. Add a new check constraint with ALL values used by the application
alter table public.audit_logs
  add constraint audit_logs_event_type_all check (
    event_type in (
      'login', 'logout', 'failed_login', 'company_switch',
      'company_create', 'company_update', 'user_invite',
      'profile_update', 'unauthorized_admin_attempt'
    )
  );

-- 4. Same for outcome column if it has a restrictive check
alter table public.audit_logs drop constraint if exists audit_logs_outcome_check;
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
    where nsp.nspname = 'public'
      and rel.relname = 'audit_logs'
      and con.contype = 'c'
      and att.attname = 'outcome'
      and con.conname <> 'audit_logs_outcome_all'
  loop
    execute format('alter table public.audit_logs drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.audit_logs
  add constraint audit_logs_outcome_all check (
    outcome in ('success', 'failure', 'throttled')
  );
