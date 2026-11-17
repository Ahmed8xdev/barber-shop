export interface FallbackLayer<T> {
  name: string;
  fetch: () => Promise<T[]>;
  timeoutMs?: number;
}

/**
 * Use each provider at most once, accepting the first result meeting the
 * threshold or the largest partial response when every provider falls short.
 */
export async function fallbackChain<T>(
  layers: FallbackLayer<T>[],
  minItems: number = 1
): Promise<{ data: T[]; source: string }> {
  if (!Number.isSafeInteger(minItems) || minItems < 1) {
    throw new RangeError("minItems must be a positive integer");
  }
  if (layers.length === 0) return { data: [], source: "none" };

  let best: { data: T[]; source: string } | null = null;
  const errors: Error[] = [];

  for (const layer of layers) {
    try {
      const timeoutMs = layer.timeoutMs ?? 8000;
      // Never retry the final layer outside the loop or issue duplicate
      // upstream requests when all providers return insufficient results.
      const result = await withTimeout(layer.fetch(), timeoutMs);
      if (!Array.isArray(result)) {
        throw new TypeError(`${layer.name} returned a non-array result`);
      }
      if (result.length >= minItems) return { data: result, source: layer.name };
      if (!best || result.length > best.data.length) {
        best = { data: result, source: layer.name };
      }
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  if (best) return best;
  if (errors.length) throw new AggregateError(errors, "All fallback providers failed");
  return { data: [], source: "none" };
}

/**
 * Promise.race enforces a deadline on our wait, even when a provider never
 * settles. The provider itself must support AbortSignal for cancellation.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new RangeError("Timeout must be a positive duration");
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Provider timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function logFallbackError(source: string, error: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[fallback] ${source}:`, error instanceof Error ? error.message : error);
  }
}
