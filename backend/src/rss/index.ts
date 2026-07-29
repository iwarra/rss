import { type Feed, type Article, type NewFeed } from "@/db/schema";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { fetchFeed } from "@/utils/fetchFeed";
import type { RssFeed, Item } from "@/types";

export async function getFeedsFromDatabase(title?: Feed["title"]) {
  const filter = (condition: string) => (title ? sql`${condition}` : sql``);

  return db.all<Feed>(sql`
    SELECT *
    FROM feeds
    ${filter(`WHERE title = ${title}`)}
    `);
}

//Type Feed as it uses DB data for the call
export async function getItems(feed: Feed): Promise<Item[]> {
  const {
    channel: { item: items },
  } = await fetchFeed(feed.rssLink);

  if (!items) return [];
  return items;
}

export async function insertArticle(item: Item) {
  const article = {
    title: item.title,
    link: item.link,
    pubDate: new Date(item.pubDate),
    guid: item.guid,
  } as Article;

  db.run(sql`
    INSERT INTO articles (${sql.raw(Object.keys(article).join(","))})
    VALUES (${article.title}, ${article.link}, ${article.pubDate.getTime()}, ${article.guid})
    ON CONFLICT (guid) DO NOTHING
  `);
}

type RssFeedWithLink = RssFeed & {
  rssLink: string;
};

export async function insertFeed(feed: RssFeedWithLink) {
  const columns: NewFeed = {
    title: feed.title,
    link: feed.link,
    rssLink: feed.rssLink,
    description: feed.description,
    language: feed.language,
    sy_updatePeriod: feed["sy:updatePeriod"],
    sy_updateFrequency: feed["sy:updateFrequency"]?.toString(),
    image: feed.image,
  };

  return db.run(sql`
    INSERT INTO feeds(${sql.raw(Object.keys(columns).join(","))})
    VALUES (
      ${columns.title},
      ${columns.link},
      ${columns.rssLink ?? null},
      ${columns.description ?? null},
      ${columns.language ?? null},
      ${columns.sy_updatePeriod ?? null},
      ${columns.sy_updateFrequency ?? null},
      ${JSON.stringify(columns.image) ?? null}
    )
    ON CONFLICT (link) DO NOTHING
  `);
}
