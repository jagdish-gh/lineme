do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lines'
  ) then
    alter publication supabase_realtime add table public.lines;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'line_entries'
  ) then
    alter publication supabase_realtime add table public.line_entries;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'line_entry_requests'
  ) then
    alter publication supabase_realtime add table public.line_entry_requests;
  end if;
end $$;

create or replace function public.broadcast_line_ticket_refresh()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_line_id uuid;
  target_ticket record;
begin
  affected_line_id := coalesce(new.line_id, old.line_id);

  for target_ticket in
    select entry.ticket_token
    from public.line_entries entry
    where entry.line_id = affected_line_id
      and (
        entry.status in ('waiting', 'called')
        or entry.id = coalesce(new.id, old.id)
      )
  loop
    perform realtime.send(
      jsonb_build_object('line_id', affected_line_id),
      'refresh',
      'ticket:' || target_ticket.ticket_token::text,
      false
    );
  end loop;

  return null;
end;
$$;

create or replace function public.broadcast_single_ticket_refresh()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_entry_id uuid;
  target_ticket uuid;
begin
  affected_entry_id := coalesce(new.entry_id, old.entry_id);

  select entry.ticket_token
  into target_ticket
  from public.line_entries entry
  where entry.id = affected_entry_id;

  if target_ticket is not null then
    perform realtime.send(
      jsonb_build_object('entry_id', affected_entry_id),
      'refresh',
      'ticket:' || target_ticket::text,
      false
    );
  end if;

  return null;
end;
$$;

create or replace function public.broadcast_line_status_ticket_refresh()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_ticket record;
begin
  for target_ticket in
    select entry.ticket_token
    from public.line_entries entry
    where entry.line_id = new.id
      and entry.status in ('waiting', 'called')
  loop
    perform realtime.send(
      jsonb_build_object('line_id', new.id),
      'refresh',
      'ticket:' || target_ticket.ticket_token::text,
      false
    );
  end loop;

  return null;
end;
$$;

drop trigger if exists line_entries_ticket_refresh_broadcast
  on public.line_entries;
create trigger line_entries_ticket_refresh_broadcast
after update of status on public.line_entries
for each row
execute function public.broadcast_line_ticket_refresh();

drop trigger if exists line_entry_requests_ticket_refresh_broadcast
  on public.line_entry_requests;
create trigger line_entry_requests_ticket_refresh_broadcast
after insert or update or delete on public.line_entry_requests
for each row
execute function public.broadcast_single_ticket_refresh();

drop trigger if exists lines_ticket_refresh_broadcast
  on public.lines;
create trigger lines_ticket_refresh_broadcast
after update of status, paused_until on public.lines
for each row
execute function public.broadcast_line_status_ticket_refresh();

revoke all on function public.broadcast_line_ticket_refresh() from public;
revoke all on function public.broadcast_single_ticket_refresh() from public;
revoke all on function public.broadcast_line_status_ticket_refresh() from public;
