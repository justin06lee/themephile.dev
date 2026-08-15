import "server-only";
import type { GitHubUser } from "@/lib/auth/github";
import { asText, db } from "@/lib/db/client";

export type AppUser = { id: string; username: string; avatarUrl: string | null };

/**
 * Keyed on the GitHub numeric id, never the handle. Handles can be renamed and
 * the old one becomes available to someone else — matching on it would
 * eventually hand one person's themes to another.
 */
export async function upsertUser(profile: GitHubUser): Promise<AppUser> {
  const result = await db().execute({
    sql: `insert into users (id, github_id, username, avatar_url)
          values (?, ?, ?, ?)
          on conflict(github_id) do update set
            username   = excluded.username,
            avatar_url = excluded.avatar_url
          returning id`,
    args: [crypto.randomUUID(), profile.githubId, profile.username, profile.avatarUrl],
  });

  return {
    id: asText(result.rows[0].id),
    username: profile.username,
    avatarUrl: profile.avatarUrl,
  };
}
