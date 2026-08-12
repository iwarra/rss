import { XMLParser } from "fast-xml-parser";
import type { RssObject } from "@/shared/types";

export default function parseXML(
  xmlData: string | Uint8Array<ArrayBufferLike>,
) {
  const parser = new XMLParser();
  return parser.parse(xmlData) as RssObject;
}
