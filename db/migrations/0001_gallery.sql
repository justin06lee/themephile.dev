-- themephile gallery — SQLite (Turso/libSQL).
--
-- The browser never reaches this database. The auth token is server-only, so
-- every read and write goes through a route handler or a server action, and
-- authorisation is enforced there rather than by row-level policies. That is
-- the whole reason this schema is so much smaller than a Postgres one would
-- be: there is no untrusted client to defend against at the SQL layer.

create table if not exists users (
  -- Our own id, so nothing downstream depends on GitHub's numbering.
  id         text primary key,
  -- GitHub's numeric id, not the handle: handles can be renamed and reused,
  -- and re-linking an account by name would hand someone else's themes over.
  github_id  integer not null unique,
  username   text not null,
  avatar_url text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists themes (
  id         text primary key,
  author_id  text not null references users(id) on delete cascade,
  slug       text not null unique,
  name       text not null,
  blurb      text,
  appearance text not null check (appearance in ('dark', 'light')),
  -- A JSON object of role id -> #rrggbb. Validated by trigger below, since
  -- SQLite CHECK constraints cannot contain subqueries.
  colors     text not null,
  like_count integer not null default 0 check (like_count >= 0),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists themes_ranked on themes (like_count desc, created_at desc);
create index if not exists themes_recent on themes (created_at desc);
create index if not exists themes_author on themes (author_id);
create index if not exists themes_slug   on themes (slug);

create table if not exists likes (
  theme_id   text not null references themes(id) on delete cascade,
  user_id    text not null references users(id) on delete cascade,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (theme_id, user_id)
);

create index if not exists likes_user on likes (user_id);

-- like_count is denormalized so "most liked" is an index scan rather than a
-- join and count on every page view. Maintained here so it cannot drift from
-- the rows it summarises.
create trigger if not exists likes_increment after insert on likes begin
  update themes set like_count = like_count + 1 where id = new.theme_id;
end;

create trigger if not exists likes_decrement after delete on likes begin
  update themes set like_count = max(0, like_count - 1) where id = old.theme_id;
end;

-- `updated_at` is set explicitly by the application rather than by a trigger:
-- an AFTER UPDATE trigger would also fire for the like_count writes above, and
-- a like is not an edit. The sitemap publishes this value as <lastmod>, so it
-- has to mean "the theme changed".

-- A ceiling, so one account cannot paper the gallery.
create trigger if not exists themes_quota before insert on themes begin
  select case
    when (select count(*) from themes where author_id = new.author_id) >= 60
    then raise(abort, 'You have reached the limit of 60 published themes.')
  end;
end;

-- Palette validation. The server is the only writer, but a bug in an action
-- should not be able to store something the renderer will choke on, and
-- "it is checked in one place" is easier to verify than "it is checked at
-- every call site".
create trigger if not exists themes_palette_insert before insert on themes begin
  select case
    when json_valid(new.colors) = 0
      then raise(abort, 'colors must be valid JSON')
    when json_type(new.colors) <> 'object'
      then raise(abort, 'colors must be a JSON object')
    when (select count(*) from json_each(new.colors)) not between 8 and 96
      then raise(abort, 'colors must hold between 8 and 96 roles')
    when exists (
      select 1 from json_each(new.colors)
      where json_each.type <> 'text'
         or json_each.value not glob '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]'
    )
      then raise(abort, 'every colour must be a lowercase #rrggbb string')
  end;
end;

create trigger if not exists themes_palette_update before update of colors on themes begin
  select case
    when json_valid(new.colors) = 0
      then raise(abort, 'colors must be valid JSON')
    when json_type(new.colors) <> 'object'
      then raise(abort, 'colors must be a JSON object')
    when (select count(*) from json_each(new.colors)) not between 8 and 96
      then raise(abort, 'colors must hold between 8 and 96 roles')
    when exists (
      select 1 from json_each(new.colors)
      where json_each.type <> 'text'
         or json_each.value not glob '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]'
    )
      then raise(abort, 'every colour must be a lowercase #rrggbb string')
  end;
end;
