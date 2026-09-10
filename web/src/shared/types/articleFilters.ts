export const ARTICLE_FILTER_PARAMS = {
  feed: "feed",
  category: "category",
  startDate: "startDate",
  endDate: "endDate",
} as const;

export const ARTICLE_PAGE_PARAM = "page";

export type ArticleFilterName = keyof typeof ARTICLE_FILTER_PARAMS;

export type ArticleFilterValues = Record<ArticleFilterName, string>;

export type ArticleSearchParams = Record<string, string | string[] | undefined>;

export function toUrlSearchParams(
  searchParams: ArticleSearchParams,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [name, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(name, item);
    } else if (value !== undefined) {
      params.set(name, value);
    }
  }

  return params;
}

export function articleFilterValuesFromSearchParams(
  searchParams: URLSearchParams,
): ArticleFilterValues {
  return {
    feed: searchParams.get(ARTICLE_FILTER_PARAMS.feed) ?? "",
    category: searchParams.get(ARTICLE_FILTER_PARAMS.category) ?? "",
    startDate: searchParams.get(ARTICLE_FILTER_PARAMS.startDate) ?? "",
    endDate: searchParams.get(ARTICLE_FILTER_PARAMS.endDate) ?? "",
  };
}

export function serializeArticleFilterValues(
  values: ArticleFilterValues,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const name of Object.keys(
    ARTICLE_FILTER_PARAMS,
  ) as ArticleFilterName[]) {
    const value = values[name].trim();
    if (value) params.set(ARTICLE_FILTER_PARAMS[name], value);
  }

  return params;
}

export function serializeArticleListQuery(
  filters: ArticleFilterValues,
  page = 1,
): URLSearchParams {
  const params = serializeArticleFilterValues(filters);

  if (page > 1) {
    params.set(ARTICLE_PAGE_PARAM, String(page));
  }

  return params;
}
