import test from "node:test";
import assert from "node:assert/strict";

import {
	collectMetingSongText,
	extractSongTextCandidates,
	normalizeLyricText,
} from "./lyrics.js";

test("extractSongTextCandidates keeps title and artist plus inline lyric text", () => {
	const result = extractSongTextCandidates({
		name: "春雷の頃",
		artist: "22/7",
		lrc: { lyric: "[00:01.00]春の雷が鳴る\n[00:03.00]君を探した" },
	});

	assert.equal(result.title, "春雷の頃");
	assert.equal(result.artist, "22/7");
	assert.deepEqual(result.inlineLyrics, [
		"[00:01.00]春の雷が鳴る\n[00:03.00]君を探した",
	]);
	assert.deepEqual(result.lyricUrls, []);
});

test("normalizeLyricText removes LRC timing and metadata while preserving lyric words", () => {
	assert.equal(
		normalizeLyricText("[ar:洛天依]\n[00:01.20]花は咲く\n[00:04.00]云在唱"),
		"花は咲く\n云在唱",
	);
});

test("collectMetingSongText fetches remote lyric URLs once and adds title, artist, and lyric chars", async () => {
	const textSet = new Set();
	let fetchCount = 0;
	const fetchFn = async (url) => {
		fetchCount += 1;
		assert.equal(url, "https://example.test/song.lrc");
		return {
			ok: true,
			headers: new Map([["content-type", "text/plain"]]),
			text: async () => "[00:01.00]星が降る\n[00:02.00]梦醒时分",
		};
	};
	const lyricUrlCache = new Map();
	const song = {
		title: "星夢",
		author: "歌姫",
		lyricUrl: "https://example.test/song.lrc",
	};

	await collectMetingSongText(song, textSet, { fetchFn, lyricUrlCache });
	await collectMetingSongText(song, textSet, { fetchFn, lyricUrlCache });

	assert.equal(fetchCount, 1);
	for (const char of "星夢歌姫星降梦醒时分") {
		assert.equal(textSet.has(char), true, `missing ${char}`);
	}
});
