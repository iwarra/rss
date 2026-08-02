import "@/rss/index";
import { getFeedsFromDatabase, getItems, insertArticle } from "@/rss/index";
import app from "@/routes/link";
import { getProcessedArticles } from "./utils/getProcessedArticles";
import { getArticlesToPersist } from "./utils/getArticlesToPersist";

// ON SCHEDULED (every x minutes)
// OPTIMAL: ON SCHEDULED BASED ON FEED (every x minute)
const [feed] = await getFeedsFromDatabase("CERT-SE.");
if (!feed) throw new Error("CERT-SE. feed was not found.");
const items = await getItems(feed);
const processedArticles = await getProcessedArticles(items);
const presistantArticles = getArticlesToPersist(items, processedArticles);
presistantArticles.forEach((article) => insertArticle(article));

Bun.serve({
  port: 3000,
  fetch: app.fetch,
});
