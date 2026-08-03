import { Hono } from "hono";
import "@/rss/index";
import articles from "@/routes/articles";
import rss from "@/routes/rss";

const app = new Hono();

app.route("/api/articles", articles);
app.route("/api/rss", rss);

export default app;

Bun.serve({
  port: 3000,
  fetch: app.fetch,
});
