import { getFeeds } from "@/server/feed/repository";

export async function GET(): Promise<Response> {
  try {
    const feeds = await getFeeds();

    return Response.json({
      feeds: feeds.map(({ id, title }) => ({ id, title })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
