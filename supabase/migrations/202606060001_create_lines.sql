create extension if not exists pgcrypto;

create table public.lines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  public_code text not null default upper(encode(gen_random_bytes(5), 'hex')),
  name text not null,
  location text,
  line_type text not null,
  custom_line_type text,
  estimated_service_minutes integer,
  daily_capacity integer,
  auto_notify boolean not null default true,
  allow_pause boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lines_public_code_key unique (public_code),
  constraint lines_name_length check (char_length(btrim(name)) between 2 and 100),
  constraint lines_location_length check (
    location is null or char_length(location) <= 160
  ),
  constraint lines_type_check check (
    line_type in ('clinic', 'restaurant', 'service', 'event', 'other')
  ),
  constraint lines_custom_type_check check (
    (line_type = 'other' and char_length(btrim(custom_line_type)) between 2 and 80)
    or (line_type <> 'other' and custom_line_type is null)
  ),
  constraint lines_estimated_minutes_check check (
    estimated_service_minutes is null
    or estimated_service_minutes between 2 and 60
  ),
  constraint lines_daily_capacity_check check (
    daily_capacity is null or daily_capacity between 5 and 250
  ),
  constraint lines_status_check check (status in ('active', 'paused', 'closed'))
);

create table public.line_questions (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines(id) on delete cascade,
  position integer not null,
  label text not null,
  answer_type text not null,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  constraint line_questions_position_key unique (line_id, position),
  constraint line_questions_position_check check (position between 0 and 19),
  constraint line_questions_label_length check (
    char_length(btrim(label)) between 1 and 120
  ),
  constraint line_questions_type_check check (
    answer_type in ('text', 'phone', 'email', 'number', 'choice')
  ),
  constraint line_questions_options_array_check check (
    jsonb_typeof(options) = 'array'
  ),
  constraint line_questions_choice_options_check check (
    (answer_type = 'choice' and jsonb_array_length(options) between 2 and 20)
    or (answer_type <> 'choice' and jsonb_array_length(options) = 0)
  )
);

create index lines_owner_id_created_at_idx
  on public.lines(owner_id, created_at desc);

create index line_questions_line_id_position_idx
  on public.line_questions(line_id, position);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lines_set_updated_at
before update on public.lines
for each row execute function public.set_updated_at();

alter table public.lines enable row level security;
alter table public.line_questions enable row level security;

create policy "Creators can view their lines"
on public.lines for select
to authenticated
using (owner_id = auth.uid());

create policy "Creators can create their lines"
on public.lines for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Creators can update their lines"
on public.lines for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Creators can delete their lines"
on public.lines for delete
to authenticated
using (owner_id = auth.uid());

create policy "Creators can view their line questions"
on public.line_questions for select
to authenticated
using (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = auth.uid()
  )
);

create policy "Creators can create their line questions"
on public.line_questions for insert
to authenticated
with check (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = auth.uid()
  )
);

create policy "Creators can update their line questions"
on public.line_questions for update
to authenticated
using (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = auth.uid()
  )
);

create policy "Creators can delete their line questions"
on public.line_questions for delete
to authenticated
using (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = auth.uid()
  )
);

create function public.create_line(
  p_name text,
  p_location text,
  p_line_type text,
  p_custom_line_type text,
  p_estimated_service_minutes integer,
  p_daily_capacity integer,
  p_auto_notify boolean,
  p_allow_pause boolean,
  p_questions jsonb
)
returns table (id uuid, public_code text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_line_id uuid;
  created_public_code text;
  question jsonb;
  question_index integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(coalesce(p_questions, '[]'::jsonb)) <> 'array' then
    raise exception 'Questions must be an array';
  end if;

  if jsonb_array_length(coalesce(p_questions, '[]'::jsonb)) > 20 then
    raise exception 'A line can have at most 20 questions';
  end if;

  insert into public.lines (
    owner_id,
    name,
    location,
    line_type,
    custom_line_type,
    estimated_service_minutes,
    daily_capacity,
    auto_notify,
    allow_pause
  )
  values (
    auth.uid(),
    btrim(p_name),
    nullif(btrim(p_location), ''),
    p_line_type,
    case when p_line_type = 'other' then nullif(btrim(p_custom_line_type), '') end,
    p_estimated_service_minutes,
    p_daily_capacity,
    coalesce(p_auto_notify, true),
    coalesce(p_allow_pause, true)
  )
  returning lines.id, lines.public_code
  into created_line_id, created_public_code;

  for question in
    select value
    from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb))
  loop
    insert into public.line_questions (
      line_id,
      position,
      label,
      answer_type,
      options,
      is_required
    )
    values (
      created_line_id,
      question_index,
      btrim(question->>'label'),
      question->>'type',
      case
        when question->>'type' = 'choice'
          then coalesce(question->'options', '[]'::jsonb)
        else '[]'::jsonb
      end,
      coalesce((question->>'required')::boolean, false)
    );

    question_index := question_index + 1;
  end loop;

  return query select created_line_id, created_public_code;
end;
$$;

revoke all on function public.create_line(
  text,
  text,
  text,
  text,
  integer,
  integer,
  boolean,
  boolean,
  jsonb
) from public;

grant execute on function public.create_line(
  text,
  text,
  text,
  text,
  integer,
  integer,
  boolean,
  boolean,
  jsonb
) to authenticated;

notify pgrst, 'reload schema';
