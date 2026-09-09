export const ARTICLE_CATEGORIES = [
  "angrepp",
  "sårbarheter",
  "aktörer",
  "skydd",
  "regler",
  "risk",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
