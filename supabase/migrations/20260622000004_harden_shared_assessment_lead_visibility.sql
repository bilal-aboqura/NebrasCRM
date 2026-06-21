drop policy if exists shared_assessment_leads_read_all_companies
  on public.shared_assessment_leads;

create policy shared_assessment_leads_read_all_companies
on public.shared_assessment_leads
for select to authenticated
using (
  exists (
    select 1
    from public.profiles p
    left join public.companies c on c.id = p.company_id
    where p.id = auth.uid()
      and p.status = 'active'
      and (p.role = 'super_admin' or c.status = 'active')
  )
);
