import { getArticles } from '@/server/articles/repository';
import { DEFAULT_ARTICLE_PAGE_SIZE } from '@/server/articles/types';
import { parseArticleQuery } from '@/server/articles/query';
import { getFeeds } from '@/server/feed/repository';
import {
  articleFilterValuesFromSearchParams,
  serializeArticleListQuery,
  toUrlSearchParams,
  type ArticleSearchParams,
} from '@/shared/types';
import { ArticleFilters } from './article-filters';
import { ArticlePagination } from './article-pagination';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<ArticleSearchParams>;
}) {
	const rawSearchParams = await searchParams;
	const urlSearchParams = toUrlSearchParams(rawSearchParams);
	const filterValues = articleFilterValuesFromSearchParams(urlSearchParams);
	let articles: Awaited<ReturnType<typeof getArticles>>['articles'] = [];
	let pagination: Awaited<ReturnType<typeof getArticles>>['pagination'] | null =
		null;
	let feedNames: string[] = [];
	let error: string | null = null;

	try {
		const query = parseArticleQuery(urlSearchParams);
		const [articlesPage, availableFeeds] = await Promise.all([
			getArticles({
				...query,
				limit: DEFAULT_ARTICLE_PAGE_SIZE,
			}),
			getFeeds(),
		]);

		articles = articlesPage.articles;
		pagination = articlesPage.pagination;
		feedNames = [...new Set(availableFeeds.map((feed) => feed.title))].sort(
			(left, right) => left.localeCompare(right),
		);
	} catch (cause) {
		error = cause instanceof Error ? cause.message : 'Unable to load articles.';
	}

	return (
		<main className={styles.page}>
			<header>
				<h1>Articles</h1>
			</header>

			<ArticleFilters
				feedNames={feedNames}
				values={filterValues}
			/>

			{error ? (
				<p className={styles.message}>Could not load articles: {error}</p>
			) : pagination &&
				pagination.total > 0 &&
				pagination.page > pagination.totalPages ? (
				<p className={styles.message}>
					Page {pagination.page} is unavailable.{' '}
					<a
						href={`/?${serializeArticleListQuery(
							filterValues,
							pagination.totalPages,
						)}`}>
						Go to page {pagination.totalPages}.
					</a>
				</p>
			) : articles.length === 0 ? (
				<p className={styles.message}>
					{filterValues.feed ||
					filterValues.category ||
					filterValues.startDate ||
					filterValues.endDate
						? 'No articles match these filters.'
						: 'No articles found.'}
				</p>
			) : (
				<ul className={styles.articles}>
					{articles.map((article) => (
						<li
							key={article.id}
							className={styles.article}>
							<a
								href={article.link}
								target="_blank"
								rel="noreferrer">
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
										.join(' · ')}
								</p>
							)}
						</li>
					))}
				</ul>
			)}

			{!error && pagination && pagination.page <= pagination.totalPages && (
				<ArticlePagination
					filters={filterValues}
					pagination={pagination}
				/>
			)}
		</main>
	);
}
