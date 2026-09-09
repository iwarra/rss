import {
  DEFAULT_ARTICLE_PAGE_SIZE,
  MAX_ARTICLE_PAGE_SIZE,
  type ArticleQuery,
} from "./types";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_FILTER_PARAMS,
  type ArticleCategory,
} from "@/shared/types";

export class InvalidArticleQueryError extends Error {}

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
  if (value === null || value === "") return undefined;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(
    isDateOnly && endOfDay ? `${value}T00:00:00.000Z` : value,
  );

  if (
    Number.isNaN(date.getTime()) ||
    (isDateOnly && date.toISOString().slice(0, 10) !== value)
  ) {
    throw new InvalidArticleQueryError(
      `${name} must be a valid ISO date or timestamp.`,
    );
  }

  if (endOfDay && isDateOnly) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date;
}

function parseCategory(searchParams: URLSearchParams): ArticleCategory | undefined {
  const category = searchParams.get(ARTICLE_FILTER_PARAMS.category)?.trim();
  if (!category) return undefined;

  if (!(ARTICLE_CATEGORIES as readonly string[]).includes(category)) {
    throw new InvalidArticleQueryError("category must be a predefined category.");
  }

  return category as ArticleCategory;
}

/**
 * Supports page (default 1), limit (default 20, maximum 100), feedId,
 * category, startDate (inclusive), and endDate (inclusive for date-only
 * values, exclusive for timestamps).
 */
export function parseArticleQuery(
  searchParams: URLSearchParams,
): ArticleQuery {
  const startDate = parseDate(searchParams, ARTICLE_FILTER_PARAMS.startDate);
  const endDate = parseDate(searchParams, ARTICLE_FILTER_PARAMS.endDate, true);

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
    feedId: searchParams.has(ARTICLE_FILTER_PARAMS.feedId)
      ? parsePositiveInteger(searchParams, ARTICLE_FILTER_PARAMS.feedId)
      : undefined,
    category: parseCategory(searchParams),
    startDate,
    endDate,
  };
}
