const DIARY_IMAGE_SHELL_SELECTOR = "[data-diary-image-shell]";
const DIARY_IMAGE_SELECTOR = "[data-diary-image]";

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

function markError(shell: HTMLElement): void {
	shell.dataset.loaded = "error";
	shell.dataset.loadState = "error";
}

function findDiaryImageShell(target: EventTarget | null): HTMLElement | null {
	if (!(target instanceof HTMLImageElement)) {
		return null;
	}

	const shell = target.closest(DIARY_IMAGE_SHELL_SELECTOR);
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
		markLoaded(shell);
	} else {
		markError(shell);
	}
}

function handleDiaryImageLoad(event: Event): void {
	const shell = findDiaryImageShell(event.target);
	if (shell) {
		markLoaded(shell);
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

	const image = shell.querySelector(DIARY_IMAGE_SELECTOR);
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
		.querySelectorAll(DIARY_IMAGE_SHELL_SELECTOR)
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
