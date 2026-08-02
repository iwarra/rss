import { load } from "cheerio";

export function normalizeText(
  input: string | null | undefined,
  preserveParagraphs = false,
): string {
  if (!input) return "";

  const $ = load("<div></div>", null, false);
  const container = $("div");

  container.html(input);
  container.find("script, style, noscript, template").remove();

  if (preserveParagraphs) {
    container.find("br").replaceWith("\n");
    container.find("p, div, li, h1, h2, h3").each((_, element) => {
      $(element).prepend("\n").append("\n");
    });
  }

  const text = container
    .text()
    .normalize("NFC")
    .replace(/\u00a0/g, " ");

  if (!preserveParagraphs) {
    return text.replace(/\s+/g, " ").trim();
  }

  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}
