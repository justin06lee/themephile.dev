# Database

The theme gallery's schema. Everything else on the site runs without it.

`migrations/` is the source of truth and matches what is applied to the live
project — the versions here are the same versions the remote reports:

```
20260815200248  gallery_schema
20260815200305  gallery_rpcs
20260815200329  harden_functions_and_extensions
```

## Setting up your own

```bash
bunx supabase link --project-ref <your-ref>
bunx supabase db push
```

Then enable the GitHub provider under **Authentication → Providers** and set
**Site URL** and **Redirect URLs** under **Authentication → URL Configuration**.
Those two are dashboard-only settings; there is no API for creating a GitHub
OAuth App, so this part cannot be scripted.

## Design notes

Row-level security decides which *rows* you may touch. Column-level grants
decide which *columns* — that distinction is load-bearing here, because
`like_count` lives on a row its author legitimately owns, and only the
`SECURITY DEFINER` trigger on `likes` is allowed to write it.

After any DDL change, run the linter (`get_advisors`, or **Advisors** in the
dashboard). It is what caught the exposed trigger functions and the mutable
`search_path` that migration three fixes.
