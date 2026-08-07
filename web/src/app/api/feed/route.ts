//import { getCloudflareContext } from "@opennextjs/cloudflare";
import { addFeed, removeDuplicateLinks } from "@/server/feed/service";
import { env } from "process";

//TODO: Move APIkey to Headers
type AddFeedsBody = {
  links: string[];
  apiKey: string;
};

export async function POST(request: Request) {
  const { links, apiKey } = (await request.json()) as AddFeedsBody;
  //const { env } = await getCloudflareContext({ async: true });

  //Temporary! till the the one above is enabled
  if (apiKey !== env.API_KEY) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!Array.isArray(links) || links.length === 0) {
    return Response.json(
      { error: "At least one link is required." },
      { status: 400 },
    );
  }

  try {
    const uniqueLinks = removeDuplicateLinks(links);
    for (const link of uniqueLinks) {
      await addFeed(link);
    }

    return new Response(null, { status: 202 });
  } catch {
    return Response.json({ error: "Unable to add feeds." }, { status: 502 });
  }
}
