import {
	decodeEntities,
	extractFirstTag,
	extractTagValues,
	joinCategories,
	resolveLink,
	stripHtml,
} from "./common.mjs";

function tightenCjkSpacing(value) {
	return String(value || "")
		.replace(/([\u3400-\u9fff])\s+([\u3400-\u9fff])/g, "$1$2")
		.replace(/([\u3400-\u9fff])\s+([，。！？；：、）】》])/g, "$1$2")
		.replace(/([（【《])\s+([\u3400-\u9fff])/g, "$1$2")
		.replace(/([，。！？；：、）】》])\s+([\u3400-\u9fff])/g, "$1$2");
}

function cleanZaobaoDescription(value) {
	const decoded = decodeEntities(value || "");
	const normalized = decoded
		.replace(/<figure\b[\s\S]*?<\/figure>/gi, "\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote)>/gi, "\n")
		.replace(/<(li)\b[^>]*>/gi, "• ")
		.replace(/<a\b[^>]*>/gi, "")
		.replace(/<\/a>/gi, "")
		.replace(/<[^>]*>/g, " ")
		.replace(/\r\n?/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n[ \t]+/g, "\n")
		.replace(/[ \t]{2,}/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	const lines = normalized
		.split("\n")
		.map((line) => tightenCjkSpacing(line.trim()))
		.filter(Boolean)
		.filter((line) => !/^[•·。\-.|]+$/.test(line));

	return lines.join("\n");
}

export function parseZaobaoFeed(xml, source) {
	const itemXmlList = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

	return itemXmlList
		.map((itemXml) => {
			const title =
				stripHtml(extractFirstTag(itemXml, "title")) || "无标题";
			const link =
				decodeEntities(extractFirstTag(itemXml, "link")) ||
				decodeEntities(extractFirstTag(itemXml, "guid"));
			const pubDate = stripHtml(extractFirstTag(itemXml, "pubDate"));
			const description = cleanZaobaoDescription(
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
