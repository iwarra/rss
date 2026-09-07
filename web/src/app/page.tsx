import {
  DEFAULT_ARTICLE_PAGE_SIZE,
  getArticles,
} from "@/server/articles/repository";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  let articles: Awaited<ReturnType<typeof getArticles>>["articles"] = [];
  let error: string | null = null;

  try {
    ({ articles } = await getArticles({
      page: 1,
      limit: DEFAULT_ARTICLE_PAGE_SIZE,
    }));
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unable to load articles.";
  }

  return (
    <main className={styles.page}>
      <header>
        <p className={styles.eyebrow}>GET /api/articles</p>
        <h1>Articles</h1>
      </header>

      {error ? (
        <p className={styles.message}>Could not load articles: {error}</p>
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
