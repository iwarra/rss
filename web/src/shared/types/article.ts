import { z } from "zod";

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

//Meant to validate the request part, not in use atm
export const articleForProcessingSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const processedArticleSchema = z.object({
  id: z.string(),
  embedding: z.array(z.number()),
  isRelevant: z.boolean(),
  categories: z.array(z.string()),
  similarTo: z.array(z.string()).optional(),
});

export const processArticlesRequestSchema = z.object({
  articles: z.array(articleForProcessingSchema),
});

export const processArticlesResponseSchema = z.object({
  articles: z.array(processedArticleSchema),
});

export type ArticleForProcessing = z.infer<typeof articleForProcessingSchema>;

export type ProcessedArticle = z.infer<typeof processedArticleSchema>;

export type ProcessArticlesRequest = z.infer<
  typeof processArticlesRequestSchema
>;

export type ProcessArticlesResponse = z.infer<
  typeof processArticlesResponseSchema
>;
