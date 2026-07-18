create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  line_id uuid references public.lines(id) on delete cascade,
  entry_id uuid references public.line_entries(id) on delete cascade,
  type text not null,
  line_name text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in (
      'line_joined',
      'member_called',
      'member_served',
      'member_no_show',
      'member_cancelled',
      'additional_info_requested',
      'additional_info_submitted'
    )
  ),
  constraint notifications_line_name_length check (
    char_length(btrim(line_name)) between 1 and 100
  )
);

create index notifications_user_created_at_idx
  on public.notifications(user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications(user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "Users can view their notifications"
on public.notifications for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can mark their notifications read"
on public.notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create function public.create_line_entry_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_line public.lines%rowtype;
  notification_type text;
begin
  select *
  into target_line
  from public.lines
  where id = new.line_id;

  if not found then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.notifications (
      user_id,
      line_id,
      entry_id,
      type,
      line_name
    )
    values (
      target_line.owner_id,
      target_line.id,
      new.id,
      'line_joined',
      target_line.name
    );

    return null;
  end if;

  if new.status is not distinct from old.status or new.joiner_id is null then
    return null;
  end if;

  notification_type := case new.status
    when 'called' then 'member_called'
    when 'served' then 'member_served'
    when 'no_show' then 'member_no_show'
    when 'cancelled' then 'member_cancelled'
    else null
  end;

  if notification_type is not null then
    insert into public.notifications (
      user_id,
      line_id,
      entry_id,
      type,
      line_name
    )
    values (
      new.joiner_id,
      target_line.id,
      new.id,
      notification_type,
      target_line.name
    );
  end if;

  return null;
end;
$$;

create function public.create_line_entry_request_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_entry public.line_entries%rowtype;
  target_line public.lines%rowtype;
begin
  select *
  into target_entry
  from public.line_entries
  where id = new.entry_id;

  if not found then
    return null;
  end if;

  select *
  into target_line
  from public.lines
  where id = target_entry.line_id;

  if not found then
    return null;
  end if;

  if tg_op = 'INSERT' and target_entry.joiner_id is not null then
    insert into public.notifications (
      user_id,
      line_id,
      entry_id,
      type,
      line_name
    )
    values (
      target_entry.joiner_id,
      target_line.id,
      target_entry.id,
      'additional_info_requested',
      target_line.name
    );
  elsif new.status = 'answered'
    and old.status is distinct from new.status
  then
    insert into public.notifications (
      user_id,
      line_id,
      entry_id,
      type,
      line_name
    )
    values (
      target_line.owner_id,
      target_line.id,
      target_entry.id,
      'additional_info_submitted',
      target_line.name
    );
  end if;

  return null;
end;
$$;

create trigger line_entries_create_notification
after insert or update of status on public.line_entries
for each row
execute function public.create_line_entry_notification();

create trigger line_entry_requests_create_notification
after insert or update of status on public.line_entry_requests
for each row
execute function public.create_line_entry_request_notification();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

revoke all on function public.create_line_entry_notification() from public;
revoke all on function public.create_line_entry_request_notification() from public;

notify pgrst, 'reload schema';
