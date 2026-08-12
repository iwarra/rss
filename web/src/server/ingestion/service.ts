import { fetchFeed } from "@/server/ingestion/fetchFeed";
import { getFeeds } from "../feed/repository";
import { FeedIngestionResult, IngestFeedsOptions } from "./types";
import {
  createConsumedArticle,
  createIngestionReport,
  mapItemsToRelevantArticles,
  prepareArticlesForEmbedding,
  removeDuplicateItems,
  createFeedIngestionResult,
  validateProcessedArticles,
} from "./pipeline";
import { getProcessedArticles } from "./processor-client";
import { saveIngestionResults } from "./repository";
import { findExistingConsumedGuids } from "../consumedArticles/repository";
import { saveIngestionReport } from "./saveIngestionReport";

//fetch → deduplicate → exclude consumed → prepare → process → validate → map relevant → mark all processed consumed → save
export async function ingestFeeds(options: IngestFeedsOptions = {}) {
  const feeds = await getFeeds(options.feedTitle);
  const startedAt = performance.now();
  const results: FeedIngestionResult[] = [];
  for (const feed of feeds) {
    try {
      const rss = await fetchFeed(feed.rssLink);
      const items = rss.channel.item ?? [];
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
      console.error(error);
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
