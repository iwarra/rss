import feedData from './data/feed.json';
import { type Category, categoryDefinitions } from './data/categories';
import { subject } from './data/subject';
import { clustering } from './data/clustering';

type ArticleForProcessing = {
	id: string;
	text: string;
};

type ProcessArticlesRequest = {
	articles: ArticleForProcessing[];
};

type ProcessedArticle = {
	id: string;
	embedding: number[];
	isRelevant: boolean;
	categories: string[];
	similarTo?: string[];
};

type EmbeddedArticle = ArticleForProcessing & {
	embedding: number[];
};

export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);

		if (url.pathname === '/api/process-articles') {
			const body = await request.json<ProcessArticlesRequest>();

			const articles = await processArticles(body.articles, env);

			return Response.json({ articles });
		}

		return new Response('Not found', { status: 404 });
	},
};

async function getEmbeddings(text: string[], env: Env): Promise<number[][]> {
	const result = (await env.AI.run('@cf/baai/bge-m3', {
		text,
	})) as Ai_Cf_Baai_Bge_M3_Output_Embedding;
	if (!result.data || result.data.length !== text.length) {
		throw new Error('Could not create an embedding for every article.');
	}

	return result.data;
}

let cachedCategories: Category[] | undefined;
async function getCategories(env: Env): Promise<Category[]> {
	if (cachedCategories) return cachedCategories;
	const result = await getEmbeddings(
		categoryDefinitions.map((category) => category.description),
		env,
	);
	const embeddings = result;
	if (!embeddings || embeddings.length !== categoryDefinitions.length) {
		throw new Error('Could not create an embedding for every category.');
	} else {
		cachedCategories = categoryDefinitions.map((category, i) => ({
			...category,
			embedding: embeddings[i],
		}));
	}
	return cachedCategories;
}
function addCategories(articleEmbedding: number[], categories: Category[]): string[] {
	return categories.filter((category) => checkRelevancy(category.embedding, articleEmbedding)).map((category) => category.name);
}
let cachedSubjectEmbedding: number[] | undefined;
async function getSubjectEmbedding(env: Env): Promise<number[]> {
	if (cachedSubjectEmbedding) return cachedSubjectEmbedding;
	const result = await getEmbeddings([subject], env);
	const embedding = result.at(0);
	if (!embedding) {
		throw new Error('Could not create an embedding for every category.');
	} else {
		cachedSubjectEmbedding = embedding;
	}
	return cachedSubjectEmbedding;
}

function checkRelevancy(embedding1: number[], embedding2: number[], treshold?: number): boolean {
	if (embedding1.length !== embedding2.length || embedding1.length === 0) {
		return false;
	}

	let dotProduct = 0;
	let magnitude1 = 0;
	let magnitude2 = 0;

	for (let i = 0; i < embedding1.length; i++) {
		dotProduct += embedding1[i] * embedding2[i];
		magnitude1 += embedding1[i] ** 2;
		magnitude2 += embedding2[i] ** 2;
	}

	if (magnitude1 === 0 || magnitude2 === 0) {
		return false;
	}

	const cosineSimilarity = dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));

	console.log('Similarity score: ', cosineSimilarity);
	const isRelevant = treshold ? cosineSimilarity >= treshold : cosineSimilarity >= 0.5;

	return isRelevant;
}

async function processArticles(articles: ArticleForProcessing[], env: Env): Promise<ProcessedArticle[]> {
	if (articles.length === 0) return [];

	const embeddings = await getEmbeddings(
		articles.map((article) => article.text),
		env,
	);

	const embeddedArticles: EmbeddedArticle[] = articles.map((article, index) => ({
		...article,
		embedding: embeddings[index],
	}));

	const subjectEmbedding = await getSubjectEmbedding(env);

	const relevanceChecked = embeddedArticles.map((article) => {
		const isRelevant = checkRelevancy(article.embedding, subjectEmbedding);

		return {
			...article,
			isSubjectRelevant: isRelevant,
		};
	});

	const categories = await getCategories(env);
	const relevantArticles = relevanceChecked.filter((article) => article.isSubjectRelevant);

	return relevanceChecked.map((article) => ({
		id: article.id,
		embedding: article.embedding,
		isRelevant: article.isSubjectRelevant,
		categories: article.isSubjectRelevant ? addCategories(article.embedding, categories) : [],
		//similarTo: article.isSubjectRelevant ? findSimilarArticleIds(article, relevantArticles) : [],
	}));
}

//
//
//
//Temporary parsing helper that will be removed later:
function getParsedArticle(article = feedData.feed.entry.at(0)) {
	const title = article.title._text.replaceAll('â€“', '–').replaceAll('Ã¥', 'å');
	const summary = article.summary._text.replaceAll('Ã¥', 'å').replaceAll('Ã¤', 'ä').replaceAll('Ã¶', 'ö').replaceAll('Ã©', 'é');
	const parsedArticle = `${title} ${summary
		.replace(/<[^>]*>/g, '')
		.replace(/\s*\[\d+(?:,\s*\d+)*\]\s*$/g, '')
		.trim()}`;
	return parsedArticle;
}
