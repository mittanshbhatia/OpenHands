-- OpenHands Supabase schema (run in this project's Supabase SQL editor)
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz,
  login_count integer not null default 0
);

create index if not exists profiles_email_idx on public.profiles (email);

-- Manually bookmarked places
create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_key text not null,
  resource jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, place_key)
);

-- My Plan
create table if not exists public.plan_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_key text not null,
  resource jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, place_key)
);

-- Only places the user asked directions to
create table if not exists public.direction_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_key text not null,
  resource jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists direction_places_user_idx
  on public.direction_places (user_id, created_at desc);

-- Explicit location choices (typed address or “use my location”)
create table if not exists public.user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  source text not null check (source in ('typed', 'gps')),
  created_at timestamptz not null default now()
);

create index if not exists user_locations_user_idx
  on public.user_locations (user_id, created_at desc);

-- Summarized assistant conversations
create table if not exists public.chat_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  summary text not null,
  topics text[] not null default '{}',
  message_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists chat_summaries_user_idx
  on public.chat_summaries (user_id, created_at desc);

-- Hosted donation locations
create table if not exists public.host_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text not null,
  phone text not null,
  hours text not null,
  capacity text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.saved_places enable row level security;
alter table public.plan_places enable row level security;
alter table public.direction_places enable row level security;
alter table public.user_locations enable row level security;
alter table public.chat_summaries enable row level security;
alter table public.host_locations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "saved_places_own" on public.saved_places
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plan_places_own" on public.plan_places
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "direction_places_own" on public.direction_places
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_locations_own" on public.user_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "chat_summaries_own" on public.chat_summaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "host_locations_own" on public.host_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, provider, last_login, login_count)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    now(),
    1
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    last_login = now(),
    login_count = public.profiles.login_count + 1,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit)
values ('openhands-media', 'openhands-media', false, 10485760)
on conflict (id) do nothing;
