<script lang="ts">
	import Icon from "@iconify/svelte";

	import Key from "../../../../i18n/i18nKey";
	import { i18n } from "../../../../i18n/translation";
	import type { ResolvedPlaylistConfig } from "../../../../stores/musicPlaylistConfig";
	import AccordionDrawer from "../../common/AccordionDrawer.svelte";
	import PlaylistSwitcher from "../../music-player/atoms/PlaylistSwitcher.svelte";
	import type { Song } from "../../music-player/types";
	import TrackListItem from "./TrackListItem.svelte";

	interface Props {
		playlist: Song[];
		playlists: ResolvedPlaylistConfig[];
		currentPlaylistIndex: number;
		isPlaylistLoading: boolean;
		currentIndex: number;
		isPlaying: boolean;
		show: boolean;
		onPlaylistSourceSelect: (index: number) => void;
		onPlaySong: (index: number) => void;
	}

	const {
		playlist,
		playlists,
		currentPlaylistIndex,
		isPlaylistLoading,
		currentIndex,
		isPlaying,
		show,
		onPlaylistSourceSelect,
		onPlaySong,
	}: Props = $props();

	function getSongProgress(): string {
		if (playlist.length === 0) {
			return "0/0";
		}
		const current = Math.min(Math.max(currentIndex + 1, 1), playlist.length);
		return `${current}/${playlist.length}`;
	}
</script>

<AccordionDrawer {show} class="playlist-drawer">
	<div class="playlist-shell">
		<div class="playlist-body">
			<div class="playlist-source-wrap">
				<PlaylistSwitcher
					{playlists}
					currentIndex={currentPlaylistIndex}
					isLoading={isPlaylistLoading}
					onSelect={onPlaylistSourceSelect}
				/>
			</div>
			<div class="playlist-track-title">
				<span class="playlist-track-title-main">
					<Icon icon="material-symbols:music-note-rounded" />
					<span>{i18n(Key.musicPlayerSongSource)}</span>
				</span>
				<span class="playlist-track-index">{getSongProgress()}</span>
			</div>
			<div
				class="playlist-content"
				class:is-loading={isPlaylistLoading}
				role="listbox"
				aria-label="Playlist"
				aria-multiselectable="false"
			>
				{#if isPlaylistLoading}
					{#each Array.from({ length: 4 }) as _, index}
						<div class="track-skeleton" aria-hidden="true">
							<div class="track-skeleton-index"></div>
							<div class="track-skeleton-cover"></div>
							<div class="track-skeleton-content">
								<div class="track-skeleton-line title"></div>
								<div class="track-skeleton-line artist"></div>
							</div>
						</div>
					{/each}
				{:else}
					{#each playlist as song, index}
						<TrackListItem
							{song}
							{index}
							isCurrent={index === currentIndex}
							{isPlaying}
							onclick={() => onPlaySong(index)}
						/>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</AccordionDrawer>

<style>
	:global(.playlist-drawer) {
		margin-top: 0;
	}

	.playlist-shell {
		margin-top: 0.5rem;
		padding-top: 0.4rem;
		border-top: 1px solid color-mix(in oklab, var(--line-color) 88%, transparent);
	}

	.playlist-body {
		padding: 0.3rem 0.32rem 0.32rem;
		border-radius: 0.9rem;
		background: color-mix(in oklab, var(--card-bg) 96%, white 4%);
		border: 1px solid color-mix(in oklab, var(--line-color) 88%, transparent);
	}

	.playlist-source-wrap {
		position: relative;
		z-index: 2;
		overflow: visible;
		padding: 0.12rem 0.18rem 0.42rem;
		margin-bottom: 0.02rem;
		border-bottom: 1px dashed
			color-mix(in oklab, var(--line-color) 82%, transparent);
	}

	.playlist-track-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.42rem 0.36rem 0.34rem;
		border-bottom: 1px dashed
			color-mix(in oklab, var(--line-color) 78%, transparent);
		font-size: 0.76rem;
		font-weight: 700;
		line-height: 1.2;
		color: var(--content-meta);
	}

	.playlist-track-title-main {
		min-width: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.34rem;
	}

	.playlist-track-index {
		flex-shrink: 0;
		padding: 0.1rem 0.36rem;
		border-radius: 9999px;
		font-size: 0.66rem;
		font-weight: 800;
		line-height: 1;
		color: var(--content-meta);
		background: transparent;
		border: 1px solid color-mix(in oklab, var(--line-color) 86%, transparent);
	}

	.playlist-content {
		position: relative;
		z-index: 1;
		overflow-y: auto;
		max-height: 12rem;
		min-height: 9.8rem;
		padding: 0.44rem 0.4rem 0.22rem 0.08rem;
		display: flex;
		flex-direction: column;
		gap: 0.38rem;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		scrollbar-color: color-mix(in oklab, var(--line-color) 78%, transparent)
			transparent;
	}

	.playlist-content::-webkit-scrollbar {
		width: 8px;
	}

	.playlist-content::-webkit-scrollbar-track {
		background: transparent;
		margin-block: 0.25rem;
	}

	.playlist-content::-webkit-scrollbar-thumb {
		background: color-mix(in oklab, var(--line-color) 70%, transparent);
		border: 2px solid transparent;
		background-clip: content-box;
		border-radius: 9999px;
	}

	.playlist-content::-webkit-scrollbar-thumb:hover {
		background: color-mix(in oklab, var(--primary) 30%, var(--line-color));
		border: 2px solid transparent;
		background-clip: content-box;
	}

	.track-skeleton {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.56rem 0.62rem;
		border-radius: 0.92rem;
		border: 1px solid color-mix(in oklab, var(--line-color) 86%, transparent);
		background: color-mix(in oklab, var(--card-bg) 95%, white 5%);
	}

	.track-skeleton-index {
		width: 1.35rem;
		height: 0.7rem;
		flex: 0 0 1.35rem;
		border-radius: 9999px;
		background: color-mix(in oklab, var(--line-color) 78%, transparent);
	}

	.track-skeleton-cover {
		width: 2.28rem;
		height: 2.28rem;
		flex-shrink: 0;
		border-radius: 0.62rem;
		background: color-mix(in oklab, var(--line-color) 74%, transparent);
	}

	.track-skeleton-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.track-skeleton-line {
		height: 0.58rem;
		border-radius: 9999px;
		background: color-mix(in oklab, var(--line-color) 72%, transparent);
	}

	.track-skeleton-line.title {
		width: 66%;
	}

	.track-skeleton-line.artist {
		width: 48%;
	}

	.playlist-content.is-loading .track-skeleton {
		animation: playlistSkeletonPulse 1.2s ease-in-out infinite;
	}

	@keyframes playlistSkeletonPulse {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 1;
		}
	}

	:global(.dark) .playlist-body {
		background: color-mix(in oklab, var(--card-bg) 86%, black 14%);
		border-color: color-mix(in oklab, var(--line-color) 84%, transparent);
	}
</style>
