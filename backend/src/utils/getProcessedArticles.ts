import { getArticleText } from "./getArticleText";
import {
  processArticlesResponseSchema,
  type ProcessedArticle,
  type Item,
} from "@/types";

const workerUrl = process.env.WORKER_URL;
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

  const result = processArticlesResponseSchema.parse(await response.json());
  return result.articles;
}
