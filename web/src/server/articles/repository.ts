import "server-only";

import { and, count, desc, eq, gte, lt, or, type SQL, sql } from "drizzle-orm";

import { getDb } from "@/server/db/client";

import { articlesTable, feedsTable } from "../db/schema";
import type { ArticleQuery, ArticlesPage } from "./types";

export type { ArticleQuery, ArticlesPage } from "./types";

function buildArticleFilters(query: ArticleQuery): SQL | undefined {
  const filters: SQL[] = [];

  if (query.feedId !== undefined) {
    filters.push(eq(articlesTable.feedId, query.feedId));
  }

  if (query.feedName !== undefined) {
    filters.push(sql`EXISTS (
      SELECT 1
      FROM ${feedsTable}
      WHERE ${feedsTable.id} = ${articlesTable.feedId}
        AND ${feedsTable.title} = ${query.feedName}
    )`);
  }

  if (query.category !== undefined) {
    filters.push(
      or(
        eq(articlesTable.sourceCategory, query.category),
        sql`EXISTS (
          SELECT 1
          FROM json_each(${articlesTable.categories})
          WHERE json_each.value = ${query.category}
        )`,
      )!,
    );
  }

  if (query.startDate !== undefined) {
    filters.push(gte(articlesTable.pubDate, query.startDate));
  }

  if (query.endDate !== undefined) {
    filters.push(lt(articlesTable.pubDate, query.endDate));
  }

  return filters.length > 0 ? and(...filters) : undefined;
}

export async function getArticles(query: ArticleQuery): Promise<ArticlesPage> {
  const db = await getDb();
  const filters = buildArticleFilters(query);
  const [articles, [{ total }]] = await Promise.all([
    db
      .select()
      .from(articlesTable)
      .where(filters)
      .orderBy(desc(articlesTable.pubDate), desc(articlesTable.id))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
    db.select({ total: count() }).from(articlesTable).where(filters),
  ]);

  return {
    articles,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
