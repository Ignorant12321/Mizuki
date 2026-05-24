import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const playerPath = path.join(
	repoRoot,
	"src",
	"components",
	"widgets",
	"music-player",
	"MusicPlayer.svelte",
);

function readPlayer() {
	return fs.readFileSync(playerPath, "utf-8");
}

function getCssRule(source, selector) {
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = source.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`));
	assert.ok(match?.groups?.body, `Expected ${selector} rule to exist`);
	return match.groups.body;
}

test("fab panel top anchored shell leaves shadow space unclipped", () => {
	const player = readPlayer();
	const topAnchoredShell = getCssRule(
		player,
		".music-player-fab-shell.top-anchored",
	);

	assert.match(
		topAnchoredShell,
		/overflow:\s*visible;/,
		"outer shell should not clip the panel's rounded shadow",
	);
	assert.doesNotMatch(
		topAnchoredShell,
		/scrollbar-gutter:\s*stable;/,
		"outer shell should not reserve a rectangular scrollbar gutter",
	);
});

test("fab panel top anchored scrolling is owned by rounded panel", () => {
	const player = readPlayer();
	const panelRule = getCssRule(
		player,
		".music-player-fab-shell.top-anchored :global(.fab-music-panel)",
	);

	assert.match(
		panelRule,
		/max-height:\s*inherit;/,
		"rounded panel should inherit the measured available height",
	);
	assert.match(
		panelRule,
		/overflow-y:\s*auto;/,
		"rounded panel should own vertical scrolling",
	);
});
