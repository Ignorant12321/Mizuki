<script lang="ts">
	import { onDestroy, onMount } from "svelte";

	import type { MusicPlayerState } from "@/stores/musicPlayerStore";
	import { musicPlayerStore } from "@/stores/musicPlayerStore";

	import MusicPanelContent from "../music-player/organisms/MusicPanelContent.svelte";

	let state: MusicPlayerState = $state(musicPlayerStore.getState());
	let showPlaylist = $state(false);

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
</script>

<div class="music-sidebar-widget">
	<MusicPanelContent
		{state}
		{showPlaylist}
		compact
		onTogglePlay={togglePlay}
		onPrev={prev}
		onNext={next}
		onToggleMode={toggleMode}
		onTogglePlaylist={togglePlaylistView}
		onPlayIndex={playIndex}
		onSeek={seek}
		onToggleMute={toggleMute}
		onSetVolume={setVolume}
		onPlaylistSourceSelect={(index) =>
			musicPlayerStore.selectPlaylist(index)}
	/>
</div>

<style>
	.music-sidebar-widget {
		padding: 0.12rem 0.05rem 0.02rem;
	}

	@media (max-width: 520px) {
		.music-sidebar-widget {
			min-width: 0;
		}
	}
</style>
