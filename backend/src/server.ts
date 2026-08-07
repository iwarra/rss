import { Hono } from "hono";
import { cors } from "hono/cors";
import articles from "@/routes/articles";
import rss from "@/routes/rss";
import { ingestFeeds } from "@/rss/ingest";
import { saveIngestionReport } from "@/rss/saveIngestionReport";

const app = new Hono();

app.use("/api/*", cors());
app.route("/api/articles", articles);
app.route("/api/rss", rss);

Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

ingestFeeds({ feedTitle: "CERT-SE." })
  .then(async (report) => {
    const reportPath = await saveIngestionReport(report);
    console.log(JSON.stringify(report, null, 2));
    console.log(`Ingestion report saved to ${reportPath}`);
  })
  .catch((error) => {
    console.error("Unexpected ingestion error:", error);
  });
