import { getArticles } from '@/server/articles/repository';
import { DEFAULT_ARTICLE_PAGE_SIZE } from '@/server/articles/types';
import { parseArticleQuery } from '@/server/articles/query';
import { getFeeds } from '@/server/feed/repository';
import {
	articleFilterValuesFromSearchParams,
	toUrlSearchParams,
	type ArticleSearchParams,
} from '@/shared/types';
import { ArticleFilters } from './article-filters';
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
	let feeds: { id: number; title: string }[] = [];
	let error: string | null = null;

	try {
		const query = parseArticleQuery(urlSearchParams);
		const [articlesPage, availableFeeds] = await Promise.all([
			getArticles({
				...query,
				page: 1,
				limit: DEFAULT_ARTICLE_PAGE_SIZE,
			}),
			getFeeds(),
		]);

		articles = articlesPage.articles;
		feeds = availableFeeds
			.map(({ id, title }) => ({ id, title }))
			.sort((left, right) => left.title.localeCompare(right.title));
	} catch (cause) {
		error = cause instanceof Error ? cause.message : 'Unable to load articles.';
	}

	return (
		<main className={styles.page}>
			<header>
				<h1>Articles</h1>
			</header>

			<ArticleFilters
				feeds={feeds}
				values={filterValues}
			/>

			{error ? (
				<p className={styles.message}>Could not load articles: {error}</p>
			) : articles.length === 0 ? (
				<p className={styles.message}>
					{filterValues.feedId ||
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
		</main>
	);
}
