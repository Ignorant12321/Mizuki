export const entityMap = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

export function decodeEntities(value) {
	return String(value || "")
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

export function stripHtml(value = "") {
	return decodeEntities(value)
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function extractTagValues(xml, tag) {
	const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
	const values = [];
	for (const match of xml.matchAll(pattern)) {
		if (typeof match[1] === "string") {
			values.push(match[1]);
		}
	}
	return values;
}

export function extractFirstTag(xml, tag) {
	const values = extractTagValues(xml, tag);
	return values.length > 0 ? values[0] : "";
}

export function extractAttribute(tagXml, attribute) {
	const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i");
	const match = String(tagXml || "").match(pattern);
	return match?.[1] ? decodeEntities(match[1]) : "";
}

export function resolveLink(link, baseUrl) {
	if (!link) {
		return "#";
	}

	try {
		return new URL(link, baseUrl).href;
	} catch {
		return link;
	}
}

export function joinCategories(values) {
	return Array.from(new Set(values.filter(Boolean))).join(" / ");
}

export function toTimeValue(dateStr) {
	if (!dateStr) {
		return 0;
	}
	const time = new Date(dateStr).getTime();
	return Number.isFinite(time) ? time : 0;
}

export function dedupeAndSort(items) {
	const deduped = Array.from(
		new Map(items.map((item) => [item.link || item.title, item])).values(),
	);
	return deduped.sort(
		(a, b) => toTimeValue(b.pubDate) - toTimeValue(a.pubDate),
	);
}

function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export async function fetchXmlWithRetry(url, attempts = 3) {
	let lastError;

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
