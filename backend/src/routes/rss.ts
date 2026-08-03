import { addNewFeed } from "@/utils/addNewFeed";
import { Hono } from "hono";

const rss = new Hono();

rss.post("/add-feeds", async (c) => {
  //Credentials sent over body as auth header works only over HTTPS because of encoding
  // To be replaced later on
  const { links, APIKey } = await c.req.json<{
    links: string[];
    APIKey: string;
  }>();

  const API_KEY = Bun.env.API_KEY;
  //Send header: APIKey: YOUR_API_KEY
  if (APIKey !== API_KEY) {
    c.header("APIKey", "YOUR_API_KEY");
    return c.status(401);
  }
  if (!links.length) return c.status(400);
  const uniqueLinks = new Set(links);

  try {
    uniqueLinks.forEach((link) => addNewFeed(link));
    return c.status(202);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 502);
  }
});

export default rss;
