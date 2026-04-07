<script lang="ts">
	import Icon from "@iconify/svelte";
	import { slide } from "svelte/transition";

	import Key from "../../../../i18n/i18nKey";
	import { i18n } from "../../../../i18n/translation";
	import type { ResolvedPlaylistConfig } from "../../../../stores/musicPlaylistConfig";
	import PlaylistItem from "../atoms/PlaylistItem.svelte";
	import PlaylistSwitcher from "../atoms/PlaylistSwitcher.svelte";
	import type { Song } from "../types";

	interface Props {
		playlist: Song[];
		playlists: ResolvedPlaylistConfig[];
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

{#if show}
	<div
		class="playlist-panel music-surface fixed bottom-70 right-4 w-80 max-h-96 overflow-hidden z-50"
		transition:slide={{ duration: 300, axis: "y" }}
	>
		<div class="playlist-header">
			<h3 class="text-lg font-semibold text-90">
				{i18n(Key.musicPlayerPlaylist)}
			</h3>
			<button class="playlist-close-btn btn-plain w-9 h-9 rounded-full" onclick={onClose}>
				<Icon icon="material-symbols:close" class="text-lg" />
			</button>
		</div>
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
				class="playlist-content overflow-y-auto max-h-80"
				role="presentation"
			>
				{#each playlist as song, index}
					<PlaylistItem
						{song}
						{index}
						isCurrent={index === currentIndex}
						{isPlaying}
						onclick={() => onPlaySong(index)}
						lazy={index !== 0}
					/>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.playlist-panel {
		right: var(--fab-group-right, 1.5rem);
		bottom: calc(
			var(--fab-group-bottom, 10rem) +
				(var(--fab-button-size, 3rem) * var(--fab-visible-count, 1)) +
				(
					var(--fab-group-gap, 0.5rem) *
						(var(--fab-visible-count, 1) - 1)
				) +
				6.75rem
		);
		border-radius: 1.15rem;
		border: 1px solid color-mix(in oklab, var(--primary) 20%, var(--line-color));
		background: linear-gradient(
			180deg,
			color-mix(in oklab, var(--primary) 6%, var(--card-bg)) 0%,
			var(--card-bg) 36%
		);
		box-shadow:
			0 0 0 1px color-mix(in oklab, var(--primary) 10%, transparent),
			0 16px 32px color-mix(in oklab, black 16%, transparent);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.playlist-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.95rem 0.95rem 0.82rem;
		border-bottom: 1px solid
			color-mix(in oklab, var(--primary) 14%, var(--line-color));
	}

	.playlist-close-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--primary);
		background: color-mix(in oklab, var(--primary) 8%, var(--card-bg));
		border: 1px solid color-mix(in oklab, var(--primary) 26%, transparent);
		transition:
			transform 180ms ease,
			background 180ms ease;
	}

	.playlist-close-btn:hover {
		transform: rotate(90deg);
		background: color-mix(in oklab, var(--primary) 16%, var(--card-bg));
	}

	.playlist-content {
		padding: 0.32rem 0.25rem 0.35rem;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		scrollbar-color: color-mix(in oklab, var(--primary) 42%, transparent)
			transparent;
	}

	.playlist-body {
		margin: 0.35rem 0.45rem 0.5rem;
		padding: 0.28rem 0.28rem 0.28rem;
		border-radius: 0.95rem;
		background: color-mix(in oklab, var(--primary) 5%, transparent);
		border: 1px solid color-mix(in oklab, var(--primary) 10%, transparent);
	}

	.playlist-source-wrap {
		position: relative;
		z-index: 2;
		overflow: visible;
		padding: 0.16rem 0.22rem 0.4rem;
		margin-bottom: 0.04rem;
		border-bottom: 1px solid
			color-mix(in oklab, var(--primary) 14%, transparent);
	}

	.playlist-content {
		position: relative;
		z-index: 1;
	}

	:global(.dark) .playlist-body {
		background: color-mix(in oklab, var(--card-bg) 82%, black 18%);
		border-color: color-mix(in oklab, var(--primary) 20%, transparent);
	}

	.playlist-content::-webkit-scrollbar {
		width: 6px;
	}

	.playlist-content::-webkit-scrollbar-thumb {
		background: color-mix(in oklab, var(--primary) 42%, transparent);
		border-radius: 9999px;
	}

	@media (max-width: 768px) {
		.playlist-panel {
			width: 280px !important;
			max-width: 280px !important;
			right: var(--fab-group-right, 0.75rem) !important;
		}
	}

	@media (max-width: 480px) {
		.playlist-panel {
			width: 260px !important;
			max-width: 260px !important;
			right: var(--fab-group-right, 0.5rem) !important;
		}
	}
</style>
