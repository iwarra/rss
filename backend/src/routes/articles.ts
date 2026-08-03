import { Hono } from "hono";
import { client } from "@/db/client";

const articles = new Hono();

type ArticleRow = {
  id: number;
  title: string;
  link: string;
  description: string | null;
  pubDate: number;
  guid: string;
  media_content: string | null;
  sourceCategory: string | null;
  categories: string | null;
};

function parseCategories(categories: string | null): string[] | null {
  if (categories === null) return null;

  const parsed: unknown = JSON.parse(categories);
  if (
    !Array.isArray(parsed) ||
    !parsed.every((category) => typeof category === "string")
  ) {
    throw new Error("Invalid article categories in database.");
  }

  return parsed;
}

articles.get("/get-all", async (c) => {
  try {
    const articles = client
      .query<ArticleRow, []>(
        `
        SELECT
          id,
          title,
          link,
          description,
          pubDate,
          guid,
          media_content,
          sourceCategory,
          categories
        FROM articles
        ORDER BY pubDate DESC, id DESC
      `,
      )
      .all()
      .map((article) => ({
        ...article,
        pubDate: new Date(article.pubDate).toISOString(),
        categories: parseCategories(article.categories),
      }));

    return c.json(articles);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

export default articles;
