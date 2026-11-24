-- Run this entire file once in Supabase Dashboard → SQL Editor.
-- The browser uses only the publishable/anon key. Row Level Security protects the data.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Student',
  created_at timestamptz not null default now()
);

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  subject text not null check (char_length(subject) between 2 and 80),
  description text not null default '',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- Add the creator as the first member atomically with group creation.
create or replace function public.add_group_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id) values (new.id, new.owner_id)
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_study_group_created_add_owner on public.study_groups;
create trigger on_study_group_created_add_owner
  after insert on public.study_groups
  for each row execute procedure public.add_group_owner_as_member();

create index if not exists group_members_user_id_idx on public.group_members(user_id);
create index if not exists messages_group_created_idx on public.messages(group_id, created_at);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Student'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Signed-in users can read profiles" on public.profiles;
create policy "Signed-in users can read profiles" on public.profiles
  for select to authenticated using (true);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Signed-in users can browse groups" on public.study_groups;
create policy "Signed-in users can browse groups" on public.study_groups
  for select to authenticated using (true);
drop policy if exists "Users can create groups as themselves" on public.study_groups;
create policy "Users can create groups as themselves" on public.study_groups
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "Owners can update their groups" on public.study_groups;
create policy "Owners can update their groups" on public.study_groups
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "Owners can delete their groups" on public.study_groups;
create policy "Owners can delete their groups" on public.study_groups
  for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "Signed-in users can see group members" on public.group_members;
create policy "Signed-in users can see group members" on public.group_members
  for select to authenticated using (true);
drop policy if exists "Users can join groups as themselves" on public.group_members;
create policy "Users can join groups as themselves" on public.group_members
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can leave or owners can remove members" on public.group_members;
create policy "Users can leave or owners can remove members" on public.group_members
  for delete to authenticated using (
    user_id = (select auth.uid()) or exists (
      select 1 from public.study_groups where id = group_id and owner_id = (select auth.uid())
    )
  );

drop policy if exists "Group members can read messages" on public.messages;
create policy "Group members can read messages" on public.messages
  for select to authenticated using (
    exists (select 1 from public.group_members where group_id = messages.group_id and user_id = (select auth.uid()))
  );
drop policy if exists "Group members can send as themselves" on public.messages;
create policy "Group members can send as themselves" on public.messages
  for insert to authenticated with check (
    user_id = (select auth.uid()) and
    exists (select 1 from public.group_members where group_id = messages.group_id and user_id = (select auth.uid()))
  );

-- Needed for Supabase Realtime to broadcast newly inserted chat messages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
