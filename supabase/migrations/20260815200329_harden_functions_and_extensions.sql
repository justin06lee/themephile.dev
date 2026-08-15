-- Supabase exposes every function in `public` at /rest/v1/rpc/<name>. Trigger
-- functions have no business being callable there, and two of ours are
-- SECURITY DEFINER, so they'd run as the owner. Calling them without a trigger
-- context would error out rather than do damage, but "fails loudly" is not a
-- security boundary — revoke the grant instead.
--
-- All four findings here came from Supabase's own database linter; re-run it
-- after any DDL change with the `get_advisors` tool.
revoke all on function public.handle_new_user()  from anon, authenticated, public;
revoke all on function public.sync_like_count()  from anon, authenticated, public;
revoke all on function public.touch_updated_at() from anon, authenticated, public;
revoke all on function public.enforce_theme_quota() from anon, authenticated, public;

-- A mutable search_path in a function that other roles can influence is the
-- classic Postgres privilege-escalation shape. Pin both.
create or replace function public.is_palette(colors jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(colors) = 'object'
     and (select count(*) from pg_catalog.jsonb_object_keys(colors)) between 8 and 96
     and not exists (
       select 1 from pg_catalog.jsonb_each_text(colors) as kv
       where kv.value !~ '^#[0-9a-f]{6}$'
     );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Keep the API surface (`public`) free of extension objects.
drop index if exists public.themes_name_trgm;
alter extension pg_trgm set schema extensions;
create index themes_name_trgm
  on public.themes using gin (name extensions.gin_trgm_ops);
