import "server-only";
import { cookies } from "next/headers";
import { SESSION_SECRET } from "@/lib/env";

/**
 * A stateless, signed session cookie.
 *
 * Turso is a database, not an auth service, so sessions are ours to write.
 * This is deliberately the smallest thing that works: an HMAC-SHA256 signature
 * over a JSON payload, no session table, no server-side store. The trade is
 * that a session cannot be revoked before it expires — acceptable for a cookie
 * that only authorises publishing a colour scheme, and worth the round trip it
 * saves on every request.
 *
 * Web Crypto rather than a dependency: `crypto.subtle.verify` is constant-time,
 * which is the one property a hand-rolled comparison usually gets wrong.
 */

export type Session = {
  userId: string;
  username: string;
  avatarUrl: string | null;
};

type Payload = Session & { exp: number };

const COOKIE = "tp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function signingKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function seal(session: Session): Promise<string> {
  const payload: Payload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    encoder.encode(body),
  );
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function unseal(token: string): Promise<Session | null> {
  try {
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      fromBase64Url(signature) as unknown as ArrayBuffer,
      encoder.encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as Payload;

    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.userId !== "string" || !payload.userId) return null;

    return {
      userId: payload.userId,
      username: String(payload.username ?? ""),
      avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl : null,
    };
  } catch {
    return null;
  }
}

/** The signed-in person, or null. Safe to call from anywhere on the server. */
export async function getSession(): Promise<Session | null> {
  if (!SESSION_SECRET) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? unseal(token) : null;
}

export async function startSession(session: Session): Promise<void> {
  (await cookies()).set(COOKIE, await seal(session), {
    httpOnly: true,
    // Lax, not Strict: the OAuth callback is a top-level navigation from
    // github.com, and Strict would withhold the cookie on that first hop.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
