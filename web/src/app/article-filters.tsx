"use client";

import { useRouter } from "next/navigation";
import { type JSX, type SubmitEvent, useTransition } from "react";

import {
  ARTICLE_CATEGORIES,
  ARTICLE_FILTER_PARAMS,
  type ArticleFilterValues,
  serializeArticleFilterValues,
} from "@/shared/types";

import styles from "./page.module.css";

type ArticleFiltersProps = {
  feedNames: string[];
  values: ArticleFilterValues;
};

function queryFromForm(form: HTMLFormElement): URLSearchParams {
  const formData = new FormData(form);
  const textValue = (name: string): string => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  return serializeArticleFilterValues({
    feed: textValue(ARTICLE_FILTER_PARAMS.feed),
    category: textValue(ARTICLE_FILTER_PARAMS.category),
    startDate: textValue(ARTICLE_FILTER_PARAMS.startDate),
    endDate: textValue(ARTICLE_FILTER_PARAMS.endDate),
  });
}

export function ArticleFilters({
  feedNames,
  values,
}: ArticleFiltersProps): JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selectedFeedIsMissing =
    values.feed !== "" && !feedNames.includes(values.feed);
  const filterKey = serializeArticleFilterValues(values).toString();

  function navigate(params: URLSearchParams): void {
    const query = params.toString();
    startTransition(() => router.push(query ? `/?${query}` : "/"));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    navigate(queryFromForm(event.currentTarget));
  }

  return (
    <form
      key={filterKey}
      className={styles.filters}
      action="/"
      method="get"
      onSubmit={handleSubmit}
    >
      <label>
        Feed
        <select name={ARTICLE_FILTER_PARAMS.feed} defaultValue={values.feed}>
          <option value="">All feeds</option>
          {selectedFeedIsMissing && (
            <option value={values.feed}>{values.feed}</option>
          )}
          {feedNames.map((feedName) => (
            <option key={feedName} value={feedName}>
              {feedName}
            </option>
          ))}
        </select>
      </label>

      <label>
        Category
        <select
          name={ARTICLE_FILTER_PARAMS.category}
          defaultValue={values.category}
        >
          <option value="">All categories</option>
          {ARTICLE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        From
        <input
          name={ARTICLE_FILTER_PARAMS.startDate}
          type="date"
          defaultValue={values.startDate}
        />
      </label>

      <label>
        To
        <input
          name={ARTICLE_FILTER_PARAMS.endDate}
          type="date"
          defaultValue={values.endDate}
        />
      </label>

      <div className={styles.filterActions}>
        <button type="submit" disabled={isPending}>
          Apply filters
        </button>
        <button
          type="button"
          onClick={() => navigate(new URLSearchParams())}
          disabled={isPending}
        >
          Clear filters
        </button>
        {isPending && <span aria-live="polite">Loading articles…</span>}
      </div>
    </form>
  );
}
