import { siteConfig } from "../config";
import { parseBilibiliFeed } from "./news/bilibili";
import { parseCsdnFeed } from "./news/csdn";
import {
	dedupeAndSort,
	fetchXmlWithRetry,
	formatNewsDate,
	normalizeNewsFeedSource,
} from "./news/common";
import { parseGenericRss } from "./news/rss-generic";
import { parseZaobaoFeed } from "./news/zaobao";
import type { NewsFeedSource, NewsItem } from "./news/types";

const defaultNewsFeedSources: NewsFeedSource[] = [
	{
		id: "zaobao-china",
		name: "联合早报 · 中国",
		url: "https://rsshub.pseudoyu.com/zaobao/realtime/china",
	},
	{
		id: "zaobao-world",
		name: "联合早报 · 国际",
		url: "https://rsshub.pseudoyu.com/zaobao/realtime/world",
	},
	{
		id: "csdn-geeknews",
		name: "CSDN · 极客日报",
		url: "https://rsshub.pseudoyu.com/csdn/blog/csdngeeknews",
	},
];

export type { NewsFeedSource, NewsItem } from "./news/types";
export { formatNewsDate } from "./news/common";

export const newsMode = siteConfig.news?.mode ?? "local";

export const newsFeedSources: NewsFeedSource[] = (() => {
	const configuredFeeds = siteConfig.news?.feeds ?? [];
	const validFeeds = configuredFeeds.filter(
		(feed) =>
			typeof feed.id === "string" &&
			feed.id.trim().length > 0 &&
			typeof feed.name === "string" &&
			feed.name.trim().length > 0 &&
			typeof feed.url === "string" &&
			feed.url.trim().length > 0,
	);

	return validFeeds.length > 0
		? validFeeds.map((feed) => normalizeNewsFeedSource(feed))
		: defaultNewsFeedSources;
})();

function pickParser(
	source: NewsFeedSource,
): (xml: string, s: NewsFeedSource) => NewsItem[] {
	const id = source.id.toLowerCase();
	const name = source.name.toLowerCase();
	const url = source.url.toLowerCase();
	const fingerprint = `${id} ${name} ${url}`;

	if (fingerprint.includes("zaobao")) {
		return parseZaobaoFeed;
	}
	if (fingerprint.includes("csdn")) {
		return parseCsdnFeed;
	}
	if (fingerprint.includes("bilibili")) {
		return parseBilibiliFeed;
	}
	return parseGenericRss;
}

export async function fetchNewsListBySource(
	source: NewsFeedSource,
): Promise<NewsItem[]> {
	try {
		const xml = await fetchXmlWithRetry(source.url);
		return pickParser(source)(xml, source);
	} catch {
		return [];
	}
}

export async function fetchNewsList(
	sources: NewsFeedSource[] = newsFeedSources,
): Promise<NewsItem[]> {
	const listBySource = await Promise.all(
		sources.map((source) => fetchNewsListBySource(source)),
	);
	return dedupeAndSort(listBySource.flat());
}
