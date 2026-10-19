import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

import { isFeedRequestAuthorized } from "@/server/feed/feed-auth";
import { addFeed, removeDuplicateLinks } from "@/server/feed/service";

const addFeedsBodySchema = z.object({
  links: z.array(z.string()),
});

type FeedEnv = {
  API_KEY?: string;
};

export async function POST(request: Request): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true });
  const { API_KEY } = env as FeedEnv;

  if (!isFeedRequestAuthorized(request, API_KEY)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = addFeedsBodySchema.safeParse(await request.json());

  if (!body.success || body.data.links.length === 0) {
    return Response.json(
      { error: "At least one link is required." },
      { status: 400 },
    );
  }

  try {
    const uniqueLinks = removeDuplicateLinks(body.data.links);
    for (const link of uniqueLinks) {
      await addFeed(link);
    }

    return new Response(null, { status: 202 });
  } catch {
    return Response.json({ error: "Unable to add feeds." }, { status: 502 });
  }
}
