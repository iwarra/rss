import { insertFeed } from "@/server/feed/repository";
import type { RssFeed } from "@/shared/types/rss";
import { fetchFeed } from "@/utils/fetchFeed";
import { z } from "zod";

const linkSchema = z.url().refine(
  (url) => {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  },
  { message: "RSS links must use HTTP or HTTPS" },
);

export async function addNewFeed(url: string) {
  const validatedUrl = linkSchema.parse(url);
  const { channel } = await fetchFeed(validatedUrl);

  const feedWithRSSLink = {
    ...channel,
    rssLink: validatedUrl,
  } as RssFeed & {
    rssLink: string;
  };

  const result = await insertFeed(feedWithRSSLink);

  //TODO: What to return!!!!
  return Boolean(result.changes);
}
