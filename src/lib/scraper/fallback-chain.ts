export interface FallbackLayer<T> {
  name: string;
  fetch: () => Promise<T[]>;
  timeoutMs?: number;
}

export async function fallbackChain<T>(
  layers: FallbackLayer<T>[],
  minItems: number = 1
): Promise<{ data: T[]; source: string }> {
  const errors: string[] = [];

  for (const layer of layers) {
    try {
      const result = await withTimeout(layer.fetch(), layer.timeoutMs || 8000);
      if (result.length >= minItems) {
        return { data: result, source: layer.name };
      }
      errors.push(`${layer.name}: returned ${result.length} items (need ${minItems})`);
    } catch (err) {
      errors.push(`${layer.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const lastLayer = layers[layers.length - 1];
  const lastResult = await withTimeout(lastLayer.fetch(), lastLayer.timeoutMs || 8000);
  return { data: lastResult, source: lastLayer.name };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const result = await promise;
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export function logFallbackError(source: string, error: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[fallback] ${source}:`, error instanceof Error ? error.message : error);
  }
}
