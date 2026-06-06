create table public.line_entry_requests (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.line_entries(id) on delete cascade,
  prompt text not null,
  response text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  constraint line_entry_requests_prompt_length check (
    char_length(btrim(prompt)) between 1 and 300
  ),
  constraint line_entry_requests_response_length check (
    response is null or char_length(btrim(response)) between 1 and 1000
  ),
  constraint line_entry_requests_status_check check (
    status in ('pending', 'answered', 'cancelled')
  )
);

create index line_entry_requests_entry_status_created_idx
  on public.line_entry_requests(entry_id, status, created_at desc);

alter table public.line_entry_requests enable row level security;

create policy "Creators can view their line entry requests"
on public.line_entry_requests for select
to authenticated
using (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = line_entry_requests.entry_id
      and line.owner_id = (select auth.uid())
  )
);

create policy "Creators can create their line entry requests"
on public.line_entry_requests for insert
to authenticated
with check (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = line_entry_requests.entry_id
      and line.owner_id = (select auth.uid())
  )
);

create policy "Creators can update their line entry requests"
on public.line_entry_requests for update
to authenticated
using (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = line_entry_requests.entry_id
      and line.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = line_entry_requests.entry_id
      and line.owner_id = (select auth.uid())
  )
);

grant select, insert, update on public.line_entry_requests to authenticated;
revoke all on public.line_entry_requests from anon;

create function public.manage_line_entry(
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
  else
    raise exception 'invalid_action';
  end if;

  return target_entry_id;
end;
$$;

revoke all on function public.manage_line_entry(uuid, text, uuid) from public;
grant execute on function public.manage_line_entry(uuid, text, uuid)
  to authenticated;

create function public.respond_to_line_entry_request(
  p_ticket_token uuid,
  p_request_id uuid,
  p_response text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(btrim(coalesce(p_response, ''))) not between 1 and 1000 then
    raise exception 'invalid_response';
  end if;

  update public.line_entry_requests request
  set
    response = btrim(p_response),
    status = 'answered',
    answered_at = now()
  from public.line_entries entry
  where request.id = p_request_id
    and request.entry_id = entry.id
    and entry.ticket_token = p_ticket_token
    and request.status = 'pending';

  return found;
end;
$$;

revoke all on function public.respond_to_line_entry_request(uuid, uuid, text)
  from public;
grant execute on function public.respond_to_line_entry_request(uuid, uuid, text)
  to anon, authenticated;

create or replace function public.lookup_public_line_ticket(p_ticket_token uuid)
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
      'joined_at', entry.joined_at,
      'requests', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', request.id,
            'prompt', request.prompt,
            'response', request.response,
            'status', request.status,
            'created_at', request.created_at,
            'answered_at', request.answered_at
          )
          order by request.created_at desc
        )
        from public.line_entry_requests request
        where request.entry_id = entry.id
          and request.status <> 'cancelled'
      ), '[]'::jsonb)
    )
  )
  into result
  from public.line_entries entry
  join public.lines line on line.id = entry.line_id
  where entry.ticket_token = p_ticket_token;

  return result;
end;
$$;

notify pgrst, 'reload schema';
