create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Nila member' check (char_length(trim(full_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  phone_number text not null check (phone_number ~ '^\+[1-9][0-9]{7,14}$'),
  preferred_language text not null check (char_length(trim(preferred_language)) between 1 and 80),
  timezone text not null check (char_length(trim(timezone)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parent_relationships (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid not null references public.parents (id) on delete cascade,
  relationship text not null check (char_length(trim(relationship)) between 1 and 80),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, parent_id)
);

create table public.call_schedules (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  timezone text not null check (char_length(trim(timezone)) between 1 and 80),
  local_time time not null,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  days_of_week smallint[] null check (days_of_week is null or days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  schedule_id uuid null references public.call_schedules (id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'initiating', 'ringing', 'connected', 'in_progress', 'completed', 'no_answer', 'busy', 'failed')),
  started_at timestamptz null,
  ended_at timestamptz null,
  duration_seconds integer null check (duration_seconds is null or duration_seconds >= 0),
  failure_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or started_at is null or ended_at >= started_at)
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  parent_id uuid not null references public.parents (id) on delete cascade,
  category text not null check (category in ('mood', 'activities', 'food', 'sleep', 'social_interaction', 'comfort', 'concerns', 'important_mention')),
  observation_text text not null check (char_length(trim(observation_text)) between 1 and 2000),
  source_excerpt text null check (source_excerpt is null or char_length(trim(source_excerpt)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.call_summaries (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references public.calls (id) on delete cascade,
  parent_id uuid not null references public.parents (id) on delete cascade,
  overall_tone text null check (overall_tone is null or char_length(trim(overall_tone)) <= 80),
  summary_text text not null check (char_length(trim(summary_text)) between 1 and 5000),
  follow_up_text text null check (follow_up_text is null or char_length(trim(follow_up_text)) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  call_id uuid null references public.calls (id) on delete set null,
  severity text not null check (severity in ('follow_up', 'urgent')),
  message text not null check (char_length(trim(message)) between 1 and 2000),
  is_resolved boolean not null default false,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_resolved and resolved_at is not null) or (not is_resolved and resolved_at is null))
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles (id) on delete cascade,
  alert_id uuid null references public.alerts (id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index parent_relationships_child_id_idx on public.parent_relationships (child_id);
create index parent_relationships_parent_id_idx on public.parent_relationships (parent_id);
create index call_schedules_parent_id_idx on public.call_schedules (parent_id);
create index call_schedules_created_by_idx on public.call_schedules (created_by);
create index calls_parent_id_ended_at_idx on public.calls (parent_id, ended_at desc);
create index observations_parent_id_created_at_idx on public.observations (parent_id, created_at desc);
create index observations_call_id_idx on public.observations (call_id);
create index call_summaries_parent_id_created_at_idx on public.call_summaries (parent_id, created_at desc);
create index alerts_parent_id_created_at_idx on public.alerts (parent_id, created_at desc);
create index notifications_child_id_created_at_idx on public.notifications (child_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger parents_set_updated_at before update on public.parents for each row execute procedure public.set_updated_at();
create trigger parent_relationships_set_updated_at before update on public.parent_relationships for each row execute procedure public.set_updated_at();
create trigger call_schedules_set_updated_at before update on public.call_schedules for each row execute procedure public.set_updated_at();
create trigger calls_set_updated_at before update on public.calls for each row execute procedure public.set_updated_at();
create trigger call_summaries_set_updated_at before update on public.call_summaries for each row execute procedure public.set_updated_at();
create trigger alerts_set_updated_at before update on public.alerts for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Nila member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function private.can_access_parent(target_parent_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.parent_relationships relationship
    where relationship.parent_id = target_parent_id
      and relationship.child_id = (select auth.uid())
  );
$$;

revoke all on function private.can_access_parent(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.can_access_parent(uuid) to authenticated;

create or replace function public.create_parent_with_relationship(
  parent_full_name text,
  parent_phone_number text,
  relationship_name text,
  parent_preferred_language text,
  parent_timezone text
)
returns public.parents
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_parent public.parents;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  insert into public.parents (full_name, phone_number, preferred_language, timezone)
  values (parent_full_name, parent_phone_number, parent_preferred_language, parent_timezone)
  returning * into new_parent;

  insert into public.parent_relationships (child_id, parent_id, relationship, is_primary)
  values ((select auth.uid()), new_parent.id, relationship_name, true);

  return new_parent;
end;
$$;

revoke all on function public.create_parent_with_relationship(text, text, text, text, text) from public;
grant execute on function public.create_parent_with_relationship(text, text, text, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.parents enable row level security;
alter table public.parent_relationships enable row level security;
alter table public.call_schedules enable row level security;
alter table public.calls enable row level security;
alter table public.observations enable row level security;
alter table public.call_summaries enable row level security;
alter table public.alerts enable row level security;
alter table public.notifications enable row level security;

revoke all on table public.profiles, public.parents, public.parent_relationships, public.call_schedules, public.calls, public.observations, public.call_summaries, public.alerts, public.notifications from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, update on public.parents to authenticated;
grant select, update on public.parent_relationships to authenticated;
grant select, insert, update, delete on public.call_schedules to authenticated;
grant select on public.calls, public.observations, public.call_summaries, public.alerts to authenticated;
grant select, update on public.notifications to authenticated;

create policy "Profiles are readable by their owner" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Profiles are updatable by their owner" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Parents are readable through a relationship" on public.parents for select to authenticated using ((select private.can_access_parent(id)));
create policy "Parents are updatable through a relationship" on public.parents for update to authenticated using ((select private.can_access_parent(id))) with check ((select private.can_access_parent(id)));

create policy "Relationships are readable by their child" on public.parent_relationships for select to authenticated using ((select auth.uid()) = child_id);
create policy "Relationships are updatable by their child" on public.parent_relationships for update to authenticated using ((select auth.uid()) = child_id) with check ((select auth.uid()) = child_id);

create policy "Schedules are readable through a relationship" on public.call_schedules for select to authenticated using ((select private.can_access_parent(parent_id)));
create policy "Schedules are insertable through a relationship" on public.call_schedules for insert to authenticated with check ((select private.can_access_parent(parent_id)) and (select auth.uid()) = created_by);
create policy "Schedules are updatable through a relationship" on public.call_schedules for update to authenticated using ((select private.can_access_parent(parent_id))) with check ((select private.can_access_parent(parent_id)) and (select auth.uid()) = created_by);
create policy "Schedules are deletable through a relationship" on public.call_schedules for delete to authenticated using ((select private.can_access_parent(parent_id)));

create policy "Calls are readable through a relationship" on public.calls for select to authenticated using ((select private.can_access_parent(parent_id)));
create policy "Observations are readable through a relationship" on public.observations for select to authenticated using ((select private.can_access_parent(parent_id)));
create policy "Summaries are readable through a relationship" on public.call_summaries for select to authenticated using ((select private.can_access_parent(parent_id)));
create policy "Alerts are readable through a relationship" on public.alerts for select to authenticated using ((select private.can_access_parent(parent_id)));

create policy "Notifications are readable by their child" on public.notifications for select to authenticated using ((select auth.uid()) = child_id);
create policy "Notifications are updatable by their child" on public.notifications for update to authenticated using ((select auth.uid()) = child_id) with check ((select auth.uid()) = child_id);
