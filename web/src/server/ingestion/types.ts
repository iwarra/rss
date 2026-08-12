import { Item, ProcessedArticle } from "@/shared/types";
import { Feed } from "../db/schema";

export interface IngestionCounts {
  fetched: number;
  skippedAsConsumed: number;
  skippedAsDuplicate: number;
  submittedForProcessing: number;
  processed: number;
  irrelevant: number;
  savedArticles: number;
  consumedArticles: number;
}

export interface FeedIngestionBase extends IngestionCounts {
  feedId: number | null;
  feedTitle: string;
}

export interface SuccessfulFeedIngestion extends FeedIngestionBase {
  status: "success";
}

export interface FailedFeedIngestion extends FeedIngestionBase {
  status: "failed";
  error: string;
}

export type FeedIngestionResult = SuccessfulFeedIngestion | FailedFeedIngestion;

export interface IngestionReport extends IngestionCounts {
  status: "success" | "failed";
  durationMs: number;
  feeds: FeedIngestionResult[];
}

export interface SaveIngestionResults {
  numberOfSavedArticles: number;
  numberOfConsumedArticles: number;
}

export type FeedIngestionInput =
  | {
      kind: "processed";
      feed: Feed;
      items: Item[];
      uniqueItems: Item[];
      unconsumedItems: Item[];
      processed: ProcessedArticle[];
      saved: SaveIngestionResults;
    }
  | {
      kind: "skipped";
      feed: Feed;
      items: Item[];
      uniqueItems: Item[];
    }
  | {
      kind: "failed";
      feed: Feed;
      error: unknown;
    };

export interface IngestFeedsOptions {
  feedTitle?: string;
}
