import {
  DEFAULT_ARTICLE_PAGE_SIZE,
  getArticles,
  MAX_ARTICLE_PAGE_SIZE,
} from "@/server/articles/repository";

class InvalidArticleQueryError extends Error {}

function parsePositiveInteger(
  searchParams: URLSearchParams,
  name: string,
  defaultValue?: number,
  maximum?: number,
) {
  const value = searchParams.get(name);

  if (value === null && defaultValue !== undefined) {
    return defaultValue;
  }

  if (!value || !/^\d+$/.test(value)) {
    throw new InvalidArticleQueryError(`${name} must be a positive integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new InvalidArticleQueryError(`${name} must be a positive integer.`);
  }

  if (maximum !== undefined && parsed > maximum) {
    throw new InvalidArticleQueryError(`${name} must be at most ${maximum}.`);
  }

  return parsed;
}

function parseDate(
  searchParams: URLSearchParams,
  name: string,
  endOfDay = false,
) {
  const value = searchParams.get(name);
  if (value === null) return undefined;

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) && endOfDay
      ? `${value}T00:00:00.000Z`
      : value,
  );

  if (Number.isNaN(date.getTime())) {
    throw new InvalidArticleQueryError(
      `${name} must be a valid ISO date or timestamp.`,
    );
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date;
}

function parseArticleQuery(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const category = searchParams.get("category");
  const startDate = parseDate(searchParams, "startDate");
  const endDate = parseDate(searchParams, "endDate", true);

  if (category !== null && category.trim() === "") {
    throw new InvalidArticleQueryError("category must not be empty.");
  }

  if (startDate !== undefined && endDate !== undefined && startDate >= endDate) {
    throw new InvalidArticleQueryError(
      "startDate must be earlier than endDate.",
    );
  }

  return {
    page: parsePositiveInteger(searchParams, "page", 1),
    limit: parsePositiveInteger(
      searchParams,
      "limit",
      DEFAULT_ARTICLE_PAGE_SIZE,
      MAX_ARTICLE_PAGE_SIZE,
    ),
    feedId: searchParams.has("feedId")
      ? parsePositiveInteger(searchParams, "feedId")
      : undefined,
    category: category ?? undefined,
    startDate,
    endDate,
  };
}

/**
 * Supports page (default 1), limit (default 20, maximum 100), feedId,
 * category, startDate (inclusive), and endDate (inclusive for date-only
 * values, exclusive for timestamps).
 */
export async function GET(request: Request) {
  try {
    return Response.json(await getArticles(parseArticleQuery(request)));
  } catch (error) {
    if (error instanceof InvalidArticleQueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
