import { ProviderError } from "./errors";

/**
 * Serialises calls so that at most one starts every `minIntervalMs`
 * (TikWM free tier ≈ 1 request / second). Rejects when the queue is too long
 * instead of letting requests pile up.
 */
export function createThrottle(minIntervalMs: number, maxQueue = 25) {
  let chain: Promise<void> = Promise.resolve();
  let last = 0;
  let queued = 0;
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (queued >= maxQueue) throw new ProviderError("rate_limited", "Server sedang sibuk. Coba lagi sebentar.");
    queued++;
    const slot = chain.then(async () => {
      const wait = last + minIntervalMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();
    });
    chain = slot.catch(() => undefined);
    try {
      await slot;
    } finally {
      queued--;
    }
    return fn();
  };
}
