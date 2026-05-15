import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const storePath = path.join(repoRoot, "src", "stores", "musicPlayerStore.ts");

function readStore() {
	return fs.readFileSync(storePath, "utf-8");
}

test("playlist switching preserves the currently loaded song", () => {
	const store = readStore();

	assert.match(
		store,
		/loadPlaylistAtIndex\(index,\s*false,\s*\{\s*preserveCurrentSong:\s*true,\s*\}\)/,
		"selectPlaylist should switch playlist sources without replacing the current song",
	);
});

test("preserved playlist loads do not clear the active audio while fetching", () => {
	const store = readStore();

	assert.match(
		store,
		/if\s*\(!options\.preserveCurrentSong\)\s*\{\s*this\.state\.playlist\s*=\s*\[\];\s*this\.state\.currentIndex\s*=\s*0;\s*this\.resetCurrentTrack\(\);/s,
		"remote playlist loading should only reset the active track for non-preserving loads",
	);
});
