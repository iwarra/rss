# Feed API

`POST /api/feed` adds one or more RSS feeds.

Authentication is supplied through the `x-api-key` request header, which must match the `API_KEY` configured on the Worker. Requests with a missing or incorrect key receive `401 Unauthorized`. Credentials are no longer accepted in the request body.

The JSON request body contains only feed-addition data:

```json
{ "links": ["https://example.com/feed.xml"] }
```

Responses:

- `202 Accepted` — feeds accepted for addition (empty body).
- `400 Bad Request` — `links` is missing or empty.
- `401 Unauthorized` — missing or invalid `x-api-key` header.
- `502 Bad Gateway` — a feed could not be fetched or stored.

Example:

```sh
curl -X POST https://<worker-host>/api/feed \
  -H "x-api-key: $API_KEY" \
  -H "content-type: application/json" \
  -d '{ "links": ["https://example.com/feed.xml"] }'
```

# Scheduled ingestion

Feed ingestion runs hourly in production through the `rss-ingestion-scheduler` Cloudflare Worker. Its Cron Trigger uses UTC (`0 * * * *`) and calls the web Worker through the private `RSS_WEB` service binding; the existing `POST /api/ingestion` route remains the single ingestion entry point.

Before deploying, set the same strong, randomly generated `INGESTION_CRON_SECRET` in both Workers. The ingestion route rejects calls without this header, so use this secret for any intentional on-demand invocation as well.

```sh
npx wrangler secret put INGESTION_CRON_SECRET
npx wrangler secret put INGESTION_CRON_SECRET --config wrangler.scheduler.jsonc
npm run deploy
npm run deploy:ingestion-scheduler
```

Use `npx wrangler dev --config wrangler.scheduler.jsonc` and request `/cdn-cgi/local/scheduled?format=json` to exercise the scheduler locally. Cloudflare Cron Trigger updates can take up to 15 minutes to propagate.
