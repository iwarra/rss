//It should own`fetch → select → process → plan → save → report`,
//while calling pure pipeline functions and adapters.
import { fetchFeed } from "@/utils/fetchFeed";
import { getFeeds } from "../feed/repository";
import { IngestFeedsOptions } from "./types";

export async function ingestFeeds(options: IngestFeedsOptions = {}) {
  const feeds = await getFeeds(options.feedTitle);

  const results = [];
  for (const feed of feeds) {
    results.push(await fetchFeed(feed.rssLink));
  }
}

/* ingestion/pipeline.ts
  validateItems(...)
  removeDuplicateItems(...)
  prepareArticlesForEmbedding(...)
  validateProcessedArticles(...)
  createPersistencePlan(...)
  createIngestionReport(...)

consumedArticles/repository.ts
  findConsumedGuids(feed.id, guids)

ingestion/processor-client.ts
  getProcessedArticles(preparedArticles)

ingestion/repository.ts
  saveIngestionResults(plan) */
