-- RoamVantage MVP schema (Phase 1)
-- Applied automatically by `pnpm db:start` / `pnpm db:reset` (local).
-- For hosted: `supabase link` then `supabase db push`.

create extension if not exists "pgcrypto";

-- Profiles extend auth.users
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'agent' check (role in ('agent', 'admin')),
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'team')),
  team_id uuid,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'team' check (plan in ('pro', 'team')),
  seat_limit int not null default 5,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_team_id_fkey
  foreign key (team_id) references public.teams (id) on delete set null;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles (id) on delete set null,
  owner_team_id uuid references public.teams (id) on delete set null,
  title text not null,
  address text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_owner_check check (
    owner_user_id is not null or owner_team_id is not null
  )
);

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  "order" int not null default 0,
  title text not null default 'Untitled scene',
  created_at timestamptz not null default now()
);

create index scenes_property_id_order_idx on public.scenes (property_id, "order");

create table public.hotspots (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes (id) on delete cascade,
  type text not null check (type in ('navigation', 'info')),
  target_scene_id uuid references public.scenes (id) on delete set null,
  position_yaw double precision not null,
  position_pitch double precision not null,
  content text,
  created_at timestamptz not null default now(),
  constraint hotspots_navigation_target check (
    (type = 'navigation' and target_scene_id is not null)
    or (type = 'info')
  )
);

create index hotspots_scene_id_idx on public.hotspots (scene_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.properties enable row level security;
alter table public.scenes enable row level security;
alter table public.hotspots enable row level security;

-- Profiles: users can read/update themselves
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Properties: owners manage; anyone can read active (public tours)
create policy "properties_select_owner"
  on public.properties for select
  using (owner_user_id = auth.uid());

create policy "properties_select_public_active"
  on public.properties for select
  using (status = 'active');

create policy "properties_insert_own"
  on public.properties for insert
  with check (owner_user_id = auth.uid());

create policy "properties_update_own"
  on public.properties for update
  using (owner_user_id = auth.uid());

create policy "properties_delete_own"
  on public.properties for delete
  using (owner_user_id = auth.uid());

-- Scenes / hotspots follow property ownership or public active tour
create policy "scenes_select"
  on public.scenes for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = scenes.property_id
        and (p.owner_user_id = auth.uid() or p.status = 'active')
    )
  );

create policy "scenes_write_owner"
  on public.scenes for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = scenes.property_id and p.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = scenes.property_id and p.owner_user_id = auth.uid()
    )
  );

create policy "hotspots_select"
  on public.hotspots for select
  using (
    exists (
      select 1
      from public.scenes s
      join public.properties p on p.id = s.property_id
      where s.id = hotspots.scene_id
        and (p.owner_user_id = auth.uid() or p.status = 'active')
    )
  );

create policy "hotspots_write_owner"
  on public.hotspots for all
  using (
    exists (
      select 1
      from public.scenes s
      join public.properties p on p.id = s.property_id
      where s.id = hotspots.scene_id and p.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.scenes s
      join public.properties p on p.id = s.property_id
      where s.id = hotspots.scene_id and p.owner_user_id = auth.uid()
    )
  );
