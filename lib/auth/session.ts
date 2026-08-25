import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * The admin session is a signed JWT in an httpOnly cookie. There is exactly
 * one account, so the token carries no identity beyond "this browser proved it
 * knows the password" - which keeps it useless if it leaks anywhere that
 * cannot also set cookies on this origin.
 *
 * `jose` rather than `jsonwebtoken` because middleware runs on the Edge
 * runtime, where Node's crypto module is not available.
 */
export const SESSION_COOKIE = 'vr_session';
const ISSUER = 'voltage-reef';
const AUDIENCE = 'voltage-reef-admin';
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Set it to at least 32 random characters.',
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** Verifies signature, issuer, audience, and expiry. Never throws. */
export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey(), { issuer: ISSUER, audience: AUDIENCE });
    return true;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: MAX_AGE_SECONDS,
} as const;

/** Whether the current request carries a valid admin session. */
export async function isSignedIn(): Promise<boolean> {
  const jar = await cookies();
  return isValidSessionToken(jar.get(SESSION_COOKIE)?.value);
}
