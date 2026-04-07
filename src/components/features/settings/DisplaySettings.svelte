<script lang="ts">
	import {
		WALLPAPER_BANNER,
		WALLPAPER_FULLSCREEN,
		WALLPAPER_NONE,
	} from "@constants/constants";
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";
	import Icon from "@iconify/svelte";
	import { panelManager } from "@utils/panel-manager.js";
	import {
		getDefaultHue,
		getDefaultBannerWavesEnabled,
		getDefaultClickEffectEnabled,
		getDefaultLive2dEnabled,
		getDefaultPostListLayout,
		getDefaultSakuraEnabled,
		getDefaultWallpaperBlur,
		getDefaultWallpaperMode,
		getDefaultWallpaperOpacity,
		getHue,
		getStoredBannerWavesEnabled,
		getStoredClickEffectEnabled,
		getStoredLive2dEnabled,
		getStoredPostListLayout,
		getStoredSakuraEnabled,
		getStoredWallpaperBlur,
		getStoredWallpaperMode,
		getStoredWallpaperOpacity,
		setBannerWavesEnabled,
		setClickEffectEnabled,
		setHue,
		setLive2dEnabled,
		setSakuraEnabled,
		setStoredPostListLayout,
		setWallpaperBlur,
		setWallpaperMode,
		setWallpaperOpacity,
	} from "@utils/setting-utils";
	import { onMount } from "svelte";

	type LayoutMode = "list" | "grid";

	export let className = "";

	let isMounted = false;
	let defaultHue = 250;
	let hue = 250;
	let wallpaperMode = WALLPAPER_BANNER;
	let wallpaperOpacity = 0.8;
	let wallpaperBlur = 1;
	let layoutMode: LayoutMode = "list";
	let clickEffectEnabled = true;
	let sakuraEnabled = false;
	let live2dEnabled = true;
	let bannerWavesEnabled = true;

	const wallpaperCards: {
		mode:
			| typeof WALLPAPER_BANNER
			| typeof WALLPAPER_FULLSCREEN
			| typeof WALLPAPER_NONE;
		icon: string;
		label: I18nKey;
	}[] = [
		{
			mode: WALLPAPER_BANNER,
			icon: "material-symbols:image-outline",
			label: I18nKey.wallpaperBanner,
		},
		{
			mode: WALLPAPER_FULLSCREEN,
			icon: "material-symbols:wallpaper",
			label: I18nKey.wallpaperFullscreen,
		},
		{
			mode: WALLPAPER_NONE,
			icon: "material-symbols:hide-image-outline",
			label: I18nKey.wallpaperNone,
		},
	];

	const layoutCards: {
		mode: LayoutMode;
		icon: string;
		label: I18nKey;
	}[] = [
		{
			mode: "list",
			icon: "material-symbols:view-agenda-outline",
			label: I18nKey.layoutListMode,
		},
		{
			mode: "grid",
			icon: "material-symbols:grid-view-outline",
			label: I18nKey.layoutGridMode,
		},
	];

	function resetHue() {
		hue = defaultHue;
	}

	function clampHue() {
		if (!Number.isFinite(hue)) {
			hue = defaultHue;
			return;
		}
		const normalized = Math.round(hue / 5) * 5;
		hue = Math.min(360, Math.max(0, normalized));
	}

	function resetWallpaperMode() {
		wallpaperMode = getDefaultWallpaperMode();
	}

	function resetWallpaperTransparency() {
		wallpaperOpacity = getDefaultWallpaperOpacity();
		wallpaperBlur = getDefaultWallpaperBlur();
	}

	function resetEffectsSettings() {
		clickEffectEnabled = getDefaultClickEffectEnabled();
		sakuraEnabled = getDefaultSakuraEnabled();
		live2dEnabled = getDefaultLive2dEnabled();
		bannerWavesEnabled = getDefaultBannerWavesEnabled();
	}

	function resetLayoutSettings() {
		layoutMode = getDefaultPostListLayout();
	}

	async function closePanel() {
		await panelManager.closePanel("display-setting");
	}

	onMount(() => {
		defaultHue = getDefaultHue();
		hue = getHue();
		wallpaperMode = getStoredWallpaperMode();
		wallpaperOpacity = getStoredWallpaperOpacity();
		wallpaperBlur = getStoredWallpaperBlur();
		layoutMode = getStoredPostListLayout();
		clickEffectEnabled = getStoredClickEffectEnabled();
		sakuraEnabled = getStoredSakuraEnabled();
		live2dEnabled = getStoredLive2dEnabled();
		bannerWavesEnabled = getStoredBannerWavesEnabled();
		isMounted = true;
	});

	$: if (isMounted && Number.isFinite(hue)) {
		setHue(hue);
	}

	$: if (isMounted) {
		setWallpaperMode(wallpaperMode);
	}

	$: if (isMounted) {
		setWallpaperOpacity(wallpaperOpacity);
	}

	$: if (isMounted) {
		setWallpaperBlur(wallpaperBlur);
	}

	$: if (isMounted) {
		setStoredPostListLayout(layoutMode);
	}

	$: if (isMounted) {
		setClickEffectEnabled(clickEffectEnabled);
	}

	$: if (isMounted) {
		setSakuraEnabled(sakuraEnabled);
	}

	$: if (isMounted) {
		setLive2dEnabled(live2dEnabled);
	}

	$: if (isMounted) {
		setBannerWavesEnabled(bannerWavesEnabled);
	}
</script>

<div
	id="display-setting"
	class={`float-panel float-panel-closed fixed transition-all right-4 w-[21.5rem] max-w-[calc(100vw-2rem)]`}
	class:list={[className]}
>
	<div class="panel-scroll">
		<div class="panel-header">
			<div class="panel-heading">
				<div class="panel-title-row">
					<Icon
						icon="material-symbols:palette-outline"
						class="text-[1.05rem]"
					/>
					<div>
						<div class="panel-title">
							{i18n(I18nKey.displaySettings)}
						</div>
					</div>
				</div>
			</div>
			<button
				type="button"
				aria-label={i18n(I18nKey.announcementClose)}
				class="panel-close-btn"
				on:click={closePanel}
			>
				<Icon
					icon="material-symbols:close-rounded"
					class="text-[0.95rem]"
				/>
			</button>
		</div>

		<section class="setting-section">
			<div class="section-header">
				<div class="section-title">{i18n(I18nKey.themeColor)}</div>
				<div class="section-header-actions">
					<input
						aria-label={i18n(I18nKey.themeColor)}
						type="number"
						min="0"
						max="360"
						step="5"
						bind:value={hue}
						class="value-chip"
						on:change={clampHue}
					/>
					<button
						type="button"
						aria-label={i18n(I18nKey.resetThemeColor)}
						class="section-reset-btn"
						class:is-disabled={hue === defaultHue}
						on:click={resetHue}
					>
						<Icon
							icon="fa7-solid:arrow-rotate-left"
							class="text-[0.875rem]"
						/>
					</button>
				</div>
			</div>
			<input
				aria-label={i18n(I18nKey.themeColor)}
				type="range"
				min="0"
				max="360"
				bind:value={hue}
				class="setting-slider hue-slider"
				step="5"
			/>
		</section>

		<section class="setting-section">
			<div class="section-header">
				<div class="section-title">
					{i18n(I18nKey.wallpaperModeTitle)}
				</div>
				<div class="section-header-actions">
					<button
						type="button"
						aria-label={i18n(I18nKey.resetWallpaperMode)}
						class="section-reset-btn"
						class:is-disabled={wallpaperMode ===
							getDefaultWallpaperMode()}
						on:click={resetWallpaperMode}
					>
						<Icon
							icon="fa7-solid:arrow-rotate-left"
							class="text-[0.875rem]"
						/>
					</button>
				</div>
			</div>
			<div class="mode-row mode-row-3">
				{#each wallpaperCards as option}
					<button
						type="button"
						class="mode-button"
						class:is-active={wallpaperMode === option.mode}
						aria-label={i18n(option.label)}
						title={i18n(option.label)}
						on:click={() => (wallpaperMode = option.mode)}
					>
						<Icon icon={option.icon} class="text-[1rem]" />
						<span>{i18n(option.label)}</span>
					</button>
				{/each}
			</div>
		</section>

		{#if wallpaperMode === WALLPAPER_FULLSCREEN}
			<section class="setting-section">
				<div class="section-header">
					<div class="section-title">
						{i18n(I18nKey.wallpaperTransparencySettings)}
					</div>
					<div class="section-header-actions">
						<button
							type="button"
							aria-label={i18n(
								I18nKey.resetWallpaperTransparency,
							)}
							class="section-reset-btn"
							class:is-disabled={wallpaperOpacity ===
								getDefaultWallpaperOpacity() &&
								wallpaperBlur === getDefaultWallpaperBlur()}
							on:click={resetWallpaperTransparency}
						>
							<Icon
								icon="fa7-solid:arrow-rotate-left"
								class="text-[0.875rem]"
							/>
						</button>
					</div>
				</div>

				<div class="slider-stack">
					<div class="slider-block">
						<div class="slider-meta">
							<span>{i18n(I18nKey.wallpaperOpacity)}</span>
							<span>{Math.round(wallpaperOpacity * 100)}%</span>
						</div>
						<input
							aria-label={i18n(I18nKey.wallpaperOpacity)}
							type="range"
							min="0"
							max="1"
							step="0.05"
							bind:value={wallpaperOpacity}
							class="setting-slider"
						/>
					</div>

					<div class="slider-block">
						<div class="slider-meta">
							<span>{i18n(I18nKey.wallpaperBlur)}</span>
							<span>{wallpaperBlur.toFixed(1)}px</span>
						</div>
						<input
							aria-label={i18n(I18nKey.wallpaperBlur)}
							type="range"
							min="0"
							max="24"
							step="0.5"
							bind:value={wallpaperBlur}
							class="setting-slider"
						/>
					</div>
				</div>
			</section>
		{/if}

		<section class="setting-section">
			<div class="section-header">
				<div class="section-title">{i18n(I18nKey.effectsSettings)}</div>
				<div class="section-header-actions">
					<button
						type="button"
						aria-label={i18n(I18nKey.resetEffectsSettings)}
						class="section-reset-btn"
						class:is-disabled={live2dEnabled ===
							getDefaultLive2dEnabled() &&
							clickEffectEnabled ===
								getDefaultClickEffectEnabled() &&
							bannerWavesEnabled ===
								getDefaultBannerWavesEnabled() &&
							sakuraEnabled === getDefaultSakuraEnabled()}
						on:click={resetEffectsSettings}
					>
						<Icon
							icon="fa7-solid:arrow-rotate-left"
							class="text-[0.875rem]"
						/>
					</button>
				</div>
			</div>
			<div class="effects-list">
				<label
					class="effect-row"
					class:is-active={live2dEnabled}
					for="effect-live2d"
				>
					<div class="effect-meta">
						<Icon
							icon="material-symbols:package-2-outline"
							class="text-[1rem]"
						/>
						<span>{i18n(I18nKey.effectLive2d)}</span>
					</div>
					<div class="effect-switch" aria-hidden="true">
						<div class="effect-thumb"></div>
					</div>
					<input
						id="effect-live2d"
						bind:checked={live2dEnabled}
						type="checkbox"
					/>
				</label>

				<label
					class="effect-row"
					class:is-active={clickEffectEnabled}
					for="effect-click"
				>
					<div class="effect-meta">
						<Icon
							icon="material-symbols:touch-app-outline"
							class="text-[1rem]"
						/>
						<span>{i18n(I18nKey.effectClick)}</span>
					</div>
					<div class="effect-switch" aria-hidden="true">
						<div class="effect-thumb"></div>
					</div>
					<input
						id="effect-click"
						bind:checked={clickEffectEnabled}
						type="checkbox"
					/>
				</label>

				<label
					class="effect-row"
					class:is-active={bannerWavesEnabled}
					for="effect-wave"
				>
					<div class="effect-meta">
						<Icon
							icon="material-symbols:waves"
							class="text-[1rem]"
						/>
						<span>{i18n(I18nKey.effectWave)}</span>
					</div>
					<div class="effect-switch" aria-hidden="true">
						<div class="effect-thumb"></div>
					</div>
					<input
						id="effect-wave"
						bind:checked={bannerWavesEnabled}
						type="checkbox"
					/>
				</label>

				<label
					class="effect-row"
					class:is-active={sakuraEnabled}
					for="effect-sakura"
				>
					<div class="effect-meta">
						<Icon
							icon="material-symbols:local-florist-outline"
							class="text-[1rem]"
						/>
						<span>{i18n(I18nKey.effectSakura)}</span>
					</div>
					<div class="effect-switch" aria-hidden="true">
						<div class="effect-thumb"></div>
					</div>
					<input
						id="effect-sakura"
						bind:checked={sakuraEnabled}
						type="checkbox"
					/>
				</label>
			</div>
		</section>

		<section class="setting-section">
			<div class="section-header">
				<div class="section-title">{i18n(I18nKey.layoutSettings)}</div>
				<div class="section-header-actions">
					<button
						type="button"
						aria-label={i18n(I18nKey.resetLayoutSettings)}
						class="section-reset-btn"
						class:is-disabled={layoutMode ===
							getDefaultPostListLayout()}
						on:click={resetLayoutSettings}
					>
						<Icon
							icon="fa7-solid:arrow-rotate-left"
							class="text-[0.875rem]"
						/>
					</button>
				</div>
			</div>
			<div class="toggle-grid">
				{#each layoutCards as option}
					<button
						type="button"
						class="toggle-button"
						class:is-active={layoutMode === option.mode}
						aria-label={i18n(option.label)}
						title={i18n(option.label)}
						on:click={() => (layoutMode = option.mode)}
					>
						<Icon icon={option.icon} class="text-[1rem]" />
						<span>{i18n(option.label)}</span>
					</button>
				{/each}
			</div>
		</section>
	</div>
</div>
