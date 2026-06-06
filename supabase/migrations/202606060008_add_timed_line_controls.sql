alter table public.lines
add column paused_until timestamptz;

create function public.manage_line_status(
  p_line_id uuid,
  p_action text
)
returns table (status text, paused_until timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_line public.lines%rowtype;
begin
  select *
  into target_line
  from public.lines
  where id = p_line_id
    and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'line_not_found';
  end if;

  if target_line.status = 'closed' then
    raise exception 'line_expired';
  end if;

  if p_action = 'pause' then
    if not target_line.allow_pause then
      raise exception 'pause_not_allowed';
    end if;

    update public.lines
    set status = 'paused', paused_until = null
    where id = p_line_id;
  elsif p_action = 'pause_30' then
    if not target_line.allow_pause then
      raise exception 'pause_not_allowed';
    end if;

    update public.lines
    set status = 'paused', paused_until = now() + interval '30 minutes'
    where id = p_line_id;
  elsif p_action = 'resume' then
    update public.lines
    set status = 'active', paused_until = null
    where id = p_line_id;
  elsif p_action = 'expire' then
    update public.lines
    set status = 'closed', paused_until = null
    where id = p_line_id;
  else
    raise exception 'invalid_action';
  end if;

  return query
  select line.status, line.paused_until
  from public.lines line
  where line.id = p_line_id;
end;
$$;

revoke all on function public.manage_line_status(uuid, text) from public;
grant execute on function public.manage_line_status(uuid, text)
  to authenticated;

create or replace function public.lookup_public_line(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text;
  result jsonb;
begin
  normalized_code := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));

  if char_length(normalized_code) <> 10 then
    return null;
  end if;

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
  where line.public_code = normalized_code;

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
  answer_value text;
  next_position integer;
  created_entry_id uuid;
  created_ticket_token uuid;
  ahead_count integer;
  joined_today integer;
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
      and joined_at >= date_trunc('day', now())
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
      if char_length(answer_value) > 500 then raise exception 'answer_too_long'; end if;
      if question.answer_type = 'number' and answer_value !~ '^-?[0-9]+([.][0-9]+)?$' then raise exception 'invalid_number_answer'; end if;
      if question.answer_type = 'email' and answer_value !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'invalid_email_answer'; end if;
      if question.answer_type = 'phone' and char_length(regexp_replace(answer_value, '[^0-9]', '', 'g')) not between 7 and 15 then raise exception 'invalid_phone_answer'; end if;
      if question.answer_type = 'choice' and not (question.options ? answer_value) then raise exception 'invalid_choice_answer'; end if;
    end if;
  end loop;

  select coalesce(max(entry.position_number), 0) + 1
  into next_position
  from public.line_entries entry
  where entry.line_id = target_line.id;

  insert into public.line_entries (line_id, position_number, answers)
  values (target_line.id, next_position, coalesce(p_answers, '{}'::jsonb))
  returning id, line_entries.ticket_token
  into created_entry_id, created_ticket_token;

  select count(*)
  into ahead_count
  from public.line_entries entry
  where entry.line_id = target_line.id
    and entry.status in ('waiting', 'called')
    and entry.position_number < next_position;

  return query select created_entry_id, created_ticket_token, next_position, ahead_count;
end;
$$;

notify pgrst, 'reload schema';
