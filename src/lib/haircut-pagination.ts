/** Keep the first item for every stable ID when paginated APIs repeat entries. */
export function appendUniqueById<T extends { id: string }>(previous: T[], incoming: T[]): T[] {
  const seen = new Set(previous.map(item => item.id));
  const additions: T[] = [];
  for (const item of incoming) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    additions.push(item);
  }
  return additions.length > 0 ? [...previous, ...additions] : previous;
}

/** Stop pagination if a source fails to advance its continuation token. */
export function nextPageCursor(current: string, proposed: unknown, itemCount: number): string {
  if (itemCount < 1 || typeof proposed !== "string" || !proposed || proposed === current) return "";
  return proposed;
}
