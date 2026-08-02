import type { Item } from "@/types";
import { normalizeText } from "./normalizeText";

export function getArticleText(article: Item): string {
  const normalizedTitle = normalizeText(article.title);
  const normalizedDescription = normalizeText(article.description, true);

  return [normalizedTitle, normalizedDescription]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
