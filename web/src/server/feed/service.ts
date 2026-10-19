import "server-only";

import { z } from "zod";

import { insertFeed } from "@/server/feed/repository";
import { fetchFeed } from "@/server/ingestion/fetchFeed";

import { NewFeed } from "../db/schema";

const linkSchema = z.url().refine(
  (url) => {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  },
  { message: "RSS links must use HTTP or HTTPS" },
);

export async function addFeed(rssUrl: string): Promise<void> {
  const validatedUrl = linkSchema.parse(rssUrl);
  //TODO: What if invalid link is passed???
  const { channel } = await fetchFeed(validatedUrl);

  const feed: NewFeed = {
    title: channel.title,
    link: channel.link,
    rssLink: validatedUrl,
    description: channel.description,
    language: channel.language,
    sy_updatePeriod: channel["sy:updatePeriod"],
    sy_updateFrequency: channel["sy:updateFrequency"]?.toString(),
    image: channel.image,
  };
  await insertFeed(feed);
  //Do we need a return?
}

export function removeDuplicateLinks(links: string[]): string[] {
  return [...new Set(links)];
}
