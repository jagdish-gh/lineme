alter table public.line_entries
add column service_date date;

update public.line_entries
set service_date = (joined_at at time zone 'Asia/Kolkata')::date
where service_date is null;

alter table public.line_entries
alter column service_date set not null,
alter column service_date set default ((now() at time zone 'Asia/Kolkata')::date);

alter table public.line_entries
drop constraint line_entries_position_key;

alter table public.line_entries
add constraint line_entries_line_service_position_key
unique (line_id, service_date, position_number);

create index line_entries_line_service_status_position_idx
  on public.line_entries(line_id, service_date, status, position_number);

create or replace function public.rollover_line_day(p_line_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_count integer;
  current_service_date date := (now() at time zone 'Asia/Kolkata')::date;
begin
  update public.line_entries entry
  set status = 'no_show'
  where entry.line_id = p_line_id
    and entry.service_date < current_service_date
    and entry.status in ('waiting', 'called');

  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;

revoke all on function public.rollover_line_day(uuid) from public;

create or replace function public.rollover_owned_line_day(p_line_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed_count integer;
  current_service_date date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not exists (
    select 1
    from public.lines line
    where line.id = p_line_id
      and line.owner_id = auth.uid()
  ) then
    raise exception 'line_not_found';
  end if;

  update public.line_entries entry
  set status = 'no_show'
  where entry.line_id = p_line_id
    and entry.service_date < current_service_date
    and entry.status in ('waiting', 'called');

  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;

revoke all on function public.rollover_owned_line_day(uuid) from public;
grant execute on function public.rollover_owned_line_day(uuid) to authenticated;

create or replace function public.lookup_public_line(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text;
  result jsonb;
  target_line_id uuid;
  current_service_date date := (now() at time zone 'Asia/Kolkata')::date;
begin
  normalized_code := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));

  if char_length(normalized_code) <> 10 then
    return null;
  end if;

  select line.id
  into target_line_id
  from public.lines line
  where line.public_code = normalized_code;

  if target_line_id is null then
    return null;
  end if;

  perform public.rollover_line_day(target_line_id);

  select jsonb_build_object(
    'id', line.id,
    'public_code', line.public_code,
    'name', line.name,
    'location', line.location,
    'line_type', line.line_type,
    'custom_line_type', line.custom_line_type,
    'estimated_service_minutes', line.estimated_service_minutes,
    'status', case
      when line.status = 'paused'
        and line.paused_until is not null
        and line.paused_until <= now()
      then 'active'
      else line.status
    end,
    'waiting_count', (
      select count(*)
      from public.line_entries entry
      where entry.line_id = line.id
        and entry.service_date = current_service_date
        and entry.status in ('waiting', 'called')
    ),
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', question.id,
          'position', question.position,
          'label', question.label,
          'answer_type', question.answer_type,
          'options', question.options,
          'is_required', question.is_required
        )
        order by question.position
      )
      from public.line_questions question
      where question.line_id = line.id
    ), '[]'::jsonb)
  )
  into result
  from public.lines line
  where line.id = target_line_id;

  return result;
end;
$$;

create or replace function public.join_public_line(
  p_code text,
  p_answers jsonb
)
returns table (
  entry_id uuid,
  ticket_token uuid,
  position_number integer,
  people_ahead integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text;
  target_line public.lines%rowtype;
  question public.line_questions%rowtype;
  existing_entry public.line_entries%rowtype;
  answer_value text;
  next_position integer;
  created_entry_id uuid;
  created_ticket_token uuid;
  ahead_count integer;
  joined_today integer;
  current_service_date date := (now() at time zone 'Asia/Kolkata')::date;
begin
  normalized_code := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));

  if char_length(normalized_code) <> 10 then
    raise exception 'invalid_code';
  end if;

  if jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid_answers';
  end if;

  select *
  into target_line
  from public.lines
  where public_code = normalized_code
  for update;

  if not found then
    raise exception 'line_not_found';
  end if;

  perform public.rollover_line_day(target_line.id);

  if auth.uid() is not null then
    select *
    into existing_entry
    from public.line_entries entry
    where entry.line_id = target_line.id
      and entry.joiner_id = auth.uid()
      and entry.service_date = current_service_date
      and entry.status in ('waiting', 'called')
    order by entry.joined_at desc
    limit 1;

    if found then
      select count(*)
      into ahead_count
      from public.line_entries entry
      where entry.line_id = target_line.id
        and entry.service_date = current_service_date
        and entry.status in ('waiting', 'called')
        and entry.position_number < existing_entry.position_number;

      return query
      select
        existing_entry.id,
        existing_entry.ticket_token,
        existing_entry.position_number,
        ahead_count;
      return;
    end if;
  end if;

  if target_line.status = 'paused'
    and target_line.paused_until is not null
    and target_line.paused_until <= now()
  then
    update public.lines
    set status = 'active', paused_until = null
    where id = target_line.id;
    target_line.status := 'active';
  end if;

  if target_line.status <> 'active' then
    raise exception 'line_not_active';
  end if;

  if target_line.daily_capacity is not null then
    select count(*)
    into joined_today
    from public.line_entries
    where line_id = target_line.id
      and service_date = current_service_date
      and status <> 'cancelled';

    if joined_today >= target_line.daily_capacity then
      raise exception 'line_at_capacity';
    end if;
  end if;

  for question in
    select *
    from public.line_questions
    where line_id = target_line.id
    order by position
  loop
    answer_value := nullif(btrim(p_answers->>question.id::text), '');

    if question.is_required and answer_value is null then
      raise exception 'required_answer_missing';
    end if;

    if answer_value is not null then
      if char_length(answer_value) > 500 then
        raise exception 'answer_too_long';
      end if;

      if question.answer_type = 'number'
        and answer_value !~ '^-?[0-9]+([.][0-9]+)?$'
      then
        raise exception 'invalid_number_answer';
      end if;

      if question.answer_type = 'email'
        and answer_value !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      then
        raise exception 'invalid_email_answer';
      end if;

      if question.answer_type = 'phone'
        and char_length(regexp_replace(answer_value, '[^0-9]', '', 'g')) not between 7 and 15
      then
        raise exception 'invalid_phone_answer';
      end if;

      if question.answer_type = 'choice'
        and not (question.options ? answer_value)
      then
        raise exception 'invalid_choice_answer';
      end if;
    end if;
  end loop;

  select coalesce(max(entry.position_number), 0) + 1
  into next_position
  from public.line_entries entry
  where entry.line_id = target_line.id
    and entry.service_date = current_service_date;

  insert into public.line_entries (
    line_id,
    joiner_id,
    service_date,
    position_number,
    answers
  )
  values (
    target_line.id,
    auth.uid(),
    current_service_date,
    next_position,
    coalesce(p_answers, '{}'::jsonb)
  )
  returning id, line_entries.ticket_token
  into created_entry_id, created_ticket_token;

  select count(*)
  into ahead_count
  from public.line_entries entry
  where entry.line_id = target_line.id
    and entry.service_date = current_service_date
    and entry.status in ('waiting', 'called')
    and entry.position_number < next_position;

  return query
  select created_entry_id, created_ticket_token, next_position, ahead_count;
end;
$$;

create or replace function public.lookup_public_line_ticket(p_ticket_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform public.rollover_line_day(entry.line_id)
  from public.line_entries entry
  where entry.ticket_token = p_ticket_token;

  select jsonb_build_object(
    'line', jsonb_build_object(
      'id', line.id,
      'public_code', line.public_code,
      'name', line.name,
      'location', line.location,
      'line_type', line.line_type,
      'custom_line_type', line.custom_line_type,
      'estimated_service_minutes', line.estimated_service_minutes,
      'status', case
        when line.status = 'paused'
          and line.paused_until is not null
          and line.paused_until <= now()
        then 'active'
        else line.status
      end,
      'waiting_count', (
        select count(*)
        from public.line_entries waiting_entry
        where waiting_entry.line_id = line.id
          and waiting_entry.service_date = entry.service_date
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
          and ahead_entry.service_date = entry.service_date
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

create or replace function public.list_joined_line_tickets()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  result jsonb;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  perform public.rollover_line_day(entry.line_id)
  from public.line_entries entry
  where entry.joiner_id = current_user_id
    and entry.status in ('waiting', 'called');

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'line', jsonb_build_object(
          'id', line.id,
          'public_code', line.public_code,
          'name', line.name,
          'location', line.location,
          'line_type', line.line_type,
          'custom_line_type', line.custom_line_type,
          'estimated_service_minutes', line.estimated_service_minutes,
          'status', case
            when line.status = 'paused'
              and line.paused_until is not null
              and line.paused_until <= now()
            then 'active'
            else line.status
          end,
          'waiting_count', (
            select count(*)
            from public.line_entries waiting_entry
            where waiting_entry.line_id = line.id
              and waiting_entry.service_date = entry.service_date
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
              and ahead_entry.service_date = entry.service_date
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
      order by entry.joined_at desc
    ),
    '[]'::jsonb
  )
  into result
  from public.line_entries entry
  join public.lines line on line.id = entry.line_id
  where entry.joiner_id = current_user_id;

  return result;
end;
$$;

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
  current_service_date date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not exists (
    select 1
    from public.lines line
    where line.id = p_line_id
      and line.owner_id = auth.uid()
  ) then
    raise exception 'line_not_found';
  end if;

  perform public.rollover_owned_line_day(p_line_id);

  if p_action = 'call_next' then
    update public.line_entries
    set status = 'served'
    where line_id = p_line_id
      and service_date = current_service_date
      and status = 'called';

    select entry.id
    into target_entry_id
    from public.line_entries entry
    where entry.line_id = p_line_id
      and entry.service_date = current_service_date
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
      and entry.service_date = current_service_date
      and entry.status in ('waiting', 'called')
    for update;

    if target_entry_id is null then
      raise exception 'member_not_available';
    end if;

    update public.line_entries
    set status = 'served'
    where line_id = p_line_id
      and service_date = current_service_date
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
      and service_date = current_service_date
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
      and service_date = current_service_date
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

notify pgrst, 'reload schema';
