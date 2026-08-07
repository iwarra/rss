"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Article = {
  id: number;
  title: string;
  link: string;
  description: string | null;
  pubDate: string;
  sourceCategory: string | null;
  categories: string[] | null;
};

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        const response = await fetch("/api/articles");

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        setArticles(await response.json());
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load articles.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadArticles();
  }, []);

  return (
    <main className={styles.page}>
      <header>
        <p className={styles.eyebrow}>GET /api/articles</p>
        <h1>Articles</h1>
      </header>

      {error ? (
        <p className={styles.message}>Could not load articles: {error}</p>
      ) : isLoading ? (
        <p className={styles.message}>Loading articles…</p>
      ) : articles.length === 0 ? (
        <p className={styles.message}>No articles found.</p>
      ) : (
        <ul className={styles.articles}>
          {articles.map((article) => (
            <li key={article.id} className={styles.article}>
              <a href={article.link} target="_blank" rel="noreferrer">
                {article.title}
              </a>
              <p>{new Date(article.pubDate).toLocaleDateString()}</p>
              {article.description && <p>{article.description}</p>}
              {Boolean(
                article.sourceCategory || article.categories?.length,
              ) && (
                <p className={styles.categories}>
                  {[article.sourceCategory, ...(article.categories ?? [])]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
