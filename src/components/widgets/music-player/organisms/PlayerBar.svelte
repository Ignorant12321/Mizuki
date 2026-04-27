<script lang="ts">
	import type { MusicPlayerState } from "../../../../stores/musicPlayerStore";
	import MusicPanelContent from "./MusicPanelContent.svelte";

	interface Props {
		state: MusicPlayerState;
		isHidden: boolean;
		onTogglePlay: () => void;
		onPrev: () => void;
		onNext: () => void;
		onToggleMode: () => void;
		onTogglePlaylist: () => void;
		onPlayIndex: (index: number) => void;
		onSeek: (time: number) => void;
		onToggleMute: () => void;
		onSetVolume: (volume: number) => void;
		onPlaylistSourceSelect: (index: number) => void;
		onHide: () => void;
		onCollapse: () => void;
	}

	const {
		state,
		isHidden,
		onTogglePlay,
		onPrev,
		onNext,
		onToggleMode,
		onTogglePlaylist,
		onPlayIndex,
		onSeek,
		onToggleMute,
		onSetVolume,
		onPlaylistSourceSelect,
		onHide,
		onCollapse,
	}: Props = $props();
</script>

<div
	class="expanded-player music-surface card-base shadow-xl rounded-2xl p-4 transition-all duration-500 ease-in-out absolute bottom-0 right-0 w-80"
	class:opacity-0={isHidden}
	class:scale-95={isHidden}
	class:pointer-events-none={isHidden}
>
	<MusicPanelContent
		{state}
		showPlaylist={state.showPlaylist}
		{onTogglePlay}
		{onPrev}
		{onNext}
		{onToggleMode}
		{onTogglePlaylist}
		{onPlayIndex}
		{onSeek}
		{onToggleMute}
		{onSetVolume}
		{onPlaylistSourceSelect}
		{onHide}
		{onCollapse}
	/>
</div>
