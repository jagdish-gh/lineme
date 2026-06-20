create table public.ticket_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.line_entries(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  locale text not null default 'en',
  user_agent text,
  notifications_sent text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ticket_push_subscriptions_endpoint_key unique (endpoint),
  constraint ticket_push_subscriptions_endpoint_check check (
    char_length(endpoint) between 20 and 2048
  ),
  constraint ticket_push_subscriptions_p256dh_check check (
    char_length(p256dh) between 20 and 512
  ),
  constraint ticket_push_subscriptions_auth_check check (
    char_length(auth) between 10 and 512
  ),
  constraint ticket_push_subscriptions_locale_check check (
    locale in ('en', 'hi')
  )
);

create index ticket_push_subscriptions_entry_id_idx
  on public.ticket_push_subscriptions(entry_id);

create trigger ticket_push_subscriptions_set_updated_at
before update on public.ticket_push_subscriptions
for each row execute function public.set_updated_at();

alter table public.ticket_push_subscriptions enable row level security;

create policy "Creators can view push subscriptions for their lines"
on public.ticket_push_subscriptions for select
to authenticated
using (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = ticket_push_subscriptions.entry_id
      and line.owner_id = (select auth.uid())
  )
);

create policy "Creators can update push subscriptions for their lines"
on public.ticket_push_subscriptions for update
to authenticated
using (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = ticket_push_subscriptions.entry_id
      and line.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = ticket_push_subscriptions.entry_id
      and line.owner_id = (select auth.uid())
  )
);

create policy "Creators can delete push subscriptions for their lines"
on public.ticket_push_subscriptions for delete
to authenticated
using (
  exists (
    select 1
    from public.line_entries entry
    join public.lines line on line.id = entry.line_id
    where entry.id = ticket_push_subscriptions.entry_id
      and line.owner_id = (select auth.uid())
  )
);

revoke all on public.ticket_push_subscriptions from anon, authenticated;
grant select, update, delete on public.ticket_push_subscriptions to authenticated;

create or replace function public.upsert_ticket_push_subscription(
  p_ticket_token uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_locale text default 'en',
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_entry_id uuid;
begin
  select entry.id
  into target_entry_id
  from public.line_entries entry
  where entry.ticket_token = p_ticket_token
    and entry.status in ('waiting', 'called')
  limit 1;

  if target_entry_id is null then
    raise exception 'ticket_not_found';
  end if;

  insert into public.ticket_push_subscriptions (
    entry_id,
    endpoint,
    p256dh,
    auth,
    locale,
    user_agent
  )
  values (
    target_entry_id,
    p_endpoint,
    p_p256dh,
    p_auth,
    case when p_locale in ('en', 'hi') then p_locale else 'en' end,
    nullif(left(coalesce(p_user_agent, ''), 500), '')
  )
  on conflict (endpoint)
  do update set
    entry_id = excluded.entry_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    locale = excluded.locale,
    user_agent = excluded.user_agent,
    notifications_sent = case
      when public.ticket_push_subscriptions.entry_id = excluded.entry_id
        then public.ticket_push_subscriptions.notifications_sent
      else '{}'
    end;
end;
$$;

revoke all on function public.upsert_ticket_push_subscription(uuid, text, text, text, text, text)
  from public;
grant execute on function public.upsert_ticket_push_subscription(uuid, text, text, text, text, text)
  to anon, authenticated;

notify pgrst, 'reload schema';
