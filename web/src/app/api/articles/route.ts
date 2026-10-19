import {
  InvalidArticleQueryError,
  parseArticleQuery,
} from "@/server/articles/query";
import { getArticles } from "@/server/articles/repository";

export async function GET(request: Request): Promise<Response> {
  try {
    return Response.json(
      await getArticles(parseArticleQuery(new URL(request.url).searchParams)),
    );
  } catch (error) {
    if (error instanceof InvalidArticleQueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
