import type { Feed, NewConsumedArticle } from "@/server/db/schema";
import type { Item, ProcessedArticle } from "@/shared/types";
import {
  mapItemsToRelevantArticles,
  getItems,
  createIngestionReport,
  prepareArticlesForEmbedding,
} from "@/server/ingestion/pipeline";
import { getProcessedArticles } from "@/server/ingestion/processor-client";
import { findConsumedGuids } from "./consumedArticles/repository";
import { resetCounts } from "@/server/ingestion/pipeline";
import {
  FeedIngestionResult,
  IngestFeedsOptions,
  IngestionReport,
} from "./ingestion/types";
import { getFeeds } from "./feed/repository";
import { saveIngestionResults } from "./ingestion/repository";

export async function ingestFeeds(
  options: IngestFeedsOptions = {},
): Promise<IngestionReport> {
  const startedAt = performance.now();
  const feeds = await getFeeds(options.feedTitle);

  if (options.feedTitle && feeds.length === 0) {
    const timeDiff = Date.now() - startedAt;
    return createIngestionReport(
      [
        {
          ...resetCounts(),
          feedId: null,
          feedTitle: options.feedTitle,
          status: "failed",
          error: `No feed found with title \"${options.feedTitle}\".`,
        },
      ],
      timeDiff,
    );
  }

  const results: FeedIngestionResult[] = [];
  for (const feed of feeds) {
    results.push(await ingestFeed(feed));
  }
  const timeReportTook = Date.now() - startedAt;

  return createIngestionReport(results, timeReportTook);
}

async function ingestFeed(feed: Feed): Promise<FeedIngestionResult> {
  const counts = resetCounts();

  try {
    const items = await getItems(feed);
    counts.fetched = items.length;

    const uniqueItems = removeDuplicateItems(items);
    counts.skippedAsDuplicate = items.length - uniqueItems.length;

    const knownGuids = await getClassifiedGuids(feed.id, uniqueItems);
    const newItems = uniqueItems.filter((item) => !knownGuids.has(item.guid));
    counts.skippedAsConsumed = uniqueItems.length - newItems.length;
    counts.submittedForProcessing = newItems.length;

    const formatted = prepareArticlesForEmbedding(newItems);
    const processed =
      newItems.length === 0 ? [] : await getProcessedArticles(formatted);
    const completeProcessedArticles = validateProcessedArticles(
      newItems,
      processed,
    );
    counts.processed = completeProcessedArticles.length;

    const articles = mapItemsToRelevantArticles(
      feed.id,
      newItems,
      completeProcessedArticles,
    );
    const classifications = createArticleClassifications(
      feed.id,
      completeProcessedArticles,
    );

    const persisted = await saveIngestionResults({
      articles,
      consumedArticles: classifications,
    });
    counts.irrelevant =
      persisted.numberOfConsumedArticles - persisted.numberOfSavedArticles;
    counts.savedArticles = persisted.numberOfSavedArticles;
    counts.savedConsumedArticles = persisted.numberOfConsumedArticles;

    return {
      ...counts,
      feedId: feed.id,
      feedTitle: feed.title,
      status: "success",
    };
  } catch (error) {
    return {
      ...counts,
      feedId: feed.id,
      feedTitle: feed.title,
      status: "failed",
      error: errorMessage(error),
    };
  }
}

async function getClassifiedGuids(
  feedId: number,
  items: Item[],
): Promise<Set<string>> {
  const guids = [...new Set(items.map((item) => item.guid))];
  const classifiedGuids = await findConsumedGuids(feedId, guids);

  return classifiedGuids;
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

export function createArticleClassifications(
  feedId: number,
  processed: ProcessedArticle[],
): NewConsumedArticle[] {
  const processedAt = new Date();

  return processed.map((article) => ({
    feedId,
    guid: article.id,
    processedAt,
  }));
}

export function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (error.cause === undefined) return error.message;

  return `${error.message}\nCaused by: ${errorMessage(error.cause)}`;
}
