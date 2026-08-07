import type { Rss } from "@/shared/types";
import parseXML from "./parseXML";

export async function fetchFeed(link: string): Promise<Rss> {
  let url: URL;

  try {
    url = new URL(link);
  } catch {
    throw new Error(`Invalid feed URL: ${link}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch feed ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();
  const parsed = parseXML(xml);

  return parsed.rss;
}
