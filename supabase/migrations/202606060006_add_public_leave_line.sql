create function public.leave_public_line(p_ticket_token uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  select entry.status
  into current_status
  from public.line_entries entry
  where entry.ticket_token = p_ticket_token
  for update;

  if not found then
    return 'not_found';
  end if;

  if current_status = 'cancelled' then
    return 'already_left';
  end if;

  if current_status = 'served' then
    return 'already_completed';
  end if;

  update public.line_entries
  set status = 'cancelled'
  where ticket_token = p_ticket_token;

  return 'left';
end;
$$;

revoke all on function public.leave_public_line(uuid) from public;
grant execute on function public.leave_public_line(uuid)
  to anon, authenticated;

notify pgrst, 'reload schema';
