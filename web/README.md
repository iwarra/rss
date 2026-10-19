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
