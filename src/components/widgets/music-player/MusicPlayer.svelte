<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onDestroy, onMount } from "svelte";

	import { musicPlayerConfig } from "@/config";
	import type { MusicPlayerState } from "@/stores/musicPlayerStore";
	import { musicPlayerStore } from "@/stores/musicPlayerStore";

	import CoverImage from "./atoms/CoverImage.svelte";
	import FabMusicPanel from "./FabMusicPanel.svelte";
	import MiniPlayer from "./organisms/MiniPlayer.svelte";
	import PlayerBar from "./organisms/PlayerBar.svelte";

	let state: MusicPlayerState = musicPlayerStore.getState();
	let fabAnchorRight = 0;
	let fabAnchorBottom = 0;
	let fabShellTop: number | null = null;
	let fabShellEl: HTMLDivElement | null = null;
	let shouldRenderFabPanel = false;
	let isFabPanelClosing = false;
	let fabPanelCloseTimer: ReturnType<typeof setTimeout> | undefined;
	const showFloatingPlayer = musicPlayerConfig.showFloatingPlayer;
	const floatingEntryMode = musicPlayerConfig.floatingEntryMode ?? "default";
	const useFabEntry = floatingEntryMode === "fab";
	const shouldRenderFloatingUi =
		showFloatingPlayer && musicPlayerConfig.enable;
	let unsubscribe: (() => void) | undefined;

	function togglePlay() {
		musicPlayerStore.toggle();
	}

	function prev() {
		musicPlayerStore.prev();
	}

	function next() {
		musicPlayerStore.next();
	}

	function toggleMode() {
		musicPlayerStore.toggleMode();
	}

	function playIndex(index: number) {
		musicPlayerStore.playIndex(index);
	}

	function selectPlaylist(index: number) {
		musicPlayerStore.selectPlaylist(index);
	}

	function seek(time: number) {
		musicPlayerStore.seek(time);
	}

	function toggleMute() {
		musicPlayerStore.toggleMute();
	}

	function setVolume(volume: number) {
		musicPlayerStore.setVolume(volume);
	}

	function handleVolumeKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (
			target?.tagName === "INPUT" ||
			target?.tagName === "TEXTAREA" ||
			target?.contentEditable === "true"
		) {
			return;
		}

		if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
			event.preventDefault();
			musicPlayerStore.setVolume(state.volume - 0.05);
			return;
		}

		if (event.key === "ArrowRight" || event.key === "ArrowUp") {
			event.preventDefault();
			musicPlayerStore.setVolume(state.volume + 0.05);
			return;
		}

		if (
			event.key === "Enter" ||
			event.key === " " ||
			event.key === "m" ||
			event.key === "M"
		) {
			event.preventDefault();
			toggleMute();
		}
	}

	function togglePlaylist() {
		musicPlayerStore.togglePlaylist();
	}

	function toggleLyrics() {
		musicPlayerStore.toggleLyrics();
	}

	function toggleExpanded() {
		musicPlayerStore.toggleExpanded();
	}

	function toggleHidden() {
		musicPlayerStore.toggleHidden();
	}

	function hideError() {
		musicPlayerStore.hideError();
	}

	function updateFabAnchorPosition() {
		if (typeof window === "undefined") {
			return;
		}

		const fabButton = document.getElementById("music-fab-btn");
		if (!fabButton) {
			return;
		}

		const rect = fabButton.getBoundingClientRect();
		fabAnchorRight = Math.max(0, window.innerWidth - rect.left);
		fabAnchorBottom = Math.max(0, window.innerHeight - rect.bottom);
	}

	function captureFabShellTop() {
		if (typeof window === "undefined" || !fabShellEl) {
			return;
		}

		const rect = fabShellEl.getBoundingClientRect();
		fabShellTop = Math.max(12, rect.top);
	}

	function handleFloatingTocBeforeOpen() {
		musicPlayerStore.setExpanded(false);
	}

	function clearFabPanelCloseTimer() {
		if (fabPanelCloseTimer) {
			clearTimeout(fabPanelCloseTimer);
			fabPanelCloseTimer = undefined;
		}
	}

	onMount(() => {
		unsubscribe = musicPlayerStore.subscribe((nextState) => {
			state = nextState;
		});
		musicPlayerStore.initialize();
		updateFabAnchorPosition();
		window.addEventListener("resize", updateFabAnchorPosition, {
			passive: true,
		});
		window.addEventListener("scroll", updateFabAnchorPosition, {
			passive: true,
		});
		window.addEventListener(
			"floating-toc:before-open",
			handleFloatingTocBeforeOpen,
		);
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		if (typeof window !== "undefined") {
			window.removeEventListener("resize", updateFabAnchorPosition);
			window.removeEventListener("scroll", updateFabAnchorPosition);
			window.removeEventListener(
				"floating-toc:before-open",
				handleFloatingTocBeforeOpen,
			);
		}
		clearFabPanelCloseTimer();
		musicPlayerStore.destroy();
	});

	$: if (useFabEntry && state.isExpanded) {
		clearFabPanelCloseTimer();
		shouldRenderFabPanel = true;
		isFabPanelClosing = false;
	}

	$: if (
		useFabEntry &&
		!state.isExpanded &&
		shouldRenderFabPanel &&
		!isFabPanelClosing
	) {
		isFabPanelClosing = true;
		clearFabPanelCloseTimer();
		fabPanelCloseTimer = setTimeout(() => {
			shouldRenderFabPanel = false;
			isFabPanelClosing = false;
			fabShellTop = null;
		}, 220);
	}

	$: if (!shouldRenderFabPanel && fabShellTop !== null) {
		fabShellTop = null;
	}

	$: if (useFabEntry && state.isExpanded) {
		requestAnimationFrame(updateFabAnchorPosition);
		if (fabShellTop === null) {
			requestAnimationFrame(() => {
				requestAnimationFrame(captureFabShellTop);
			});
		}
	}
</script>

<svelte:window onkeydown={handleVolumeKeyDown} />

{#if shouldRenderFloatingUi}
	{#if state.showError}
		<div class="fixed bottom-20 right-4 z-[60] max-w-sm">
			<div
				class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
			>
				<Icon
					icon="material-symbols:error"
					class="text-xl flex-shrink-0"
				/>
				<span class="text-sm flex-1">{state.errorMessage}</span>
				<button
					onclick={hideError}
					class="text-white/80 hover:text-white transition-colors"
				>
					<Icon icon="material-symbols:close" class="text-lg" />
				</button>
			</div>
		</div>
	{/if}

	{#if useFabEntry}
		{#if shouldRenderFabPanel}
			<div
				class="music-player-fab-anchor fixed z-[55]"
				style={`--music-fab-anchor-right:${fabAnchorRight}px;--music-fab-anchor-bottom:${fabAnchorBottom}px;`}
			>
				<div
					class="music-player-fab-shell"
					class:top-anchored={fabShellTop !== null}
					class:is-closing={isFabPanelClosing}
					bind:this={fabShellEl}
					style={fabShellTop !== null
						? `--music-fab-shell-top:${fabShellTop}px;`
						: ""}
				>
					<FabMusicPanel />
				</div>
			</div>
		{/if}
	{:else}
		<div
			class="music-player fixed bottom-8 right-4 z-50 transition-all duration-300 ease-in-out"
			class:expanded={state.isExpanded}
			class:hidden-mode={state.isHidden}
		>
			<div
				class="orb-player-container {state.isHidden
					? 'orb-enter pointer-events-auto'
					: 'orb-leave pointer-events-none'}"
			>
				<CoverImage
					cover={state.currentSong.cover}
					isPlaying={state.isPlaying}
					isLoading={state.isLoading}
					size="orb"
					onclick={toggleHidden}
				/>
			</div>

			<MiniPlayer
				song={state.currentSong}
				currentTime={state.currentTime}
				duration={state.duration}
				isPlaying={state.isPlaying}
				isLoading={state.isLoading}
				isHidden={state.isExpanded || state.isHidden}
				onCoverClick={togglePlay}
				onInfoClick={toggleExpanded}
				onHideClick={toggleHidden}
				onExpandClick={toggleExpanded}
			/>

			<PlayerBar
				{state}
				isHidden={!state.isExpanded}
				onTogglePlay={togglePlay}
				onPrev={prev}
				onNext={() => next()}
				onToggleMode={toggleMode}
				onTogglePlaylist={togglePlaylist}
				onToggleLyrics={toggleLyrics}
				onPlayIndex={playIndex}
				onSeek={seek}
				onToggleMute={toggleMute}
				onSetVolume={setVolume}
				onPlaylistSourceSelect={selectPlaylist}
				onHide={toggleHidden}
				onCollapse={toggleExpanded}
			/>
		</div>
	{/if}

	<style>
		.music-player-fab-anchor {
			right: var(
				--music-fab-anchor-right,
				var(--fab-group-right, 1.5rem)
			);
			bottom: var(
				--music-fab-anchor-bottom,
				calc(
					var(--fab-group-bottom, 11.5rem) +
						(
							var(--fab-button-size, 3rem) *
								var(--fab-visible-count, 1)
						) +
						(
							var(--fab-group-gap, 0.5rem) *
								(var(--fab-visible-count, 1) - 1)
						)
				)
			);
			width: 0;
			height: 0;
			pointer-events: none;
		}

		.music-player-fab-shell {
			position: absolute;
			right: 0;
			bottom: calc(
				var(--fab-button-size, 3rem) + var(--fab-group-gap, 0.5rem)
			);
			margin-right: 0.75rem;
			transform-origin: center right;
			pointer-events: auto;
			will-change: transform, opacity;
			animation: musicPanelFadeIn 220ms cubic-bezier(0.22, 1, 0.36, 1)
				both;
		}

		.music-player-fab-shell.top-anchored {
			position: fixed;
			top: var(--music-fab-shell-top, 1rem);
			right: calc(
				var(--music-fab-anchor-right, var(--fab-group-right, 1.5rem)) +
					0.75rem
			);
			bottom: auto;
			margin-right: 0;
			transform-origin: top right;
		}

		.music-player-fab-shell.is-closing {
			pointer-events: none;
			animation: musicPanelFadeOut 180ms cubic-bezier(0.4, 0, 1, 1) both;
		}

		@keyframes musicPanelFadeIn {
			from {
				opacity: 0;
				transform: translateY(0.35rem) scale(0.98);
			}
			to {
				opacity: 1;
				transform: translateY(0) scale(1);
			}
		}

		@keyframes musicPanelFadeOut {
			from {
				opacity: 1;
				transform: translateY(0) scale(1);
			}
			to {
				opacity: 0;
				transform: translateY(0.3rem) scale(0.98);
			}
		}

		.orb-player-container {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		.orb-enter {
			animation: orbElasticIn 460ms cubic-bezier(0.22, 1.25, 0.36, 1)
				forwards;
		}

		.orb-leave {
			animation: orbElasticOut 360ms cubic-bezier(0.4, 0, 1, 1) forwards;
		}

		@keyframes orbElasticIn {
			0% {
				opacity: 0;
				transform: translateX(0) scale(0.55);
			}
			70% {
				opacity: 1;
				transform: translateX(0) scale(1.12);
			}
			100% {
				opacity: 1;
				transform: translateX(0) scale(1);
			}
		}

		@keyframes orbElasticOut {
			0% {
				opacity: 1;
				transform: translateX(0) scale(1);
			}
			100% {
				opacity: 0;
				transform: translateX(0) scale(0.6);
			}
		}

		.music-player.hidden-mode {
			width: 3rem;
			height: 3rem;
		}

		.music-player {
			width: 20rem;
			max-width: 20rem;
			min-width: 20rem;
			user-select: none;
		}

		:global(.mini-player) {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		:global(.expanded-player) {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		:global(.orb-player) {
			position: relative;
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
		}

		:global(.orb-player::before) {
			content: "";
			position: absolute;
			inset: -0.125rem;
			background: linear-gradient(
				45deg,
				var(--primary),
				transparent,
				var(--primary)
			);
			border-radius: 50%;
			z-index: -1;
			opacity: 0;
			transition: opacity 0.3s ease;
		}

		:global(.orb-player:hover::before) {
			opacity: 0.3;
			animation: rotate 2s linear infinite;
		}

		:global(.orb-player .animate-pulse) {
			animation: musicWave 1.5s ease-in-out infinite;
		}

		@keyframes rotate {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		@keyframes musicWave {
			0%,
			100% {
				transform: scaleY(0.5);
			}
			50% {
				transform: scaleY(1);
			}
		}

		:global(.animate-pulse) {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}

		@keyframes pulse {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.5;
			}
		}

		:global(.progress-section div:hover),
		:global(.bottom-controls > div:hover) {
			transform: scaleY(1.2);
			transition: transform 0.2s ease;
		}

		:global(.music-surface) {
			position: relative;
			overflow: hidden;
			background: linear-gradient(
				180deg,
				color-mix(in oklab, var(--primary) 6%, var(--card-bg)) 0%,
				var(--card-bg) 35%
			) !important;
			border: 1px solid
				color-mix(in oklab, var(--primary) 20%, var(--line-color)) !important;
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 12%, transparent),
				0 14px 32px color-mix(in oklab, black 18%, transparent) !important;
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
		}

		:global(.music-surface::after) {
			content: "";
			position: absolute;
			inset: 0;
			pointer-events: none;
			background:
				repeating-linear-gradient(
					0deg,
					transparent 0 2px,
					color-mix(in oklab, black 7%, transparent) 2px 3px
				),
				radial-gradient(
					circle at 18% 12%,
					color-mix(in oklab, white 18%, transparent) 0%,
					transparent 36%
				);
			opacity: 0.28;
			mix-blend-mode: soft-light;
		}

		:global(.music-action-btn) {
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--primary);
			background: linear-gradient(
				160deg,
				color-mix(in oklab, var(--primary) 9%, var(--card-bg)) 0%,
				color-mix(in oklab, var(--primary) 3%, var(--card-bg)) 100%
			);
			border: 1px solid transparent;
			box-shadow: 0 0 0 1px
				color-mix(in oklab, var(--primary) 10%, transparent);
			transition:
				transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
				background 0.22s cubic-bezier(0.22, 1, 0.36, 1),
				box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
				border-color 0.22s cubic-bezier(0.22, 1, 0.36, 1);
		}

		:global(.music-action-btn:hover) {
			background: color-mix(
				in oklab,
				var(--primary) 10%,
				var(--btn-regular-bg)
			);
			border-color: color-mix(in oklab, var(--primary) 20%, transparent);
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 22%, transparent),
				0 6px 16px color-mix(in oklab, var(--primary) 20%, transparent);
		}

		:global(.music-action-btn:active) {
			transform: scale(0.94);
		}

		:global(.play-main-btn) {
			color: var(--primary);
			background: linear-gradient(
				160deg,
				color-mix(in oklab, var(--primary) 12%, var(--card-bg)) 0%,
				var(--card-bg) 80%
			);
			border: 1px solid
				color-mix(in oklab, var(--primary) 18%, var(--line-color));
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 25%, transparent),
				0 8px 24px color-mix(in oklab, var(--primary) 22%, transparent);
			backdrop-filter: blur(8px);
			-webkit-backdrop-filter: blur(8px);
			transition:
				transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
				box-shadow 0.28s cubic-bezier(0.22, 1, 0.36, 1),
				background 0.28s cubic-bezier(0.22, 1, 0.36, 1);
		}

		:global(.play-main-btn:hover:not(:disabled)) {
			transform: scale(1.03);
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 35%, transparent),
				0 12px 30px color-mix(in oklab, var(--primary) 30%, transparent);
		}

		:global(.play-main-btn:active:not(:disabled)) {
			transform: scale(0.94);
		}

		:global(.music-track) {
			background: color-mix(
				in oklab,
				var(--primary) 9%,
				var(--line-color)
			) !important;
			border: 1px solid
				color-mix(in oklab, var(--primary) 16%, transparent);
		}

		:global(.music-track-fill) {
			background: color-mix(
				in oklab,
				var(--primary) 88%,
				white 12%
			) !important;
		}

		:global(.playlist-item-base) {
			border: 1px solid transparent;
			background: color-mix(in oklab, var(--primary) 4%, transparent);
		}

		:global(.playlist-item-base:hover) {
			border-color: color-mix(in oklab, var(--primary) 18%, transparent);
			box-shadow: inset 0 0 0 1px
				color-mix(in oklab, var(--primary) 16%, transparent);
		}

		@media (max-width: 768px) {
			.music-player-fab-anchor {
				right: var(
					--music-fab-anchor-right,
					var(--fab-group-right, 0.75rem)
				) !important;
				bottom: var(
					--music-fab-anchor-bottom,
					var(--fab-group-bottom, 6.25rem)
				) !important;
			}

			.music-player-fab-shell {
				right: 0 !important;
				bottom: calc(
					var(--fab-button-size, 2.75rem) +
						var(--fab-group-gap, 0.5rem)
				) !important;
				margin-right: 0.5rem !important;
			}

			.music-player-fab-shell.top-anchored {
				position: fixed;
				right: calc(
					var(
							--music-fab-anchor-right,
							var(--fab-group-right, 0.75rem)
						) +
						0.5rem
				) !important;
				bottom: auto !important;
				margin-right: 0 !important;
				transform-origin: top right;
			}

			.music-player {
				width: 280px !important;
				min-width: 280px !important;
				max-width: 280px !important;
				bottom: 1.75rem !important;
				right: 0.5rem !important;
			}
			:global(.mini-player) {
				width: 280px !important;
			}
			:global(.expanded-player) {
				width: 280px !important;
				max-width: 280px !important;
			}
			.music-player.expanded {
				width: 280px !important;
				min-width: 280px !important;
				max-width: 280px !important;
				right: 0.5rem !important;
			}
			:global(.playlist-panel) {
				width: 280px !important;
				right: 0.5rem !important;
				max-width: 280px !important;
			}
			:global(.controls) {
				gap: 8px;
			}
			:global(.controls button) {
				width: 36px;
				height: 36px;
			}
			:global(.controls button:nth-child(3)) {
				width: 44px;
				height: 44px;
			}
		}

		@media (max-width: 480px) {
			.music-player-fab-anchor {
				right: var(
					--music-fab-anchor-right,
					var(--fab-group-right, 0.5rem)
				) !important;
				bottom: var(
					--music-fab-anchor-bottom,
					var(--fab-group-bottom, 5.75rem)
				) !important;
			}

			.music-player-fab-shell {
				right: 0 !important;
				bottom: calc(
					var(--fab-button-size, 2.5rem) +
						var(--fab-group-gap, 0.5rem)
				) !important;
				margin-right: 0.5rem !important;
			}

			.music-player-fab-shell.top-anchored {
				right: calc(
					var(
							--music-fab-anchor-right,
							var(--fab-group-right, 0.5rem)
						) +
						0.5rem
				) !important;
			}

			.music-player {
				width: 260px !important;
				min-width: 260px !important;
				max-width: 260px !important;
			}
			:global(.expanded-player) {
				width: 260px !important;
				max-width: 260px !important;
			}
			:global(.playlist-panel) {
				width: 260px !important;
				max-width: 260px !important;
				right: 0.5rem !important;
			}
			:global(.song-title) {
				font-size: 14px;
			}
			:global(.song-artist) {
				font-size: 12px;
			}
			:global(.controls) {
				gap: 6px;
				margin-bottom: 12px;
			}
			:global(.controls button) {
				width: 32px;
				height: 32px;
			}
			:global(.controls button:nth-child(3)) {
				width: 40px;
				height: 40px;
			}
			:global(.playlist-item) {
				padding: 8px 12px;
			}
			:global(.playlist-item .w-10) {
				width: 32px;
				height: 32px;
			}
		}

		@keyframes slide-up {
			from {
				transform: translateY(100%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}

		.animate-slide-up {
			animation: slide-up 0.3s ease-out;
		}

		@media (hover: none) and (pointer: coarse) {
			:global(.music-player button),
			:global(.playlist-item) {
				min-height: 44px;
			}
			:global(.progress-section > div),
			:global(.bottom-controls > div:nth-child(2)) {
				height: 12px;
			}
		}

		:global(button.bg-\\[var\\(--primary\\)\\]) {
			box-shadow: 0 0 0 2px var(--primary);
			border: none;
		}

		@media (prefers-reduced-motion: reduce) {
			.music-player-fab-shell,
			.music-player-fab-shell.is-closing {
				animation: none;
			}
		}
	</style>
{/if}
