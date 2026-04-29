import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptRoot = path.resolve(__dirname, "..");

test("root compress-fonts script stays as a small compatibility entry", () => {
	const entry = fs.readFileSync(
		path.join(scriptRoot, "compress-fonts.js"),
		"utf-8",
	);
	const codeLines = entry
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("//"));

	assert.ok(
		entry.includes(`import "./compress-fonts/index.js";`),
		"root script should delegate to folder entry",
	);
	assert.ok(
		codeLines.length <= 2,
		"root script should not contain compressor implementation",
	);
});

test("compress-fonts folder exposes the main responsibility modules", () => {
	for (const file of [
		"index.js",
		"config.js",
		"collect-text.js",
		"external-text.js",
		"font-output.js",
		"lyrics.js",
	]) {
		assert.equal(
			fs.existsSync(path.join(__dirname, file)),
			true,
			`${file} should exist`,
		);
	}
});
