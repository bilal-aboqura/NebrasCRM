begin;
select plan(5);
select has_table('public', 'call_logs', 'call logs table exists');
select has_column('public', 'call_logs', 'channel', 'channel exists');
select has_trigger('public', 'call_logs', 'trg_validate_call_log', 'validation trigger exists');
select has_trigger('public', 'call_logs', 'trg_check_call_log_edit_window', '24h edit trigger exists');
select has_type('public', 'communication_outcome', 'outcome enum exists');
select * from finish();
rollback;
