import { parseGenericRss } from "./rss-generic.mjs";

export function parseBilibiliFeed(xml, source) {
	return parseGenericRss(xml, source).map((item) => ({
		...item,
		category: "",
	}));
}
