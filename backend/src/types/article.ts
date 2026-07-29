export interface Item {
  title: string;
  description: string;
  category?: string;
  link: string;
  author?: string;
  "dc:creator"?: string | string[];
  "media:content"?: MediaContent;
  pubDate: string;
  guid: string;
}

export interface MediaContent {
  "media:credit": string;
  "media:description": string;
}
