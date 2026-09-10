import { fetchFeed } from "@/server/ingestion/fetchFeed";

import { findExistingConsumedGuids } from "../consumedArticles/repository";
import { getFeeds } from "../feed/repository";
import { normalizeFeedItems } from "./normalizeFeedItems";
import {
  createConsumedArticle,
  createFeedIngestionResult,
  createIngestionReport,
  mapItemsToRelevantArticles,
  prepareArticlesForEmbedding,
  removeDuplicateItems,
  validateProcessedArticles,
} from "./pipeline";
import { getProcessedArticles } from "./processor-client";
import { saveIngestionReport } from "./reportRepository";
import { saveIngestionResults } from "./repository";
import type {
  FeedIngestionResult,
  IngestFeedsOptions,
  IngestionReport,
} from "./types";

//fetch → deduplicate → exclude consumed → prepare → process → validate → map relevant → mark all processed consumed → save
export async function ingestFeeds(
  options: IngestFeedsOptions = {},
): Promise<IngestionReport> {
  const feeds = await getFeeds(options.feedTitle);
  const startedAt = performance.now();
  const results: FeedIngestionResult[] = [];
  for (const feed of feeds) {
    try {
      const rss = await fetchFeed(feed.rssLink);
      const items = normalizeFeedItems(rss.channel.item ?? []);
      const uniqueItems = removeDuplicateItems(items);

      const consumedGuids = await findExistingConsumedGuids(
        feed.id,
        uniqueItems.map((item) => item.guid),
      );
      const unconsumedItems = uniqueItems.filter(
        (item) => !consumedGuids.has(item.guid),
      );
      if (!unconsumedItems.length) {
        results.push(
          createFeedIngestionResult({
            kind: "skipped",
            feed,
            items,
            uniqueItems,
          }),
        );
        continue;
      }

      const preparedArticles = prepareArticlesForEmbedding(unconsumedItems);
      const embeddedArticles = await getProcessedArticles(preparedArticles);
      const validated = validateProcessedArticles(
        unconsumedItems,
        embeddedArticles,
      );

      const articles = mapItemsToRelevantArticles(
        feed.id,
        unconsumedItems,
        validated,
      );

      const consumedArticles = createConsumedArticle(feed.id, validated);

      const saved = await saveIngestionResults({
        articles,
        consumedArticles,
      });

      const ingestionInfo = createFeedIngestionResult({
        kind: "processed",
        feed,
        items,
        uniqueItems,
        unconsumedItems,
        processed: validated,
        saved,
      });
      results.push(ingestionInfo);
    } catch (error) {
      results.push(
        createFeedIngestionResult({
          kind: "failed",
          feed,
          error,
        }),
      );
    }
  }
  const ingestionReport = createIngestionReport(startedAt, results);
  await saveIngestionReport(ingestionReport);

  return ingestionReport;
}

/* validateProcessedArticles(...)
  createIngestionReport(...)

consumedArticles/repository.ts
  findConsumedGuids(feed.id, guids)

ingestion/repository.ts
  saveIngestionResults(plan) */
