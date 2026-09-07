- NEW LIST:

* Add pagination (and the noted feed/category/date filters) to `GET /api/articles`; the repository still has this explicit TODO. [repository.ts](/Users/ivonajosipovic/Desktop/rss/web/src/server/articles/repository.ts:14)
* Replace the article-list client-side `useEffect` fetch with server-side rendering. [page.tsx](/Users/ivonajosipovic/Desktop/rss/web/src/app/page.tsx:1)
* Move the feed API key out of the JSON body and into request headers. [route.ts](/Users/ivonajosipovic/Desktop/rss/web/src/app/api/feed/route.ts:5)
* Separate the frontend demo from the `web` application/server code; it remains the root application page.
* Add scheduled ingestion jobs/cron triggers. Ingestion is callable through `POST /api/ingestion`, but nothing schedules it.
* Add a message broker/queue for ingestion ↔ embedding processing.
* Implement similarity grouping/clustering of articles covering the same event. The worker imports clustering material, but the actual `similarTo` logic is commented out and no grouping is persisted. [index.ts](/Users/ivonajosipovic/Desktop/rss/services/embed-articles/src/index.ts:142)
* Define and implement a staleness/re-fetch policy for feed items.
* Add caching beyond the in-worker category/subject-embedding memory cache.
* Restrict consumed-GUID lookups to a time window; current lookups consider all stored GUIDs.
* Decide, document, and configure relevance/category similarity thresholds. A hard-coded default of `0.5` is currently used. [index.ts](/Users/ivonajosipovic/Desktop/rss/services/embed-articles/src/index.ts:107)
* Improve the feed schema: decide the stored `image` representation and clarify/rename `sy_updatePeriod` and `sy_updateFrequency`. They are currently stored essentially as parsed RSS fields. [feed.ts](/Users/ivonajosipovic/Desktop/rss/web/src/server/db/schema/feed.ts:10)
* Further improve the database schema (the TODO is broad; likely includes fields needed for grouping, staleness, and richer processing state).
* Define finer-grained failure behavior. The code records a failed feed and continues with other feeds, but one item/embedding failure currently fails the whole feed batch; there is no retry or per-item policy. [service.ts](/Users/ivonajosipovic/Desktop/rss/web/src/server/ingestion/service.ts:77)

# OLD LIST:

# Subtasks of handling raw data

1. Read the data from test data file
2. Parse it into JSON (fast-xml package) && SAVE into new file
3. Transform

- Make types from JSON
- Remove unwanted fields

# Subtasks of handling relevant data

1. Throw away articles not relevant // what if more categories are added later on?
2. Filter out not relevant fields && SAVE into new file

Substasks of handling categories

- Add categories

Subtasks of handling similarity search

- Look into similarity search

Subtasks of sending to client

- Read articles-table from DB
- Sending response back to Frontend with articles already formatted and tagged etc.

## Notes:

What I want to have:

consumeFeed()
parseXML()
!saveToDatabase()
formatData()
saveToDatabase()

filterByTopic() // rename to getXArticles, X being the topic
labelArticle()
groupSimilarArticles() //use vectors

# IMPORTANT

- Clustering doesn't take in any parameters and grous on similarity !!!
- Add pagination to articles return (api/get-articles)

### Improvements for feed schema

    - what should feed.image contain (url | link)
    - sy_updatePeriod: text() - figure out what the value is and rename
    - sy_updateFrequency: text() - figure out what the value is and rename

# Missing parts:

- Jobs to trigger feed ingestion
- Add messaging broker
- Grouping the articles covering same news
- Staleness policy: how old can a feed item be before it is ignored; how often do you re-check recent feed windows?
- Caching
- Which treshold to use for relevancy
- Improve DB schemas
- Find consumed guids should have a time restrain (look only at guids saved after this date - previous fetch call?)
- Bun VS Hono
- Proper DB to replace local SQLite ✓

---

### Remaining ToDo (12/08/2026)

- Replace useEffect to use SSR (Next)
- Move APIkey to Headers instead of having it in request body
- Isolate FE demo to separate directory
- Decide what happens when one article, feed, or embedding request fails.
- Articles are saved to DB with HTML tags - remove them before inserting ✓
- Save ingestion report ✓
- Improve types once the ingestion report format is decided upon ✓

---

## Older task lists

---

ToDO for 03/08

- Stabilize the backend/worker contract: ✓
  - Define shared request/response types. ✓
  - Validate the worker response before using it. ✓
  - Move the worker URL into environment configuration. ✓
- Confirm Swedish characters are preserved correctly in articles - seems so from articles saved to db so far
- _Separate ingestion from application startup_ ✓
  - Expose ingestion as a callable function or command. ✓
  - Ensure it can be triggered by a cron job, CLI command, worker, or API endpoint. ✓
  - Decide what happens when one article, feed, or embedding request fails.
- Make the following endpoints in backend: /api/get-articles ✓
- Create separate routes files and adjust endpoints ✓
- _Add persistence for processing metadata_
  - Decide whether embeddings, processing timestamps, or processing status should be stored. ✓
  - Track whether an article has already been processed. ✓
- _Add observability_ ✓
  - Log ingestion start/end, feed identity, counts, duration, and failures. ✓
  - Use structured logs so scheduled executions can be inspected later. ✓

- INGESTION:
  - irrelevant articles will be reprocessed on every run. Persist processing status/GUIDs separately ✓
  - Add `feedId` to failed results too. ✓
  - Foreign key connecting article to feed! ✓
  - Do I need to check both: ON CONFLICT (feedId, guid) when inserting articles ✓

---

ToDo for 05/08/26

- Do a single page in FE to display the results ✓
- Shared direcory for types ✓

---

ToDo for 06/08/26

- Move backend logic systematically to web (Next) ✓
- Use the AI suggested structure for route/repository pattern ✓
- Replace types where needed with the shared ones ✓
- migrate DB ✓
- Rename types : /Users/ivonajosipovic/Desktop/rss/web/src/server/ingestion/types.ts ✓
- Refactor `ingestFeed` into a small effectful pipeline plus pure result/count builders. ✓
