import type { Item } from "@/types";

type ParsedItem = Omit<Item, "category" | "guid"> & {
  category?: string | string[];
  guid?: string;
};

export function normalizeFeedItems(items: ParsedItem[]): Item[] {
  return items.map((item) => ({
    ...item,
    category: Array.isArray(item.category)
      ? JSON.stringify(item.category)
      : item.category,
    guid: item.guid?.trim() || item.link,
  }));
}
