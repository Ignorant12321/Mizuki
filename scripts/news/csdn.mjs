import { parseGenericRss } from "./rss-generic.mjs";
import { decodeEntities, extractFirstTag } from "./common.mjs";

function splitLines(value) {
	return String(value || "")
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => !/^[•·。\-.|]+$/.test(line));
}

function uniqueLines(lines) {
	const output = [];
	const seen = new Set();
	for (const line of lines) {
		const normalized = line.replace(/\s+/g, " ").trim();
		if (!normalized || seen.has(normalized)) {
			continue;
		}
		seen.add(normalized);
		output.push(normalized);
	}
	return output;
}

function formatSections(lines, sectionMarkers) {
	if (lines.length === 0) {
		return "";
	}

	const quickIndex = lines.findIndex((line) =>
		line.includes("一分钟速览新闻点"),
	);
	const firstSectionIndex = lines.findIndex((line) =>
		sectionMarkers.some((marker) => line === marker),
	);

	const intro =
		quickIndex > 0
			? lines.slice(0, quickIndex).slice(0, 4)
			: lines.slice(0, Math.min(4, lines.length));

	const tocStart = quickIndex >= 0 ? quickIndex + 1 : -1;
	const tocEnd =
		firstSectionIndex > tocStart ? firstSectionIndex : lines.length;
	const toc =
		tocStart >= 0 && tocStart < tocEnd
			? uniqueLines(lines.slice(tocStart, tocEnd)).slice(0, 20)
			: [];

	const body =
		firstSectionIndex >= 0
			? lines.slice(firstSectionIndex).slice(0, 40)
			: lines.slice(Math.max(quickIndex + 1, 0)).slice(0, 24);

	const parts = [];

	if (intro.length > 0) {
		parts.push("【导语】");
		parts.push(intro.join("\n"));
	}
	if (toc.length > 0) {
		parts.push("【目录】");
		parts.push(
			toc.map((line, index) => `${index + 1}. ${line}`).join("\n"),
		);
	}
	if (body.length > 0) {
		parts.push("【正文】");
		parts.push(body.join("\n\n"));
	}

	return parts.join("\n\n").trim();
}

function normalizeHeading(value) {
	return String(value || "")
		.replace(/^[\d.\-、\s•·]+/, "")
		.replace(/[“”"'‘’【】《》()（）:：,，。！？!?\-]/g, "")
		.replace(/\s+/g, "")
		.trim()
		.toLowerCase();
}

function stripListMarker(value) {
	return String(value || "")
		.replace(/^[\d.\-、\s•·]+/, "")
		.trim();
}

function detectSectionMarkers(decodedHtml) {
	const headings = Array.from(
		String(decodedHtml || "").matchAll(
			/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi,
		),
	)
		.map((match) =>
			String(match[1] || "")
				.replace(/<[^>]*>/g, " ")
				.replace(/\s+/g, " ")
				.trim(),
		)
		.filter((line) => line.length >= 2 && line.length <= 16)
		.filter((line) => !line.includes("一分钟速览新闻点"))
		.filter((line) => !line.includes("极客头条"));

	return Array.from(new Set(headings));
}

function extractCsdnSections(value) {
	const decoded = decodeEntities(value || "");
	const sectionMarkers = detectSectionMarkers(decoded);
	const withBreaks = decoded
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
		.replace(/<(li)\b[^>]*>/gi, "• ")
		.replace(/<[^>]*>/g, " ");

	const normalized = withBreaks
		.replace(/\r\n?/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n[ \t]+/g, "\n")
		.replace(/[ \t]{2,}/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	const lines = splitLines(normalized);
	const quickIndex = lines.findIndex((line) =>
		line.includes("一分钟速览新闻点"),
	);
	const firstSectionIndex = lines.findIndex((line) =>
		sectionMarkers.some((marker) => line === marker),
	);
	const intro =
		quickIndex > 0
			? lines.slice(0, quickIndex).slice(0, 4)
			: lines.slice(0, Math.min(4, lines.length));
	const tocStart = quickIndex >= 0 ? quickIndex + 1 : -1;
	const tocEnd =
		firstSectionIndex > tocStart ? firstSectionIndex : lines.length;
	const toc =
		tocStart >= 0 && tocStart < tocEnd
			? uniqueLines(lines.slice(tocStart, tocEnd)).slice(0, 24)
			: [];
	const body =
		firstSectionIndex >= 0
			? lines.slice(firstSectionIndex)
			: lines.slice(Math.max(quickIndex + 1, 0));

	return {
		intro,
		toc,
		body,
		sectionMarkers,
		formatted: formatSections(lines, sectionMarkers),
	};
}

function trimEntryDescription(lines, maxLen = 520) {
	const chunks = [];
	let used = 0;
	for (const line of lines) {
		const next = String(line || "").trim();
		if (!next) {
			continue;
		}
		const cost = next.length + (chunks.length > 0 ? 2 : 0);
		if (chunks.length > 0 && used + cost > maxLen) {
			break;
		}
		chunks.push(next);
		used += cost;
	}
	return chunks.join("\n\n").trim();
}

function splitDailyNews(base, sections) {
	if (sections.toc.length < 3 || sections.body.length === 0) {
		return [base];
	}

	const tocSet = new Set(
		sections.toc.map((title) => normalizeHeading(title)),
	);
	const bodyBlocks = [];
	let currentSection = "";
	let current = null;

	for (const line of sections.body) {
		if (sections.sectionMarkers.includes(line)) {
			currentSection = line;
			continue;
		}
		const normalized = normalizeHeading(line);
		if (tocSet.has(normalized)) {
			if (current) {
				bodyBlocks.push(current);
			}
			current = { title: line, section: currentSection, lines: [] };
			continue;
		}
		if (current) {
			current.lines.push(line);
		}
	}
	if (current) {
		bodyBlocks.push(current);
	}
	if (bodyBlocks.length < 2) {
		return [base];
	}

	return sections.toc.map((tocTitle, index) => {
		const tocNormalized = normalizeHeading(tocTitle);
		const block =
			bodyBlocks.find(
				(item) =>
					normalizeHeading(item.title) === tocNormalized ||
					normalizeHeading(item.title).includes(tocNormalized) ||
					tocNormalized.includes(normalizeHeading(item.title)),
			) ?? null;

		const descParts = [];
		const shortDesc = trimEntryDescription(block?.lines ?? [], 520);
		if (shortDesc) {
			descParts.push(shortDesc);
		} else if (sections.intro.length > 0) {
			descParts.push(trimEntryDescription(sections.intro, 280));
		}

		return {
			...base,
			title: stripListMarker(tocTitle),
			link: `${base.link}#csdn-item-${index + 1}`,
			category: block?.section || base.category,
			description: descParts.join("\n\n").trim(),
		};
	});
}

function cleanCsdnDescription(value) {
	return extractCsdnSections(value).formatted;
}

export function parseCsdnFeed(xml, source) {
	const items = parseGenericRss(xml, source);
	const itemXmlList = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

	return items
		.map((item, index) => {
			const itemXml = itemXmlList[index] || "";
			const descriptionRaw = extractFirstTag(itemXml, "description");
			const base = {
				...item,
				description: cleanCsdnDescription(descriptionRaw),
			};
			return splitDailyNews(base, extractCsdnSections(descriptionRaw));
		})
		.flat();
}
