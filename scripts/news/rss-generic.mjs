import {
	decodeEntities,
	extractFirstTag,
	extractTagValues,
	joinCategories,
	resolveLink,
	stripHtml,
} from "./common.mjs";

export function parseGenericRss(xml, source) {
	const itemXmlList = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

	return itemXmlList
		.map((itemXml) => {
			const title =
				stripHtml(extractFirstTag(itemXml, "title")) || "无标题";
			const link =
				decodeEntities(extractFirstTag(itemXml, "link")) ||
				decodeEntities(extractFirstTag(itemXml, "guid"));
			const pubDate = stripHtml(extractFirstTag(itemXml, "pubDate"));
			const description = stripHtml(
				extractFirstTag(itemXml, "description"),
			);
			const category = joinCategories(
				extractTagValues(itemXml, "category")
					.map((value) => stripHtml(value))
					.filter(Boolean),
			);

			return {
				title,
				link: resolveLink(link, source.url),
				pubDate,
				description,
				category,
				sourceName: source.name,
				sourceUrl: source.url,
			};
		})
		.filter((item) => item.title && item.link);
}
