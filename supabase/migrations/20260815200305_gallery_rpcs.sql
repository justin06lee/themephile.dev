-- Two operations that have to be atomic, so they live in the database rather
-- than as a read-then-write from the client.

/* ------------------------------------------------------------------ publish */

-- Slug allocation is a race by nature: two people publishing "Nord" in the
-- same second would both see the name as free. Catching unique_violation and
-- retrying inside one statement is the only version that's actually correct.
--
-- security invoker on purpose: auth.uid() stays the caller's, RLS still
-- applies, and the column grants above still bind. This function is a
-- convenience, not a privilege escalation.
create or replace function public.publish_theme(
  p_name       text,
  p_blurb      text,
  p_appearance text,
  p_colors     jsonb
)
returns public.themes
language plpgsql
security invoker
set search_path = public
as $$
declare
  base      text;
  candidate text;
  attempts  int := 0;
  result    themes;
begin
  if auth.uid() is null then
    raise exception 'Sign in to publish a theme.' using errcode = 'insufficient_privilege';
  end if;

  base := trim(both '-' from regexp_replace(lower(coalesce(p_name, '')), '[^a-z0-9]+', '-', 'g'));
  base := left(nullif(base, ''), 48);
  if base is null then
    base := 'theme';
  end if;

  candidate := base;
  loop
    begin
      insert into themes (author_id, slug, name, blurb, appearance, colors)
      values (
        auth.uid(),
        candidate,
        trim(p_name),
        nullif(trim(coalesce(p_blurb, '')), ''),
        p_appearance,
        p_colors
      )
      returning * into result;
      return result;
    exception when unique_violation then
      attempts := attempts + 1;
      if attempts > 8 then
        raise exception 'Could not find a free URL for that name — try a different one.';
      end if;
      candidate := left(base, 48) || '-' || substr(md5(random()::text), 1, 4);
    end;
  end loop;
end;
$$;

/* --------------------------------------------------------------------- like */

-- Returns the resulting state, so the client never has to guess whether its
-- optimistic update was right.
create or replace function public.toggle_like(p_theme_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to like a theme.' using errcode = 'insufficient_privilege';
  end if;

  delete from likes where theme_id = p_theme_id and user_id = auth.uid();
  if found then
    return false;
  end if;

  insert into likes (theme_id, user_id) values (p_theme_id, auth.uid());
  return true;
end;
$$;

revoke all on function public.publish_theme(text, text, text, jsonb) from anon, public;
revoke all on function public.toggle_like(uuid) from anon, public;
grant execute on function public.publish_theme(text, text, text, jsonb) to authenticated;
grant execute on function public.toggle_like(uuid) to authenticated;
