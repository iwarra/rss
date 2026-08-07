import type { Item } from "@/shared/types";
import type { Feed, NewArticle } from "@/server/db/schema";
import type {
  ArticleForProcessing,
  ProcessedArticle,
} from "@/shared/types/article";
import { load } from "cheerio";
import { FeedIngestionResult, IngestionCounts, IngestionReport } from "./types";
import { fetchFeed } from "@/utils/fetchFeed";

function normalizeText(
  input: string | null | undefined,
  preserveParagraphs = false,
): string {
  if (!input) return "";

  const $ = load("<div></div>", null, false);
  const container = $("div");

  container.html(input);
  container.find("script, style, noscript, template").remove();

  if (preserveParagraphs) {
    container.find("br").replaceWith("\n");
    container.find("p, div, li, h1, h2, h3").each((_, element) => {
      $(element).prepend("\n").append("\n");
    });
  }

  const text = container
    .text()
    .normalize("NFC")
    .replace(/\u00a0/g, " ");

  if (!preserveParagraphs) {
    return text.replace(/\s+/g, " ").trim();
  }

  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function mapItemsToRelevantArticles(
  feedId: number,
  items: Item[],
  processed: ProcessedArticle[],
): NewArticle[] {
  const processedByGuid = new Map(
    processed
      .filter((article) => article.isRelevant)
      .map((article) => [article.id, article]),
  );

  return items.flatMap((item) => {
    const processedArticle = processedByGuid.get(item.guid);
    if (!processedArticle) return [];

    return [
      {
        feedId,
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: new Date(item.pubDate),
        guid: item.guid,
        media_content: item["media:content"]
          ? JSON.stringify(item["media:content"])
          : null,
        sourceCategory: item.category ?? null,
        categories: processedArticle.categories,
      },
    ];
  });
}

export function removeDuplicateItems(items: Item[]): Item[] {
  const seenGuids = new Set<string>();

  return items.filter((item) => {
    if (seenGuids.has(item.guid)) return false;

    seenGuids.add(item.guid);
    return true;
  });
}

export function validateProcessedArticles(
  items: Item[],
  processed: ProcessedArticle[],
): ProcessedArticle[] {
  const expectedGuids = new Set(items.map((item) => item.guid));
  const receivedGuids = new Set<string>();

  for (const article of processed) {
    if (!expectedGuids.has(article.id)) {
      throw new Error(`Worker processed an unknown article: ${article.id}`);
    }

    if (receivedGuids.has(article.id)) {
      throw new Error(
        `Worker processed an article more than once: ${article.id}`,
      );
    }

    receivedGuids.add(article.id);
  }

  const missingGuids = [...expectedGuids].filter(
    (guid) => !receivedGuids.has(guid),
  );
  if (missingGuids.length > 0) {
    throw new Error(
      `Worker did not process ${missingGuids.length} submitted article(s): ${missingGuids.join(", ")}`,
    );
  }

  return processed;
}

export function prepareArticlesForEmbedding(
  articles: Item[],
): ArticleForProcessing[] {
  return articles.map((article) => ({
    id: article.guid,
    text: [
      normalizeText(article.title),
      normalizeText(article.description, true),
    ]
      .filter(Boolean)
      .join("\n\n"),
  }));
}

export const resetCounts = (): IngestionCounts => ({
  fetched: 0,
  skippedAsConsumed: 0,
  skippedAsDuplicate: 0,
  submittedForProcessing: 0,
  processed: 0,
  irrelevant: 0,
  savedArticles: 0,
  savedConsumedArticles: 0,
});

export function createIngestionReport(
  feeds: FeedIngestionResult[],
  durationMs: number,
): IngestionReport {
  const counts = feeds.reduce<IngestionCounts>(
    (total, feed) => ({
      fetched: total.fetched + feed.fetched,
      skippedAsConsumed: total.skippedAsConsumed + feed.skippedAsConsumed,
      skippedAsDuplicate: total.skippedAsDuplicate + feed.skippedAsDuplicate,
      submittedForProcessing:
        total.submittedForProcessing + feed.submittedForProcessing,
      processed: total.processed + feed.processed,
      irrelevant: total.irrelevant + feed.irrelevant,
      savedArticles: total.savedArticles + feed.savedArticles,
      savedConsumedArticles:
        total.savedConsumedArticles + feed.savedConsumedArticles,
    }),
    resetCounts(),
  );

  return {
    ...counts,
    status: feeds.some((feed) => feed.status === "failed")
      ? "failed"
      : "success",
    durationMs,
    feeds,
  };
}

//Type Feed as it uses DB data for the call
export async function getItems(feed: Feed): Promise<Item[]> {
  const {
    channel: { item: items },
  } = await fetchFeed(feed.rssLink);

  if (!items) return [];
  return items;
}
