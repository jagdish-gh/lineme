alter table public.line_entries
drop constraint line_entries_status_check;

alter table public.line_entries
add constraint line_entries_status_check check (
  status in ('waiting', 'called', 'served', 'cancelled', 'no_show')
);

create or replace function public.manage_line_entry(
  p_line_id uuid,
  p_action text,
  p_entry_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_entry_id uuid;
begin
  if not exists (
    select 1
    from public.lines line
    where line.id = p_line_id
      and line.owner_id = auth.uid()
  ) then
    raise exception 'line_not_found';
  end if;

  if p_action = 'call_next' then
    update public.line_entries
    set status = 'served'
    where line_id = p_line_id
      and status = 'called';

    select entry.id
    into target_entry_id
    from public.line_entries entry
    where entry.line_id = p_line_id
      and entry.status = 'waiting'
    order by entry.position_number
    limit 1
    for update;

    if target_entry_id is null then
      raise exception 'no_waiting_members';
    end if;

    update public.line_entries
    set status = 'called'
    where id = target_entry_id;
  elsif p_action = 'call' then
    select entry.id
    into target_entry_id
    from public.line_entries entry
    where entry.id = p_entry_id
      and entry.line_id = p_line_id
      and entry.status in ('waiting', 'called')
    for update;

    if target_entry_id is null then
      raise exception 'member_not_available';
    end if;

    update public.line_entries
    set status = 'served'
    where line_id = p_line_id
      and status = 'called'
      and id <> target_entry_id;

    update public.line_entries
    set status = 'called'
    where id = target_entry_id;
  elsif p_action = 'serve' then
    update public.line_entries
    set status = 'served'
    where id = p_entry_id
      and line_id = p_line_id
      and status in ('waiting', 'called')
    returning id into target_entry_id;

    if target_entry_id is null then
      raise exception 'member_not_available';
    end if;
  elsif p_action = 'no_show' then
    update public.line_entries
    set status = 'no_show'
    where id = p_entry_id
      and line_id = p_line_id
      and status = 'called'
    returning id into target_entry_id;

    if target_entry_id is null then
      raise exception 'member_not_available';
    end if;
  else
    raise exception 'invalid_action';
  end if;

  return target_entry_id;
end;
$$;

revoke all on function public.manage_line_entry(uuid, text, uuid) from public;
grant execute on function public.manage_line_entry(uuid, text, uuid)
  to authenticated;

create or replace function public.leave_public_line(p_ticket_token uuid)
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

  if current_status in ('served', 'no_show') then
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
