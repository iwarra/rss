import "server-only";
import { getDb } from "@/server/db/client";
import {
  articlesTable,
  consumedArticlesTable,
  type NewArticle,
  type NewConsumedArticle,
} from "@/server/db/schema";

type SaveIngestionInput = {
  articles: NewArticle[];
  consumedArticles: NewConsumedArticle[];
};

type SaveIngestionResult = {
  numberOfSavedArticles: number;
  numberOfConsumedArticles: number;
};

export async function saveIngestionResults({
  articles,
  consumedArticles: consumedArticlesData,
}: SaveIngestionInput): Promise<SaveIngestionResult> {
  if (consumedArticlesData.length === 0 && articles.length > 0) {
    throw new Error("Articles cannot be saved without consumed records.");
  }
  if (consumedArticlesData.length === 0) {
    return { numberOfSavedArticles: 0, numberOfConsumedArticles: 0 };
  }

  const db = await getDb();

  const consumedArticlesInsert = db
    .insert(consumedArticlesTable)
    .values(consumedArticlesData)
    .onConflictDoNothing({
      target: [consumedArticlesTable.feedId, consumedArticlesTable.guid],
    });

  if (articles.length === 0) {
    const [consumedArticlesResult] = await db.batch([consumedArticlesInsert]);

    return {
      numberOfSavedArticles: 0,
      numberOfConsumedArticles: consumedArticlesResult.meta.changes,
    };
  }

  const articlesInsert = db
    .insert(articlesTable)
    .values(articles)
    .onConflictDoNothing({
      target: [articlesTable.feedId, articlesTable.guid],
    });

  const [consumedArticlesResult, articleResult] = await db.batch([
    consumedArticlesInsert,
    articlesInsert,
  ]);

  return {
    numberOfSavedArticles: articleResult.meta.changes,
    numberOfConsumedArticles: consumedArticlesResult.meta.changes,
  };
}
