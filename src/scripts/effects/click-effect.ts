import type { ClickEffectConfig } from "@/types/config";

// 与 Astro 模板、全局控制器和设置面板同步用的固定标识。
const CLICK_EFFECT_CONFIG_ID = "click-effect-config";
const GLOBAL_CONTROLLER_KEY = "__mizukiClickEffectController";
const SETTINGS_LISTENER_KEY = "__mizukiClickEffectSettingsListener";
const CLICK_EFFECT_STORAGE_KEY = "clickEffectEnabled";

// 小于该宽度会按移动端处理，并结合触控能力判断是否启用特效。
const MOBILE_BREAKPOINT = 768;

// 粒子数量控制：限制总量和单次点击爆发量，避免连续点击造成过多 DOM 节点。
const MAX_ACTIVE_PARTICLES = 64;
const RING_PARTICLES = 8;
const EXTRA_PARTICLES = 2;
const MAX_PARTICLES_PER_CLICK = 10;

// 粒子视觉参数：基础扩散距离、可用颜色数量、每个粒子的错峰延迟。
const BASE_DISTANCE = 18;
const PARTICLE_COLORS = 10;
const STAGGER_MS = 3;

// 交互过滤参数：限制触发频率，并忽略拖拽产生的点击事件。
const MIN_CLICK_INTERVAL_MS = 40;
const DRAG_THRESHOLD_PX = 6;

type ValidatedConfig = ClickEffectConfig & {
	blacklist: {
		paths: string[];
		selectors: string[];
	};
};

type BlacklistPathRule = {
	path: string;
	includeChildren: boolean;
};

class ClickEffectController {
	private config: ValidatedConfig;
	private readonly reducedMotionQuery = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	);
	private readonly coarsePointerQuery = window.matchMedia("(pointer: coarse)");
	private readonly noHoverQuery = window.matchMedia("(hover: none)");
	private readonly particlePool: HTMLDivElement[] = [];
	private readonly activeParticleSet = new Set<HTMLDivElement>();
	private activeParticleQueue: HTMLDivElement[] = [];
	private activeParticleQueueStart = 0;
	private blacklistPathRules: BlacklistPathRule[] = [];
	private blacklistSelectors: string[] = [];
	private lastEffectTimestamp = 0;
	private pointerDownPosition: { x: number; y: number } | null = null;

	constructor(config: ValidatedConfig) {
		this.config = config;
		this.applyConfig(config);
		this.bindEvents();
	}

	updateConfig(config: ValidatedConfig) {
		this.applyConfig(config);
	}

	private applyConfig(config: ValidatedConfig) {
		this.config = config;
		this.blacklistPathRules = config.blacklist.paths.map(createBlacklistPathRule);
		this.blacklistSelectors = config.blacklist.selectors;
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

		const now = performance.now();
		if (now - this.lastEffectTimestamp < MIN_CLICK_INTERVAL_MS) return;
		this.lastEffectTimestamp = now;

		const target = this.getEventTargetElement(event);
		if (!target) return;
		if (!this.isAllowedTarget(target)) return;

		const requestedParticles = Math.min(
			RING_PARTICLES + EXTRA_PARTICLES,
			MAX_PARTICLES_PER_CLICK,
		);
		if (requestedParticles <= 0) return;

		this.ensureParticleCapacity(requestedParticles);
		const availableSlots = MAX_ACTIVE_PARTICLES - this.activeParticleSet.size;
		if (availableSlots <= 0) return;

		const totalParticles = Math.min(requestedParticles, availableSlots);
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
		if (this.reducedMotionQuery.matches) {
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
		const hasCoarsePointer = this.coarsePointerQuery.matches;
		const hasNoHover = this.noHoverQuery.matches;
		const isSmallViewport = window.innerWidth < MOBILE_BREAKPOINT;
		const hasTouchEvents =
			"ontouchstart" in window || navigator.maxTouchPoints > 0;

		return isSmallViewport || (hasTouchEvents && (hasCoarsePointer || hasNoHover));
	}

	private isPathBlacklisted(pathname: string) {
		const normalizedCurrentPath = normalizePath(pathname);

		return this.blacklistPathRules.some((rule) => {
			if (rule.path === "/") {
				return normalizedCurrentPath === "/";
			}
			if (rule.includeChildren) {
				return (
					normalizedCurrentPath === rule.path ||
					normalizedCurrentPath.startsWith(`${rule.path}/`)
				);
			}
			return normalizedCurrentPath === rule.path;
		});
	}

	private shouldIgnoreDrag(event: MouseEvent) {
		if (!this.pointerDownPosition) return false;

		const deltaX = Math.abs(event.clientX - this.pointerDownPosition.x);
		const deltaY = Math.abs(event.clientY - this.pointerDownPosition.y);
		return deltaX > DRAG_THRESHOLD_PX || deltaY > DRAG_THRESHOLD_PX;
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
		return !this.blacklistSelectors.some((selector) =>
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
		const particle = this.acquireParticleElement();
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

		this.trackActiveParticle(particle);

		return particle;
	}

	private ensureParticleCapacity(nextBurstCount: number) {
		const overflow =
			this.activeParticleSet.size + nextBurstCount - MAX_ACTIVE_PARTICLES;
		if (overflow <= 0) {
			return;
		}

		// 优先淘汰最早创建的粒子，避免连点时整次点击无反馈。
		let removed = 0;
		while (
			removed < overflow &&
			this.activeParticleQueueStart < this.activeParticleQueue.length
		) {
			const oldestParticle =
				this.activeParticleQueue[this.activeParticleQueueStart];
			this.activeParticleQueueStart += 1;
			if (!this.activeParticleSet.has(oldestParticle)) {
				continue;
			}

			this.releaseParticle(oldestParticle);
			removed += 1;
		}

		this.compactParticleQueue();
	}

	private acquireParticleElement() {
		const particle = this.particlePool.pop();
		if (particle) {
			return particle;
		}

		const newParticle = document.createElement("div");
		newParticle.addEventListener("animationend", () => {
			this.releaseParticle(newParticle);
		});
		return newParticle;
	}

	private trackActiveParticle(particle: HTMLDivElement) {
		this.activeParticleSet.add(particle);
		this.activeParticleQueue.push(particle);
		this.compactParticleQueueIfNeeded();
	}

	private releaseParticle(particle: HTMLDivElement) {
		if (!this.activeParticleSet.delete(particle)) {
			return;
		}

		particle.remove();
		if (this.particlePool.length < MAX_ACTIVE_PARTICLES) {
			this.particlePool.push(particle);
		}
	}

	private compactParticleQueueIfNeeded() {
		if (this.activeParticleQueue.length <= MAX_ACTIVE_PARTICLES * 2) {
			return;
		}
		this.compactParticleQueue();
	}

	private compactParticleQueue() {
		this.activeParticleQueue = this.activeParticleQueue
			.slice(this.activeParticleQueueStart)
			.filter((particle) => this.activeParticleSet.has(particle));
		this.activeParticleQueueStart = 0;
	}
}

function normalizePath(path: string) {
	if (!path) return "/";
	if (path === "/") return "/";

	const normalized = path.startsWith("/") ? path : `/${path}`;
	return normalized.replace(/\/+$/, "") || "/";
}

function createBlacklistPathRule(pattern: string): BlacklistPathRule {
	const normalizedPath = normalizePath(pattern);
	return {
		path: normalizedPath,
		includeChildren: normalizedPath !== "/" && pattern.endsWith("/"),
	};
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
		const storedOverride = localStorage.getItem(CLICK_EFFECT_STORAGE_KEY);
		const effectiveEnable =
			storedOverride === null
				? normalizedEnable
				: storedOverride === "true";
		const normalizedMobile =
			storedOverride === null
				? (typeof parsedConfig.mobile === "boolean"
						? parsedConfig.mobile
						: (legacyEnable?.mobile ?? false))
				: storedOverride === "true";

		return {
			enable: effectiveEnable,
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

	if (
		!(window as typeof window & { [SETTINGS_LISTENER_KEY]?: boolean })[
			SETTINGS_LISTENER_KEY
		]
	) {
		window.addEventListener("display-settings:changed", () => {
			initClickEffect();
		});
		(window as typeof window & { [SETTINGS_LISTENER_KEY]?: boolean })[
			SETTINGS_LISTENER_KEY
		] = true;
	}

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
