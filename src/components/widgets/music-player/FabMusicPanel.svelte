<script lang="ts">
	import { onDestroy, onMount } from "svelte";

	import type { MusicPlayerState } from "@/stores/musicPlayerStore";
	import { musicPlayerStore } from "@/stores/musicPlayerStore";

	import MusicPanelContent from "./organisms/MusicPanelContent.svelte";

	let state: MusicPlayerState = $state(musicPlayerStore.getState());
	let showPlaylist = $state(false);
	let showLyrics = $state(false);

	function handleStateUpdate(event: Event) {
		const custom = event as CustomEvent<MusicPlayerState>;
		if (custom.detail) {
			state = custom.detail;
		}
	}

	onMount(() => {
		window.addEventListener("music-sidebar:state", handleStateUpdate);
	});

	onDestroy(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener(
				"music-sidebar:state",
				handleStateUpdate,
			);
		}
	});

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

	function togglePlaylistView() {
		showPlaylist = !showPlaylist;
		if (showPlaylist) {
			showLyrics = false;
		}
	}

	function toggleLyricsView() {
		showLyrics = !showLyrics;
		if (showLyrics) {
			showPlaylist = false;
		}
	}

	function playIndex(index: number) {
		musicPlayerStore.playIndex(index);
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

	function closePanel() {
		musicPlayerStore.setExpanded(false);
	}
</script>

<div
	class="fab-music-panel card-base shadow-xl rounded-2xl p-4 w-[20rem] max-w-[80vw]"
>
	<MusicPanelContent
		{state}
		{showPlaylist}
		{showLyrics}
		compact
		onTogglePlay={togglePlay}
		onPrev={prev}
		onNext={next}
		onToggleMode={toggleMode}
		onTogglePlaylist={togglePlaylistView}
		onToggleLyrics={toggleLyricsView}
		onPlayIndex={playIndex}
		onSeek={seek}
		onToggleMute={toggleMute}
		onSetVolume={setVolume}
		onTogglePanelVisibility={closePanel}
		isPanelVisible={state.isExpanded}
		onPlaylistSourceSelect={(index) =>
			musicPlayerStore.selectPlaylist(index)}
	/>
</div>

<style>
	.fab-music-panel {
		border-radius: 1.25rem;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid
			color-mix(in oklab, var(--primary) 22%, var(--line-color));
		background: linear-gradient(
			180deg,
			color-mix(in oklab, var(--primary) 7%, var(--card-bg)) 0%,
			var(--card-bg) 36%
		);
		box-shadow:
			0 0 0 1px color-mix(in oklab, var(--primary) 10%, transparent),
			0 14px 32px color-mix(in oklab, black 16%, transparent);
	}

	:global(.dark) .fab-music-panel {
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
	}

	@media (max-width: 640px) {
		.fab-music-panel {
			padding: 0.9rem 0.85rem 0.9rem 0.9rem;
			border-radius: 1rem;
		}
	}
</style>
