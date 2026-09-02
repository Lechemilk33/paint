'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import type { Painting } from '@/lib/paintings/schema';

const STORAGE_KEY = 'voltage-reef:held';

/** Stable empty snapshot: the server has no storage, and returning a fresh []
 *  each call would loop useSyncExternalStore. */
const EMPTY: readonly string[] = [];

const listeners = new Set<() => void>();

/** Cached client snapshot. `null` means "not read from storage yet"; every read
 *  path goes through getSnapshot so the reference only changes on a real write. */
let snapshot: readonly string[] | null = null;

function readStorage(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed.filter((id): id is string => typeof id === 'string');
    return ids.length > 0 ? ids : EMPTY;
  } catch {
    // Private-mode or corrupt storage is not worth breaking the shop over.
    return EMPTY;
  }
}

function getSnapshot(): readonly string[] {
  snapshot ??= readStorage();
  return snapshot;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // A second tab writing the same key invalidates this tab's cache, so a hold
  // taken in one window shows up in the other.
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = null;
    listeners.forEach((notify) => notify());
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function write(next: readonly string[]): void {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage being unavailable only costs persistence, not the session.
  }
  listeners.forEach((notify) => notify());
}

interface CartValue {
  /** Ids of the pieces currently held, oldest first. */
  held: readonly string[];
  /** The catalog, so the sheet can resolve held ids without its own fetch. */
  paintings: Painting[];
  isHeld: (paintingId: string) => boolean;
  hold: (paintingId: string) => void;
  release: (paintingId: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartValue | null>(null);

/**
 * The hold list.
 *
 * Every piece is a unique original, so this is a set of ids rather than a
 * quantity map: a painting is either held or it is not, and "add two" is not a
 * state the shop can be in. localStorage is the source of truth, read through
 * useSyncExternalStore so the server renders the empty list, hydration matches,
 * and the stored holds arrive on the first client snapshot.
 */
export function CartProvider({
  paintings,
  children,
}: {
  paintings: Painting[];
  children: React.ReactNode;
}) {
  const held = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setOpen] = useState(false);

  const hold = useCallback((paintingId: string) => {
    const current = getSnapshot();
    if (current.includes(paintingId)) return;
    write([...current, paintingId]);
  }, []);

  const release = useCallback((paintingId: string) => {
    write(getSnapshot().filter((id) => id !== paintingId));
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  const value = useMemo<CartValue>(
    () => ({
      held,
      paintings,
      isHeld: (paintingId: string) => held.includes(paintingId),
      hold,
      release,
      clear,
      isOpen,
      setOpen,
    }),
    [held, paintings, hold, release, clear, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside a CartProvider');
  return value;
}
