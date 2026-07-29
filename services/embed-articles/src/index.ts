import feedData from './data/feed.json';
import { categoriesEmbeddings, categories } from './data/categories';

const article = feedData.feed.entry.at(0);
const title = article.title._text.replaceAll('â€“', '–').replaceAll('Ã¥', 'å');
const summary = article.summary._text.replaceAll('Ã¥', 'å').replaceAll('Ã¤', 'ä').replaceAll('Ã¶', 'ö').replaceAll('Ã©', 'é');
const parsedArticle = `${title} ${summary
	.replace(/<[^>]*>/g, '')
	.replace(/\s*\[\d+(?:,\s*\d+)*\]\s*$/g, '')
	.trim()}`;

// CATEGORIES
// Make embeddings for all cattegories
// Compare article to cattegories and label with highest score (or all above certain treshhold)
// Skipp if not relevant

// Group articles covering the same news (same event/happening)
// above certain treshold put in same bucket
//

export default {
	async fetch(request: Request, env: Env) {
		const articles = Array(parsedArticle);
		const articleEmbeddings = await getEmbeddings(articles, env);
		/* 		checkAricleRelevancy(articleEmbeddings);*/
		let lala = addCategory(articleEmbeddings.data?.at(0));

		//Response.json({ articles, batchedResponse, relevancy, relevancyEmbeddings });
		//	console.log(JSON.stringify(categoryEmbeddings.data?.at(0)));
		return Response.json(lala);
	},
};

async function getEmbeddings(data: string[], env: Env) {
	return (await env.AI.run('@cf/baai/bge-m3', {
		text: data,
	})) as Ai_Cf_Baai_Bge_M3_Output_Embedding;
}

/* function checkAricleRelevancy(articleEmbedding: number[]) {
	relevancyEmbedding.map((embedding) => {
		if (!isRelevant(embedding, articleEmbedding)) return;
	});
} */

function addCategory(articleEmbedding: number[]) {
	//const assignedCategories =
	return categoriesEmbeddings.map((catEmbedding, i) => {
		if (!isRelevant(catEmbedding, articleEmbedding)) return;
		else return categories.at(i)?.name;
		//return {
		// categories: assignedCategories,
		// article: articleEmbedding
		// }
	});
	// Check all category embeddings VS the article and select the most relevant one(s?) - if any
	// If category is found add it to the article info and return to be sent further
}

//Put trashold as a parameter as it might vary from category comparison to topic etc...
function isRelevant(embedding1: number[], embedding2: number[]): boolean {
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

	console.log(cosineSimilarity);
	return cosineSimilarity >= 0.5;
}
