-- themephile gallery: profiles, themes, likes.
--
-- The editor never touches any of this. Reading the gallery is anonymous;
-- only publishing and liking need an identity, which is why every policy
-- below is "select is public, writes are yours alone".

create extension if not exists pg_trgm;

/* ---------------------------------------------------------------- profiles */

create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text not null check (char_length(username) between 1 and 39),
  avatar_url text check (char_length(avatar_url) <= 512),
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'GitHub identity, mirrored on first sign-in. Public by design: a gallery of "Anonymous" is a dead gallery.';

/* ------------------------------------------------------------------ themes */

-- A palette is 48 role ids to #rrggbb. Validated in the database as well as
-- the client, because RLS lets any signed-in user write here and "authenticated"
-- is not the same as "well-behaved".
create or replace function public.is_palette(colors jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(colors) = 'object'
     and (select count(*) from jsonb_object_keys(colors)) between 8 and 96
     and not exists (
       select 1 from jsonb_each_text(colors) as kv
       where kv.value !~ '^#[0-9a-f]{6}$'
     );
$$;

create table public.themes (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  name        text not null check (char_length(trim(name)) between 1 and 48),
  blurb       text check (char_length(blurb) <= 140),
  appearance  text not null check (appearance in ('dark', 'light')),
  colors      jsonb not null check (public.is_palette(colors)),
  like_count  integer not null default 0 check (like_count >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index themes_ranked_idx  on public.themes (like_count desc, created_at desc);
create index themes_recent_idx  on public.themes (created_at desc);
create index themes_author_idx  on public.themes (author_id);
create index themes_name_trgm   on public.themes using gin (name gin_trgm_ops);

/* ------------------------------------------------------------------- likes */

create table public.likes (
  theme_id   uuid not null references public.themes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (theme_id, user_id)
);

create index likes_user_idx on public.likes (user_id);

/* --------------------------------------------------------------- behaviour */

-- Mirror the GitHub identity Supabase hands us into a readable profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'user_name', ''),
      nullif(new.raw_user_meta_data ->> 'preferred_username', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      'someone'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- like_count is denormalized so "most liked" can be an index scan. It is
-- maintained here and nowhere else; clients have no column grant on it.
create or replace function public.sync_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update themes set like_count = like_count + 1 where id = new.theme_id;
    return new;
  end if;
  update themes set like_count = greatest(0, like_count - 1) where id = old.theme_id;
  return old;
end;
$$;

create trigger likes_sync_count
  after insert or delete on public.likes
  for each row execute function public.sync_like_count();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger themes_touch_updated_at
  before update on public.themes
  for each row execute function public.touch_updated_at();

-- A ceiling, so one account can't paper the gallery.
create or replace function public.enforce_theme_quota()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from themes where author_id = new.author_id) >= 60 then
    raise exception 'You have reached the limit of 60 published themes.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger themes_quota
  before insert on public.themes
  for each row execute function public.enforce_theme_quota();

/* ----------------------------------------------------------------- privileges */

-- Column-level grants, not just RLS. RLS decides which *rows* you may touch;
-- these decide which *columns*, which is what keeps an author from setting
-- their own like_count to 9999 on a row they legitimately own.

alter table public.profiles enable row level security;
alter table public.themes   enable row level security;
alter table public.likes    enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.themes   from anon, authenticated;
revoke all on public.likes    from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update (username, avatar_url) on public.profiles to authenticated;

grant select on public.themes to anon, authenticated;
grant insert (author_id, slug, name, blurb, appearance, colors) on public.themes to authenticated;
grant update (name, blurb, appearance, colors) on public.themes to authenticated;
grant delete on public.themes to authenticated;

grant select on public.likes to anon, authenticated;
grant insert (theme_id, user_id) on public.likes to authenticated;
grant delete on public.likes to authenticated;

/* -------------------------------------------------------------------- RLS */

create policy "profiles are public"       on public.profiles for select using (true);
create policy "update your own profile"   on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "themes are public"         on public.themes for select using (true);
create policy "publish as yourself"       on public.themes for insert
  with check (auth.uid() = author_id);
create policy "edit your own themes"      on public.themes for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "delete your own themes"    on public.themes for delete
  using (auth.uid() = author_id);

create policy "likes are public"          on public.likes for select using (true);
create policy "like as yourself"          on public.likes for insert
  with check (auth.uid() = user_id);
create policy "unlike your own"           on public.likes for delete
  using (auth.uid() = user_id);
