export type SupportedLocale = "en" | "ar";

/**
 * Choose between English and Arabic from HTTP Accept-Language preferences.
 * Respect q values rather than looking for an arbitrary ",ar" substring.
 */
export function preferredLocale(header: string | null | undefined): SupportedLocale {
  if (!header) return "en";
  let best: { locale: SupportedLocale; quality: number; index: number } | null = null;
  const entries = header.split(",");
  for (let index = 0; index < entries.length; index++) {
    const [tag, ...parameters] = entries[index].trim().split(";");
    const lower = tag.trim().toLowerCase();
    const locale = lower === "ar" || lower.startsWith("ar-")
      ? "ar"
      : lower === "en" || lower.startsWith("en-") ? "en" : null;
    if (!locale) continue;

    let quality = 1;
    for (const parameter of parameters) {
      const match = /^\s*q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)\s*$/i.exec(parameter);
      if (match) quality = Number(match[1]);
      else if (/^\s*q\s*=/i.test(parameter)) quality = 0;
    }
    if (quality === 0) continue;
    if (!best || quality > best.quality ||
      (quality === best.quality && index < best.index)) {
      best = { locale, quality, index };
    }
  }
  return best?.locale ?? "en";
}
