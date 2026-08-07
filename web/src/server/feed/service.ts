import "server-only";
import { fetchFeed } from "@/utils/fetchFeed";
import { insertFeed } from "@/server/feed/repository";
import { NewFeed } from "../db/schema";

export async function addFeed(rssLink: string) {
  const { channel } = await fetchFeed(rssLink);

  const feed: NewFeed = {
    title: channel.title,
    link: channel.link,
    rssLink,
    description: channel.description,
    language: channel.language,
    sy_updatePeriod: channel["sy:updatePeriod"],
    sy_updateFrequency: channel["sy:updateFrequency"]?.toString(),
    image: channel.image,
  };
  await insertFeed(feed);
}

export function removeDuplicateLinks(links: string[]) {
  return [...new Set(links)];
}
