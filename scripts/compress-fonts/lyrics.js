function addTextToSet(text, textSet) {
	for (const char of text) {
		textSet.add(char);
	}
}

function stringValue(value) {
	if (typeof value !== "string") {
		return "";
	}
	return value.trim();
}

function getHeader(headers, name) {
	if (!headers) {
		return "";
	}
	if (typeof headers.get === "function") {
		return headers.get(name) || "";
	}
	return headers[name] || headers[name.toLowerCase()] || "";
}

function hasLyricTimestamp(text) {
	return /\[\d{1,2}:\d{1,2}(?:\.\d{1,3})?\]/.test(text);
}

function isLikelyLyricUrl(value) {
	const text = value.trim();
	if (!text) {
		return false;
	}
	if (/^(https?:)?\/\//.test(text)) {
		return true;
	}
	if (text.startsWith("/")) {
		return true;
	}
	if (/\.(lrc|txt)(\?.*)?$/i.test(text)) {
		return true;
	}
	return !text.includes("\n") && !text.includes("[") && text.includes("/");
}

function pushString(target, value) {
	const text = stringValue(value);
	if (text) {
		target.push(text);
	}
}

export function extractSongTextCandidates(song) {
	const title = stringValue(song?.name ?? song?.title);
	const artist = stringValue(song?.artist ?? song?.author);
	const candidates = [];

	pushString(candidates, song?.lyric);
	pushString(candidates, song?.lrc);
	pushString(candidates, song?.lrc?.lyric);
	pushString(candidates, song?.lrc?.url);
	pushString(candidates, song?.lyric?.lyric);
	pushString(candidates, song?.lyric?.url);
	pushString(candidates, song?.lyricUrl);
	pushString(candidates, song?.lrcUrl);

	const inlineLyrics = [];
	const lyricUrls = [];
	for (const candidate of candidates) {
		if (hasLyricTimestamp(candidate) || candidate.includes("\n")) {
			inlineLyrics.push(candidate);
		} else if (isLikelyLyricUrl(candidate)) {
			lyricUrls.push(candidate);
		} else {
			inlineLyrics.push(candidate);
		}
	}

	return { title, artist, inlineLyrics, lyricUrls };
}

export function normalizeLyricText(rawText) {
	return String(rawText ?? "")
		.replace(/\uFEFF/g, "")
		.split(/\r?\n/)
		.map((line) =>
			line
				.replace(/\[\d{1,2}:\d{1,2}(?:\.\d{1,3})?\]/g, "")
				.replace(/\[(?:ar|al|ti|by|offset|length|re|ve):[^\]]*]/gi, "")
				.trim(),
		)
		.filter(Boolean)
		.join("\n");
}

async function fetchLyricText(url, options) {
	const {
		fetchFn = globalThis.fetch,
		logger = console.log,
		timeoutMs = 10000,
	} = options;
	if (typeof fetchFn !== "function") {
		logger("⚠ Fetch API is unavailable, skipping remote lyric collection");
		return "";
	}

	const controller =
		typeof AbortController === "function" ? new AbortController() : null;
	const timeoutId =
		controller && timeoutMs > 0
			? setTimeout(() => controller.abort(), timeoutMs)
			: null;

	try {
		const response = await fetchFn(url, {
			signal: controller?.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
		});

		if (!response?.ok) {
			throw new Error(
				`HTTP ${response?.status ?? "unknown"}: ${
					response?.statusText ?? "request failed"
				}`,
			);
		}

		const contentType = getHeader(response.headers, "content-type");
		if (contentType && !/text|json|xml|octet-stream/i.test(contentType)) {
			throw new Error(`Unexpected content type: ${contentType}`);
		}

		return await response.text();
	} catch (error) {
		if (error?.name === "AbortError") {
			logger(
				`⚠ Lyric request timeout (${timeoutMs}ms), skipping: ${url}`,
			);
		} else {
			logger(
				`⚠ Failed to fetch lyric from "${url}": ${
					error?.message ?? String(error)
				}`,
			);
		}
		return "";
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

export async function collectMetingSongText(song, textSet, options = {}) {
	const { lyricUrlCache = new Map() } = options;
	const { title, artist, inlineLyrics, lyricUrls } =
		extractSongTextCandidates(song);

	if (title) {
		addTextToSet(title, textSet);
	}
	if (artist) {
		addTextToSet(artist, textSet);
	}

	for (const lyric of inlineLyrics) {
		addTextToSet(normalizeLyricText(lyric), textSet);
	}

	for (const url of lyricUrls) {
		let lyricText;
		if (lyricUrlCache.has(url)) {
			lyricText = lyricUrlCache.get(url);
		} else {
			lyricText = await fetchLyricText(url, options);
			lyricUrlCache.set(url, lyricText);
		}
		if (lyricText) {
			addTextToSet(normalizeLyricText(lyricText), textSet);
		}
	}

	return Boolean(title || artist);
}
