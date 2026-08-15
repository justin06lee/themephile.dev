import "server-only";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "@/lib/env";

/**
 * The GitHub OAuth web flow, by hand.
 *
 * Sixty lines, and no dependency: send the user to GitHub with a `state` we
 * can recognise, trade the returned `code` for a token, then ask who they
 * are. The token is used once and thrown away — we store the
 * GitHub id, handle and avatar, and nothing else. No `scope` is requested, so
 * the grant covers only public profile data.
 */

export type GitHubUser = {
  githubId: number;
  username: string;
  avatarUrl: string | null;
};

export function authorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    // No scope: the default grant is public read-only profile data, which is
    // all a gallery byline needs. Asking for more would be rude and riskier.
    scope: "",
    allow_signup: "true",
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<string | null> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  // GitHub answers 200 with `{ error: "bad_verification_code" }` rather than a
  // 4xx, so the status alone is not enough to tell success from failure.
  const body = (await response.json()) as { access_token?: string; error?: string };
  return body.access_token ?? null;
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser | null> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "themephile",
    },
    cache: "no-store",
  });
  if (!response.ok) return null;

  const body = (await response.json()) as {
    id?: number;
    login?: string;
    avatar_url?: string;
  };
  if (typeof body.id !== "number" || typeof body.login !== "string") return null;

  return {
    githubId: body.id,
    username: body.login,
    avatarUrl: typeof body.avatar_url === "string" ? body.avatar_url : null,
  };
}
