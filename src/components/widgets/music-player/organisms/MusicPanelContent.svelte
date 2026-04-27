<script lang="ts">
	import Icon from "@iconify/svelte";

	import Key from "../../../../i18n/i18nKey";
	import { i18n } from "../../../../i18n/translation";
	import type { MusicPlayerState } from "../../../../stores/musicPlayerStore";
	import SidebarControls from "../../music-sidebar/components/SidebarControls.svelte";
	import SidebarCover from "../../music-sidebar/components/SidebarCover.svelte";
	import SidebarPlaylist from "../../music-sidebar/components/SidebarPlaylist.svelte";
	import SidebarProgress from "../../music-sidebar/components/SidebarProgress.svelte";
	import SidebarTrackInfo from "../../music-sidebar/components/SidebarTrackInfo.svelte";
	import LyricsPanel from "../molecules/LyricsPanel.svelte";

	interface Props {
		state: MusicPlayerState;
		showPlaylist: boolean;
		compact?: boolean;
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
		onHide?: () => void;
		onCollapse?: () => void;
	}

	const {
		state,
		showPlaylist,
		compact = false,
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

<div class="music-panel-content" class:compact>
	<div class="music-panel-header">
		<SidebarCover
			currentSong={state.currentSong}
			isPlaying={state.isPlaying}
			isLoading={state.isLoading}
		/>
		<SidebarTrackInfo
			currentSong={state.currentSong}
			playlistName={state.currentPlaylistName}
			volume={state.volume}
			isMuted={state.isMuted}
			{onToggleMute}
			{onSetVolume}
		/>
		{#if onHide || onCollapse}
			<div class="music-panel-actions">
				{#if onHide}
					<button
						type="button"
						class="panel-action-btn"
						onclick={onHide}
						title={i18n(Key.musicPlayerHide)}
						aria-label={i18n(Key.musicPlayerHide)}
					>
						<Icon icon="material-symbols:close-rounded" />
					</button>
				{/if}
				{#if onCollapse}
					<button
						type="button"
						class="panel-action-btn"
						onclick={onCollapse}
						title={i18n(Key.musicPlayerCollapse)}
						aria-label={i18n(Key.musicPlayerCollapse)}
					>
						<Icon icon="material-symbols:expand-more-rounded" />
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if !showPlaylist}
		<LyricsPanel
			lines={state.lyricLines}
			isTimed={state.lyricIsTimed}
			currentIndex={state.currentLyricIndex}
			isLoading={state.lyricLoading}
			{compact}
		/>
	{/if}

	<SidebarControls
		isPlaying={state.isPlaying}
		isShuffled={state.isShuffled}
		repeatMode={state.isRepeating}
		{onToggleMode}
		{onPrev}
		{onNext}
		{onTogglePlay}
		{onTogglePlaylist}
	/>

	<div class="music-panel-progress">
		<SidebarProgress
			currentTime={state.currentTime}
			duration={state.duration}
			{onSeek}
		/>
	</div>

	<SidebarPlaylist
		playlist={state.playlist}
		playlists={state.playlists}
		currentPlaylistIndex={state.currentPlaylistIndex}
		isPlaylistLoading={state.isPlaylistLoading}
		currentIndex={state.currentIndex}
		isPlaying={state.isPlaying}
		show={showPlaylist}
		{onPlaylistSourceSelect}
		onPlaySong={onPlayIndex}
	/>
</div>

<style>
	.music-panel-content {
		min-width: 0;
	}

	.music-panel-header {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 0.7rem;
	}

	.music-panel-actions {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		margin-left: 0.2rem;
		flex-shrink: 0;
	}

	.panel-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 0.5rem;
		color: var(--content-meta);
		transition:
			color 150ms ease,
			background 150ms ease,
			transform 150ms ease;
	}

	.panel-action-btn:hover {
		color: var(--primary);
		background: color-mix(in oklab, var(--primary) 8%, transparent);
	}

	.panel-action-btn:active {
		transform: scale(0.94);
	}

	.music-panel-progress {
		margin-top: 0.42rem;
		margin-bottom: 0.32rem;
	}

	@media (max-width: 640px) {
		.music-panel-header {
			gap: 0.7rem;
			margin-bottom: 0.62rem;
		}

		.music-panel-actions {
			gap: 0.1rem;
			margin-left: 0;
		}

		.panel-action-btn {
			width: 1.55rem;
			height: 1.55rem;
		}
	}
</style>
