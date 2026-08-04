import { Hono } from "hono";
import articles from "@/routes/articles";
import rss from "@/routes/rss";
import { ingestFeeds } from "@/rss/ingest";
import { saveIngestionReport } from "@/rss/saveIngestionReport";

const app = new Hono();

app.route("/api/articles", articles);
app.route("/api/rss", rss);

export default app;

Bun.serve({
  port: 3000,
  fetch: app.fetch,
});

void ingestFeeds({ feedTitle: "CERT-SE." })
  .then(async (report) => {
    const reportPath = await saveIngestionReport(report);
    console.log(JSON.stringify(report, null, 2));
    console.log(`Ingestion report saved to ${reportPath}`);
  })
  .catch((error) => {
    console.error("Unexpected ingestion error:", error);
  });
