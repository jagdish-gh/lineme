create table public.line_entries (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines(id) on delete cascade,
  ticket_token uuid not null default gen_random_uuid(),
  position_number integer not null,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'waiting',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint line_entries_ticket_token_key unique (ticket_token),
  constraint line_entries_position_key unique (line_id, position_number),
  constraint line_entries_position_check check (position_number > 0),
  constraint line_entries_answers_object_check check (
    jsonb_typeof(answers) = 'object'
  ),
  constraint line_entries_status_check check (
    status in ('waiting', 'called', 'served', 'cancelled')
  )
);

create index line_entries_line_status_position_idx
  on public.line_entries(line_id, status, position_number);

create index line_entries_line_joined_at_idx
  on public.line_entries(line_id, joined_at desc);

create trigger line_entries_set_updated_at
before update on public.line_entries
for each row execute function public.set_updated_at();

alter table public.line_entries enable row level security;

create policy "Creators can view their line entries"
on public.line_entries for select
to authenticated
using (
  exists (
    select 1
    from public.lines
    where lines.id = line_entries.line_id
      and lines.owner_id = (select auth.uid())
  )
);

create policy "Creators can update their line entries"
on public.line_entries for update
to authenticated
using (
  exists (
    select 1
    from public.lines
    where lines.id = line_entries.line_id
      and lines.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.lines
    where lines.id = line_entries.line_id
      and lines.owner_id = (select auth.uid())
  )
);

grant select, update on public.line_entries to authenticated;
revoke all on public.line_entries from anon;

create function public.lookup_public_line(p_code text)
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
    'status', line.status,
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

create function public.join_public_line(
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
  where entry.line_id = target_line.id;

  insert into public.line_entries (
    line_id,
    position_number,
    answers
  )
  values (
    target_line.id,
    next_position,
    coalesce(p_answers, '{}'::jsonb)
  )
  returning id, line_entries.ticket_token
  into created_entry_id, created_ticket_token;

  select count(*)
  into ahead_count
  from public.line_entries entry
  where entry.line_id = target_line.id
    and entry.status in ('waiting', 'called')
    and entry.position_number < next_position;

  return query
  select created_entry_id, created_ticket_token, next_position, ahead_count;
end;
$$;

revoke all on function public.lookup_public_line(text) from public;
revoke all on function public.join_public_line(text, jsonb) from public;

grant execute on function public.lookup_public_line(text) to anon, authenticated;
grant execute on function public.join_public_line(text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
