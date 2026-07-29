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
- Are article being upserted _done_
- Auth _done_
- Validate _done_
- handle more urls in API rss/add-link _done_

### Improvements for feed schema

    - what should feed.image contain (url | link)
    - sy_updatePeriod: text() - figure out what the value is and rename
    - sy_updateFrequency: text() - figure out what the value is and rename
