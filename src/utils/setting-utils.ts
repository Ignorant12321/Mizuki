import {
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants";

import {
	clickEffectConfig,
	fullscreenWallpaperConfig,
	live2dConfig,
	sakuraConfig,
	siteConfig,
} from "@/config";
import type {
	ClickEffectConfig,
	LIGHT_DARK_MODE,
	WALLPAPER_MODE,
} from "@/types/config";

export const DISPLAY_SETTINGS_CHANGED_EVENT = "display-settings:changed";

export const DISPLAY_SETTING_STORAGE_KEYS = {
	theme: "theme",
	hue: "hue",
	wallpaperMode: "wallpaperMode",
	wallpaperOpacity: "wallpaperOpacity",
	wallpaperBlur: "wallpaperBlur",
	postListLayout: "postListLayout",
	clickEffectEnabled: "clickEffectEnabled",
	sakuraEnabled: "sakuraEnabled",
	live2dEnabled: "live2dEnabled",
	bannerWavesEnabled: "bannerWavesEnabled",
} as const;

export type DisplaySettingStorageKey =
	(typeof DISPLAY_SETTING_STORAGE_KEYS)[keyof typeof DISPLAY_SETTING_STORAGE_KEYS];

function canUseStorage(): boolean {
	return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readStorage(key: DisplaySettingStorageKey): string | null {
	if (!canUseStorage()) {
		return null;
	}
	return localStorage.getItem(key);
}

function writeStorage(key: DisplaySettingStorageKey, value: string): void {
	if (!canUseStorage()) {
		return;
	}
	localStorage.setItem(key, value);
}

function clamp(value: number, min: number, max: number): number {
	if (!Number.isFinite(value)) {
		return min;
	}
	return Math.min(max, Math.max(min, value));
}

export function emitDisplaySettingsChanged(
	key?: DisplaySettingStorageKey,
	value?: unknown,
): void {
	if (typeof window === "undefined") {
		return;
	}
	window.dispatchEvent(
		new CustomEvent(DISPLAY_SETTINGS_CHANGED_EVENT, {
			detail: {
				key,
				value,
			},
		}),
	);
}

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	// 在Swup页面切换时，config-carrier可能不存在，使用默认值
	if (!configCarrier) {
		return Number.parseInt(fallback);
	}
	return Number.parseInt(configCarrier.dataset.hue || fallback);
}

export function getDefaultWallpaperMode(): WALLPAPER_MODE {
	return siteConfig.wallpaperMode.defaultMode;
}

export function getHue(): number {
	const stored = readStorage(DISPLAY_SETTING_STORAGE_KEYS.hue);
	return stored === null ? getDefaultHue() : Number.parseInt(stored);
}

export function setHue(hue: number): void {
	writeStorage(DISPLAY_SETTING_STORAGE_KEYS.hue, String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		emitDisplaySettingsChanged(DISPLAY_SETTING_STORAGE_KEYS.hue, hue);
		return;
	}
	r.style.setProperty("--hue", String(hue));
	emitDisplaySettingsChanged(DISPLAY_SETTING_STORAGE_KEYS.hue, hue);
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	// 获取当前主题状态的完整信息
	const currentIsDark = document.documentElement.classList.contains("dark");
	const currentTheme = document.documentElement.getAttribute("data-theme");

	// 计算目标主题状态
	let targetIsDark = false; // 初始化默认值
	switch (theme) {
		case LIGHT_MODE:
			targetIsDark = false;
			break;
		case DARK_MODE:
			targetIsDark = true;
			break;
		default:
			// 处理默认情况，使用当前主题状态
			targetIsDark = currentIsDark;
			break;
	}

	// 检测是否真的需要主题切换：
	// 1. dark类状态是否改变
	// 2. expressiveCode主题是否需要更新
	const needsThemeChange = currentIsDark !== targetIsDark;
	const expectedTheme = targetIsDark ? "github-dark" : "github-light";
	const needsCodeThemeUpdate = currentTheme !== expectedTheme;

	// 如果既不需要主题切换也不需要代码主题更新，直接返回
	if (!needsThemeChange && !needsCodeThemeUpdate) {
		return;
	}

	// 定义实际执行主题切换的函数
	const performThemeChange = () => {
		// 应用主题变化
		if (needsThemeChange) {
			if (targetIsDark) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		}

		// Set the theme for Expressive Code based on current mode
		// 只在必要时更新 data-theme 属性以减少重绘
		if (needsCodeThemeUpdate) {
			const expressiveTheme = targetIsDark
				? "github-dark"
				: "github-light";
			document.documentElement.setAttribute(
				"data-theme",
				expressiveTheme,
			);
		}
	};

	// 检查浏览器是否支持 View Transitions API
	if (
		needsThemeChange &&
		document.startViewTransition &&
		!window.matchMedia("(prefers-reduced-motion: reduce)").matches
	) {
		// 添加标记类，表示正在使用 View Transitions
		document.documentElement.classList.add(
			"is-theme-transitioning",
			"use-view-transition",
		);

		// 使用 View Transitions API 实现平滑过渡
		const transition = document.startViewTransition(() => {
			performThemeChange();
		});

		// 在过渡完成后移除标记类（使用 finished promise 确保完全同步）
		transition.finished
			.then(() => {
				// 使用 microtask 确保在下一个事件循环前完成清理
				queueMicrotask(() => {
					document.documentElement.classList.remove(
						"is-theme-transitioning",
						"use-view-transition",
					);
				});
			})
			.catch(() => {
				// 如果过渡被中断，也要清理状态
				document.documentElement.classList.remove(
					"is-theme-transitioning",
					"use-view-transition",
				);
			});
	} else {
		// 不支持 View Transitions API 或用户偏好减少动画，使用传统方式
		// 只在需要主题切换时添加过渡保护
		if (needsThemeChange) {
			document.documentElement.classList.add("is-theme-transitioning");
		}

		performThemeChange();

		// 使用 requestAnimationFrame 确保在下一帧移除过渡保护类
		if (needsThemeChange) {
			requestAnimationFrame(() => {
				document.documentElement.classList.remove(
					"is-theme-transitioning",
				);
			});
		}
	}
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	writeStorage(DISPLAY_SETTING_STORAGE_KEYS.theme, theme);
	applyThemeToDocument(theme);
	emitDisplaySettingsChanged(DISPLAY_SETTING_STORAGE_KEYS.theme, theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	const stored = readStorage(DISPLAY_SETTING_STORAGE_KEYS.theme);
	if (stored === LIGHT_MODE || stored === DARK_MODE) {
		return stored;
	}
	return DEFAULT_THEME;
}

export function getStoredWallpaperMode(): WALLPAPER_MODE {
	const stored = readStorage(DISPLAY_SETTING_STORAGE_KEYS.wallpaperMode);
	if (stored === "banner" || stored === "fullscreen" || stored === "none") {
		return stored;
	}
	return getDefaultWallpaperMode();
}

export function setWallpaperMode(mode: WALLPAPER_MODE): void {
	writeStorage(DISPLAY_SETTING_STORAGE_KEYS.wallpaperMode, mode);
	// 触发自定义事件通知其他组件壁纸模式已改变
	window.dispatchEvent(
		new CustomEvent("wallpaper-mode-change", { detail: { mode } }),
	);
	emitDisplaySettingsChanged(DISPLAY_SETTING_STORAGE_KEYS.wallpaperMode, mode);
}

export function getDefaultWallpaperOpacity(): number {
	return fullscreenWallpaperConfig.opacity ?? 0.8;
}

export function getStoredWallpaperOpacity(): number {
	const stored = readStorage(DISPLAY_SETTING_STORAGE_KEYS.wallpaperOpacity);
	if (stored === null) {
		return getDefaultWallpaperOpacity();
	}
	return clamp(Number.parseFloat(stored), 0, 1);
}

export function setWallpaperOpacity(opacity: number): void {
	const nextOpacity = clamp(opacity, 0, 1);
	writeStorage(
		DISPLAY_SETTING_STORAGE_KEYS.wallpaperOpacity,
		String(nextOpacity),
	);
	emitDisplaySettingsChanged(
		DISPLAY_SETTING_STORAGE_KEYS.wallpaperOpacity,
		nextOpacity,
	);
}

export function getDefaultWallpaperBlur(): number {
	return fullscreenWallpaperConfig.blur ?? 0;
}

export function getStoredWallpaperBlur(): number {
	const stored = readStorage(DISPLAY_SETTING_STORAGE_KEYS.wallpaperBlur);
	if (stored === null) {
		return getDefaultWallpaperBlur();
	}
	return clamp(Number.parseFloat(stored), 0, 24);
}

export function setWallpaperBlur(blur: number): void {
	const nextBlur = clamp(blur, 0, 24);
	writeStorage(DISPLAY_SETTING_STORAGE_KEYS.wallpaperBlur, String(nextBlur));
	emitDisplaySettingsChanged(
		DISPLAY_SETTING_STORAGE_KEYS.wallpaperBlur,
		nextBlur,
	);
}

export function getStoredPostListLayout(): "list" | "grid" {
	const stored = readStorage(DISPLAY_SETTING_STORAGE_KEYS.postListLayout);
	if (stored === "list" || stored === "grid") {
		return stored;
	}
	return getDefaultPostListLayout();
}

export function getDefaultPostListLayout(): "list" | "grid" {
	return siteConfig.postListLayout.defaultMode || "list";
}

export function setStoredPostListLayout(layout: "list" | "grid"): void {
	writeStorage(DISPLAY_SETTING_STORAGE_KEYS.postListLayout, layout);
	emitDisplaySettingsChanged(
		DISPLAY_SETTING_STORAGE_KEYS.postListLayout,
		layout,
	);
	window.dispatchEvent(
		new CustomEvent("layoutChange", {
			detail: { layout },
		}),
	);
}

export function getStoredToggleSetting(
	key: Exclude<
		DisplaySettingStorageKey,
		| "theme"
		| "hue"
		| "wallpaperMode"
		| "wallpaperOpacity"
		| "wallpaperBlur"
		| "postListLayout"
	>,
	fallback: boolean,
): boolean {
	const stored = readStorage(key);
	if (stored === null) {
		return fallback;
	}
	return stored === "true";
}

export function setStoredToggleSetting(
	key: Exclude<
		DisplaySettingStorageKey,
		| "theme"
		| "hue"
		| "wallpaperMode"
		| "wallpaperOpacity"
		| "wallpaperBlur"
		| "postListLayout"
	>,
	enabled: boolean,
): void {
	writeStorage(key, String(enabled));
	emitDisplaySettingsChanged(key, enabled);
}

export function getStoredClickEffectEnabled(): boolean {
	return getStoredToggleSetting(
		DISPLAY_SETTING_STORAGE_KEYS.clickEffectEnabled,
		getDefaultClickEffectEnabled(),
	);
}

export function getDefaultClickEffectEnabled(): boolean {
	return (clickEffectConfig as ClickEffectConfig).enable;
}

export function setClickEffectEnabled(enabled: boolean): void {
	setStoredToggleSetting(
		DISPLAY_SETTING_STORAGE_KEYS.clickEffectEnabled,
		enabled,
	);
}

export function getStoredSakuraEnabled(): boolean {
	return getStoredToggleSetting(
		DISPLAY_SETTING_STORAGE_KEYS.sakuraEnabled,
		getDefaultSakuraEnabled(),
	);
}

export function getDefaultSakuraEnabled(): boolean {
	return sakuraConfig.enable;
}

export function setSakuraEnabled(enabled: boolean): void {
	setStoredToggleSetting(DISPLAY_SETTING_STORAGE_KEYS.sakuraEnabled, enabled);
}

export function getStoredLive2dEnabled(): boolean {
	return getStoredToggleSetting(
		DISPLAY_SETTING_STORAGE_KEYS.live2dEnabled,
		getDefaultLive2dEnabled(),
	);
}

export function getDefaultLive2dEnabled(): boolean {
	return live2dConfig.enable;
}

export function setLive2dEnabled(enabled: boolean): void {
	setStoredToggleSetting(DISPLAY_SETTING_STORAGE_KEYS.live2dEnabled, enabled);
}

export function getStoredBannerWavesEnabled(): boolean {
	return getStoredToggleSetting(
		DISPLAY_SETTING_STORAGE_KEYS.bannerWavesEnabled,
		getDefaultBannerWavesEnabled(),
	);
}

export function getDefaultBannerWavesEnabled(): boolean {
	return siteConfig.banner.waves?.enable ?? true;
}

export function setBannerWavesEnabled(enabled: boolean): void {
	setStoredToggleSetting(
		DISPLAY_SETTING_STORAGE_KEYS.bannerWavesEnabled,
		enabled,
	);
}
