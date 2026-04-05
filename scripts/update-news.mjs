import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(ROOT_DIR, "../src/config.ts");
const OUTPUT_FILE = path.join(ROOT_DIR, "../src/data/news-data.json");

const entityMap = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

function decodeEntities(value) {
	return value
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
		.replace(/&#(\d+);/g, (_, num) => {
			const code = Number(num);
			return Number.isFinite(code) ? String.fromCharCode(code) : _;
		})
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
			const code = Number.parseInt(hex, 16);
			return Number.isFinite(code) ? String.fromCharCode(code) : _;
		})
		.replace(/&([a-z]+);/gi, (_, name) => entityMap[name] ?? _);
}

function stripHtml(value = "") {
	return decodeEntities(value)
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function extractTagValues(xml, tag) {
	const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
	const values = [];

	for (const match of xml.matchAll(pattern)) {
		if (typeof match[1] === "string") {
			values.push(match[1]);
		}
	}

	return values;
}

function extractFirstTag(xml, tag) {
	const values = extractTagValues(xml, tag);
	return values.length > 0 ? values[0] : "";
}

function resolveLink(link, baseUrl) {
	if (!link) {
		return "#";
	}

	try {
		return new URL(link, baseUrl).href;
	} catch {
		return link;
	}
}

function toTimeValue(dateStr) {
	if (!dateStr) {
		return 0;
	}

	const time = new Date(dateStr).getTime();
	return Number.isFinite(time) ? time : 0;
}

async function getNewsFeedsFromConfig() {
	const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
	const newsBlockMatch = configContent.match(
		/news:\s*\{([\s\S]*?)\n\t\},\n\n\tpagination:/,
	);

	if (!newsBlockMatch) {
		return [];
	}

	const feedRegex =
		/\{\s*[\s\S]*?id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?url:\s*"([^"]+)"[\s\S]*?\}/g;
	const feeds = [];

	for (const match of newsBlockMatch[1].matchAll(feedRegex)) {
		feeds.push({
			id: match[1],
			name: match[2],
			url: match[3],
		});
	}

	return feeds;
}

async function fetchNewsListBySource(source) {
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
					stripHtml(extractFirstTag(itemXml, "title")) || "无标题";
				const link =
					decodeEntities(extractFirstTag(itemXml, "link")) ||
					decodeEntities(extractFirstTag(itemXml, "guid"));
				const pubDate = stripHtml(extractFirstTag(itemXml, "pubDate"));
				const description = stripHtml(
					extractFirstTag(itemXml, "description"),
				);
				const categoryValues = extractTagValues(itemXml, "category")
					.map((value) => stripHtml(value))
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
		console.warn(`Warning: failed to fetch RSS for ${source.name}`);
		return [];
	}
}

async function updateNewsSnapshot() {
	const feeds = await getNewsFeedsFromConfig();
	if (feeds.length === 0) {
		console.warn("Warning: no news feeds found in src/config.ts");
		return;
	}

	const listBySource = await Promise.all(
		feeds.map((source) => fetchNewsListBySource(source)),
	);
	const merged = listBySource.flat();
	const deduped = Array.from(
		new Map(merged.map((item) => [item.link || item.title, item])).values(),
	).sort((a, b) => toTimeValue(b.pubDate) - toTimeValue(a.pubDate));

	await fs.writeFile(
		OUTPUT_FILE,
		`${JSON.stringify(deduped, null, 2)}\n`,
		"utf-8",
	);
	console.log(`✓ Updated news snapshot with ${deduped.length} items`);
}

updateNewsSnapshot().catch(async (error) => {
	console.error("✘ Failed to update news snapshot");
	console.error(error);

	try {
		await fs.access(OUTPUT_FILE);
		console.warn("Warning: keeping the existing news snapshot file.");
		process.exit(0);
	} catch {
		await fs.writeFile(OUTPUT_FILE, "[]\n", "utf-8");
		process.exit(0);
	}
});
