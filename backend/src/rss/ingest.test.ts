import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Item, ProcessedArticle } from "@/types";

// The pure helpers are imported from ingest.ts, whose production entry point
// imports the database client. Keep this suite independent of app.db.
vi.mock("@/db/client", () => ({ db: {} }));

const {
  createArticleClassifications,
  errorMessage,
  removeDuplicateItems,
  report,
  validateProcessedArticles,
} = await import("./ingest");

const item = (guid: string): Item => ({
  guid,
  title: `Title ${guid}`,
  description: `Description ${guid}`,
  link: `https://example.test/${guid}`,
  pubDate: "2026-01-01T00:00:00.000Z",
});

const processed = (id: string, isRelevant = true): ProcessedArticle => ({
  id,
  embedding: [0.1, 0.2],
  isRelevant,
  categories: ["technology"],
});

describe("removeDuplicateItems", () => {
  it("keeps the first item for each GUID in input order", () => {
    const first = item("one");
    const duplicate = { ...item("one"), title: "Replacement" };

    expect(removeDuplicateItems([first, item("two"), duplicate, item("three")])).toEqual([
      first,
      item("two"),
      item("three"),
    ]);
  });

  it("returns an empty list for no fetched items", () => {
    expect(removeDuplicateItems([])).toEqual([]);
  });

  it("collapses non-adjacent duplicates", () => {
    expect(removeDuplicateItems([item("one"), item("two"), item("one")]).map(({ guid }) => guid)).toEqual([
      "one",
      "two",
    ]);
  });
});

describe("validateProcessedArticles", () => {
  it("accepts a complete, one-to-one worker response", () => {
    const result = [processed("one"), processed("two", false)];

    expect(validateProcessedArticles([item("one"), item("two")], result)).toBe(result);
  });

  it("rejects a worker response with missing articles", () => {
    expect(() => validateProcessedArticles([item("one"), item("two")], [processed("one")])).toThrow(
      "Worker did not process 1 submitted article(s): two",
    );
  });

  it("rejects a worker response for an unknown article", () => {
    expect(() => validateProcessedArticles([item("one")], [processed("other")])).toThrow(
      "Worker processed an unknown article: other",
    );
  });

  it("rejects an article returned more than once", () => {
    expect(() => validateProcessedArticles([item("one")], [processed("one"), processed("one")])).toThrow(
      "Worker processed an article more than once: one",
    );
  });

  it("accepts empty input and an empty worker response", () => {
    expect(validateProcessedArticles([], [])).toEqual([]);
  });
});

describe("createArticleClassifications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T04:05:06.000Z"));
  });

  it("creates one relevant or irrelevant classification per processed article", () => {
    expect(createArticleClassifications(42, [processed("relevant"), processed("irrelevant", false)])).toEqual([
      { feedId: 42, guid: "relevant", status: "relevant", processedAt: new Date("2026-02-03T04:05:06.000Z") },
      { feedId: 42, guid: "irrelevant", status: "irrelevant", processedAt: new Date("2026-02-03T04:05:06.000Z") },
    ]);
  });

  it("returns no classifications when the worker processed no articles", () => {
    expect(createArticleClassifications(42, [])).toEqual([]);
  });
});

describe("report", () => {
  it("aggregates every count and fails the report when any feed failed", () => {
    const result = report(performance.now(), [
      { feedId: 1, feedTitle: "Healthy", status: "success", fetched: 3, skippedAsKnown: 1, skippedAsDuplicate: 1, submittedForProcessing: 1, processed: 1, irrelevant: 0, articlesPersisted: 1, classificationsPersisted: 1 },
      { feedId: 2, feedTitle: "Broken", status: "failed", error: "Worker unavailable", fetched: 2, skippedAsKnown: 0, skippedAsDuplicate: 0, submittedForProcessing: 2, processed: 0, irrelevant: 0, articlesPersisted: 0, classificationsPersisted: 0 },
    ]);

    expect(result).toMatchObject({
      status: "failed",
      fetched: 5,
      skippedAsKnown: 1,
      skippedAsDuplicate: 1,
      submittedForProcessing: 3,
      processed: 1,
      irrelevant: 0,
      articlesPersisted: 1,
      classificationsPersisted: 1,
    });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("returns a successful zero-count report when no feeds were attempted", () => {
    expect(report(performance.now(), [])).toMatchObject({
      status: "success",
      fetched: 0,
      skippedAsKnown: 0,
      skippedAsDuplicate: 0,
      submittedForProcessing: 0,
      processed: 0,
      irrelevant: 0,
      articlesPersisted: 0,
      classificationsPersisted: 0,
      feeds: [],
    });
  });
});

describe("errorMessage", () => {
  it("uses an Error's message", () => {
    expect(errorMessage(new Error("RSS unavailable"))).toBe("RSS unavailable");
  });

  it("converts non-Error thrown values to strings", () => {
    expect(errorMessage("failed")).toBe("failed");
    expect(errorMessage(404)).toBe("404");
    expect(errorMessage(null)).toBe("null");
    expect(errorMessage({ reason: "failed" })).toBe("[object Object]");
  });
});
