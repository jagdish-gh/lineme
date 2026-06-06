create function public.lookup_public_line_ticket(p_ticket_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'line', jsonb_build_object(
      'id', line.id,
      'public_code', line.public_code,
      'name', line.name,
      'location', line.location,
      'line_type', line.line_type,
      'custom_line_type', line.custom_line_type,
      'estimated_service_minutes', line.estimated_service_minutes,
      'status', line.status,
      'waiting_count', (
        select count(*)
        from public.line_entries waiting_entry
        where waiting_entry.line_id = line.id
          and waiting_entry.status in ('waiting', 'called')
      ),
      'questions', '[]'::jsonb
    ),
    'ticket', jsonb_build_object(
      'entry_id', entry.id,
      'ticket_token', entry.ticket_token,
      'position_number', entry.position_number,
      'people_ahead', (
        select count(*)
        from public.line_entries ahead_entry
        where ahead_entry.line_id = entry.line_id
          and ahead_entry.status in ('waiting', 'called')
          and ahead_entry.position_number < entry.position_number
      ),
      'status', entry.status,
      'joined_at', entry.joined_at
    )
  )
  into result
  from public.line_entries entry
  join public.lines line on line.id = entry.line_id
  where entry.ticket_token = p_ticket_token;

  return result;
end;
$$;

revoke all on function public.lookup_public_line_ticket(uuid) from public;
grant execute on function public.lookup_public_line_ticket(uuid)
  to anon, authenticated;

notify pgrst, 'reload schema';
