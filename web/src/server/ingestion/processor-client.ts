import {
  processArticlesResponseSchema,
  type ProcessedArticle,
  type ArticleForProcessing,
} from "@/shared/types";

const workerUrl = process.env.WORKER_URL;
export async function getProcessedArticles(
  articles: ArticleForProcessing[],
): Promise<ProcessedArticle[]> {
  const response = await fetch(`${workerUrl}/api/process-articles`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ articles: articles }),
  });

  if (!response.ok) {
    throw new Error(`Article processing failed: ${response.status}`);
  }

  const result = processArticlesResponseSchema.parse(await response.json());
  return result.articles;
}

export async function fetchEmbeddings(content: string[]): Promise<number[][]> {
  const response = await fetch("http://localhost:8787/api/get-embeddings", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(content),
  });

  if (!response.ok) {
    throw new Error(
      `Embedding request failed (${response.status}): ${await response.text()}`,
    );
  }

  return response.json() as Promise<number[][]>;
}
