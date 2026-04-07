import type { ClickEffectConfig } from "@/types/config";

const CLICK_EFFECT_CONFIG_ID = "click-effect-config";
const GLOBAL_CONTROLLER_KEY = "__mizukiClickEffectController";
const MOBILE_BREAKPOINT = 768;
const MAX_ACTIVE_PARTICLES = 64;
const RING_PARTICLES = 8;
const EXTRA_PARTICLES = 2;
const MAX_PARTICLES_PER_CLICK = 8;
const BASE_DISTANCE = 18;
const PARTICLE_COLORS = 10;
const STAGGER_MS = 3;
const MIN_CLICK_INTERVAL_MS = 40;
const DRAG_THRESHOLD_PX = 6;

type ValidatedConfig = ClickEffectConfig & {
	blacklist: {
		paths: string[];
		selectors: string[];
	};
};

class ClickEffectController {
	private config: ValidatedConfig;
	private activeParticles = 0;
	private lastEffectTimestamp = 0;
	private pointerDownPosition: { x: number; y: number } | null = null;

	constructor(config: ValidatedConfig) {
		this.config = config;
		this.bindEvents();
	}

	updateConfig(config: ValidatedConfig) {
		this.config = config;
	}

	private bindEvents() {
		document.addEventListener(
			"pointerdown",
			(event) => {
				this.pointerDownPosition = { x: event.clientX, y: event.clientY };
			},
			{ passive: true },
		);

		document.addEventListener(
			"click",
			(event) => {
				this.handleClick(event);
			},
			{ passive: true },
		);
	}

	private handleClick(event: MouseEvent) {
		if (!this.isEffectEnabled()) return;
		if (event.button !== 0) return;
		if (this.shouldIgnoreDrag(event)) return;
		if (this.shouldIgnoreSelection()) return;

		const now = performance.now();
		if (now - this.lastEffectTimestamp < MIN_CLICK_INTERVAL_MS) return;
		this.lastEffectTimestamp = now;

		const target = this.getEventTargetElement(event);
		if (!target) return;
		if (!this.isAllowedTarget(target)) return;

		const availableSlots = MAX_ACTIVE_PARTICLES - this.activeParticles;
		if (availableSlots <= 0) return;

		const totalParticles = Math.min(
			RING_PARTICLES + EXTRA_PARTICLES,
			MAX_PARTICLES_PER_CLICK,
			availableSlots,
		);
		const fragment = document.createDocumentFragment();
		let created = 0;

		for (let i = 0; i < RING_PARTICLES && created < totalParticles; i++) {
			const angle = ((Math.PI * 2) / RING_PARTICLES) * i;
			const distance = BASE_DISTANCE + Math.random() * 8;
			const colorIndex = (i % PARTICLE_COLORS) + 1;
			fragment.appendChild(
				this.createParticleElement(
					event.clientX,
					event.clientY,
					angle,
					distance,
					colorIndex,
					i * STAGGER_MS,
				),
			);
			created += 1;
		}

		for (let i = 0; i < EXTRA_PARTICLES && created < totalParticles; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = BASE_DISTANCE + Math.random() * 10;
			const colorIndex = Math.floor(Math.random() * PARTICLE_COLORS) + 1;
			fragment.appendChild(
				this.createParticleElement(
					event.clientX,
					event.clientY,
					randomAngle,
					randomDistance,
					colorIndex,
					(RING_PARTICLES + i) * STAGGER_MS,
				),
			);
			created += 1;
		}

		document.body.appendChild(fragment);
	}

	private isEffectEnabled() {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return false;
		}

		if (this.isPathBlacklisted(window.location.pathname)) {
			return false;
		}

		if (!this.config.enable) {
			return false;
		}

		return this.isMobileDevice() ? this.config.mobile ?? false : true;
	}

	private isMobileDevice() {
		const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
		const hasNoHover = window.matchMedia("(hover: none)").matches;
		const isSmallViewport = window.innerWidth < MOBILE_BREAKPOINT;
		const hasTouchEvents =
			"ontouchstart" in window || navigator.maxTouchPoints > 0;

		return isSmallViewport || (hasTouchEvents && (hasCoarsePointer || hasNoHover));
	}

	private isPathBlacklisted(pathname: string) {
		const normalizedCurrentPath = normalizePath(pathname);

		return this.config.blacklist.paths.some((pattern) => {
			const normalizedPattern = normalizePath(pattern);
			if (normalizedPattern === "/") {
				return normalizedCurrentPath === "/";
			}
			if (pattern.endsWith("/")) {
				return (
					normalizedCurrentPath === normalizedPattern ||
					normalizedCurrentPath.startsWith(`${normalizedPattern}/`)
				);
			}
			return normalizedCurrentPath === normalizedPattern;
		});
	}

	private shouldIgnoreDrag(event: MouseEvent) {
		if (!this.pointerDownPosition) return false;

		const deltaX = Math.abs(event.clientX - this.pointerDownPosition.x);
		const deltaY = Math.abs(event.clientY - this.pointerDownPosition.y);
		return deltaX > DRAG_THRESHOLD_PX || deltaY > DRAG_THRESHOLD_PX;
	}

	private shouldIgnoreSelection() {
		const selection = window.getSelection();
		return Boolean(selection && !selection.isCollapsed && selection.toString().trim());
	}

	private getEventTargetElement(event: MouseEvent): Element | null {
		const path =
			typeof event.composedPath === "function"
				? event.composedPath()
				: undefined;
		const firstTarget = path && path.length > 0 ? path[0] : event.target;

		if (firstTarget instanceof Element) return firstTarget;
		if (firstTarget instanceof Node) return firstTarget.parentElement;
		return null;
	}

	private isAllowedTarget(target: Element) {
		return !this.config.blacklist.selectors.some((selector) =>
			matchesSelectorTree(target, selector),
		);
	}

	private createParticleElement(
		x: number,
		y: number,
		angle: number,
		distance: number,
		colorIndex: number,
		delayMs: number,
	) {
		const particle = document.createElement("div");
		particle.className = `click-particle color-${colorIndex}`;

		const dx = Math.cos(angle) * distance;
		const dy = Math.sin(angle) * distance;
		particle.style.setProperty("--dx", `${dx}px`);
		particle.style.setProperty("--dy", `${dy}px`);
		particle.style.left = `${x}px`;
		particle.style.top = `${y}px`;
		particle.style.animationDelay = `${delayMs}ms`;

		const size = Math.random() * 6 + 8;
		particle.style.width = `${size}px`;
		particle.style.height = `${size}px`;

		this.activeParticles += 1;
		particle.addEventListener(
			"animationend",
			() => {
				particle.remove();
				this.activeParticles = Math.max(0, this.activeParticles - 1);
			},
			{ once: true },
		);

		return particle;
	}
}

function normalizePath(path: string) {
	if (!path) return "/";
	if (path === "/") return "/";

	const normalized = path.startsWith("/") ? path : `/${path}`;
	return normalized.replace(/\/+$/, "") || "/";
}

function matchesSelectorTree(target: Element, selector: string) {
	return Boolean(target.closest(selector));
}

function normalizeSelectorList(selectors?: string[]) {
	return (selectors ?? []).map((item) => item.trim()).filter(Boolean);
}

function normalizePathList(paths?: string[]) {
	return (paths ?? []).map((item) => item.trim()).filter(Boolean);
}

function getConfigElement() {
	return document.getElementById(CLICK_EFFECT_CONFIG_ID);
}

function validateSelectorList(selectors: string[]) {
	return selectors.filter((selector) => {
		try {
			document.createDocumentFragment().querySelector(selector);
			return true;
		} catch (error) {
			console.warn(
				`[ClickEffect] Invalid selector "${selector}", skipping this rule.`,
				error,
			);
			return false;
		}
	});
}

function readClickEffectConfig(): ValidatedConfig | null {
	const configEl = getConfigElement();
	const rawConfig = configEl?.dataset.config;
	if (!rawConfig) return null;

	try {
		const parsedConfig = JSON.parse(rawConfig) as
			| ClickEffectConfig
			| {
					enable?: boolean | { desktop?: boolean; mobile?: boolean };
					mobile?: boolean;
					blacklist?: {
						paths?: string[];
						selectors?: string[];
					};
			  };
		const legacyEnable =
			typeof parsedConfig.enable === "object" && parsedConfig.enable
				? parsedConfig.enable
				: null;
		const normalizedEnable =
			typeof parsedConfig.enable === "boolean"
				? parsedConfig.enable
				: (legacyEnable?.desktop ?? true);
		const normalizedMobile =
			typeof parsedConfig.mobile === "boolean"
				? parsedConfig.mobile
				: (legacyEnable?.mobile ?? false);

		return {
			enable: normalizedEnable,
			mobile: normalizedMobile,
			blacklist: {
				paths: normalizePathList(parsedConfig.blacklist?.paths),
				selectors: validateSelectorList(
					normalizeSelectorList(parsedConfig.blacklist?.selectors),
				),
			},
		};
	} catch (error) {
		console.error("[ClickEffect] Failed to parse config.", error);
		return null;
	}
}

export function initClickEffect() {
	const config = readClickEffectConfig();
	if (!config) return;

	const existingController = (
		window as typeof window & {
			[GLOBAL_CONTROLLER_KEY]?: ClickEffectController;
		}
	)[GLOBAL_CONTROLLER_KEY];

	if (existingController) {
		existingController.updateConfig(config);
		return;
	}

	(
		window as typeof window & {
			[GLOBAL_CONTROLLER_KEY]?: ClickEffectController;
		}
	)[GLOBAL_CONTROLLER_KEY] = new ClickEffectController(config);
}
