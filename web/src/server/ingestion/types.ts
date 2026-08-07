export interface IngestionCounts {
  fetched: number;
  skippedAsConsumed: number;
  skippedAsDuplicate: number;
  submittedForProcessing: number;
  processed: number;
  irrelevant: number;
  savedArticles: number;
  savedConsumedArticles: number;
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
