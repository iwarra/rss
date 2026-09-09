"use client";

import { useRouter } from "next/navigation";
import { useTransition, type SubmitEvent } from "react";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_FILTER_PARAMS,
  serializeArticleFilterValues,
  type ArticleFilterValues,
} from "@/shared/types";
import styles from "./page.module.css";

type ArticleFiltersProps = {
  feeds: { id: number; title: string }[];
  values: ArticleFilterValues;
};

function queryFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);

  return serializeArticleFilterValues({
    feedId: String(formData.get(ARTICLE_FILTER_PARAMS.feedId) ?? ""),
    category: String(formData.get(ARTICLE_FILTER_PARAMS.category) ?? ""),
    startDate: String(formData.get(ARTICLE_FILTER_PARAMS.startDate) ?? ""),
    endDate: String(formData.get(ARTICLE_FILTER_PARAMS.endDate) ?? ""),
  });
}

export function ArticleFilters({ feeds, values }: ArticleFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selectedFeedIsMissing =
    values.feedId !== "" &&
    !feeds.some((feed) => String(feed.id) === values.feedId);
  const filterKey = serializeArticleFilterValues(values).toString();

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    startTransition(() => router.push(query ? `/?${query}` : "/"));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
        <select
          name={ARTICLE_FILTER_PARAMS.feedId}
          defaultValue={values.feedId}
        >
          <option value="">All feeds</option>
          {selectedFeedIsMissing && (
            <option value={values.feedId}>Unknown feed ({values.feedId})</option>
          )}
          {feeds.map((feed) => (
            <option key={feed.id} value={feed.id}>
              {feed.title}
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
