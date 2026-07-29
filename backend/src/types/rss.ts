import type { Item } from "@/types";

export interface RssObject {
  rss: Rss;
}

export interface Rss {
  channel: RssFeed;
}

export interface RssFeed {
  title: string;
  description: string;
  link: string;
  lastBuildDate?: string;
  copyright?: string;
  language?: string;
  image?: Image;
  managingEditor?: string;
  "atom:link"?: string;
  "sy:updatePeriod"?: string;
  "sy:updateFrequency"?: number;
  item: Item[];
}

export interface Image {
  title: string;
  url: string;
  link: string;
}
