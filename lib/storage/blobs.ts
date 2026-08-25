import { getStore, type Store } from '@netlify/blobs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Storage lives in Netlify Blobs. On Netlify the runtime injects the site id
 * and token, so `getStore(name)` just works; off Netlify - a plain `next dev`,
 * a CI typecheck, the seed script - there is no such context, so we fall back
 * to a folder under .netlify/local-blobs that behaves the same way.
 *
 * The two backends are reached through one narrow interface, so no caller ever
 * branches on which is in play. Only the operations the app actually needs are
 * exposed; anything else would have to be implemented twice.
 */
export interface BlobBackend {
  getJSON<T>(key: string): Promise<T | null>;
  setJSON(key: string, value: unknown): Promise<void>;
  /**
   * Writes only if the key is free, reporting whether it won. This is the one
   * operation in here that is about contention rather than storage: it is what
   * lets two people clicking Buy on the same one-of-one canvas resolve to a
   * winner and a loser rather than to two checkouts. See lib/orders/holds.ts.
   */
  setJSONIfNew(key: string, value: unknown): Promise<boolean>;
  getBuffer(key: string): Promise<Buffer | null>;
  setBuffer(key: string, value: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

/** True when running inside a Netlify build, function, or edge context. */
function onNetlify(): boolean {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

class NetlifyBackend implements BlobBackend {
  constructor(private readonly store: Store) {}

  async getJSON<T>(key: string): Promise<T | null> {
    return ((await this.store.get(key, { type: 'json' })) as T | null) ?? null;
  }

  async setJSON(key: string, value: unknown): Promise<void> {
    await this.store.setJSON(key, value);
  }

  async setJSONIfNew(key: string, value: unknown): Promise<boolean> {
    // Netlify resolves the conditional server-side, so the check and the write
    // are one operation - two functions racing cannot both be told they won.
    const { modified } = await this.store.setJSON(key, value, { onlyIfNew: true });
    return modified;
  }

  async getBuffer(key: string): Promise<Buffer | null> {
    const data = (await this.store.get(key, { type: 'arrayBuffer' })) as ArrayBuffer | null;
    return data ? Buffer.from(data) : null;
  }

  async setBuffer(key: string, value: Buffer): Promise<void> {
    // A Buffer is a view over a pooled ArrayBuffer, so it has to be sliced to
    // its own bytes rather than handed over whole - otherwise the store would
    // receive whatever else Node happens to have parked in that pool.
    await this.store.set(
      key,
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer,
    );
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    const { blobs } = await this.store.list({ prefix });
    return blobs.map((blob) => blob.key);
  }
}

/**
 * Filesystem stand-in for local work. Keys can contain slashes, so they are
 * encoded rather than nested - that keeps `list` a flat directory read and
 * makes it impossible for a key to escape the store directory.
 */
class LocalBackend implements BlobBackend {
  constructor(private readonly dir: string) {}

  private file(key: string): string {
    return path.join(this.dir, encodeURIComponent(key));
  }

  private async ensure(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const buf = await this.getBuffer(key);
    return buf ? (JSON.parse(buf.toString('utf8')) as T) : null;
  }

  async setJSON(key: string, value: unknown): Promise<void> {
    await this.setBuffer(key, Buffer.from(JSON.stringify(value), 'utf8'));
  }

  async setJSONIfNew(key: string, value: unknown): Promise<boolean> {
    await this.ensure();
    try {
      // 'wx' is an exclusive create: the kernel refuses it if the file is
      // already there, which is the same win-or-lose answer Netlify gives.
      await writeFile(this.file(key), JSON.stringify(value), { flag: 'wx' });
      return true;
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'EEXIST') return false;
      throw cause;
    }
  }

  async getBuffer(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.file(key));
    } catch {
      return null;
    }
  }

  async setBuffer(key: string, value: Buffer): Promise<void> {
    await this.ensure();
    await writeFile(this.file(key), value);
  }

  async delete(key: string): Promise<void> {
    await rm(this.file(key), { force: true });
  }

  async list(prefix: string): Promise<string[]> {
    await this.ensure();
    const names = await readdir(this.dir);
    return names.map(decodeURIComponent).filter((key) => key.startsWith(prefix));
  }
}

const backends = new Map<string, BlobBackend>();

/** A named store, memoised so repeated calls in one request share a client. */
export function blobStore(name: string): BlobBackend {
  const existing = backends.get(name);
  if (existing) return existing;

  const backend = onNetlify()
    ? new NetlifyBackend(getStore({ name, consistency: 'strong' }))
    : new LocalBackend(path.join(process.cwd(), '.netlify', 'local-blobs', name));

  backends.set(name, backend);
  return backend;
}

/** Painting records, as JSON. See repository.ts: the whole catalog is one blob. */
export const RECORDS = 'paintings';
/** Photo bytes, one blob per uploaded image. */
export const MEDIA = 'media';
/** Paid orders, as JSON. See lib/orders/repository.ts. */
export const ORDERS = 'orders';
/**
 * Checkout reservations, one blob per painting rather than one document for
 * all of them: a hold has to be taken atomically against a single key, and a
 * shared document would serialise every piece against every other.
 */
export const HOLDS = 'holds';
