import { getArticles } from "@/server/articles/repository";

export async function GET() {
  try {
    return Response.json(await getArticles());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
