import type { Item } from "@/types";
import type { NewArticle } from "@/db/schema";
import type { ProcessedArticle } from "@/types";

export function getArticlesToPersist(
  feedId: number,
  items: Item[],
  processed: ProcessedArticle[],
): NewArticle[] {
  const processedByGuid = new Map(
    processed
      .filter((article) => article.isRelevant)
      .map((article) => [article.id, article]),
  );

  return items.flatMap((item) => {
    const processedArticle = processedByGuid.get(item.guid);
    if (!processedArticle) return [];

    return [
      {
        feedId,
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: new Date(item.pubDate),
        guid: item.guid,
        media_content: item["media:content"]
          ? JSON.stringify(item["media:content"])
          : null,
        sourceCategory: item.category ?? null,
        categories: processedArticle.categories,
      },
    ];
  });
}
