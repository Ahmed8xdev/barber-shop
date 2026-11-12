export type HaircutLocale = "en" | "ar";

export type HaircutRequest = {
  query: string;
  category: string;
  page: number;
  limit: number;
  cmcontinue: string | undefined;
  locale: HaircutLocale;
};

export type HaircutRequestResult =
  | { ok: true; value: HaircutRequest }
  | { ok: false; error: string };

const CATEGORIES = new Set(["all", "hair", "beard", "packages", "facials"]);

function positiveIntegerParam(raw: string | null, fallback: number, max: number): number | null {
  if (raw === null || raw === "") return fallback;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed <= max ? parsed : null;
}

export function parseHaircutRequestParameters(params: URLSearchParams): HaircutRequestResult {
  const page = positiveIntegerParam(params.get("page"), 1, 1000);
  if (page === null) return { ok: false, error: "page must be an integer from 1 to 1000" };

  const limit = positiveIntegerParam(params.get("limit"), 15, 50);
  if (limit === null) return { ok: false, error: "limit must be an integer from 1 to 50" };

  const query = (params.get("query") || "").trim();
  if (query.length > 100) return { ok: false, error: "query must not exceed 100 characters" };

  const category = params.get("category") || "";
  if (category && !CATEGORIES.has(category)) {
    return { ok: false, error: "category must be all, hair, beard, packages, or facials" };
  }

  const locale = params.get("locale") || "en";
  if (locale !== "en" && locale !== "ar") {
    return { ok: false, error: "locale must be en or ar" };
  }

  const token = params.get("continue") || "";
  if (token.length > 1024) return { ok: false, error: "continue token is too long" };

  return {
    ok: true,
    value: {
      query,
      category,
      page,
      limit,
      cmcontinue: token || undefined,
      locale,
    },
  };
}
