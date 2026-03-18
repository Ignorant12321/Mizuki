<script lang="ts">
import {
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
} from "@constants/constants";
import {
	displaySettingsConfig,
} from "@/config";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
	SETTING_CHANGE_EVENT,
	applyAllStoredSettings,
	getDefaultHue,
	getHue,
	getStoredClickEffectEnabled,
	getStoredFullscreenWallpaperBlur,
	getStoredFullscreenWallpaperOpacity,
	getStoredLive2dEnabled,
	getStoredPostListLayout,
	getStoredWallpaperCarouselEnabled,
	getStoredSakuraEnabled,
	getStoredWallpaperMode,
	getStoredWavesEnabled,
	resetDisplaySettingGroup,
	setClickEffectEnabled,
	setFullscreenWallpaperBlur,
	setFullscreenWallpaperOpacity,
	setHue,
	setLive2dEnabled,
	setPostListLayout,
	setWallpaperCarouselEnabled,
	setSakuraEnabled,
	setWallpaperMode,
	setWavesEnabled,
} from "@utils/setting-utils";
import { panelManager } from "@utils/panel-manager.js";
import { onMount } from "svelte";
import { fade, fly } from "svelte/transition";
import type { WALLPAPER_MODE } from "@/types/config";

type PostListLayoutMode = "list" | "grid";

type SettingChangeDetail = {
	key: string;
	value: unknown;
};

const wallpaperOptions: {
	mode: WALLPAPER_MODE;
	icon: string;
	label: I18nKey;
}[] = [
	{
		mode: WALLPAPER_BANNER,
		icon: "material-symbols:image-outline-rounded",
		label: I18nKey.wallpaperBanner,
	},
	{
		mode: WALLPAPER_FULLSCREEN,
		icon: "material-symbols:wallpaper-rounded",
		label: I18nKey.wallpaperFullscreen,
	},
	{
		mode: WALLPAPER_NONE,
		icon: "material-symbols:palette-outline",
		label: I18nKey.wallpaperNone,
	},
];

const panelBaseStyle = [
	`top: ${displaySettingsConfig.panel.top}`,
	`right: ${displaySettingsConfig.panel.right}`,
	`width: min(${displaySettingsConfig.panel.width}, calc(100vw - 1rem))`,
	`max-height: ${displaySettingsConfig.panel.maxHeight}`,
	`z-index: ${displaySettingsConfig.panel.zIndex}`,
].join("; ");

const opacityConfig = displaySettingsConfig.fullscreenWallpaper.opacity;
const blurConfig = displaySettingsConfig.fullscreenWallpaper.blur;

const opacityMin = Math.round(opacityConfig.min * 100);
const opacityMax = Math.round(opacityConfig.max * 100);
const opacityStep = Math.max(1, Math.round(opacityConfig.step * 100));

const defaultWallpaperMode =
	displaySettingsConfig.wallpaperMode.defaultMode as WALLPAPER_MODE;
const defaultWallpaperOpacity = Math.round(opacityConfig.defaultValue * 100);
const defaultWallpaperBlur = blurConfig.defaultValue;
const defaultLive2dEnabled = displaySettingsConfig.effects.live2d.defaultValue;
const defaultClickEffectEnabled =
	displaySettingsConfig.effects.clickEffect.defaultValue;
const defaultWavesEnabled = displaySettingsConfig.effects.waves.defaultValue;
const defaultSakuraEnabled = displaySettingsConfig.effects.sakura.defaultValue;
const defaultWallpaperCarouselEnabled =
	displaySettingsConfig.effects.wallpaperCarousel.defaultValue;
const defaultPostListLayout =
	displaySettingsConfig.postListLayout.defaultMode as PostListLayoutMode;

let hue = displaySettingsConfig.themeColor.defaultValue;
let defaultHue = displaySettingsConfig.themeColor.defaultValue;
let wallpaperMode: WALLPAPER_MODE = defaultWallpaperMode;
let wallpaperOpacity = defaultWallpaperOpacity;
let wallpaperBlur = defaultWallpaperBlur;
let live2dEnabled = defaultLive2dEnabled;
let clickEffectEnabled = defaultClickEffectEnabled;
let wavesEnabled = defaultWavesEnabled;
let sakuraEnabled = defaultSakuraEnabled;
let wallpaperCarouselEnabled = defaultWallpaperCarouselEnabled;
let postListLayout: PostListLayoutMode = defaultPostListLayout;
let wallpaperOpacityProgress = wallpaperOpacity;
let wallpaperBlurProgress = 0;
let panelStyle = "";

let isThemeDefault = true;
let isWallpaperDefault = true;
let isTransparencyDefault = true;
let isEffectsDefault = true;
let isLayoutDefault = true;

$: isThemeDefault = hue === defaultHue;
$: isWallpaperDefault =
	wallpaperMode === defaultWallpaperMode &&
	wallpaperOpacity === defaultWallpaperOpacity &&
	Math.abs(wallpaperBlur - defaultWallpaperBlur) < 0.001;
$: isTransparencyDefault =
	wallpaperOpacity === defaultWallpaperOpacity &&
	Math.abs(wallpaperBlur - defaultWallpaperBlur) < 0.001;
$: isEffectsDefault =
	live2dEnabled === defaultLive2dEnabled &&
	clickEffectEnabled === defaultClickEffectEnabled &&
	wavesEnabled === defaultWavesEnabled &&
	sakuraEnabled === defaultSakuraEnabled &&
	wallpaperCarouselEnabled === defaultWallpaperCarouselEnabled;
$: isLayoutDefault = postListLayout === defaultPostListLayout;
$: wallpaperOpacityProgress = wallpaperOpacity;
$: wallpaperBlurProgress =
	((wallpaperBlur - blurConfig.min) / (blurConfig.max - blurConfig.min)) *
	100;
$: panelStyle = getPanelStyle(wallpaperMode);

function getPanelStyle(mode: WALLPAPER_MODE): string {
	const lockPanelHeight =
		mode === WALLPAPER_FULLSCREEN
			? `height: ${displaySettingsConfig.panel.maxHeight}`
			: "height: auto";
	return `${panelBaseStyle}; ${lockPanelHeight}`;
}

function canShowLive2dSwitch(): boolean {
	return (
		displaySettingsConfig.effects.live2d.enable &&
		displaySettingsConfig.effects.live2d.allowSwitch
	);
}

function canShowClickEffectSwitch(): boolean {
	return (
		displaySettingsConfig.effects.clickEffect.enable &&
		displaySettingsConfig.effects.clickEffect.allowSwitch
	);
}

function canShowWavesSwitch(): boolean {
	return (
		displaySettingsConfig.effects.waves.enable &&
		displaySettingsConfig.effects.waves.allowSwitch
	);
}

function canShowSakuraSwitch(): boolean {
	return (
		displaySettingsConfig.effects.sakura.enable &&
		displaySettingsConfig.effects.sakura.allowSwitch
	);
}

function canShowWallpaperCarouselSwitch(): boolean {
	return (
		displaySettingsConfig.effects.wallpaperCarousel.enable &&
		displaySettingsConfig.effects.wallpaperCarousel.allowSwitch
	);
}

function hasVisibleEffectSwitches(): boolean {
	return (
		canShowLive2dSwitch() ||
		canShowClickEffectSwitch() ||
		canShowWavesSwitch() ||
		canShowSakuraSwitch() ||
		canShowWallpaperCarouselSwitch()
	);
}

function ensurePanelShell(): void {
	const panel = document.getElementById("display-setting");
	if (!panel) return;
	panel.classList.add("float-panel", "card-base", "fixed", "px-3", "py-3");
	panel.style.cssText = getPanelStyle(wallpaperMode);
}

function syncFromStorage(): void {
	hue = getHue();
	defaultHue = getDefaultHue();
	wallpaperMode = getStoredWallpaperMode();
	wallpaperOpacity = Math.round(getStoredFullscreenWallpaperOpacity() * 100);
	wallpaperBlur = getStoredFullscreenWallpaperBlur();
	live2dEnabled = getStoredLive2dEnabled();
	clickEffectEnabled = getStoredClickEffectEnabled();
	wavesEnabled = getStoredWavesEnabled();
	sakuraEnabled = getStoredSakuraEnabled();
	wallpaperCarouselEnabled = getStoredWallpaperCarouselEnabled();
	postListLayout = getStoredPostListLayout();
}

function syncPanelState(): void {
	syncFromStorage();
	ensurePanelShell();
}

function getResetAriaLabel(sectionTitleKey: I18nKey): string {
	return `${i18n(I18nKey.displaySettingsResetSection)}: ${i18n(sectionTitleKey)}`;
}

function resetThemeSection(): void {
	resetDisplaySettingGroup("themeColor");
	syncFromStorage();
}

function resetWallpaperSection(): void {
	resetDisplaySettingGroup("wallpaperMode");
	syncFromStorage();
}

function resetTransparencySection(): void {
	resetDisplaySettingGroup("transparency");
	syncFromStorage();
}

function resetEffectsSection(): void {
	resetDisplaySettingGroup("effects");
	syncFromStorage();
}

function resetLayoutSection(): void {
	resetDisplaySettingGroup("postListLayout");
	syncFromStorage();
}

async function closeDisplaySettingsPanel(): Promise<void> {
	await panelManager.closePanel("display-setting");
}

function updateHue(event: Event): void {
	const target = event.currentTarget as HTMLInputElement;
	const value = Number.parseInt(target.value, 10);
	hue = value;
	setHue(value);
}

function updateWallpaperMode(mode: WALLPAPER_MODE): void {
	wallpaperMode = mode;
	setWallpaperMode(mode);
}

function updateWallpaperOpacity(event: Event): void {
	const target = event.currentTarget as HTMLInputElement;
	const percent = Number.parseInt(target.value, 10);
	wallpaperOpacity = percent;
	setFullscreenWallpaperOpacity(percent / 100);
}

function updateWallpaperBlur(event: Event): void {
	const target = event.currentTarget as HTMLInputElement;
	const blur = Number.parseFloat(target.value);
	wallpaperBlur = blur;
	setFullscreenWallpaperBlur(blur);
}

function toggleLive2d(): void {
	if (!canShowLive2dSwitch()) return;
	live2dEnabled = !live2dEnabled;
	setLive2dEnabled(live2dEnabled);
}

function toggleClickEffect(): void {
	if (!canShowClickEffectSwitch()) return;
	clickEffectEnabled = !clickEffectEnabled;
	setClickEffectEnabled(clickEffectEnabled);
}

function toggleWaves(): void {
	if (!canShowWavesSwitch()) return;
	wavesEnabled = !wavesEnabled;
	setWavesEnabled(wavesEnabled);
}

function toggleSakura(): void {
	if (!canShowSakuraSwitch()) return;
	sakuraEnabled = !sakuraEnabled;
	setSakuraEnabled(sakuraEnabled);
}

function toggleWallpaperCarousel(): void {
	if (!canShowWallpaperCarouselSwitch()) return;
	wallpaperCarouselEnabled = !wallpaperCarouselEnabled;
	setWallpaperCarouselEnabled(wallpaperCarouselEnabled);
}

function updatePostListLayout(layout: PostListLayoutMode): void {
	if (
		!(
			displaySettingsConfig.postListLayout.enable &&
			displaySettingsConfig.postListLayout.allowSwitch
		)
	)
		return;
	postListLayout = layout;
	setPostListLayout(layout);
}

function handleSettingChange(event: Event): void {
	const customEvent = event as CustomEvent<SettingChangeDetail>;
	if (!customEvent.detail) return;

	switch (customEvent.detail.key) {
		case "hue":
			hue = Number(customEvent.detail.value) || hue;
			break;
		case "wallpaperMode":
			wallpaperMode = customEvent.detail.value as WALLPAPER_MODE;
			break;
		case "wallpaperOpacity":
			wallpaperOpacity = Math.round(Number(customEvent.detail.value || 0) * 100);
			break;
		case "wallpaperBlur":
			wallpaperBlur = Number(customEvent.detail.value || 0);
			break;
		case "live2dEnabled":
			live2dEnabled = Boolean(customEvent.detail.value);
			break;
		case "clickEffectEnabled":
			clickEffectEnabled = Boolean(customEvent.detail.value);
			break;
		case "wavesEnabled":
			wavesEnabled = Boolean(customEvent.detail.value);
			break;
		case "sakuraEnabled":
			sakuraEnabled = Boolean(customEvent.detail.value);
			break;
		case "wallpaperCarouselEnabled":
			wallpaperCarouselEnabled = Boolean(customEvent.detail.value);
			break;
		case "postListLayout":
			postListLayout = customEvent.detail.value as PostListLayoutMode;
			break;
	}
}

onMount(() => {
	applyAllStoredSettings();
	syncPanelState();

	const onSwupSync = () => {
		requestAnimationFrame(() => {
			syncPanelState();
		});
	};

	const onResize = () => {
		requestAnimationFrame(() => {
			syncPanelState();
		});
	};

	window.addEventListener(SETTING_CHANGE_EVENT, handleSettingChange as EventListener);
	document.addEventListener("swup:content:replace", onSwupSync);
	document.addEventListener("swup:page:view", onSwupSync);
	window.addEventListener("resize", onResize);

	return () => {
		window.removeEventListener(
			SETTING_CHANGE_EVENT,
			handleSettingChange as EventListener,
		);
		document.removeEventListener("swup:content:replace", onSwupSync);
		document.removeEventListener("swup:page:view", onSwupSync);
		window.removeEventListener("resize", onResize);
	};
});
</script>

<div
	id="display-setting"
	class="float-panel float-panel-closed card-base fixed px-3 py-3"
	style={panelStyle}
>
	<div class="panel-header">
		<h3 class="panel-title">{i18n(I18nKey.displaySettingsTitle)}</h3>
		<button
			type="button"
			class="panel-close-btn active:scale-90"
			aria-label={i18n(I18nKey.displaySettingsClose)}
			on:click={closeDisplaySettingsPanel}
		>
			<Icon icon="material-symbols:close" class="text-[1rem]" />
		</button>
	</div>
	<div class="panel-scroll">
		{#if displaySettingsConfig.themeColor.enable}
			<section class="setting-section">
				<div class="section-header">
					<div class="section-title">{i18n(I18nKey.themeColor)}</div>
					<div class="section-header-actions">
						<div class="value-chip">{hue}</div>
						<button
							type="button"
							aria-label={getResetAriaLabel(I18nKey.themeColor)}
							class="section-reset-btn active:scale-90"
							disabled={isThemeDefault}
							on:click={resetThemeSection}
						>
							<Icon icon="fa7-solid:arrow-rotate-left" class="text-sm" />
						</button>
					</div>
				</div>
				<div class="hue-slider-wrap">
					<input
						type="range"
						class="setting-slider hue-slider"
						min={displaySettingsConfig.themeColor.min}
						max={displaySettingsConfig.themeColor.max}
						step={displaySettingsConfig.themeColor.step}
						value={hue}
						on:input={updateHue}
						aria-label={i18n(I18nKey.themeColor)}
					/>
				</div>
			</section>
		{/if}

		{#if displaySettingsConfig.wallpaperMode.enable}
			<section class="setting-section">
				<div class="section-header">
					<div class="section-title">{i18n(I18nKey.displaySettingsWallpaperMode)}</div>
					<button
						type="button"
						aria-label={getResetAriaLabel(I18nKey.displaySettingsWallpaperMode)}
						class="section-reset-btn active:scale-90"
						disabled={isWallpaperDefault}
						on:click={resetWallpaperSection}
					>
						<Icon icon="fa7-solid:arrow-rotate-left" class="text-sm" />
					</button>
				</div>
				<div class="mode-row mode-row-3">
					{#each wallpaperOptions as option}
						<button
							type="button"
							class="mode-button"
							class:is-active={wallpaperMode === option.mode}
							on:click={() => updateWallpaperMode(option.mode)}
							aria-pressed={wallpaperMode === option.mode}
						>
							<Icon icon={option.icon} class="text-base" />
							<span>{i18n(option.label)}</span>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		{#if wallpaperMode === WALLPAPER_FULLSCREEN}
			<section
				class="setting-section fullscreen-extra-section"
				in:fly|local={{ y: -8, duration: 180 }}
				out:fade|local={{ duration: 120 }}
			>
				<div class="section-header">
					<div class="section-title">{i18n(I18nKey.displaySettingsTransparency)}</div>
					<button
						type="button"
						aria-label={getResetAriaLabel(I18nKey.displaySettingsTransparency)}
						class="section-reset-btn active:scale-90"
						disabled={isTransparencyDefault}
						on:click={resetTransparencySection}
					>
						<Icon icon="fa7-solid:arrow-rotate-left" class="text-sm" />
					</button>
				</div>
				{#if opacityConfig.enable}
					<div class="slider-block">
						<div class="slider-meta">
							<span>{i18n(I18nKey.wallpaperOpacity)}</span>
							<span>{wallpaperOpacity}%</span>
						</div>
						<input
							type="range"
							class="setting-slider"
							min={opacityMin}
							max={opacityMax}
							step={opacityStep}
							value={wallpaperOpacity}
							style={`--slider-progress: ${Math.min(100, Math.max(0, wallpaperOpacityProgress)).toFixed(2)}%`}
							on:input={updateWallpaperOpacity}
							aria-label={i18n(I18nKey.wallpaperOpacity)}
						/>
					</div>
				{/if}
				{#if blurConfig.enable}
					<div class="slider-block">
						<div class="slider-meta">
							<span>{i18n(I18nKey.wallpaperBlur)}</span>
							<span>{wallpaperBlur.toFixed(1)}px</span>
						</div>
						<input
							type="range"
							class="setting-slider"
							min={blurConfig.min}
							max={blurConfig.max}
							step={blurConfig.step}
							value={wallpaperBlur}
							style={`--slider-progress: ${Math.min(100, Math.max(0, wallpaperBlurProgress)).toFixed(2)}%`}
							on:input={updateWallpaperBlur}
							aria-label={i18n(I18nKey.wallpaperBlur)}
						/>
					</div>
				{/if}
			</section>
		{/if}

		{#if hasVisibleEffectSwitches()}
			<section class="setting-section">
				<div class="section-header">
					<div class="section-title">{i18n(I18nKey.displaySettingsEffects)}</div>
					<button
						type="button"
						aria-label={getResetAriaLabel(I18nKey.displaySettingsEffects)}
						class="section-reset-btn active:scale-90"
						disabled={isEffectsDefault}
						on:click={resetEffectsSection}
					>
						<Icon icon="fa7-solid:arrow-rotate-left" class="text-sm" />
					</button>
				</div>
				<div class="effects-list">
					{#if canShowLive2dSwitch()}
						<button
							type="button"
							class="effect-row"
							class:is-active={live2dEnabled}
							on:click={toggleLive2d}
							aria-pressed={live2dEnabled}
						>
							<span class="effect-meta">
								<Icon icon="material-symbols:smart-toy-outline-rounded" class="text-base" />
								<span>{i18n(I18nKey.enableLive2d)}</span>
							</span>
							<span class="effect-switch" aria-hidden="true">
								<span class="effect-thumb"></span>
							</span>
						</button>
					{/if}
					{#if canShowClickEffectSwitch()}
						<button
							type="button"
							class="effect-row"
							class:is-active={clickEffectEnabled}
							on:click={toggleClickEffect}
							aria-pressed={clickEffectEnabled}
						>
							<span class="effect-meta">
								<Icon icon="fa7-solid:hand-pointer" class="text-base" />
								<span>{i18n(I18nKey.enableClickEffect)}</span>
							</span>
							<span class="effect-switch" aria-hidden="true">
								<span class="effect-thumb"></span>
							</span>
						</button>
					{/if}
					{#if canShowWavesSwitch()}
						<button
							type="button"
							class="effect-row"
							class:is-active={wavesEnabled}
							on:click={toggleWaves}
							aria-pressed={wavesEnabled}
						>
							<span class="effect-meta">
								<Icon icon="material-symbols:water-rounded" class="text-base" />
								<span>{i18n(I18nKey.enableWaves)}</span>
							</span>
							<span class="effect-switch" aria-hidden="true">
								<span class="effect-thumb"></span>
							</span>
						</button>
					{/if}
					{#if canShowSakuraSwitch()}
						<button
							type="button"
							class="effect-row"
							class:is-active={sakuraEnabled}
							on:click={toggleSakura}
							aria-pressed={sakuraEnabled}
						>
							<span class="effect-meta">
								<Icon icon="material-symbols:local-florist-outline-rounded" class="text-base" />
								<span>{i18n(I18nKey.enableSakura)}</span>
							</span>
							<span class="effect-switch" aria-hidden="true">
								<span class="effect-thumb"></span>
							</span>
						</button>
					{/if}
					{#if canShowWallpaperCarouselSwitch()}
						<button
							type="button"
							class="effect-row"
							class:is-active={wallpaperCarouselEnabled}
							on:click={toggleWallpaperCarousel}
							aria-pressed={wallpaperCarouselEnabled}
						>
							<span class="effect-meta">
								<Icon icon="material-symbols:slideshow-rounded" class="text-base" />
								<span>{i18n(I18nKey.enableWallpaperCarousel)}</span>
							</span>
							<span class="effect-switch" aria-hidden="true">
								<span class="effect-thumb"></span>
							</span>
						</button>
					{/if}
				</div>
			</section>
		{/if}

		{#if displaySettingsConfig.postListLayout.enable}
			<section class="setting-section">
				<div class="section-header">
					<div class="section-title">{i18n(I18nKey.displaySettingsArticleLayout)}</div>
					<button
						type="button"
						aria-label={getResetAriaLabel(I18nKey.displaySettingsArticleLayout)}
						class="section-reset-btn active:scale-90"
						disabled={isLayoutDefault}
						on:click={resetLayoutSection}
					>
						<Icon icon="fa7-solid:arrow-rotate-left" class="text-sm" />
					</button>
				</div>
				<div class="mode-row mode-row-2">
					<button
						type="button"
						class="mode-button"
						class:is-active={postListLayout === "list"}
						class:is-disabled={!displaySettingsConfig.postListLayout.allowSwitch}
						on:click={() => updatePostListLayout("list")}
					>
						<Icon icon="material-symbols:view-list-rounded" class="text-base" />
						<span>{i18n(I18nKey.layoutList)}</span>
					</button>
					<button
						type="button"
						class="mode-button"
						class:is-active={postListLayout === "grid"}
						class:is-disabled={!displaySettingsConfig.postListLayout.allowSwitch}
						on:click={() => updatePostListLayout("grid")}
					>
						<Icon icon="material-symbols:grid-view-rounded" class="text-base" />
						<span>{i18n(I18nKey.layoutGrid)}</span>
					</button>
				</div>
			</section>
		{/if}
	</div>
</div>
