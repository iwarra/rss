import Link from "next/link";
import type { JSX } from "react";

import type { ArticlesPage } from "@/server/articles/types";
import {
  type ArticleFilterValues,
  serializeArticleListQuery,
} from "@/shared/types";

import styles from "./page.module.css";

type ArticlePaginationProps = {
  filters: ArticleFilterValues;
  pagination: ArticlesPage["pagination"];
};

function pageHref(filters: ArticleFilterValues, page: number): string {
  const query = serializeArticleListQuery(filters, page).toString();
  return query ? `/?${query}` : "/";
}

export function ArticlePagination({
  filters,
  pagination,
}: ArticlePaginationProps): JSX.Element | null {
  if (pagination.total === 0) return null;

  const firstResult = (pagination.page - 1) * pagination.limit + 1;
  const lastResult = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );
  const hasPreviousPage = pagination.page > 1;
  const hasNextPage = pagination.page < pagination.totalPages;

  return (
    <nav className={styles.pagination} aria-label="Article pagination">
      <p className={styles.paginationStatus}>
        Showing {firstResult}–{lastResult} of {pagination.total} articles. Page{" "}
        {pagination.page} of {pagination.totalPages}.
      </p>
      <div className={styles.paginationControls}>
        {hasPreviousPage ? (
          <Link href={pageHref(filters, pagination.page - 1)}>Previous</Link>
        ) : (
          <span aria-disabled="true">Previous</span>
        )}
        {hasNextPage ? (
          <Link href={pageHref(filters, pagination.page + 1)}>Next</Link>
        ) : (
          <span aria-disabled="true">Next</span>
        )}
      </div>
    </nav>
  );
}
