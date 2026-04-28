import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

import ts from "typescript";

const sourcePath = new URL(
	"../src/components/widgets/music-player/utils/fabPanelLayout.ts",
	import.meta.url,
);
const source = fs.readFileSync(sourcePath, "utf8");
const { outputText } = ts.transpileModule(source, {
	compilerOptions: {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	},
	fileName: sourcePath.pathname,
});

const module = { exports: {} };
vm.runInNewContext(outputText, {
	exports: module.exports,
	module,
});

const { calculateFabPanelLayout } = module.exports;

function assertLayout(actual, expected) {
	assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
}

const base = {
	buttonTop: 600,
	gap: 8,
	panelHeight: 320,
	viewportHeight: 760,
	topMargin: 12,
	bottomMargin: 16,
};

assertLayout(calculateFabPanelLayout(base), {
	top: 272,
	maxHeight: 472,
});

assertLayout(
	calculateFabPanelLayout({
		...base,
		buttonTop: 260,
		panelHeight: 520,
	}),
	{
		top: 12,
		maxHeight: 732,
	},
);

assertLayout(
	calculateFabPanelLayout({
		...base,
		viewportHeight: 420,
		bottomMargin: 34,
		panelHeight: 620,
	}),
	{
		top: 12,
		maxHeight: 374,
	},
);

console.log("fab panel layout tests passed");
