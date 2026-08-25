/**
 * Prints a fresh admin password, its hash, and a session secret.
 *
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/make-credentials.ts
 *
 * Only the hash and the secret are ever stored; the password itself exists in
 * the output of this command and nowhere else, so copy it before closing.
 */
import { randomBytes } from 'node:crypto';
import { hashPassword } from '@/lib/auth/password';

const WORDS = [
  'reef', 'spine', 'voltage', 'puffer', 'cobalt', 'acid',
  'magenta', 'canvas', 'studio', 'signal', 'current', 'spark',
];

/** Four random words plus digits: easy to retype, far past guessable. */
function makePassword(): string {
  const bytes = randomBytes(4);
  const words = Array.from(bytes, (byte) => WORDS[byte % WORDS.length]);
  return [...words, randomBytes(2).toString('hex')].join('-');
}

async function main(): Promise<void> {
  const password = makePassword();
  console.log('ADMIN_PASSWORD (save this, it is not stored anywhere):');
  console.log(`  ${password}\n`);
  console.log('Set these on the site:');
  console.log(`  ADMIN_PASSWORD_HASH=${await hashPassword(password)}`);
  console.log(`  AUTH_SECRET=${randomBytes(32).toString('base64url')}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
