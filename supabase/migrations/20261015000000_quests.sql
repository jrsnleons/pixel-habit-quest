-- One row per player holding their whole quest as JSON. The app computes
-- HP, XP and streaks from this history, so the row is the single source of truth.
create table public.quests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint quests_state_size check (pg_column_size(state) < 1000000)
);

alter table public.quests enable row level security;

create policy "Players read their own quest" on public.quests
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Players create their own quest" on public.quests
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Players update their own quest" on public.quests
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.touch_quest_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger quests_touch_updated_at
  before update on public.quests
  for each row execute function public.touch_quest_updated_at();
