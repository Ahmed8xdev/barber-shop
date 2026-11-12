/** A missing conversion must be represented as unavailable, never 1:1. */
export function getUsdRate(
  currency: string,
  rates: Record<string, number> | null | undefined,
): number | null {
  if (currency === "USD") return 1;
  const value = rates?.[currency];
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

/** Accept only plausible, USD-based provider responses. */
export function parseUsdRates(
  candidate: unknown,
  reportedBase?: string,
): Record<string, number> | null {
  if (reportedBase && reportedBase.toUpperCase() !== "USD") return null;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;

  const input = candidate as Record<string, unknown>;
  const rawUsd = input.USD;
  if (rawUsd !== undefined &&
      (typeof rawUsd !== "number" || !Number.isFinite(rawUsd) || Math.abs(rawUsd - 1) > 0.01)) {
    return null;
  }

  const result: Record<string, number> = { USD: 1 };
  for (const [code, value] of Object.entries(input)) {
    if (!/^[A-Z]{3}$/.test(code) || code === "USD") continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
    result[code] = value;
  }
  return Object.keys(result).length >= 11 ? result : null;
}
