import {
	decodeEntities,
	extractFirstTag,
	resolveLink,
	stripNewsHtml,
} from "./common";
import type { NewsFeedSource, NewsItem } from "./types";

export function parseBilibiliFeed(
	xml: string,
	source: NewsFeedSource,
): NewsItem[] {
	const itemXmlList = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

	return itemXmlList
		.map((itemXml) => {
			const title =
				stripNewsHtml(extractFirstTag(itemXml, "title")) || "无标题";
			const link =
				decodeEntities(extractFirstTag(itemXml, "link")) ||
				decodeEntities(extractFirstTag(itemXml, "guid"));
			const pubDate = stripNewsHtml(extractFirstTag(itemXml, "pubDate"));
			const description = stripNewsHtml(
				extractFirstTag(itemXml, "description"),
			);

			return {
				title,
				link: resolveLink(link, source.url),
				pubDate,
				description,
				category: "",
				sourceName: source.name,
				sourceUrl: source.url,
			};
		})
		.filter((item) => item.title && item.link);
}
