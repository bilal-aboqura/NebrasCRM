insert into public.system_settings (key, value)
values (
  'assessment_visibility_settings',
  '{"general":{"disabledChapterCodes":[],"disabledItemCodes":[]},"dental":{"disabledChapterCodes":["LB","RD","MM","DPU","DA"],"disabledItemCodes":[]}}'
)
on conflict (key) do nothing;
