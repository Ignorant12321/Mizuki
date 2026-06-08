const DIARY_IMAGE_SHELL_SELECTOR = "[data-diary-image-shell]";
const DIARY_IMAGE_SELECTOR = "[data-diary-image]";
const PROGRESSIVE_IMAGE_SHELL_SELECTOR = "[data-progressive-image-shell]";
const PROGRESSIVE_IMAGE_SELECTOR = "[data-progressive-image]";
const IMAGE_SHELL_SELECTOR = `${DIARY_IMAGE_SHELL_SELECTOR}, ${PROGRESSIVE_IMAGE_SHELL_SELECTOR}`;
const IMAGE_SELECTOR = `${DIARY_IMAGE_SELECTOR}, ${PROGRESSIVE_IMAGE_SELECTOR}`;

declare global {
	interface Window {
		__mizukiInitDiaryImageSkeletons?: () => void;
		__mizukiDiaryImageSkeletonEventsBound?: boolean;
	}
}

function markLoaded(shell: HTMLElement): void {
	shell.dataset.loaded = "true";
	shell.dataset.loadState = "loaded";
}

function markLoadedAfterPaint(shell: HTMLElement): void {
	if (shell.dataset.loadState === "loaded") {
		return;
	}

	window.requestAnimationFrame(() => {
		window.requestAnimationFrame(() => {
			markLoaded(shell);
		});
	});
}

function markError(shell: HTMLElement): void {
	shell.dataset.loaded = "error";
	shell.dataset.loadState = "error";
}

function findDiaryImageShell(target: EventTarget | null): HTMLElement | null {
	if (!(target instanceof HTMLImageElement)) {
		return null;
	}

	const shell = target.closest(IMAGE_SHELL_SELECTOR);
	return shell instanceof HTMLElement ? shell : null;
}

function syncDiaryImageState(
	image: HTMLImageElement,
	shell: HTMLElement,
): void {
	if (!image.complete) {
		return;
	}

	if (image.naturalWidth > 0) {
		markLoadedAfterPaint(shell);
	} else {
		markError(shell);
	}
}

function handleDiaryImageLoad(event: Event): void {
	const shell = findDiaryImageShell(event.target);
	if (shell) {
		markLoadedAfterPaint(shell);
	}
}

function handleDiaryImageError(event: Event): void {
	const shell = findDiaryImageShell(event.target);
	if (shell) {
		markError(shell);
	}
}

function bindDiaryImage(shell: Element): void {
	if (!(shell instanceof HTMLElement)) {
		return;
	}

	const image = shell.querySelector(IMAGE_SELECTOR);
	if (!(image instanceof HTMLImageElement)) {
		return;
	}

	if (shell.dataset.bound !== "true") {
		shell.dataset.bound = "true";
		image.addEventListener("load", handleDiaryImageLoad);
		image.addEventListener("error", handleDiaryImageError);
	}

	syncDiaryImageState(image, shell);
}

export function initDiaryImageSkeletons(): void {
	document
		.querySelectorAll(IMAGE_SHELL_SELECTOR)
		.forEach((shell) => bindDiaryImage(shell));
}

function scheduleDiaryImageSkeletonsInit(): void {
	initDiaryImageSkeletons();
	window.requestAnimationFrame(() => {
		initDiaryImageSkeletons();
	});
}

function bindGlobalDiaryImageEvents(): void {
	if (window.__mizukiDiaryImageSkeletonEventsBound) {
		return;
	}

	window.__mizukiDiaryImageSkeletonEventsBound = true;
	document.addEventListener("load", handleDiaryImageLoad, true);
	document.addEventListener("error", handleDiaryImageError, true);
	document.addEventListener(
		"astro:page-load",
		scheduleDiaryImageSkeletonsInit,
	);
	document.addEventListener(
		"astro:after-swap",
		scheduleDiaryImageSkeletonsInit,
	);
	document.addEventListener(
		"mizuki:swup-ready",
		scheduleDiaryImageSkeletonsInit,
	);
	window.addEventListener("pageshow", scheduleDiaryImageSkeletonsInit);
}

export function initDiaryImageLoader(): void {
	window.__mizukiInitDiaryImageSkeletons = scheduleDiaryImageSkeletonsInit;
	bindGlobalDiaryImageEvents();
	scheduleDiaryImageSkeletonsInit();
}
