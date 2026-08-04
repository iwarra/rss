import { db } from "@/db/client";
import type { Feed, NewArticle } from "@/db/schema";
import type { Item } from "@/types";
import { getArticlesToPersist } from "@/utils/getArticlesToPersist";
import { getProcessedArticles } from "@/utils/getProcessedArticles";
import { getItems } from "@/rss/index";
import { sql } from "drizzle-orm";

export interface IngestionCounts {
  fetched: number;
  skippedAsKnown: number;
  submittedForProcessing: number;
  irrelevant: number;
  persisted: number;
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
  submittedForProcessing: 0,
  irrelevant: 0,
  persisted: 0,
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

    const knownGuids = getKnownGuids(items);
    const newItems = items.filter((item) => !knownGuids.has(item.guid));
    counts.skippedAsKnown = items.length - newItems.length;
    counts.submittedForProcessing = newItems.length;

    const processed =
      newItems.length === 0 ? [] : await getProcessedArticles(newItems);
    //Helper to check if all articles were processed and return diagnostics?
    const articles = getArticlesToPersist(feed.id, newItems, processed);
    counts.irrelevant = newItems.length - articles.length;
    counts.persisted = persistArticles(articles);

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

function getKnownGuids(items: Item[]): Set<string> {
  const guids = [...new Set(items.map((item) => item.guid))];
  const knownGuids = new Set<string>();

  for (let index = 0; index < guids.length; index += 900) {
    const batch = guids.slice(index, index + 900);
    if (batch.length === 0) continue;

    const rows = db.all<{ guid: string }>(sql`
      SELECT guid
      FROM articles
      WHERE guid IN (${sql.join(
        batch.map((guid) => sql`${guid}`),
        sql`, `,
      )})
    `);

    for (const row of rows) knownGuids.add(row.guid);
  }

  return knownGuids;
}

function persistArticles(articles: NewArticle[]): number {
  if (articles.length === 0) return 0;

  return db.transaction((tx) => {
    let persisted = 0;
    for (const article of articles) {
      persisted += tx.run(sql`
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
        ON CONFLICT (guid) DO NOTHING
      `).changes;
    }
    return persisted;
  });
}

function report(
  startedAt: number,
  feeds: FeedIngestionResult[],
): IngestionReport {
  const counts = feeds.reduce<IngestionCounts>(
    (total, feed) => ({
      fetched: total.fetched + feed.fetched,
      skippedAsKnown: total.skippedAsKnown + feed.skippedAsKnown,
      submittedForProcessing:
        total.submittedForProcessing + feed.submittedForProcessing,
      irrelevant: total.irrelevant + feed.irrelevant,
      persisted: total.persisted + feed.persisted,
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
