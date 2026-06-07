revoke execute on function public.list_joined_line_tickets()
  from public, anon;
grant execute on function public.list_joined_line_tickets()
  to authenticated;

drop policy "Creators can view their line entries"
  on public.line_entries;
drop policy "Joiners can view their line entries"
  on public.line_entries;

create policy "Creators and joiners can view line entries"
on public.line_entries for select
to authenticated
using (
  joiner_id = (select auth.uid())
  or exists (
    select 1
    from public.lines
    where lines.id = line_entries.line_id
      and lines.owner_id = (select auth.uid())
  )
);

drop policy "Creators can view their line entry requests"
  on public.line_entry_requests;
drop policy "Joiners can view their entry requests"
  on public.line_entry_requests;

create policy "Creators and joiners can view entry requests"
on public.line_entry_requests for select
to authenticated
using (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = line_entry_requests.entry_id
      and (
        entry.joiner_id = (select auth.uid())
        or line.owner_id = (select auth.uid())
      )
  )
);

notify pgrst, 'reload schema';
