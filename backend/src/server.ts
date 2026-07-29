import "@/rss/index";
import { getFeedsFromDatabase, getItems, insertArticle } from "@/rss/index";
import app from "@/routes/link";

//   // ON SCHEDULED (every x minutes)
//   // OPTIMAL: ON SCHEDULED BASED ON FEED (every x minute)
await getFeedsFromDatabase();
// feeds.forEach(async (feed) => {
//   const items = await getItems(feed);

//   items.forEach((item) => {
//     const lala = (item: string) => true;
//     // Vector filter
//     const isRelevant = lala("item");
//     if (isRelevant) addToBatchInsert() (then that will insertArticle(item) in a batch)
//   });
// });

Bun.serve({
  port: 3000,
  fetch: app.fetch,
});
