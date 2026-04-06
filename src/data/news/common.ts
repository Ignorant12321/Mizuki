import { siteConfig } from "../../config";
import type { NewsFeedSource, NewsItem } from "./types";

const entityMap: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

export function decodeEntities(value: string): string {
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

export function extractTagValues(xml: string, tag: string): string[] {
	const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
	const values: string[] = [];

	for (const match of xml.matchAll(pattern)) {
		if (typeof match[1] === "string") {
			values.push(match[1]);
		}
	}

	return values;
}

export function extractFirstTag(xml: string, tag: string): string {
	const values = extractTagValues(xml, tag);
	return values.length > 0 ? values[0] : "";
}

export function extractAttribute(tagXml: string, attribute: string): string {
	const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i");
	const match = tagXml.match(pattern);
	return match?.[1] ? decodeEntities(match[1]) : "";
}

export function resolveLink(link: string, baseUrl: string): string {
	if (!link) {
		return "#";
	}

	try {
		return new URL(link, baseUrl).href;
	} catch {
		return link;
	}
}

export function joinCategories(values: string[]): string {
	if (values.length === 0) {
		return "";
	}
	return Array.from(new Set(values.filter(Boolean))).join(" / ");
}

export function toTimeValue(dateStr?: string): number {
	if (!dateStr) {
		return 0;
	}

	const time = new Date(dateStr).getTime();
	return Number.isFinite(time) ? time : 0;
}

export function dedupeAndSort(items: NewsItem[]): NewsItem[] {
	const deduped = Array.from(
		new Map(items.map((item) => [item.link || item.title, item])).values(),
	);
	return deduped.sort(
		(a, b) => toTimeValue(b.pubDate) - toTimeValue(a.pubDate),
	);
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
	const timeZoneOffset =
		siteConfig.timeZone >= -12 && siteConfig.timeZone <= 12
			? siteConfig.timeZone
			: 8;
	const siteDate = new Date(date.getTime() + timeZoneOffset * 60 * 60 * 1000);

	return siteDate.toLocaleString(locale, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZone: "UTC",
	});
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export async function fetchXmlWithRetry(
	url: string,
	attempts = 3,
): Promise<string> {
	let lastError: unknown;

	for (let index = 0; index < attempts; index += 1) {
		try {
			const response = await fetch(url, {
				headers: {
					"user-agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
					accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
					"accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
					referer: "https://rsshub.pseudoyu.com/",
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch RSS: ${response.status} ${response.statusText}`,
				);
			}

			return await response.text();
		} catch (error) {
			lastError = error;
			if (index < attempts - 1) {
				await delay(1000 * (index + 1));
			}
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("Failed to fetch RSS");
}

export function normalizeNewsFeedSource(feed: NewsFeedSource): NewsFeedSource {
	return {
		id: feed.id,
		name: feed.name,
		url: feed.url,
	};
}
