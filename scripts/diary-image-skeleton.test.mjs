import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const pagePath = new URL("../src/pages/diary/[...page].astro", import.meta.url);
const source = fs.readFileSync(pagePath, "utf8");
const scriptMatch = source.match(
	/<script is:inline>\s*([\s\S]*?)\s*<\/script>\s*<style>/,
);

assert(scriptMatch, "diary page inline image script should exist");

const inlineScript = scriptMatch[1];

assert.match(
	source,
	/class="diary-image-error"/,
	"diary image markup should include an error state layer",
);

class HTMLElementMock {
	constructor() {
		this.dataset = {};
		this.listeners = new Map();
	}

	addEventListener(name, handler) {
		this.listeners.set(name, handler);
	}

	emit(name) {
		this.listeners.get(name)?.();
	}
}

class HTMLImageElementMock extends HTMLElementMock {
	constructor({ complete = false, naturalWidth = 0 } = {}) {
		super();
		this.complete = complete;
		this.naturalWidth = naturalWidth;
	}
}

class DiaryShellMock extends HTMLElementMock {
	constructor(image) {
		super();
		this.image = image;
	}

	querySelector(selector) {
		return selector === "[data-diary-image]" ? this.image : null;
	}
}

function createDocument(shells) {
	const listeners = new Map();

	return {
		readyState: "complete",
		addEventListener(name, handler) {
			listeners.set(name, handler);
		},
		querySelectorAll(selector) {
			return selector === "[data-diary-image-shell]" ? shells : [];
		},
		emit(name) {
			listeners.get(name)?.();
		},
	};
}

function runInlineScript({ window, document }) {
	vm.runInNewContext(inlineScript, {
		window,
		document,
		HTMLElement: HTMLElementMock,
		HTMLImageElement: HTMLImageElementMock,
	});
}

const windowMock = {
	listeners: new Map(),
	addEventListener(name, handler) {
		this.listeners.set(name, handler);
	},
};

const firstLoadedImage = new HTMLImageElementMock({
	complete: true,
	naturalWidth: 320,
});
const firstShell = new DiaryShellMock(firstLoadedImage);

runInlineScript({
	window: windowMock,
	document: createDocument([firstShell]),
});

assert.equal(firstShell.dataset.bound, "true");
assert.equal(firstShell.dataset.loaded, "true");
assert.equal(firstShell.dataset.loadState, "loaded");

const secondLazyImage = new HTMLImageElementMock({
	complete: false,
	naturalWidth: 0,
});
const secondShell = new DiaryShellMock(secondLazyImage);

runInlineScript({
	window: windowMock,
	document: createDocument([secondShell]),
});

assert.equal(
	secondShell.dataset.bound,
	"true",
	"new diary images inserted after a swup navigation should be bound",
);

secondLazyImage.naturalWidth = 640;
secondLazyImage.complete = true;
secondLazyImage.emit("load");

assert.equal(secondShell.dataset.loaded, "true");
assert.equal(secondShell.dataset.loadState, "loaded");

console.log("diary image skeleton tests passed");
