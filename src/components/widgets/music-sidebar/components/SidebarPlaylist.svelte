<script lang="ts">
	import AccordionDrawer from "../../common/AccordionDrawer.svelte";
	import PlaylistSwitcher from "../../music-player/atoms/PlaylistSwitcher.svelte";
	import type { Song } from "../../music-player/types";
	import TrackListItem from "./TrackListItem.svelte";

	interface PlaylistOption {
		name: string;
	}

	interface Props {
		playlist: Song[];
		playlists: PlaylistOption[];
		currentPlaylistIndex: number;
		isPlaylistLoading: boolean;
		currentIndex: number;
		isPlaying: boolean;
		show: boolean;
		onClose: () => void;
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
		onClose,
		onPlaylistSourceSelect,
		onPlaySong,
	}: Props = $props();
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
			<div
				class="playlist-content"
				role="listbox"
				aria-label="Playlist"
				aria-multiselectable="false"
			>
				{#each playlist as song, index}
					<TrackListItem
						{song}
						{index}
						isCurrent={index === currentIndex}
						{isPlaying}
						onclick={() => onPlaySong(index)}
					/>
				{/each}
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
		border-top: 1px solid color-mix(in oklab, var(--primary) 14%, transparent);
	}

	.playlist-body {
		padding: 0.28rem 0.28rem 0.28rem;
		border-radius: 0.9rem;
		background: color-mix(in oklab, var(--primary) 5%, transparent);
		border: 1px solid color-mix(in oklab, var(--primary) 10%, transparent);
	}

	.playlist-source-wrap {
		padding: 0.16rem 0.22rem 0.4rem;
		margin-bottom: 0.04rem;
		border-bottom: 1px solid
			color-mix(in oklab, var(--primary) 14%, transparent);
	}

	.playlist-content {
		overflow-y: auto;
		max-height: 12rem;
		padding: 0.32rem 0.25rem 0.22rem 0.08rem;
		display: flex;
		flex-direction: column;
		gap: 0.38rem;
		scrollbar-width: thin;
		scrollbar-color: color-mix(in oklab, var(--primary) 42%, transparent)
			transparent;
	}

	.playlist-content::-webkit-scrollbar {
		width: 5px;
	}

	.playlist-content::-webkit-scrollbar-thumb {
		background: color-mix(in oklab, var(--primary) 38%, transparent);
		border-radius: 9999px;
	}

	:global(.dark) .playlist-body {
		background: color-mix(in oklab, var(--card-bg) 82%, black 18%);
		border-color: color-mix(in oklab, var(--primary) 20%, transparent);
	}
</style>
