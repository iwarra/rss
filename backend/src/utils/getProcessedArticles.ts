import type { Item } from "@/types";
import { getArticleText } from "./getArticleText";
const workerUrl = "http://localhost:8787";

export type ProcessedArticle = {
  id: string;
  embedding: number[];
  isRelevant: boolean;
  categories: string[];
  similarTo?: string[];
};

type ProcessArticlesResponse = {
  articles: ProcessedArticle[];
};

export async function getProcessedArticles(
  articles: Item[],
): Promise<ProcessedArticle[]> {
  const preparedArticles = articles.map((article) => ({
    id: article.guid,
    text: getArticleText(article),
  }));

  const response = await fetch(`${workerUrl}/api/process-articles`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ articles: preparedArticles }),
  });

  if (!response.ok) {
    throw new Error(`Article processing failed: ${response.status}`);
  }

  const { articles: processedArticles } =
    (await response.json()) as ProcessArticlesResponse;

  return processedArticles;
}
