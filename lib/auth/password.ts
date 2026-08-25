import 'server-only';
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

// promisify resolves to the 3-argument overload, which drops the options
// parameter we need to pin the cost factors. Assert the overload we actually use.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * scrypt from Node's own crypto, rather than bcrypt or argon2. Both of those
 * ship native bindings, which is a liability in a serverless bundle; scrypt is
 * memory-hard, built in, and entirely adequate for gating a single admin
 * account. Cost parameters are stored alongside the hash so raising them later
 * does not invalidate existing credentials.
 */
const KEYLEN = 64;
const COST = 2 ** 15;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;

/**
 * `scrypt:N:r:p:salt:hash`, all hex - one self-describing string to store.
 *
 * The PHC convention is to delimit with `$`, but this value spends its life in
 * .env files and hosting dashboards, where `$` triggers variable expansion and
 * silently eats every field. A colon survives all of them.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize('NFKC'), salt, KEYLEN, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    maxmem: 256 * 1024 * 1024,
  });
  return [
    'scrypt',
    COST,
    BLOCK_SIZE,
    PARALLELISM,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join(':');
}

/**
 * Constant-time verification. Returns false for a malformed stored hash rather
 * than throwing, so a misconfigured deployment fails closed at the login form
 * instead of surfacing a 500 that hints at the cause.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, cost, blockSize, parallelism, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const derived = await scryptAsync(password.normalize('NFKC'), salt, expected.length, {
      N: Number(cost),
      r: Number(blockSize),
      p: Number(parallelism),
      maxmem: 256 * 1024 * 1024,
    });
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
