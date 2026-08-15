# Database

The theme gallery's schema. Everything else on the site runs without it.

SQLite, on [Turso](https://turso.tech). `migrations/` is the source of truth
and every file is written to be re-runnable (`create table if not exists`,
`create trigger if not exists`), so applying them twice is a no-op:

```bash
make db-push        # creates the database if needed, then applies every migration
make db-shell       # an interactive SQL shell
```

## What lives where

Three tables — `users`, `themes`, `likes`. Themes hold their palette as a JSON
text column of role id to `#rrggbb`.

**The browser never reaches this database.** The auth token is server-only, so
every read goes through a route handler or server component and every write
goes through a server action. That is why there is no row-level security here
and no per-column grants: there is no untrusted client on the other end of the
connection to defend against. Authorisation lives in `app/themes/actions.ts`,
and every action re-establishes who is asking rather than trusting that the UI
only rendered for the right person.

## Things that are load-bearing

`users.github_id` is the identity, not `username`. GitHub handles can be
renamed and the old one becomes available to someone else; matching on the
handle would eventually hand one person's themes to another.

`themes.like_count` is denormalized so "most liked" is an index scan instead of
a join and count on every page view. Two triggers maintain it, and nothing else
writes it.

`updated_at` is set by the application, not by a trigger. An `AFTER UPDATE`
trigger would also fire for the `like_count` writes, and a like is not an edit —
the sitemap publishes this value as `<lastmod>`, so it has to keep meaning
"the theme changed".

Palette validation is a trigger rather than a `CHECK`, because SQLite's `CHECK`
constraints cannot contain subqueries and validating "every value matches
`#rrggbb`" needs `json_each`.

Deleting a theme removes its likes explicitly, in a batch, rather than relying
on `ON DELETE CASCADE`: SQLite only enforces foreign keys when
`PRAGMA foreign_keys` is on, which is a per-connection setting we do not
control over HTTP.
