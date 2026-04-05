import { siteConfig } from "../config";

export interface NewsItem {
	title: string;
	link: string;
	pubDate?: string;
	description?: string;
	category?: string;
	sourceName: string;
	sourceUrl: string;
}

export interface NewsFeedSource {
	id: string;
	name: string;
	url: string;
}

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
		id: "zaobao-finance",
		name: "联合早报 · 财经",
		url: "https://rsshub.pseudoyu.com/zaobao/realtime/zfinance",
	},
];

export const newsMode = siteConfig.news?.mode ?? "local";

export const newsFeedSources: NewsFeedSource[] =
	siteConfig.news?.feeds?.filter(
		(feed) =>
			typeof feed.id === "string" &&
			feed.id.trim().length > 0 &&
			typeof feed.name === "string" &&
			feed.name.trim().length > 0 &&
			typeof feed.url === "string" &&
			feed.url.trim().length > 0,
	) ?? defaultNewsFeedSources;

const entityMap: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

function decodeEntities(value: string): string {
	return value
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
		.replace(/&#(\d+);/g, (_, num: string) => {
			const code = Number(num);
			return Number.isFinite(code) ? String.fromCharCode(code) : _;
		})
		.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
			const code = Number.parseInt(hex, 16);
			return Number.isFinite(code) ? String.fromCharCode(code) : _;
		})
		.replace(/&([a-z]+);/gi, (_, name: string) => entityMap[name] ?? _);
}

export function stripNewsHtml(value = ""): string {
	return decodeEntities(value)
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function extractTagValues(xml: string, tag: string): string[] {
	const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
	const values: string[] = [];

	for (const match of xml.matchAll(pattern)) {
		if (typeof match[1] === "string") {
			values.push(match[1]);
		}
	}

	return values;
}

function extractFirstTag(xml: string, tag: string): string {
	const values = extractTagValues(xml, tag);
	return values.length > 0 ? values[0] : "";
}

function resolveLink(link: string, baseUrl: string): string {
	if (!link) {
		return "#";
	}

	try {
		return new URL(link, baseUrl).href;
	} catch {
		return link;
	}
}

export function formatNewsDate(dateStr?: string): string {
	if (!dateStr) {
		return "";
	}

	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) {
		return stripNewsHtml(dateStr);
	}

	const locale =
		siteConfig.lang === "ja"
			? "ja-JP"
			: siteConfig.lang === "zh_TW"
				? "zh-TW"
				: siteConfig.lang === "en"
					? "en-US"
					: "zh-CN";

	return date.toLocaleString(locale, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function toTimeValue(dateStr?: string): number {
	if (!dateStr) {
		return 0;
	}

	const time = new Date(dateStr).getTime();
	return Number.isFinite(time) ? time : 0;
}

export async function fetchNewsListBySource(
	source: NewsFeedSource,
): Promise<NewsItem[]> {
	try {
		const response = await fetch(source.url, {
			headers: {
				"user-agent": "Mozilla/5.0",
				accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch RSS: ${response.status} ${response.statusText}`,
			);
		}

		const xml = await response.text();
		const itemXmlList = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

		return itemXmlList
			.map((itemXml) => {
				const title =
					stripNewsHtml(extractFirstTag(itemXml, "title")) ||
					"无标题";
				const link =
					decodeEntities(extractFirstTag(itemXml, "link")) ||
					decodeEntities(extractFirstTag(itemXml, "guid"));
				const pubDate = stripNewsHtml(
					extractFirstTag(itemXml, "pubDate"),
				);
				const description = stripNewsHtml(
					extractFirstTag(itemXml, "description"),
				);
				const categoryValues = extractTagValues(itemXml, "category")
					.map((value) => stripNewsHtml(value))
					.filter(Boolean);

				return {
					title,
					link: resolveLink(link, source.url),
					pubDate,
					description,
					category:
						categoryValues.length > 0
							? Array.from(new Set(categoryValues)).join(" / ")
							: "",
					sourceName: source.name,
					sourceUrl: source.url,
				};
			})
			.filter((item) => item.title && item.link);
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

	const merged = listBySource.flat();
	const deduped = Array.from(
		new Map(merged.map((item) => [item.link || item.title, item])).values(),
	);

	return deduped.sort(
		(a, b) => toTimeValue(b.pubDate) - toTimeValue(a.pubDate),
	);
}
