/**
 * Versioned, validated localStorage store compatible with useSyncExternalStore.
 * - corrupt JSON → falls back to default (and is overwritten on next write)
 * - unknown schema version → migrate() or reset
 * - cross-tab sync via the `storage` event
 */
export interface LocalStore<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
  getServerSnapshot(): T;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LocalStoreOptions<T> {
  key: string;
  version: number;
  fallback: T;
  /** Return a valid value or null when the stored data is invalid. */
  validate: (data: unknown) => T | null;
  migrate?: (data: unknown, fromVersion: number) => T | null;
  storage?: () => StorageLike | null;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // e.g. Safari private mode / disabled storage
  }
}

export function readEnvelope<T>(raw: string | null, opts: LocalStoreOptions<T>): T {
  if (!raw) return opts.fallback;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return opts.fallback;
  }
  if (typeof parsed !== "object" || parsed === null || !("v" in parsed) || !("data" in parsed)) return opts.fallback;
  const env = parsed as { v: unknown; data: unknown };
  if (env.v === opts.version) return opts.validate(env.data) ?? opts.fallback;
  if (typeof env.v === "number" && opts.migrate) return opts.migrate(env.data, env.v) ?? opts.fallback;
  return opts.fallback;
}

export function createLocalStore<T>(opts: LocalStoreOptions<T>): LocalStore<T> {
  const getStorage = opts.storage ?? defaultStorage;
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T } | null = null;

  const read = (): T => {
    const storage = getStorage();
    let raw: string | null = null;
    try {
      raw = storage?.getItem(opts.key) ?? null;
    } catch {
      raw = null;
    }
    if (cache && cache.raw === raw) return cache.value; // stable reference for React
    const value = readEnvelope(raw, opts);
    cache = { raw, value };
    return value;
  };

  const emit = () => listeners.forEach((l) => l());

  return {
    get: read,
    getServerSnapshot: () => opts.fallback,
    set(next) {
      const prev = read();
      const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      const raw = JSON.stringify({ v: opts.version, data: value });
      try {
        getStorage()?.setItem(opts.key, raw);
        cache = { raw, value };
      } catch {
        cache = { raw: cache?.raw ?? null, value }; // quota exceeded: keep in memory for this session
      }
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === opts.key) listener();
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
  };
}
