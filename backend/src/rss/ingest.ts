import { db } from "@/db/client";
import type { Feed, NewArticle, NewArticleClassification } from "@/db/schema";
import type { Item, ProcessedArticle } from "@/types";
import { mapItemsToRelevantArticles } from "@/utils/mapItemsToRelevantArticles";
import { getProcessedArticles } from "@/utils/getProcessedArticles";
import { getItems } from "@/rss/index";
import { sql } from "drizzle-orm";

export interface IngestionCounts {
  fetched: number;
  skippedAsKnown: number;
  skippedAsDuplicate: number;
  submittedForProcessing: number;
  processed: number;
  irrelevant: number;
  articlesPersisted: number;
  classificationsPersisted: number;
}

export interface SuccessfulFeedIngestion extends IngestionCounts {
  feedId: number;
  feedTitle: string;
  status: "success";
}

export interface FailedFeedIngestion extends IngestionCounts {
  feedId: number | null;
  feedTitle: string;
  status: "failed";
  error: string;
}

export type FeedIngestionResult = SuccessfulFeedIngestion | FailedFeedIngestion;

export interface IngestionReport extends IngestionCounts {
  status: "success" | "failed";
  durationMs: number;
  feeds: FeedIngestionResult[];
}

export interface IngestFeedsOptions {
  feedTitle?: string;
}

const emptyCounts = (): IngestionCounts => ({
  fetched: 0,
  skippedAsKnown: 0,
  skippedAsDuplicate: 0,
  submittedForProcessing: 0,
  processed: 0,
  irrelevant: 0,
  articlesPersisted: 0,
  classificationsPersisted: 0,
});

export async function ingestFeeds(
  options: IngestFeedsOptions = {},
): Promise<IngestionReport> {
  const startedAt = performance.now();
  const feeds = getFeeds(options.feedTitle);

  if (options.feedTitle && feeds.length === 0) {
    return report(startedAt, [
      {
        ...emptyCounts(),
        feedId: null,
        feedTitle: options.feedTitle,
        status: "failed",
        error: `No feed found with title \"${options.feedTitle}\".`,
      },
    ]);
  }

  const results: FeedIngestionResult[] = [];
  for (const feed of feeds) {
    results.push(await ingestFeed(feed));
  }

  return report(startedAt, results);
}

async function ingestFeed(feed: Feed): Promise<FeedIngestionResult> {
  const counts = emptyCounts();

  try {
    const items = await getItems(feed);
    counts.fetched = items.length;

    const uniqueItems = removeDuplicateItems(items);
    counts.skippedAsDuplicate = items.length - uniqueItems.length;

    const knownGuids = getClassifiedGuids(feed.id, uniqueItems);
    const newItems = uniqueItems.filter((item) => !knownGuids.has(item.guid));
    counts.skippedAsKnown = uniqueItems.length - newItems.length;
    counts.submittedForProcessing = newItems.length;

    const processed =
      newItems.length === 0 ? [] : await getProcessedArticles(newItems);
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
    counts.irrelevant = classifications.filter(
      (classification) => classification.status === "irrelevant",
    ).length;
    const persisted = saveIngestionResults(articles, classifications);
    counts.articlesPersisted = persisted.articles;
    counts.classificationsPersisted = persisted.classifications;

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

function getFeeds(title?: string): Feed[] {
  const filter = title ? sql`WHERE title = ${title}` : sql``;

  return db.all<Feed>(sql`
    SELECT *
    FROM feeds
    ${filter}
  `);
}

function getClassifiedGuids(feedId: number, items: Item[]): Set<string> {
  const guids = [...new Set(items.map((item) => item.guid))];
  const classifiedGuids = new Set<string>();
  // 900 used to stay bellow SQLite's bound parameter
  for (let index = 0; index < guids.length; index += 900) {
    const batch = guids.slice(index, index + 900);
    if (batch.length === 0) continue;

    const rows = db.all<{ guid: string }>(sql`
      SELECT guid
      FROM article_classifications
      WHERE feedId = ${feedId}
        AND guid IN (${sql.join(
          batch.map((guid) => sql`${guid}`),
          sql`, `,
        )})
    `);

    for (const row of rows) classifiedGuids.add(row.guid);
  }

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
): NewArticleClassification[] {
  const processedAt = new Date();

  return processed.map((article) => ({
    feedId,
    guid: article.id,
    status: article.isRelevant ? "relevant" : "irrelevant",
    processedAt,
  }));
}

function saveIngestionResults(
  articles: NewArticle[],
  classifications: NewArticleClassification[],
): { articles: number; classifications: number } {
  if (articles.length === 0 && classifications.length === 0) {
    return { articles: 0, classifications: 0 };
  }

  return db.transaction((tx) => {
    let articlesPersisted = 0;
    let classificationsPersisted = 0;
    for (const article of articles) {
      articlesPersisted += tx.run(sql`
        INSERT INTO articles (
          feedId,
          title,
          link,
          description,
          pubDate,
          guid,
          media_content,
          sourceCategory,
          categories
        )
        VALUES (
          ${article.feedId},
          ${article.title},
          ${article.link},
          ${article.description ?? null},
          ${article.pubDate.getTime()},
          ${article.guid},
          ${article.media_content ?? null},
          ${article.sourceCategory ?? null},
          ${
            article.categories === null || article.categories === undefined
              ? null
              : JSON.stringify(article.categories)
          }
        )
        ON CONFLICT (feedId, guid) DO NOTHING
      `).changes;
    }

    for (const classification of classifications) {
      classificationsPersisted += tx.run(sql`
        INSERT INTO article_classifications (
          feedId,
          guid,
          status,
          processedAt
        )
        VALUES (
          ${classification.feedId},
          ${classification.guid},
          ${classification.status},
          ${classification.processedAt.getTime()}
        )
        ON CONFLICT (feedId, guid) DO NOTHING
      `).changes;
    }

    return {
      articles: articlesPersisted,
      classifications: classificationsPersisted,
    };
  });
}

export function report(
  startedAt: number,
  feeds: FeedIngestionResult[],
): IngestionReport {
  const counts = feeds.reduce<IngestionCounts>(
    (total, feed) => ({
      fetched: total.fetched + feed.fetched,
      skippedAsKnown: total.skippedAsKnown + feed.skippedAsKnown,
      skippedAsDuplicate: total.skippedAsDuplicate + feed.skippedAsDuplicate,
      submittedForProcessing:
        total.submittedForProcessing + feed.submittedForProcessing,
      processed: total.processed + feed.processed,
      irrelevant: total.irrelevant + feed.irrelevant,
      articlesPersisted: total.articlesPersisted + feed.articlesPersisted,
      classificationsPersisted:
        total.classificationsPersisted + feed.classificationsPersisted,
    }),
    emptyCounts(),
  );

  return {
    ...counts,
    status: feeds.some((feed) => feed.status === "failed")
      ? "failed"
      : "success",
    durationMs: performance.now() - startedAt,
    feeds,
  };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
