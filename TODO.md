// Store data into a DB that is required for the frontend application
// Store data in files/unstructured when not required for frontend application, but perhaps needed prior

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

## To do:

- Improve types
- Improve DB schema

### Improvements for feed schema

    - what should feed.image contain (url | link)
    - sy_updatePeriod: text() - figure out what the value is and rename
    - sy_updateFrequency: text() - figure out what the value is and rename

# IMPORTANT

---Clustering doesn't take in any parameters and grous on similarity !!!
--- Add pagination to articles return (api/get-articles)

**TO DO for 03.08.26**

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

INGESTION:

- irrelevant articles will be reprocessed on every run. Persist processing status/GUIDs separately ✓
- Add `feedId` to failed results too. ✓
- Foreign key connecting article to feed! ✓
- Do I need to check both: ON CONFLICT (feedId, guid) when inserting articles

Missing parts:

- Jobs to trigger feed ingestion
- Add messaging broker
- ~~Proper DB to replace local SQLite~~ ✓
- Grouping the articles covering same news
- Staleness policy: how old can a feed item be before it is ignored; how often do you re-check recent feed windows?
- Caching

ToDo for 05/08/26

- ~~Do a single page in FE to display the results~~
- Articles are saved to DB with HTML tags - remove or let frontend handle it?
- Which treshold to use for relevancy ?
- Shared direcory for types?

ToDo for 06/08/26

- Move backend logic systematically to web (Next)
- Use the AI suggested structure for route/repository pattern
- Replace useEffect to use SSR (Next)
- Replace types where needed with the shared ones
- Isolate FE demo to separate directory
- Improve DB schemas and migrate
- Move APIkey to Headers instead of having it in request body ?

Refactor `ingestFeed` into a small effectful pipeline plus pure result/count builders.
Rename types : /Users/ivonajosipovic/Desktop/rss/web/src/server/ingestion/types.ts
ConsumedArticle status should be defined
