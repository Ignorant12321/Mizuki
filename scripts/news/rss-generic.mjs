import {
	decodeEntities,
	extractAttribute,
	extractFirstTag,
	extractTagValues,
	joinCategories,
	resolveLink,
	stripHtml,
} from "./common.mjs";

function extractTagXml(xml, tag) {
	const pattern = new RegExp(
		`<${tag}\\b[^>]*(?:\\/>|>[\\s\\S]*?<\\/${tag}>)`,
		"gi",
	);
	return xml.match(pattern) ?? [];
}

function extractAtomLink(entryXml) {
	const linkTags = extractTagXml(entryXml, "link");
	const alternateLink =
		linkTags.find((tagXml) => {
			const rel = extractAttribute(tagXml, "rel").toLowerCase();
			return !rel || rel === "alternate";
		}) ??
		linkTags[0] ??
		"";

	return (
		extractAttribute(alternateLink, "href") ||
		decodeEntities(extractFirstTag(entryXml, "link"))
	);
}

function extractAtomCategory(entryXml) {
	const textCategories = extractTagValues(entryXml, "category").map((value) =>
		stripHtml(value),
	);
	const termCategories = extractTagXml(entryXml, "category").map((tagXml) =>
		stripHtml(
			extractAttribute(tagXml, "term") ||
				extractAttribute(tagXml, "label"),
		),
	);

	return joinCategories(
		[...textCategories, ...termCategories].filter(Boolean),
	);
}

function formatAtomDescription(value) {
	const normalized = decodeEntities(value || "")
		.replace(/<script\b[\s\S]*?<\/script>/gi, "\n")
		.replace(/<style\b[\s\S]*?<\/style>/gi, "\n")
		.replace(/<figure\b[\s\S]*?<\/figure>/gi, "\n")
		.replace(/<img\b[^>]*>/gi, "\n")
		.replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n\n【$1】\n\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<(li)\b[^>]*>/gi, "• ")
		.replace(/<\/li>/gi, "\n")
		.replace(
			/<\/(p|div|section|article|blockquote|pre|ul|ol|table|tr)>/gi,
			"\n\n",
		)
		.replace(/<\/?(strong|em|b|i|code|span)\b[^>]*>/gi, "")
		.replace(/<a\b[^>]*>/gi, "")
		.replace(/<\/a>/gi, "")
		.replace(/<[^>]*>/g, " ")
		.replace(/\r\n?/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n[ \t]+/g, "\n")
		.replace(/[ \t]{2,}/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	return normalized
		.split(/\n{2,}/)
		.map((block) =>
			block
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean)
				.filter((line) => !/^[•·。\-.|]+$/.test(line))
				.join("\n"),
		)
		.filter(Boolean)
		.join("\n\n")
		.trim();
}

function parseAtom(xml, source) {
	const entryXmlList = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];

	return entryXmlList
		.map((entryXml) => {
			const title =
				stripHtml(extractFirstTag(entryXml, "title")) || "无标题";
			const link = extractAtomLink(entryXml);
			const pubDate = stripHtml(
				extractFirstTag(entryXml, "published") ||
					extractFirstTag(entryXml, "updated"),
			);
			const description = formatAtomDescription(
				extractFirstTag(entryXml, "content") ||
					extractFirstTag(entryXml, "summary"),
			);

			return {
				title,
				link: resolveLink(link, source.url),
				pubDate,
				description,
				category: extractAtomCategory(entryXml),
				sourceName: source.name,
				sourceUrl: source.url,
			};
		})
		.filter((item) => item.title && item.link);
}

export function parseGenericRss(xml, source) {
	const itemXmlList = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

	if (itemXmlList.length === 0) {
		return parseAtom(xml, source);
	}

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
