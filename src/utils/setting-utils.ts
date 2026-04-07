import {
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
} from "@constants/constants";
import {
	clickEffectConfig,
	displaySettingsConfig,
	live2dConfig,
	sakuraConfig,
	siteConfig,
} from "@/config";
import type { LIGHT_DARK_MODE, WALLPAPER_MODE } from "@/types/config";

export const SETTING_CHANGE_EVENT = "mizuki:setting-change";

type SettingKey =
	| "hue"
	| "theme"
	| "wallpaperMode"
	| "wallpaperOpacity"
	| "wallpaperBlur"
	| "live2dEnabled"
	| "clickEffectEnabled"
	| "wavesEnabled"
	| "sakuraEnabled"
	| "wallpaperCarouselEnabled"
	| "postListLayout";

type DeviceScopedEffectKey =
	| "live2dEnabled"
	| "clickEffectEnabled"
	| "sakuraEnabled";

type PostListLayoutMode = "list" | "grid";
export type DisplaySettingGroup =
	| "themeColor"
	| "wallpaperMode"
	| "transparency"
	| "effects"
	| "postListLayout";

const STORAGE_KEYS = {
	hue: "hue",
	theme: "theme",
	wallpaperMode: "wallpaperMode",
	wallpaperOpacity: "wallpaperOpacity",
	wallpaperBlur: "wallpaperBlur",
	live2dEnabled: "live2dEnabled",
	clickEffectEnabled: "clickEffectEnabled",
	wavesEnabled: "wavesEnabled",
	sakuraEnabled: "sakuraEnabled",
	wallpaperCarouselEnabled: "wallpaperCarouselEnabled",
	postListLayout: "postListLayout",
} as const;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function parseNumber(
	value: string | null,
	fallback: number,
	min?: number,
	max?: number,
): number {
	if (value === null || value === "") return fallback;
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed)) return fallback;
	if (typeof min === "number" && typeof max === "number") {
		return clamp(parsed, min, max);
	}
	return parsed;
}

function parseBoolean(value: string | null, fallback: boolean): boolean {
	if (value === null) return fallback;
	return value === "true";
}

function dispatchSettingChange<T>(key: SettingKey, value: T): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent(SETTING_CHANGE_EVENT, {
			detail: { key, value },
		}),
	);
}

export function getDefaultHue(): number {
	const fallback = String(displaySettingsConfig.themeColor.defaultValue ?? 250);
	const configCarrier = document.getElementById("config-carrier");
	if (!configCarrier) {
		return Number.parseInt(fallback);
	}
	return Number.parseInt(configCarrier.dataset.hue || fallback);
}

export function getHue(): number {
	const stored = localStorage.getItem(STORAGE_KEYS.hue);
	return stored ? Number.parseInt(stored) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem(STORAGE_KEYS.hue, String(hue));
	const root = document.querySelector(":root") as HTMLElement;
	if (!root) {
		return;
	}
	root.style.setProperty("--hue", String(hue));
	dispatchSettingChange("hue", hue);
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	const currentIsDark = document.documentElement.classList.contains("dark");
	const currentTheme = document.documentElement.getAttribute("data-theme");

	let targetIsDark = false;
	switch (theme) {
		case LIGHT_MODE:
			targetIsDark = false;
			break;
		case DARK_MODE:
			targetIsDark = true;
			break;
		default:
			targetIsDark = currentIsDark;
			break;
	}

	const needsThemeChange = currentIsDark !== targetIsDark;
	const expectedTheme = targetIsDark ? "github-dark" : "github-light";
	const needsCodeThemeUpdate = currentTheme !== expectedTheme;

	if (!needsThemeChange && !needsCodeThemeUpdate) {
		return;
	}

	const performThemeChange = () => {
		if (needsThemeChange) {
			document.documentElement.classList.toggle("dark", targetIsDark);
		}

		if (needsCodeThemeUpdate) {
			document.documentElement.setAttribute("data-theme", expectedTheme);
		}
	};

	if (needsThemeChange) {
		document.documentElement.classList.add("is-theme-transitioning");
	}

	performThemeChange();

	if (needsThemeChange) {
		requestAnimationFrame(() => {
			document.documentElement.classList.remove("is-theme-transitioning");
		});
	}
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem(STORAGE_KEYS.theme, theme);
	applyThemeToDocument(theme);
	dispatchSettingChange("theme", theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (
		(localStorage.getItem(STORAGE_KEYS.theme) as LIGHT_DARK_MODE) ||
		DEFAULT_THEME
	);
}

function normalizeWallpaperMode(mode: string | null): WALLPAPER_MODE {
	switch (mode) {
		case WALLPAPER_FULLSCREEN:
			return WALLPAPER_FULLSCREEN;
		case WALLPAPER_NONE:
			return WALLPAPER_NONE;
		case WALLPAPER_BANNER:
		default:
			return WALLPAPER_BANNER;
	}
}

function applyWallpaperModeDataset(mode: WALLPAPER_MODE): void {
	document.documentElement.dataset.wallpaperMode = mode;
}

export function getStoredWallpaperMode(): WALLPAPER_MODE {
	return normalizeWallpaperMode(
		localStorage.getItem(STORAGE_KEYS.wallpaperMode) ||
			displaySettingsConfig.wallpaperMode.defaultMode ||
			siteConfig.wallpaperMode.defaultMode,
	);
}

export function setWallpaperMode(mode: WALLPAPER_MODE): void {
	localStorage.setItem(STORAGE_KEYS.wallpaperMode, mode);
	applyWallpaperModeDataset(mode);
	window.dispatchEvent(
		new CustomEvent("wallpaper-mode-change", { detail: { mode } }),
	);
	dispatchSettingChange("wallpaperMode", mode);
}

function applyFullscreenWallpaperOpacityVar(opacity: number): void {
	document.documentElement.style.setProperty(
		"--fullscreen-wallpaper-opacity",
		String(opacity),
	);
}

function applyFullscreenWallpaperBlurVar(blur: number): void {
	document.documentElement.style.setProperty(
		"--fullscreen-wallpaper-blur",
		`${blur}px`,
	);
}

export function getDefaultFullscreenWallpaperOpacity(): number {
	return displaySettingsConfig.fullscreenWallpaper.opacity.defaultValue;
}

export function getStoredFullscreenWallpaperOpacity(): number {
	const config = displaySettingsConfig.fullscreenWallpaper.opacity;
	return parseNumber(
		localStorage.getItem(STORAGE_KEYS.wallpaperOpacity),
		getDefaultFullscreenWallpaperOpacity(),
		config.min,
		config.max,
	);
}

export function setFullscreenWallpaperOpacity(opacity: number): void {
	const config = displaySettingsConfig.fullscreenWallpaper.opacity;
	const clamped = clamp(opacity, config.min, config.max);
	localStorage.setItem(STORAGE_KEYS.wallpaperOpacity, String(clamped));
	applyFullscreenWallpaperOpacityVar(clamped);
	dispatchSettingChange("wallpaperOpacity", clamped);
}

export function getDefaultFullscreenWallpaperBlur(): number {
	return displaySettingsConfig.fullscreenWallpaper.blur.defaultValue;
}

export function getStoredFullscreenWallpaperBlur(): number {
	const config = displaySettingsConfig.fullscreenWallpaper.blur;
	return parseNumber(
		localStorage.getItem(STORAGE_KEYS.wallpaperBlur),
		getDefaultFullscreenWallpaperBlur(),
		config.min,
		config.max,
	);
}

export function setFullscreenWallpaperBlur(blur: number): void {
	const config = displaySettingsConfig.fullscreenWallpaper.blur;
	const clamped = clamp(blur, config.min, config.max);
	localStorage.setItem(STORAGE_KEYS.wallpaperBlur, String(clamped));
	applyFullscreenWallpaperBlurVar(clamped);
	dispatchSettingChange("wallpaperBlur", clamped);
}

function applyBooleanDataset(key: string, value: boolean): void {
	document.documentElement.dataset[key] = value ? "true" : "false";
}

function isMobileViewport(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(max-width: 768px)").matches;
}

function getScopedEffectStorageKey(baseKey: DeviceScopedEffectKey): string {
	return `${baseKey}:${isMobileViewport() ? "mobile" : "desktop"}`;
}

function getStoredScopedBoolean(
	baseKey: DeviceScopedEffectKey,
	fallback: boolean,
): boolean {
	const scopedValue = localStorage.getItem(getScopedEffectStorageKey(baseKey));
	if (scopedValue !== null) {
		return parseBoolean(scopedValue, fallback);
	}
	return parseBoolean(localStorage.getItem(baseKey), fallback);
}

function setScopedBoolean(baseKey: DeviceScopedEffectKey, enabled: boolean): void {
	localStorage.setItem(
		getScopedEffectStorageKey(baseKey),
		enabled ? "true" : "false",
	);
}

export function getDefaultLive2dEnabled(): boolean {
	if (isMobileViewport()) return live2dConfig.mobile === true;
	return live2dConfig.enable;
}

export function getStoredLive2dEnabled(): boolean {
	return getStoredScopedBoolean(
		STORAGE_KEYS.live2dEnabled,
		getDefaultLive2dEnabled(),
	);
}

export function setLive2dEnabled(enabled: boolean): void {
	setScopedBoolean(STORAGE_KEYS.live2dEnabled, enabled);
	applyBooleanDataset("live2dEnabled", enabled);
	dispatchSettingChange("live2dEnabled", enabled);
}

export function getDefaultClickEffectEnabled(): boolean {
	if (isMobileViewport()) return clickEffectConfig.enable.mobile === true;
	return clickEffectConfig.enable.desktop;
}

export function getStoredClickEffectEnabled(): boolean {
	return getStoredScopedBoolean(
		STORAGE_KEYS.clickEffectEnabled,
		getDefaultClickEffectEnabled(),
	);
}

export function setClickEffectEnabled(enabled: boolean): void {
	setScopedBoolean(STORAGE_KEYS.clickEffectEnabled, enabled);
	applyBooleanDataset("clickEffectEnabled", enabled);
	dispatchSettingChange("clickEffectEnabled", enabled);
}

export function getDefaultWavesEnabled(): boolean {
	if (isMobileViewport() && siteConfig.banner.waves?.mobileDisable === true) {
		return false;
	}
	return displaySettingsConfig.effects.waves.defaultValue;
}

export function getStoredWavesEnabled(): boolean {
	return parseBoolean(
		localStorage.getItem(STORAGE_KEYS.wavesEnabled),
		getDefaultWavesEnabled(),
	);
}

export function setWavesEnabled(enabled: boolean): void {
	localStorage.setItem(STORAGE_KEYS.wavesEnabled, enabled ? "true" : "false");
	applyBooleanDataset("wavesEnabled", enabled);
	dispatchSettingChange("wavesEnabled", enabled);
}

export function getDefaultSakuraEnabled(): boolean {
	if (isMobileViewport()) return sakuraConfig.mobile === true;
	return sakuraConfig.enable;
}

export function getStoredSakuraEnabled(): boolean {
	return getStoredScopedBoolean(
		STORAGE_KEYS.sakuraEnabled,
		getDefaultSakuraEnabled(),
	);
}

export function setSakuraEnabled(enabled: boolean): void {
	setScopedBoolean(STORAGE_KEYS.sakuraEnabled, enabled);
	applyBooleanDataset("sakuraEnabled", enabled);
	dispatchSettingChange("sakuraEnabled", enabled);
}

export function getDefaultWallpaperCarouselEnabled(): boolean {
	return displaySettingsConfig.effects.wallpaperCarousel.defaultValue;
}

export function getStoredWallpaperCarouselEnabled(): boolean {
	return parseBoolean(
		localStorage.getItem(STORAGE_KEYS.wallpaperCarouselEnabled),
		getDefaultWallpaperCarouselEnabled(),
	);
}

export function setWallpaperCarouselEnabled(enabled: boolean): void {
	localStorage.setItem(
		STORAGE_KEYS.wallpaperCarouselEnabled,
		enabled ? "true" : "false",
	);
	applyBooleanDataset("wallpaperCarouselEnabled", enabled);
	dispatchSettingChange("wallpaperCarouselEnabled", enabled);
}

function normalizePostListLayout(mode: string | null): PostListLayoutMode {
	return mode === "grid" ? "grid" : "list";
}

export function getStoredPostListLayout(): PostListLayoutMode {
	const local = normalizePostListLayout(localStorage.getItem(STORAGE_KEYS.postListLayout));
	const session = normalizePostListLayout(
		sessionStorage.getItem(STORAGE_KEYS.postListLayout),
	);
	if (sessionStorage.getItem(STORAGE_KEYS.postListLayout)) return session;
	if (localStorage.getItem(STORAGE_KEYS.postListLayout)) return local;
	return displaySettingsConfig.postListLayout.defaultMode;
}

export function setPostListLayout(mode: PostListLayoutMode): void {
	localStorage.setItem(STORAGE_KEYS.postListLayout, mode);
	sessionStorage.setItem(STORAGE_KEYS.postListLayout, mode);
	document.documentElement.dataset.postListLayout = mode;
	window.dispatchEvent(
		new CustomEvent("layoutChange", {
			detail: { layout: mode },
		}),
	);
	dispatchSettingChange("postListLayout", mode);
}

export function resetDisplaySettingGroup(group: DisplaySettingGroup): void {
	switch (group) {
		case "themeColor":
			setHue(getDefaultHue());
			break;
		case "wallpaperMode":
			setWallpaperMode(
				displaySettingsConfig.wallpaperMode.defaultMode as WALLPAPER_MODE,
			);
			setFullscreenWallpaperOpacity(
				displaySettingsConfig.fullscreenWallpaper.opacity.defaultValue,
			);
			setFullscreenWallpaperBlur(
				displaySettingsConfig.fullscreenWallpaper.blur.defaultValue,
			);
			break;
		case "transparency":
			setFullscreenWallpaperOpacity(
				displaySettingsConfig.fullscreenWallpaper.opacity.defaultValue,
			);
			setFullscreenWallpaperBlur(
				displaySettingsConfig.fullscreenWallpaper.blur.defaultValue,
			);
			break;
		case "effects":
			setLive2dEnabled(getDefaultLive2dEnabled());
			setClickEffectEnabled(getDefaultClickEffectEnabled());
			setWavesEnabled(getDefaultWavesEnabled());
			setSakuraEnabled(getDefaultSakuraEnabled());
			setWallpaperCarouselEnabled(
				displaySettingsConfig.effects.wallpaperCarousel.defaultValue,
			);
			break;
		case "postListLayout":
			setPostListLayout(displaySettingsConfig.postListLayout.defaultMode);
			break;
	}
}

export function applyAllStoredSettings(): void {
	if (typeof window === "undefined" || typeof document === "undefined") return;

	const root = document.documentElement;
	root.style.setProperty("--hue", String(getHue()));
	applyThemeToDocument(getStoredTheme());
	applyWallpaperModeDataset(getStoredWallpaperMode());
	applyFullscreenWallpaperOpacityVar(getStoredFullscreenWallpaperOpacity());
	applyFullscreenWallpaperBlurVar(getStoredFullscreenWallpaperBlur());
	applyBooleanDataset("live2dEnabled", getStoredLive2dEnabled());
	applyBooleanDataset("clickEffectEnabled", getStoredClickEffectEnabled());
	applyBooleanDataset("wavesEnabled", getStoredWavesEnabled());
	applyBooleanDataset("sakuraEnabled", getStoredSakuraEnabled());
	applyBooleanDataset(
		"wallpaperCarouselEnabled",
		getStoredWallpaperCarouselEnabled(),
	);
	root.dataset.postListLayout = getStoredPostListLayout();
}
