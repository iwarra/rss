import { articlesTable } from "@/server/db/schema";
import type { ArticleCategory } from "@/shared/types";

export const DEFAULT_ARTICLE_PAGE_SIZE = 20;
export const MAX_ARTICLE_PAGE_SIZE = 100;

export type ArticleQuery = {
  page: number;
  limit: number;
  feedId?: number;
  category?: ArticleCategory;
  startDate?: Date;
  endDate?: Date;
};

export type ArticlesPage = {
  articles: (typeof articlesTable.$inferSelect)[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
