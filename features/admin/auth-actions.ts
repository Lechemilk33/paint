'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { verifyPassword } from '@/lib/auth/password';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth/session';

const signInSchema = z.object({
  password: z.string().min(1, 'Enter the password'),
});

export interface SignInState {
  error: string | null;
}

/**
 * The single gate into the admin. There is no user table and no lockout: one
 * shared password, checked against a scrypt hash held in the environment.
 *
 * Failures are deliberately identical whether the password was wrong or the
 * server is misconfigured in a way that makes any password fail, so the form
 * gives nothing away. The distinguishing detail goes to the server log.
 */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({ password: formData.get('password') });
  if (!parsed.success) {
    return { error: 'Enter the password' };
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    console.error('ADMIN_PASSWORD_HASH is not set; no one can sign in.');
    return { error: 'That password is not right' };
  }

  if (!(await verifyPassword(parsed.data.password, hash))) {
    return { error: 'That password is not right' };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  redirect('/admin');
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/admin/login');
}
